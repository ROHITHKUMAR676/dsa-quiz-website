import { Difficulty } from "@prisma/client";

/**
 * All XP/coin values live here so they are never scattered across services
 * (spec sections 17-19: "must be configurable rather than scattered
 * throughout code"). Adjusting the economy means editing this file only.
 */
export const XP_RULES = {
  correctByDifficulty: {
    [Difficulty.EASY]: 10,
    [Difficulty.MEDIUM]: 20,
    [Difficulty.HARD]: 30,
  } as Record<Difficulty, number>,
  perfectQuizBonus: 50,
  rankBonus: { 1: 100, 2: 60, 3: 40 } as Record<number, number>,
};

export const COIN_RULES = {
  correctAnswer: 5,
  perfectQuizBonus: 25,
  rankBonus: { 1: 100, 2: 60, 3: 50 } as Record<number, number>,
  defaultBadgeReward: 20,
};

export const STREAK_RULES = {
  // A submitted attempt with >=1 answered question qualifies (spec section 20).
  minAnsweredQuestionsToQualify: 1,
};
