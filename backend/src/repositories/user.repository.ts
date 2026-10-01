import { prisma } from "../config/prisma.js";
import { Prisma, RewardSource } from "@prisma/client";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByGoogleSub(googleSub: string) {
  return prisma.user.findUnique({ where: { googleSub } });
}

export function linkGoogleAccountIfUnlinked(userId: string, googleSub: string) {
  return prisma.user.updateMany({
    where: { id: userId, googleSub: null },
    data: {
      googleSub,
    },
  });
}

export function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
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

export async function incrementCompetitionTotalsOnce(
  id: string,
  data: { competitionPoints: number; correctAnswers: number },
  referenceId: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.xpTransaction.create({
        data: {
          userId: id,
          amount: 0,
          source: RewardSource.QUIZ_RANK,
          referenceId,
        },
      });
      await tx.user.update({
        where: { id },
        data: {
          totalCompetitionPoints: { increment: data.competitionPoints },
          totalCorrectAnswers: { increment: data.correctAnswers },
        },
      });
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export function findUserSelect<T extends Prisma.UserSelect>(id: string, select: T) {
  return prisma.user.findUnique({ where: { id }, select });
}
