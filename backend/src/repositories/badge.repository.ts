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
