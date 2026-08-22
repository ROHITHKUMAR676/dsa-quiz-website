import { env } from "../config/env.js";
import * as userRepository from "../repositories/user.repository.js";

/**
 * Returns the Asia/Kolkata calendar date (YYYY-MM-DD) for a given instant,
 * independent of the server's own timezone. Streaks are defined in terms
 * of this calendar date, never a raw 24h window (spec section 20).
 */
export function toAppTimezoneDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: env.APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysBetweenDateKeys(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / msPerDay);
}

/**
 * Updates a user's streak for a qualifying activity (a submitted attempt
 * with at least one answered question - checked by the caller). Never
 * increments the streak twice for the same calendar date.
 */
export async function recordQualifyingActivity(
  user: { id: string; currentStreak: number; longestStreak: number; lastQualifyingDate: Date | null },
  activityAt: Date
) {
  const today = toAppTimezoneDateKey(activityAt);
  const lastDate = user.lastQualifyingDate ? toAppTimezoneDateKey(user.lastQualifyingDate) : null;

  if (lastDate === today) {
    // Already qualified today - no-op, per spec: "Do not increment streak
    // multiple times on the same date."
    return { currentStreak: user.currentStreak, longestStreak: user.longestStreak, changed: false };
  }

  const isConsecutive = lastDate !== null && daysBetweenDateKeys(lastDate, today) === 1;
  const currentStreak = isConsecutive ? user.currentStreak + 1 : 1;
  const longestStreak = Math.max(user.longestStreak, currentStreak);

  await userRepository.updateStreak(user.id, {
    currentStreak,
    longestStreak,
    lastQualifyingDate: activityAt,
  });

  return { currentStreak, longestStreak, changed: true };
}
