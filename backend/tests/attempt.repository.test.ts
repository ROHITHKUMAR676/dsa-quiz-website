import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ quizAttempt: { findMany: vi.fn().mockResolvedValue([]) } }));
vi.mock("../src/config/prisma.js", () => ({ prisma: prismaMock }));

const { findSubmittedAttemptsRankedForQuiz } = await import("../src/repositories/attempt.repository.js");

describe("daily leaderboard tie-breaking", () => {
  it("orders by score, correctness, total response time, then earliest submission", async () => {
    await findSubmittedAttemptsRankedForQuiz("quiz-1");
    expect(prismaMock.quizAttempt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { score: "desc" },
        { correctAnswers: "desc" },
        { completionTimeMs: "asc" },
        { scoreAchievedAt: "asc" },
      ],
    }));
  });
});
