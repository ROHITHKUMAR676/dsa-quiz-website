import type { BackendGlobalLeaderboardEntry } from "./backend";
import type { LeaderboardEntry } from "../types";

function tierFromXp(xp: number): LeaderboardEntry["tier"] {
  if (xp >= 8000) return "Grandmaster";
  if (xp >= 6000) return "Champion";
  if (xp >= 4000) return "Legend";
  if (xp >= 2000) return "Elite";
  if (xp >= 1000) return "Gold";
  if (xp >= 300) return "Silver";
  return "Bronze";
}

/**
 * Maps the real /student/leaderboard/global response onto the existing
 * LeaderboardEntry UI shape. The backend doesn't track rank *history* or a
 * per-user badge count on this endpoint, so those two fields fall back to
 * neutral defaults (no visible movement arrow, 0 badges) rather than being
 * invented - see Podium/LeaderboardRow for where they're used.
 */
export function mapBackendGlobalEntryToLegacy(entry: BackendGlobalLeaderboardEntry): LeaderboardEntry {
  return {
    rank: entry.rank,
    previousRank: entry.rank,
    userId: entry.id,
    name: entry.fullName,
    avatar: entry.avatar ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(entry.fullName)}&backgroundColor=1A2038`,
    department: entry.department ?? "—",
    xp: entry.xp,
    points: entry.totalCompetitionPoints,
    streak: entry.currentStreak,
    badges: 0,
    tier: tierFromXp(entry.xp),
  };
}
