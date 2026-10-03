import { describe, expect, it } from "vitest";
import { calculateQuestionScore, QUESTION_TIME_LIMIT_MS } from "../src/services/quizScoring.service.js";

describe("daily quiz scoring rubric", () => {
  it.each([
    [0, 100], [5_000, 100],
    [5_001, 90], [10_000, 90],
    [10_001, 80], [15_000, 80],
    [15_001, 70], [20_000, 70],
    [20_001, 60], [25_000, 60],
    [25_001, 50], [29_999, 50],
  ])("awards %i ms -> %i points for a correct answer", (elapsedMs, points) => {
    expect(calculateQuestionScore(true, elapsedMs)).toBe(points);
  });

  it.each([5_000, 10_000, 15_000, 20_000, 25_000])("keeps exact %i ms boundary in the faster bracket", (elapsedMs) => {
    expect(calculateQuestionScore(true, elapsedMs)).toBeGreaterThan(calculateQuestionScore(true, elapsedMs + 1));
  });

  it("awards zero for wrong, unanswered, and timed-out answers", () => {
    expect(calculateQuestionScore(false, 1_000)).toBe(0);
    expect(calculateQuestionScore(false, QUESTION_TIME_LIMIT_MS)).toBe(0);
    expect(calculateQuestionScore(true, QUESTION_TIME_LIMIT_MS)).toBe(0);
    expect(calculateQuestionScore(true, QUESTION_TIME_LIMIT_MS + 1)).toBe(0);
  });
});
