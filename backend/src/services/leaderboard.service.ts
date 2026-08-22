import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { getResultReleaseAt, getResultState } from "./quizLifecycle.service.js";

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

/**
 * The single source of truth for "what can a student see right now" on the
 * daily leaderboard. Never exposes an unpublished ranking (spec section 33).
 */
export async function getDailyLeaderboard(quizId: string) {
  const quiz = await quizRepository.findQuizForAttempt(quizId);
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
