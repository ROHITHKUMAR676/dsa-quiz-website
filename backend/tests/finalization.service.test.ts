import { beforeEach, describe, expect, it, vi } from "vitest";

const attemptRepository = vi.hoisted(() => ({ findSubmittedAttemptsRankedForQuiz: vi.fn() }));
const ledgerRepository = vi.hoisted(() => ({ awardXp: vi.fn(), awardCoins: vi.fn() }));
const userRepository = vi.hoisted(() => ({ incrementCompetitionTotals: vi.fn() }));
const notificationRepository = vi.hoisted(() => ({ createNotification: vi.fn() }));
const badgeService = vi.hoisted(() => ({ evaluateFinalizationBadges: vi.fn().mockResolvedValue([]) }));

vi.mock("../src/repositories/attempt.repository.js", () => attemptRepository);
vi.mock("../src/repositories/ledger.repository.js", () => ledgerRepository);
vi.mock("../src/repositories/user.repository.js", () => userRepository);
vi.mock("../src/repositories/notification.repository.js", () => notificationRepository);
vi.mock("../src/services/badge.service.js", () => badgeService);

const { finalizeQuizResults } = await import("../src/services/finalization.service.js");

function buildAttempt(userId: string, score: number) {
  return { id: `attempt-${userId}`, userId, quizId: "quiz-1", score, correctAnswers: 5, completionTimeMs: 1000, submittedAt: new Date() };
}

describe("finalizeQuizResults", () => {
  beforeEach(() => vi.clearAllMocks());

  it("only pays rank rewards to the top 3, using the idempotent reference key shape from the spec", async () => {
    attemptRepository.findSubmittedAttemptsRankedForQuiz.mockResolvedValue([
      buildAttempt("u1", 100),
      buildAttempt("u2", 90),
      buildAttempt("u3", 80),
      buildAttempt("u4", 70),
    ]);
    ledgerRepository.awardXp.mockResolvedValue({ id: "xp-tx" });
    ledgerRepository.awardCoins.mockResolvedValue({ id: "coin-tx" });

    await finalizeQuizResults("quiz-1");

    expect(ledgerRepository.awardXp).toHaveBeenCalledTimes(3);
    expect(ledgerRepository.awardXp).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", referenceId: "quizRankReward:quiz-1:1:u1" })
    );
    expect(ledgerRepository.awardXp).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u3", referenceId: "quizRankReward:quiz-1:3:u3" })
    );
    // 4th place gets no rank bonus call.
    expect(ledgerRepository.awardXp).not.toHaveBeenCalledWith(expect.objectContaining({ userId: "u4" }));
  });

  it("does not send a rank notification when the ledger reports a duplicate (already awarded)", async () => {
    attemptRepository.findSubmittedAttemptsRankedForQuiz.mockResolvedValue([buildAttempt("u1", 100)]);
    ledgerRepository.awardXp.mockResolvedValue(null); // duplicate - idempotent no-op
    ledgerRepository.awardCoins.mockResolvedValue(null);

    const result = await finalizeQuizResults("quiz-1");

    expect(result.rankRewardsAwarded).toHaveLength(0);
    expect(notificationRepository.createNotification).not.toHaveBeenCalled();
  });

  it("credits every participant's global competition points, not just the top 3", async () => {
    attemptRepository.findSubmittedAttemptsRankedForQuiz.mockResolvedValue([
      buildAttempt("u1", 100),
      buildAttempt("u2", 90),
      buildAttempt("u3", 80),
      buildAttempt("u4", 70),
    ]);
    ledgerRepository.awardXp.mockResolvedValue({ id: "tx" });
    ledgerRepository.awardCoins.mockResolvedValue({ id: "tx" });

    await finalizeQuizResults("quiz-1");

    expect(userRepository.incrementCompetitionTotals).toHaveBeenCalledTimes(4);
    expect(userRepository.incrementCompetitionTotals).toHaveBeenCalledWith(
      "u4",
      expect.objectContaining({ competitionPoints: 70 })
    );
  });
});
