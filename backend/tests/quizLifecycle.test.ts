import { QuizStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  assertQuizEditable,
  assertTransitionAllowed,
  getEffectiveEndsAt,
  getResultReleaseAt,
  getResultState,
  getServerAvailabilityState,
} from "../src/services/quizLifecycle.service.js";

describe("quiz lifecycle", () => {
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
