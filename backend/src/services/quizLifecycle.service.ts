import { QuizStatus, type Quiz } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function getEffectiveEndsAt(quiz: Pick<Quiz, "startsAt" | "endsAt" | "defaultWindowMinutes">) {
  if (quiz.endsAt) return quiz.endsAt;
  if (!quiz.startsAt) return null;

  const windowMinutes = quiz.defaultWindowMinutes ?? env.DEFAULT_DAILY_QUIZ_WINDOW_MINUTES;
  return new Date(quiz.startsAt.getTime() + windowMinutes * 60 * 1000);
}

/**
 * Spec section 9: results publish `resultReleaseDelayMinutes` minutes AFTER
 * the quiz closes - never immediately, and never at quiz *start*.
 */
export function getResultReleaseAt(
  quiz: Pick<Quiz, "startsAt" | "endsAt" | "defaultWindowMinutes" | "resultReleaseDelayMinutes">
) {
  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  if (!effectiveEndsAt) return null;
  const delayMinutes = quiz.resultReleaseDelayMinutes ?? env.RESULT_RELEASE_DELAY_MINUTES;
  return new Date(effectiveEndsAt.getTime() + delayMinutes * 60 * 1000);
}

export type ResultState = "LIVE" | "WAITING_FOR_RESULTS" | "PUBLISHED";

/**
 * Spec sections 9-10, 33: the leaderboard must never expose today's final
 * ranking early. PUBLISHED requires BOTH the configured delay to have
 * elapsed AND the quiz to have actually been FINALIZED by an admin -
 * elapsed time alone is only ever a floor, never enough on its own, since
 * finalization is what makes the ranking authoritative.
 */
export function getResultState(
  quiz: Pick<Quiz, "status" | "startsAt" | "endsAt" | "defaultWindowMinutes" | "resultReleaseDelayMinutes">,
  now = new Date()
): ResultState {
  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  if (!effectiveEndsAt || now < effectiveEndsAt) return "LIVE";

  const isFinalized = quiz.status === QuizStatus.FINALIZED || quiz.status === QuizStatus.ARCHIVED;
  const resultReleaseAt = getResultReleaseAt(quiz);

  if (isFinalized && resultReleaseAt && now >= resultReleaseAt) return "PUBLISHED";
  return "WAITING_FOR_RESULTS";
}

export function getServerAvailabilityState(quiz: Pick<Quiz, "status" | "startsAt" | "endsAt" | "defaultWindowMinutes">, now = new Date()) {
  const effectiveEndsAt = getEffectiveEndsAt(quiz);

  if (quiz.status === QuizStatus.SCHEDULED && quiz.startsAt && quiz.startsAt <= now) {
    return effectiveEndsAt && effectiveEndsAt <= now ? QuizStatus.CLOSED : QuizStatus.LIVE;
  }

  if (quiz.status === QuizStatus.LIVE && effectiveEndsAt && effectiveEndsAt <= now) {
    return QuizStatus.CLOSED;
  }

  return quiz.status;
}

const allowedTransitions: Record<QuizStatus, QuizStatus[]> = {
  DRAFT: [QuizStatus.SCHEDULED, QuizStatus.ARCHIVED],
  SCHEDULED: [QuizStatus.LIVE, QuizStatus.CLOSED, QuizStatus.ARCHIVED],
  LIVE: [QuizStatus.CLOSED],
  CLOSED: [QuizStatus.FINALIZED],
  FINALIZED: [QuizStatus.ARCHIVED],
  ARCHIVED: [],
};

export function assertTransitionAllowed(from: QuizStatus, to: QuizStatus) {
  if (!allowedTransitions[from].includes(to)) {
    throw new ApiError(409, `Invalid quiz state transition from ${from} to ${to}`, "INVALID_QUIZ_TRANSITION");
  }
}

export function assertQuizEditable(status: QuizStatus) {
  if (status !== QuizStatus.DRAFT && status !== QuizStatus.SCHEDULED) {
    throw new ApiError(409, `Quiz cannot be modified while ${status}`, "QUIZ_NOT_EDITABLE");
  }
}
