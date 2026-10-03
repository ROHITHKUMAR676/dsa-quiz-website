import { QuizStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { finalizeQuizResults } from "./finalization.service.js";
import { getEffectiveEndsAt, getResultReleaseAt, getResultState } from "./quizLifecycle.service.js";

function toDailyLeaderboardEntries(
  attempts: Awaited<ReturnType<typeof attemptRepository.findSubmittedAttemptsRankedForQuiz>>
) {
  return attempts.map((attempt, index) => ({
    rank: index + 1,
    userId: attempt.userId,
    fullName: attempt.user.fullName,
    avatar: attempt.user.avatar,
    department: attempt.user.department,
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    completionTimeMs: attempt.completionTimeMs,
  }));
}

/**
 * Finds the most recent quiz before `quiz` whose results are actually
 * PUBLISHED right now. This is what the leaderboard falls back to while
 * today's results are still waiting (spec sections 9-10).
 */
async function findPreviousOfficialLeaderboard(quiz: { id: string; competitionDate: Date | null }, now: Date) {
  if (!quiz.competitionDate) return null;

  const candidates = await quizRepository.findPreviousPublishedCandidateQuizzes(quiz.competitionDate);
  const previousQuiz = candidates.find((candidate) => getResultState(candidate, now) === "PUBLISHED");
  if (!previousQuiz) return null;

  const attempts = await attemptRepository.findSubmittedAttemptsRankedForQuiz(previousQuiz.id);
  return {
    quizId: previousQuiz.id,
    quizTitle: previousQuiz.title,
    competitionDate: previousQuiz.competitionDate,
    entries: toDailyLeaderboardEntries(attempts),
  };
}

async function finalizeQuizIfReleaseIsDue(quiz: Awaited<ReturnType<typeof quizRepository.findQuizForAttempt>>) {
  if (!quiz) return quiz;
  if (quiz.status === QuizStatus.FINALIZED || quiz.status === QuizStatus.ARCHIVED || quiz.status === QuizStatus.DRAFT) {
    return quiz;
  }

  const now = new Date();
  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  const resultReleaseAt = getResultReleaseAt(quiz);
  if (!effectiveEndsAt || !resultReleaseAt || now < effectiveEndsAt || now < resultReleaseAt) {
    return quiz;
  }

  await finalizeQuizResults(quiz.id);
  await prisma.quiz.update({
    where: { id: quiz.id },
    data: {
      status: QuizStatus.FINALIZED,
      closedAt: quiz.closedAt ?? effectiveEndsAt,
      finalizedAt: quiz.finalizedAt ?? now,
    },
  });

  return quizRepository.findQuizForAttempt(quiz.id);
}

/**
 * The single source of truth for "what can a student see right now" on the
 * daily leaderboard. Never exposes an unpublished ranking (spec section 33).
 */
export async function getDailyLeaderboard(quizId: string) {
  const quiz = await finalizeQuizIfReleaseIsDue(await quizRepository.findQuizForAttempt(quizId));
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  const now = new Date();
  const resultState = getResultState(quiz, now);
  const resultsAvailableAt = getResultReleaseAt(quiz);

  if (resultState === "PUBLISHED") {
    const attempts = await attemptRepository.findSubmittedAttemptsRankedForQuiz(quiz.id);
    return {
      quizId: quiz.id,
      resultState,
      resultsAvailableAt,
      isPreviousResult: false,
      entries: toDailyLeaderboardEntries(attempts),
    };
  }

  // LIVE or WAITING_FOR_RESULTS: show the previous official leaderboard
  // instead of anything from today's still-in-progress/unpublished quiz.
  const previous = await findPreviousOfficialLeaderboard(quiz, now);
  return {
    quizId: quiz.id,
    resultState,
    resultsAvailableAt,
    isPreviousResult: true,
    previousQuiz: previous ? { id: previous.quizId, title: previous.quizTitle, competitionDate: previous.competitionDate } : null,
    entries: previous?.entries ?? [],
    message:
      resultState === "WAITING_FOR_RESULTS"
        ? `Today's results will be revealed at ${resultsAvailableAt?.toISOString() ?? "a later time"}.`
        : "The quiz is still live - showing the previous official results.",
  };
}

/**
 * Global leaderboard (spec section 12): ranked by total XP, then total
 * competition points, then total correct answers. Tie-break uses the
 * user id for full determinism (the spec's "earliest authoritative server
 * timestamp" isn't a column we persist per-ranking-change without a much
 * heavier ledger scan, so id is used as a stable, documented simplification).
 */
export async function getGlobalLeaderboard(limit?: number) {
  const now = new Date();
  const indiaNow = new Date(now.getTime() + 330 * 60_000);
  const monthStart = Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth(), 1) - 330 * 60_000;
  const nextMonthStart = Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth() + 1, 1) - 330 * 60_000;
  const previousMonthStart = Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth() - 1, 1) - 330 * 60_000;

  const current = await getMonthlyRankings(new Date(monthStart), new Date(nextMonthStart), limit);
  const previousMonthTop3 = await getMonthlyRankings(new Date(previousMonthStart), new Date(monthStart), 3, false);
  return {
    leaderboard: current,
    period: {
      startsAt: new Date(monthStart).toISOString(),
      endsAt: new Date(nextMonthStart).toISOString(),
      label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(now),
      key: `${indiaNow.getUTCFullYear()}-${String(indiaNow.getUTCMonth() + 1).padStart(2, "0")}`,
    },
    previousMonthTop3,
  };
}

async function getMonthlyRankings(startsAt: Date, endsAt: Date, limit?: number, includeUnattempted = true) {
  const quizzes = await prisma.quiz.findMany({
    where: {
      status: { in: [QuizStatus.FINALIZED, QuizStatus.ARCHIVED] },
      competitionDate: { gte: startsAt, lt: endsAt },
    },
    select: { id: true },
  });
  const aggregates = await attemptRepository.aggregateSubmittedAttemptsByUser(quizzes.map((quiz) => quiz.id));
  if (!includeUnattempted && !aggregates.length) return [];

  const users = await prisma.user.findMany({
    where: includeUnattempted
      ? { role: "STUDENT" }
      : { id: { in: aggregates.map((row) => row.userId) }, role: "STUDENT" },
    select: { id: true, fullName: true, avatar: true, department: true, xp: true, totalCompetitionPoints: true, totalCorrectAnswers: true, currentStreak: true },
  });
  const aggregateByUserId = new Map(aggregates.map((aggregate) => [aggregate.userId, aggregate]));
  const rankings = users
    .map((user) => {
      const aggregate = aggregateByUserId.get(user.id);
      return {
        ...user,
        monthlyPoints: aggregate?._sum.score ?? 0,
        monthlyCorrectAnswers: aggregate?._sum.correctAnswers ?? 0,
        monthlyQuizzesCompleted: aggregate?._count._all ?? 0,
        monthlyResponseTimeMs: aggregate?._sum.completionTimeMs ?? 0,
        earliestSubmissionAt: aggregate?._min.submittedAt ?? null,
      };
    })
    .sort((a, b) => b.monthlyPoints - a.monthlyPoints || b.monthlyCorrectAnswers - a.monthlyCorrectAnswers || a.monthlyResponseTimeMs - b.monthlyResponseTimeMs || (a.earliestSubmissionAt?.getTime() ?? 0) - (b.earliestSubmissionAt?.getTime() ?? 0) || a.id.localeCompare(b.id));
  return (limit === undefined ? rankings : rankings.slice(0, limit))
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}
