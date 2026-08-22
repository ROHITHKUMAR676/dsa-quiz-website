import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export function updateLastActiveAt(id: string) {
  return prisma.user.update({
    where: { id },
    data: { lastActiveAt: new Date() },
  });
}

export function updateStreak(
  id: string,
  data: { currentStreak: number; longestStreak: number; lastQualifyingDate: Date }
) {
  return prisma.user.update({ where: { id }, data });
}

/** Bumps the aggregate totals used by the global leaderboard (spec section 12). */
export function incrementCompetitionTotals(id: string, data: { competitionPoints: number; correctAnswers: number }) {
  return prisma.user.update({
    where: { id },
    data: {
      totalCompetitionPoints: { increment: data.competitionPoints },
      totalCorrectAnswers: { increment: data.correctAnswers },
    },
  });
}

export function findUserSelect<T extends Prisma.UserSelect>(id: string, select: T) {
  return prisma.user.findUnique({ where: { id }, select });
}
