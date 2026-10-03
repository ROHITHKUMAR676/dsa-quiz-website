import type { Prisma } from "@prisma/client";
import { AttemptStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export function findAttemptByQuizAndUser(quizId: string, userId: string) {
  return prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId, userId } },
  });
}

/**
 * Official daily ranking order: score DESC, correctAnswers DESC, persisted
 * total response time ASC, then the earlier server submission. Only called once a
 * quiz's results are PUBLISHED - see services/leaderboard.service.ts.
 */
export function findSubmittedAttemptsRankedForQuiz(quizId: string) {
  return prisma.quizAttempt.findMany({
    where: { quizId, status: AttemptStatus.SUBMITTED },
    orderBy: [
      { score: "desc" },
      { correctAnswers: "desc" },
    ],
    include: {
      user: { select: { id: true, fullName: true, avatar: true, department: true } },
      answers: { select: { responseTimeMs: true } },
    },
  }).then((attempts) => attempts.sort((a, b) =>
    b.score - a.score || b.correctAnswers - a.correctAnswers ||
    a.answers.reduce((sum, answer) => sum + (answer.responseTimeMs ?? 0), 0) -
      b.answers.reduce((sum, answer) => sum + (answer.responseTimeMs ?? 0), 0) ||
    (a.scoreAchievedAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.scoreAchievedAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  ));
}

/**
 * Per-user aggregate across a set of already-FINALIZED daily quizzes -
 * the raw material for the weekly ranking (spec section 13).
 */
export async function aggregateSubmittedAttemptsByUser(quizIds: string[]) {
  if (quizIds.length === 0) return [];
  return prisma.quizAttempt.groupBy({
    by: ["userId"],
    where: { quizId: { in: quizIds }, status: AttemptStatus.SUBMITTED },
    _sum: { score: true, correctAnswers: true },
    _count: { _all: true },
  });
}

export function findReleasedAttemptsBetween(start: Date, end: Date) {
  return prisma.quizAttempt.findMany({
    where: {
      status: AttemptStatus.SUBMITTED,
      quiz: {
        status: { in: ["SCHEDULED", "LIVE", "CLOSED", "FINALIZED", "ARCHIVED"] },
        competitionDate: { gte: start, lt: end },
      },
    },
    select: {
      userId: true, score: true, correctAnswers: true, completionTimeMs: true, submittedAt: true,
      user: { select: { id: true, fullName: true, avatar: true, department: true } },
      answers: { select: { responseTimeMs: true } },
      quiz: { select: { startsAt: true, endsAt: true, competitionDate: true, defaultWindowMinutes: true, resultReleaseDelayMinutes: true } },
    },
  });
}

export function findAttemptById(id: string) {
  return prisma.quizAttempt.findUnique({
    where: { id },
    include: { quiz: true },
  });
}

export function createAttempt(data: { quizId: string; userId: string; totalQuestions: number }) {
  return prisma.quizAttempt.create({
    data: {
      quizId: data.quizId,
      userId: data.userId,
      totalQuestions: data.totalQuestions,
      status: AttemptStatus.IN_PROGRESS,
    },
  });
}

export function markAttemptExpired(id: string) {
  return prisma.quizAttempt.update({
    where: { id },
    data: { status: AttemptStatus.EXPIRED },
    include: { quiz: true },
  });
}

export async function beginQuestion(attemptId: string, questionId: string) {
  await prisma.answer.createMany({
    data: [{ attemptId, questionId, selectedOptionId: null, isCorrect: false, pointsAwarded: 0 }],
    skipDuplicates: true,
  });
  return prisma.answer.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId, questionId } } });
}

export function findAttemptAnswers(attemptId: string) {
  return prisma.answer.findMany({ where: { attemptId }, orderBy: { answeredAt: "asc" } });
}

export function findAttemptAnswer(attemptId: string, questionId: string) {
  return prisma.answer.findUnique({ where: { attemptId_questionId: { attemptId, questionId } } });
}

export function saveQuestionAnswer(id: string, data: { selectedOptionId: string | null; isCorrect: boolean; pointsAwarded: number; responseTimeMs: number }) {
  return prisma.answer.updateMany({ where: { id, responseTimeMs: null }, data });
}


export function updateAttemptRewards(id: string, data: { xpEarned: number; coinsEarned: number }) {
  return prisma.quizAttempt.update({ where: { id }, data });
}

interface SubmitAttemptInput {
  attemptId: string;
  submittedAt: Date;
  completionTimeMs: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  score: number;
  accuracy: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    pointsAwarded: number;
    responseTimeMs?: number | null;
  }>;
}

/**
 * Finalizes an attempt transactionally: writes every Answer row and marks
 * the attempt SUBMITTED with the authoritative, server-computed score.
 * Never called with client-supplied scores/correctness (see
 * services/studentAttempt.service.ts).
 */
export function submitAttempt(input: SubmitAttemptInput) {
  return prisma.$transaction(async (tx) => {
    if (input.answers.length > 0) {
      await tx.answer.createMany({
        data: input.answers.map((answer) => ({
          attemptId: input.attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
          pointsAwarded: answer.pointsAwarded,
          responseTimeMs: answer.responseTimeMs ?? null,
        })) satisfies Prisma.AnswerCreateManyInput[],
        skipDuplicates: true,
      });
    }

    return tx.quizAttempt.update({
      where: { id: input.attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: input.submittedAt,
        completionTimeMs: input.completionTimeMs,
        scoreAchievedAt: input.submittedAt,
        totalQuestions: input.totalQuestions,
        correctAnswers: input.correctAnswers,
        incorrectAnswers: input.incorrectAnswers,
        unansweredQuestions: input.unansweredQuestions,
        score: input.score,
        accuracy: input.accuracy,
      },
    });
  });
}
