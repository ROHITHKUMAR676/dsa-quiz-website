import { describe, expect, it } from "vitest";
import { aggregateMonthlyAttempts, getIstMonthBounds } from "../src/services/leaderboard.service.js";

const user = (id: string) => ({ id, fullName: id, avatar: null, department: null });

describe("monthly leaderboard aggregation", () => {
  it("uses IST month boundaries and rolls over at midnight on the first", () => {
    const before = getIstMonthBounds(new Date("2026-09-30T18:29:59.999Z"));
    const after = getIstMonthBounds(new Date("2026-09-30T18:30:00.000Z"));
    expect(before.key).toBe("2026-09");
    expect(after.key).toBe("2026-10");
    expect(after.start.toISOString()).toBe("2026-09-30T18:30:00.000Z");
  });

  it("aggregates only supplied finalized scores and applies all ranking tie-breakers", () => {
    const attempts = [
      { userId: "score", user: user("score"), score: 900, correctAnswers: 5, submittedAt: new Date("2026-10-02T00:00:00Z"), answers: [{ responseTimeMs: 7000 }] },
      { userId: "score", user: user("score"), score: 100, correctAnswers: 1, submittedAt: new Date("2026-10-03T00:00:00Z"), answers: [{ responseTimeMs: 7000 }] },
      { userId: "correct", user: user("correct"), score: 1000, correctAnswers: 7, submittedAt: new Date("2026-10-02T00:00:00Z"), answers: [{ responseTimeMs: 14000 }] },
      { userId: "fast", user: user("fast"), score: 1000, correctAnswers: 7, submittedAt: new Date("2026-10-03T00:00:00Z"), answers: [{ responseTimeMs: 6000 }] },
      { userId: "early", user: user("early"), score: 1000, correctAnswers: 7, submittedAt: new Date("2026-10-01T00:00:00Z"), answers: [{ responseTimeMs: 6000 }] },
    ];
    const entries = aggregateMonthlyAttempts(attempts);
    expect(entries.map((entry) => entry.userId)).toEqual(["early", "fast", "correct", "score"]);
    expect(entries.find((entry) => entry.userId === "score")?.totalScore).toBe(1000);
  });
});
