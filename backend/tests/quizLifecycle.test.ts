import { QuizStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  assertQuizEditable,
  assertTransitionAllowed,
  getEffectiveEndsAt,
  getResultReleaseAt,
  getResultState,
  getServerAvailabilityState,
  getIstDailyWindow,
} from "../src/services/quizLifecycle.service.js";

describe("quiz lifecycle", () => {
  it("uses the fixed 8–9 PM IST window independent of host timezone", () => {
    const window = getIstDailyWindow("2026-08-15");
    expect(window.startsAt.toISOString()).toBe("2026-08-15T14:30:00.000Z");
    expect(window.endsAt.toISOString()).toBe("2026-08-15T15:30:00.000Z");
    expect(window.competitionDate.toISOString()).toBe("2026-08-14T18:30:00.000Z");
  });

  it("opens at 8 PM IST exactly and closes at 9 PM IST exactly", () => {
    const { startsAt, endsAt } = getIstDailyWindow("2026-08-15");
    const quiz = { status: QuizStatus.SCHEDULED, startsAt, endsAt, defaultWindowMinutes: 60 };
    expect(getServerAvailabilityState(quiz, new Date(startsAt.getTime() - 1))).toBe(QuizStatus.SCHEDULED);
    expect(getServerAvailabilityState(quiz, startsAt)).toBe(QuizStatus.LIVE);
    expect(getServerAvailabilityState(quiz, new Date(startsAt.getTime() + 30 * 60_000))).toBe(QuizStatus.LIVE);
    expect(getServerAvailabilityState(quiz, endsAt)).toBe(QuizStatus.CLOSED);
    expect(getServerAvailabilityState(quiz, new Date(endsAt.getTime() + 1))).toBe(QuizStatus.CLOSED);
    expect(getIstDailyWindow("2026-08-16").startsAt.getTime()).toBe(startsAt.getTime() + 24 * 60 * 60_000);
  });
  it("calculates deterministic effective end time from the default window", () => {
    const endsAt = getEffectiveEndsAt({
      startsAt: new Date("2026-08-15T19:00:00+05:30"),
      endsAt: null,
      defaultWindowMinutes: 90,
    });

    expect(endsAt?.toISOString()).toBe("2026-08-15T15:00:00.000Z");
  });

  it("releases default quiz results one hour after scheduled start", () => {
    const quiz = {
      status: QuizStatus.FINALIZED,
      startsAt: new Date("2026-08-15T19:00:00+05:30"),
      endsAt: null,
      defaultWindowMinutes: 60,
      resultReleaseDelayMinutes: null,
    };

    expect(getResultReleaseAt(quiz)?.toISOString()).toBe("2026-08-15T14:30:00.000Z");
    expect(getResultState(quiz, new Date("2026-08-15T20:00:00+05:30"))).toBe("PUBLISHED");
  });

  it("makes daily results available at the 9 PM IST close, regardless of generic delays", () => {
    const { competitionDate, startsAt, endsAt } = getIstDailyWindow("2026-08-15");
    const releaseAt = getResultReleaseAt({
      competitionDate, startsAt, endsAt,
      defaultWindowMinutes: 60, resultReleaseDelayMinutes: 45,
    });
    expect(releaseAt?.getTime()).toBe(endsAt.getTime());
  });

  it("reports scheduled quizzes as live once server time reaches startsAt", () => {
    const state = getServerAvailabilityState(
      {
        status: QuizStatus.SCHEDULED,
        startsAt: new Date("2026-08-15T19:00:00+05:30"),
        endsAt: new Date("2026-08-15T20:00:00+05:30"),
        defaultWindowMinutes: null,
      },
      new Date("2026-08-15T19:01:00+05:30")
    );

    expect(state).toBe(QuizStatus.LIVE);
  });

  it("rejects invalid state transitions", () => {
    expect(() => assertTransitionAllowed(QuizStatus.DRAFT, QuizStatus.FINALIZED)).toThrow("Invalid quiz state transition");
  });

  it("prevents quiz modification after it is live", () => {
    expect(() => assertQuizEditable(QuizStatus.LIVE)).toThrow("Quiz cannot be modified while LIVE");
  });
});
