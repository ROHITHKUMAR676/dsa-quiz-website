import type { Prisma } from "@prisma/client";
import { AttemptStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export function findAttemptByQuizAndUser(quizId: string, userId: string) {
  return prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId, userId } },
  });
}

/**
 * Official daily ranking order (spec section 11): score DESC, correctAnswers
 * DESC, completionTimeMs ASC, scoreAchievedAt ASC. Only ever called once a
 * quiz's results are PUBLISHED - see services/leaderboard.service.ts.
 */
export function findSubmittedAttemptsRankedForQuiz(quizId: string) {
  return prisma.quizAttempt.findMany({
    where: { quizId, status: AttemptStatus.SUBMITTED },
    orderBy: [
      { score: "desc" },
      { correctAnswers: "desc" },
      { completionTimeMs: "asc" },
      { scoreAchievedAt: "asc" },
    ],
    include: { user: { select: { id: true, fullName: true, avatar: true, department: true } } },
  });
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
