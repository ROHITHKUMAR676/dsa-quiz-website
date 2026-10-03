import { QuizStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { finalizeQuizResults } from "./finalization.service.js";
import { getEffectiveEndsAt, getResultReleaseAt, getResultState } from "./quizLifecycle.service.js";
import * as attemptRepo from "../repositories/attempt.repository.js";

export function getIstMonthBounds(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(date);
  const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const key = `${p.year}-${p.month}`;
  const [year, month] = key.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1) - 330 * 60_000);
  const end = new Date(Date.UTC(year, month, 1) - 330 * 60_000);
  return { key, start, end };
}

export function aggregateMonthlyAttempts(attempts: Array<{
  userId: string; score: number; correctAnswers: number; submittedAt: Date | null;
  answers: Array<{ responseTimeMs: number | null }>;
  user: { id: string; fullName: string; avatar: string | null; department: string | null };
}>) {
  const totals = new Map<string, { user: (typeof attempts)[number]["user"]; totalScore: number; totalCorrectAnswers: number; totalResponseTimeMs: number; earliestSubmission: number }>();
  for (const attempt of attempts) {
    const previous = totals.get(attempt.userId) ?? {
      user: attempt.user, totalScore: 0, totalCorrectAnswers: 0, totalResponseTimeMs: 0, earliestSubmission: Number.MAX_SAFE_INTEGER,
    };
    previous.totalScore += attempt.score;
    previous.totalCorrectAnswers += attempt.correctAnswers;
    previous.totalResponseTimeMs += attempt.answers.reduce((sum, answer) => sum + (answer.responseTimeMs ?? 0), 0);
    previous.earliestSubmission = Math.min(previous.earliestSubmission, attempt.submittedAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    totals.set(attempt.userId, previous);
  }
  return [...totals.values()].sort((a, b) =>
    b.totalScore - a.totalScore || b.totalCorrectAnswers - a.totalCorrectAnswers ||
    a.totalResponseTimeMs - b.totalResponseTimeMs || a.earliestSubmission - b.earliestSubmission
  ).map((entry, index) => ({
    rank: index + 1, userId: entry.user.id, fullName: entry.user.fullName, avatar: entry.user.avatar,
    department: entry.user.department, totalScore: entry.totalScore, totalCorrectAnswers: entry.totalCorrectAnswers,
    totalResponseTimeMs: entry.totalResponseTimeMs,
  }));
}

async function monthlyEntries(start: Date, end: Date, now: Date) {
  const attempts = await attemptRepo.findReleasedAttemptsBetween(start, end);
  const releasedAttempts = attempts.filter((attempt) => {
    const releaseAt = getResultReleaseAt(attempt.quiz);
    return Boolean(releaseAt && now >= releaseAt);
  });
  return aggregateMonthlyAttempts(releasedAttempts);
}

/** Current-month aggregate from finalized daily scores; historical totals/XP remain untouched. */
export async function getMonthlyLeaderboard(now = new Date(), limit = 50) {
  const current = getIstMonthBounds(now);
  const previous = getIstMonthBounds(new Date(current.start.getTime() - 1));
  const [entries, previousEntries] = await Promise.all([
    monthlyEntries(current.start, current.end, now),
    monthlyEntries(previous.start, previous.end, now),
  ]);
  return {
    period: current.key,
    leaderboard: entries.slice(0, limit),
    previousPeriod: previous.key,
    previousPeriodTop3: previousEntries.slice(0, 3),
  };
}

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

export async function finalizeQuizIfReleaseIsDue(quiz: Awaited<ReturnType<typeof quizRepository.findQuizForAttempt>>) {
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
export async function getGlobalLeaderboard(limit = 50) {
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: [
      { xp: "desc" },
      { totalCompetitionPoints: "desc" },
      { totalCorrectAnswers: "desc" },
      { id: "asc" },
    ],
    take: limit,
    select: {
      id: true,
      fullName: true,
      avatar: true,
      department: true,
      xp: true,
      totalCompetitionPoints: true,
      totalCorrectAnswers: true,
      currentStreak: true,
    },
  });

  return users.map((user, index) => ({ rank: index + 1, ...user }));
}
