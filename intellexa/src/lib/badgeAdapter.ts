import type { BackendBadge } from "./backend";
import type { Badge } from "../types";

const rarityByCategory: Record<string, Badge["rarity"]> = {
  STREAK: "rare",
  RANK: "legendary",
  PERFORMANCE: "epic",
  SPEED: "rare",
  PARTICIPATION: "common",
};

export function mapBackendBadgeToLegacy(badge: BackendBadge): Badge {
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon.toLowerCase(),
    earned: badge.earned,
    earnedAt: badge.earnedAt ?? undefined,
    rarity: rarityByCategory[badge.category.toUpperCase()] ?? "common",
  };
}
