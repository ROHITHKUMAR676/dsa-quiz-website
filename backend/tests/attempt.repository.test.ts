import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ quizAttempt: { findMany: vi.fn().mockResolvedValue([]) } }));
vi.mock("../src/config/prisma.js", () => ({ prisma: prismaMock }));

const { findSubmittedAttemptsRankedForQuiz } = await import("../src/repositories/attempt.repository.js");

describe("daily leaderboard tie-breaking", () => {
  it("orders by score and correctness in SQL, then loads server response times for stable tie-breaking", async () => {
    await findSubmittedAttemptsRankedForQuiz("quiz-1");
    expect(prismaMock.quizAttempt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [
        { score: "desc" },
        { correctAnswers: "desc" },
      ],
      include: expect.objectContaining({ answers: { select: { responseTimeMs: true } } }),
    }));
  });
});
