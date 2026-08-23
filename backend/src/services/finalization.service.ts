import { RewardSource } from "@prisma/client";
import * as attemptRepository from "../repositories/attempt.repository.js";
import * as ledgerRepository from "../repositories/ledger.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import * as notificationRepository from "../repositories/notification.repository.js";
import { XP_RULES, COIN_RULES } from "../config/rewards.js";
import { evaluateFinalizationBadges } from "./badge.service.js";
import { NotificationType } from "@prisma/client";

/**
 * Ranks every SUBMITTED attempt for a quiz, credits total competition
 * points for the global leaderboard, and awards Rank 1/2/3 bonuses using
 * idempotent reference keys of the exact shape the spec calls for:
 * `quizRankReward:{quizId}:{rank}:{userId}` (spec section 19) - so retrying
 * finalize() after a partial failure can never double-pay.
 *
 * Deliberately NOT called at submission time - rank can change until the
 * quiz is finalized (spec section 19).
 */
export async function finalizeQuizResults(quizId: string) {
  const rankedAttempts = await attemptRepository.findSubmittedAttemptsRankedForQuiz(quizId);

  const rankRewardsAwarded: Array<{ userId: string; rank: number }> = [];

  for (let index = 0; index < rankedAttempts.length; index += 1) {
    const attempt = rankedAttempts[index];
    const rank = index + 1;

    await userRepository.incrementCompetitionTotalsOnce(
      attempt.userId,
      {
        competitionPoints: attempt.score,
        correctAnswers: 0, // already credited at submission time
      },
      `quizCompetitionPoints:${quizId}:${attempt.userId}`
    );

    if (rank <= 3) {
      const referenceId = `quizRankReward:${quizId}:${rank}:${attempt.userId}`;
      const xpAmount = XP_RULES.rankBonus[rank] ?? 0;
      const coinAmount = COIN_RULES.rankBonus[rank] ?? 0;

      const xpResult = await ledgerRepository.awardXp({
        userId: attempt.userId,
        amount: xpAmount,
        source: RewardSource.QUIZ_RANK,
        referenceId,
      });
      await ledgerRepository.awardCoins({
        userId: attempt.userId,
        amount: coinAmount,
        source: RewardSource.QUIZ_RANK,
        referenceId,
      });

      if (xpResult) {
        rankRewardsAwarded.push({ userId: attempt.userId, rank });
        await notificationRepository.createNotification({
          userId: attempt.userId,
          type: NotificationType.RANK,
          title: `You finished rank #${rank}!`,
          message: `Congratulations - you placed #${rank} on today's quiz.`,
          metadata: { quizId, rank },
        });
      }
    }
  }

  const awardedBadges = await evaluateFinalizationBadges({
    quizId,
    finalizedAt: new Date(),
    rankedAttempts: rankedAttempts.map((attempt, index) => ({
      id: attempt.id,
      userId: attempt.userId,
      rank: index + 1,
      submittedAt: attempt.submittedAt,
    })),
  });

  return {
    quizId,
    participantCount: rankedAttempts.length,
    rankRewardsAwarded,
    awardedBadges,
  };
}
