export const QUESTION_TIME_LIMIT_MS = 30_000;

/** Correct answers score on elapsed server time; all incorrect/late answers score zero. */
export function calculateQuestionScore(isCorrect: boolean, responseTimeMs: number) {
  if (!isCorrect || !Number.isFinite(responseTimeMs) || responseTimeMs < 0 || responseTimeMs >= QUESTION_TIME_LIMIT_MS) return 0;
  if (responseTimeMs <= 5_000) return 100;
  if (responseTimeMs <= 10_000) return 90;
  if (responseTimeMs <= 15_000) return 80;
  if (responseTimeMs <= 20_000) return 70;
  if (responseTimeMs <= 25_000) return 60;
  return 50;
}
