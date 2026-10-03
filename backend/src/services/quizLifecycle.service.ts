import { QuizStatus, type Quiz } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export const DAILY_QUIZ_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60_000;
type QuizWindowFields = Pick<Quiz, "startsAt" | "endsAt" | "defaultWindowMinutes"> & Partial<Pick<Quiz, "competitionDate">>;

/** Fixed 20:00–21:00 IST window represented as UTC instants (timezone independent). */
export function getIstDailyWindow(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new ApiError(400, "Daily quiz date must be YYYY-MM-DD", "INVALID_DAILY_DATE");
  const [year, month, date] = day.split("-").map(Number);
  const validated = new Date(Date.UTC(year, month - 1, date));
  if (validated.getUTCFullYear() !== year || validated.getUTCMonth() !== month - 1 || validated.getUTCDate() !== date) {
    throw new ApiError(400, "Daily quiz date is invalid", "INVALID_DAILY_DATE");
  }
  const localMidnightUtc = Date.UTC(year, month - 1, date);
  const startsAt = new Date(localMidnightUtc + 20 * 60 * 60_000 - IST_OFFSET_MS);
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
  return { competitionDate: new Date(localMidnightUtc - IST_OFFSET_MS), startsAt, endsAt };
}

export function getIstDateKey(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_QUIZ_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getEffectiveStartsAt(quiz: Pick<Quiz, "startsAt"> & Partial<Pick<Quiz, "competitionDate">>) {
  return quiz.competitionDate ? getIstDailyWindow(getIstDateKey(quiz.competitionDate)).startsAt : quiz.startsAt;
}

export function getEffectiveEndsAt(quiz: QuizWindowFields) {
  if (quiz.competitionDate) return getIstDailyWindow(getIstDateKey(quiz.competitionDate)).endsAt;
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
  quiz: QuizWindowFields & Pick<Quiz, "resultReleaseDelayMinutes">
) {
  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  if (!effectiveEndsAt) return null;
  const delayMinutes = quiz.competitionDate ? 0 : quiz.resultReleaseDelayMinutes ?? env.RESULT_RELEASE_DELAY_MINUTES;
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
  quiz: Pick<Quiz, "status" | "resultReleaseDelayMinutes"> & QuizWindowFields,
  now = new Date()
): ResultState {
  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  if (!effectiveEndsAt || now < effectiveEndsAt) return "LIVE";

  const isFinalized = quiz.status === QuizStatus.FINALIZED || quiz.status === QuizStatus.ARCHIVED;
  const resultReleaseAt = getResultReleaseAt(quiz);

  if (isFinalized && resultReleaseAt && now >= resultReleaseAt) return "PUBLISHED";
  return "WAITING_FOR_RESULTS";
}

export function getServerAvailabilityState(quiz: Pick<Quiz, "status"> & QuizWindowFields, now = new Date()) {
  const effectiveStartsAt = getEffectiveStartsAt(quiz);
  const effectiveEndsAt = getEffectiveEndsAt(quiz);

  if (quiz.status === QuizStatus.SCHEDULED && effectiveStartsAt && effectiveStartsAt <= now) {
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
