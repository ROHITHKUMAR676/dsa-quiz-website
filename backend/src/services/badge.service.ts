import { BadgeRuleType, NotificationType, RewardSource, type Badge } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import * as badgeRepository from "../repositories/badge.repository.js";
import * as ledgerRepository from "../repositories/ledger.repository.js";
import * as notificationRepository from "../repositories/notification.repository.js";
import { COIN_RULES } from "../config/rewards.js";

export const IMMEDIATE_BADGE_RULE_TYPES: BadgeRuleType[] = [
  BadgeRuleType.PERFECT_SCORE,
  BadgeRuleType.THREE_DAY_STREAK,
  BadgeRuleType.SEVEN_DAY_STREAK,
  BadgeRuleType.QUIZ_MASTER,
  BadgeRuleType.ACCURACY_KING,
  BadgeRuleType.CONSISTENT_PERFORMER,
  BadgeRuleType.RISING_STAR,
  BadgeRuleType.SPEEDSTER,
  BadgeRuleType.CATEGORY_MASTER,
];

// Deliberately NOT awarded before official finalization (spec section 16:
// "Do not award rank-based badges before official results are released").
export const FINALIZATION_BADGE_RULE_TYPES: BadgeRuleType[] = [
  BadgeRuleType.CHAMPION,
  BadgeRuleType.TOP_THREE,
  BadgeRuleType.FIRST_BLOOD,
];

interface ImmediateBadgeContext {
  userId: string;
  quizId: string;
  category: string;
  attempt: {
    id: string;
    correctAnswers: number;
    totalQuestions: number;
    completionTimeMs: number | null;
  };
  streak: { currentStreak: number };
}

async function evaluateRule(rule: Badge, ctx: ImmediateBadgeContext): Promise<boolean> {
  const config = (rule.ruleConfig as Record<string, number>) ?? {};

  switch (rule.ruleType) {
    case BadgeRuleType.PERFECT_SCORE:
      return ctx.attempt.totalQuestions > 0 && ctx.attempt.correctAnswers === ctx.attempt.totalQuestions;

    case BadgeRuleType.THREE_DAY_STREAK:
      return ctx.streak.currentStreak >= (config.streak ?? 3);

    case BadgeRuleType.SEVEN_DAY_STREAK:
      return ctx.streak.currentStreak >= (config.streak ?? 7);

    case BadgeRuleType.SPEEDSTER: {
      if (!config.maxCompletionMs || ctx.attempt.completionTimeMs == null) return false;
      const accuracy = ctx.attempt.totalQuestions > 0 ? ctx.attempt.correctAnswers / ctx.attempt.totalQuestions : 0;
      return ctx.attempt.completionTimeMs <= config.maxCompletionMs && accuracy >= (config.minAccuracy ?? 0.8);
    }

    case BadgeRuleType.QUIZ_MASTER: {
      const submittedCount = await prisma.quizAttempt.count({
        where: { userId: ctx.userId, status: "SUBMITTED" },
      });
      return submittedCount >= (config.quizzesCompleted ?? 10);
    }

    case BadgeRuleType.ACCURACY_KING: {
      const aggregate = await prisma.quizAttempt.aggregate({
        where: { userId: ctx.userId, status: "SUBMITTED" },
        _avg: { accuracy: true },
        _count: { _all: true },
      });
      const minQuizzes = config.minQuizzes ?? 5;
      const minAccuracy = config.minAccuracy ?? 90;
      return (aggregate._count._all ?? 0) >= minQuizzes && Number(aggregate._avg.accuracy ?? 0) >= minAccuracy;
    }

    case BadgeRuleType.CONSISTENT_PERFORMER:
      // Reuses the daily streak as the "consistency" signal.
      return ctx.streak.currentStreak >= (config.streak ?? 5);

    case BadgeRuleType.RISING_STAR: {
      const submittedCount = await prisma.quizAttempt.count({
        where: { userId: ctx.userId, status: "SUBMITTED" },
      });
      const accuracy = ctx.attempt.totalQuestions > 0 ? (ctx.attempt.correctAnswers / ctx.attempt.totalQuestions) * 100 : 0;
      // First attempt ever, with a strong debut score.
      return submittedCount === 1 && accuracy >= (config.minAccuracy ?? 70);
    }

    case BadgeRuleType.CATEGORY_MASTER: {
      if (!config.count) return false;
      const categoryCount = await prisma.quizAttempt.count({
        where: { userId: ctx.userId, status: "SUBMITTED", quiz: { category: ctx.category } },
      });
      return categoryCount >= config.count;
    }

    default:
      return false;
  }
}

async function grantBadge(userId: string, badge: Badge, referenceId: string, metadata?: Record<string, unknown>) {
  const awarded = await badgeRepository.awardBadge(userId, badge.id, metadata);
  if (!awarded) return null; // already had it - idempotent no-op

  if (badge.xpReward > 0) {
    await ledgerRepository.awardXp({
      userId,
      amount: badge.xpReward,
      source: RewardSource.BADGE,
      referenceId: `badge:${badge.id}:${referenceId}`,
    });
  }

  const coinReward = badge.coinReward > 0 ? badge.coinReward : COIN_RULES.defaultBadgeReward;
  await ledgerRepository.awardCoins({
    userId,
    amount: coinReward,
    source: RewardSource.BADGE,
    referenceId: `badge:${badge.id}:${referenceId}`,
  });

  await notificationRepository.createNotification({
    userId,
    type: NotificationType.BADGE,
    title: `Badge unlocked: ${badge.name}`,
    message: badge.description,
    metadata: { badgeId: badge.id },
  });

  return awarded;
}

/** Called right after an attempt is submitted (Phase 4). */
export async function evaluateImmediateBadges(ctx: ImmediateBadgeContext) {
  const rules = await badgeRepository.listActiveBadgesByRuleTypes(IMMEDIATE_BADGE_RULE_TYPES);
  const awarded: string[] = [];

  for (const rule of rules) {
    const qualifies = await evaluateRule(rule, ctx);
    if (!qualifies) continue;
    const result = await grantBadge(ctx.userId, rule, ctx.attempt.id);
    if (result) awarded.push(rule.name);
  }

  return awarded;
}

interface FinalizationBadgeContext {
  quizId: string;
  finalizedAt: Date;
  rankedAttempts: Array<{ id: string; userId: string; rank: number; submittedAt: Date | null }>;
}

/** Called once a quiz is finalized (Phase 6) - rank-based badges only. */
export async function evaluateFinalizationBadges(ctx: FinalizationBadgeContext) {
  const rules = await badgeRepository.listActiveBadgesByRuleTypes(FINALIZATION_BADGE_RULE_TYPES);
  if (rules.length === 0 || ctx.rankedAttempts.length === 0) return [];

  const championRule = rules.find((rule) => rule.ruleType === BadgeRuleType.CHAMPION);
  const topThreeRule = rules.find((rule) => rule.ruleType === BadgeRuleType.TOP_THREE);
  const firstBloodRule = rules.find((rule) => rule.ruleType === BadgeRuleType.FIRST_BLOOD);

  const awarded: string[] = [];

  for (const attempt of ctx.rankedAttempts) {
    if (championRule && attempt.rank === 1) {
      const result = await grantBadge(attempt.userId, championRule, ctx.quizId);
      if (result) awarded.push(championRule.name);
    }
    if (topThreeRule && attempt.rank <= 3) {
      const result = await grantBadge(attempt.userId, topThreeRule, ctx.quizId);
      if (result) awarded.push(topThreeRule.name);
    }
  }

  if (firstBloodRule) {
    const earliest = [...ctx.rankedAttempts]
      .filter((attempt) => attempt.submittedAt)
      .sort((a, b) => a.submittedAt!.getTime() - b.submittedAt!.getTime())[0];
    if (earliest) {
      const result = await grantBadge(earliest.userId, firstBloodRule, ctx.quizId);
      if (result) awarded.push(firstBloodRule.name);
    }
  }

  return awarded;
}
