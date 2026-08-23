import { RewardSource, NotificationType, WeeklyStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import * as weeklyRepository from "../repositories/weekly.repository.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as ledgerRepository from "../repositories/ledger.repository.js";
import * as notificationRepository from "../repositories/notification.repository.js";
import { aggregateSubmittedAttemptsByUser } from "../repositories/attempt.repository.js";
import { XP_RULES, COIN_RULES } from "../config/rewards.js";

/** Monday 00:00 -> next Monday 00:00, in the app's configured timezone calendar. */
export function getWeekRange(referenceDate: Date): { weekStart: Date; weekEnd: Date } {
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: env.APP_TIMEZONE }).format(referenceDate);
  const local = new Date(`${dateKey}T00:00:00`);
  const dayOfWeek = local.getUTCDay() === 0 ? 7 : local.getUTCDay(); // Mon=1..Sun=7
  const weekStart = new Date(local);
  weekStart.setUTCDate(local.getUTCDate() - (dayOfWeek - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
  return { weekStart, weekEnd };
}

export async function getOrCreateWeeklyCompetition(referenceDate: Date) {
  const { weekStart, weekEnd } = getWeekRange(referenceDate);
  const existing = await weeklyRepository.findWeeklyCompetitionByRange(weekStart, weekEnd);
  if (existing) return existing;
  return weeklyRepository.createWeeklyCompetition(weekStart, weekEnd);
}

/**
 * Finalizes a week: aggregates only FINALIZED/ARCHIVED daily quizzes in
 * range (spec section 13: "must be based on authoritative finalized daily
 * results... Do not calculate weekly rankings from temporary/unpublished
 * results"), snapshots the ranking immutably, and pays Top-3 weekly bonuses
 * idempotently.
 */
export async function finalizeWeeklyCompetition(weeklyCompetitionId: string) {
  const weekly = await weeklyRepository.findWeeklyCompetitionById(weeklyCompetitionId);
  if (!weekly) throw new ApiError(404, "Weekly competition not found", "WEEKLY_NOT_FOUND");
  if (weekly.status === WeeklyStatus.FINALIZED) {
    // Idempotent: re-finalizing just returns the existing snapshot.
    const leaderboard = await weeklyRepository.getWeeklyLeaderboard(weeklyCompetitionId);
    return { weekly, leaderboard };
  }

  const finalizedQuizzes = await quizRepository.findFinalizedQuizzesBetween(weekly.weekStart, weekly.weekEnd);
  const quizIds = finalizedQuizzes.map((quiz) => quiz.id);
  const aggregates = await aggregateSubmittedAttemptsByUser(quizIds);

  const ranked = aggregates
    .map((row) => ({
      userId: row.userId,
      totalScore: row._sum.score ?? 0,
      totalCorrectAnswers: row._sum.correctAnswers ?? 0,
      quizzesCompleted: row._count._all,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || b.totalCorrectAnswers - a.totalCorrectAnswers)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  await weeklyRepository.finalizeWeeklyCompetition(weeklyCompetitionId, ranked);

  for (const entry of ranked) {
    if (entry.rank > 3) continue;
    const referenceId = `weeklyRankReward:${weeklyCompetitionId}:${entry.rank}:${entry.userId}`;
    await ledgerRepository.awardXp({
      userId: entry.userId,
      amount: XP_RULES.rankBonus[entry.rank] ?? 0,
      source: RewardSource.WEEKLY_RANK,
      referenceId,
    });
    await ledgerRepository.awardCoins({
      userId: entry.userId,
      amount: COIN_RULES.rankBonus[entry.rank] ?? 0,
      source: RewardSource.WEEKLY_RANK,
      referenceId,
    });
    await notificationRepository.createNotification({
      userId: entry.userId,
      type: NotificationType.RANK,
      title: `Weekly rank #${entry.rank}!`,
      message: `Congratulations - you placed #${entry.rank} on this week's leaderboard.`,
      metadata: { weeklyCompetitionId, rank: entry.rank },
    });
  }

  const finalWeekly = await weeklyRepository.findWeeklyCompetitionById(weeklyCompetitionId);
  const leaderboard = await weeklyRepository.getWeeklyLeaderboard(weeklyCompetitionId);
  return { weekly: finalWeekly, leaderboard };
}

export async function getWeeklyLeaderboardForStudent(weeklyCompetitionId: string) {
  const weekly = await weeklyRepository.findWeeklyCompetitionById(weeklyCompetitionId);
  if (!weekly) throw new ApiError(404, "Weekly competition not found", "WEEKLY_NOT_FOUND");
  if (new Date() < weekly.weekEnd) {
    return { weekly, entries: [], message: "Weekly leaderboard opens after this week ends." };
  }
  if (weekly.status !== WeeklyStatus.FINALIZED) {
    return { weekly, entries: [], message: "This week's results are being prepared." };
  }
  const leaderboard = await weeklyRepository.getWeeklyLeaderboard(weeklyCompetitionId);
  return {
    weekly,
    entries: leaderboard.map((entry) => ({
      rank: entry.rank,
      userId: entry.userId,
      fullName: entry.user.fullName,
      avatar: entry.user.avatar,
      department: entry.user.department,
      totalScore: entry.totalScore,
      totalCorrectAnswers: entry.totalCorrectAnswers,
      quizzesCompleted: entry.quizzesCompleted,
    })),
  };
}

export function listWeeklyCompetitions() {
  return weeklyRepository.listWeeklyCompetitions();
}
