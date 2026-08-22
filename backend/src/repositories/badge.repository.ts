import { Prisma, type BadgeRuleType } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export function listActiveBadgesByRuleTypes(ruleTypes: BadgeRuleType[]) {
  return prisma.badge.findMany({
    where: { isActive: true, ruleType: { in: ruleTypes } },
  });
}

export function findUserBadgeIds(userId: string) {
  return prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } });
}

export async function listBadgesForUser(userId: string) {
  const [badges, earned] = await Promise.all([
    prisma.badge.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true, awardedAt: true } }),
  ]);
  const earnedByBadgeId = new Map(earned.map((badge) => [badge.badgeId, badge.awardedAt]));

  return badges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    category: badge.category,
    xpReward: badge.xpReward,
    coinReward: badge.coinReward,
    earned: earnedByBadgeId.has(badge.id),
    earnedAt: earnedByBadgeId.get(badge.id) ?? null,
  }));
}

/**
 * Awards a badge idempotently: @@unique([userId, badgeId]) on UserBadge
 * guarantees a badge can never be awarded twice to the same user, even on
 * retry (spec section 16: "Badge awarding must be idempotent").
 * Returns null if the user already has this badge.
 */
export async function awardBadge(userId: string, badgeId: string, metadata?: Record<string, unknown>) {
  try {
    return await prisma.userBadge.create({
      data: { userId, badgeId, metadata: metadata as Prisma.InputJsonValue | undefined },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }
    throw error;
  }
}
