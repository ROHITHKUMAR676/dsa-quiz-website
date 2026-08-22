import { WeeklyStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export function findWeeklyCompetitionByRange(weekStart: Date, weekEnd: Date) {
  return prisma.weeklyCompetition.findUnique({
    where: { weekStart_weekEnd: { weekStart, weekEnd } },
  });
}

export function createWeeklyCompetition(weekStart: Date, weekEnd: Date) {
  return prisma.weeklyCompetition.create({ data: { weekStart, weekEnd } });
}

export function findWeeklyCompetitionById(id: string) {
  return prisma.weeklyCompetition.findUnique({ where: { id }, include: { results: true, resultReveal: true } });
}

export function listWeeklyCompetitions(limit = 20) {
  return prisma.weeklyCompetition.findMany({ orderBy: { weekStart: "desc" }, take: limit });
}

export function finalizeWeeklyCompetition(
  id: string,
  entries: Array<{ userId: string; rank: number; totalScore: number; totalCorrectAnswers: number; quizzesCompleted: number }>
) {
  return prisma.$transaction(async (tx) => {
    await tx.weeklyResult.createMany({
      data: entries.map((entry) => ({ weeklyCompetitionId: id, ...entry })),
      skipDuplicates: true,
    });
    return tx.weeklyCompetition.update({
      where: { id },
      data: { status: WeeklyStatus.FINALIZED, finalizedAt: new Date() },
    });
  });
}

export function getWeeklyLeaderboard(weeklyCompetitionId: string) {
  return prisma.weeklyResult.findMany({
    where: { weeklyCompetitionId },
    orderBy: { rank: "asc" },
    include: { user: { select: { id: true, fullName: true, avatar: true, department: true } } },
  });
}
