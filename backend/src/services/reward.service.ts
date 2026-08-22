import { Difficulty, RewardSource } from "@prisma/client";
import { XP_RULES, COIN_RULES } from "../config/rewards.js";
import * as ledgerRepository from "../repositories/ledger.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as streakService from "./streak.service.js";
import * as badgeService from "./badge.service.js";

interface GradedAnswerForRewards {
  isCorrect: boolean;
  difficulty: Difficulty;
}

interface ApplyImmediateRewardsInput {
  userId: string;
  quizId: string;
  category: string;
  attemptId: string;
  submittedAt: Date;
  totalQuestions: number;
  correctAnswers: number;
  answeredCount: number;
  completionTimeMs: number;
  gradedAnswers: GradedAnswerForRewards[];
}

/**
 * Awards XP/coins for correct answers + perfect-quiz bonus, updates the
 * daily streak, and evaluates immediate (non-rank) badges. Deliberately
 * excludes Rank 1/2/3 bonuses and rank-dependent badges - those are only
 * awarded once a quiz is officially FINALIZED (spec section 19).
 */
export async function applyImmediateRewards(input: ApplyImmediateRewardsInput) {
  const isPerfect = input.totalQuestions > 0 && input.correctAnswers === input.totalQuestions;

  let xpAmount = 0;
  let coinAmount = 0;
  for (const answer of input.gradedAnswers) {
    if (!answer.isCorrect) continue;
    xpAmount += XP_RULES.correctByDifficulty[answer.difficulty] ?? 0;
    coinAmount += COIN_RULES.correctAnswer;
  }
  if (isPerfect) {
    xpAmount += XP_RULES.perfectQuizBonus;
    coinAmount += COIN_RULES.perfectQuizBonus;
  }

  if (xpAmount > 0) {
    await ledgerRepository.awardXp({
      userId: input.userId,
      amount: xpAmount,
      source: isPerfect ? RewardSource.PERFECT_QUIZ : RewardSource.QUIZ_ANSWER,
      referenceId: `attempt:${input.attemptId}:xp`,
    });
  }
  if (coinAmount > 0) {
    await ledgerRepository.awardCoins({
      userId: input.userId,
      amount: coinAmount,
      source: isPerfect ? RewardSource.PERFECT_QUIZ : RewardSource.QUIZ_ANSWER,
      referenceId: `attempt:${input.attemptId}:coins`,
    });
  }

  await attemptRepository.updateAttemptRewards(input.attemptId, { xpEarned: xpAmount, coinsEarned: coinAmount });
  await userRepository.incrementCompetitionTotals(input.userId, {
    competitionPoints: 0, // competition points are added at finalization from the authoritative score
    correctAnswers: input.correctAnswers,
  });

  let streakResult = { currentStreak: 0 };
  if (input.answeredCount >= 1) {
    const user = await userRepository.findUserSelect(input.userId, {
      id: true,
      currentStreak: true,
      longestStreak: true,
      lastQualifyingDate: true,
    });
    if (user) {
      streakResult = await streakService.recordQualifyingActivity(user, input.submittedAt);
    }
  }

  const awardedBadges = await badgeService.evaluateImmediateBadges({
    userId: input.userId,
    quizId: input.quizId,
    category: input.category,
    attempt: {
      id: input.attemptId,
      correctAnswers: input.correctAnswers,
      totalQuestions: input.totalQuestions,
      completionTimeMs: input.completionTimeMs,
    },
    streak: streakResult,
  });

  return { xpAmount, coinAmount, currentStreak: streakResult.currentStreak, awardedBadges };
}
