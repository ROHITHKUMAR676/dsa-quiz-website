import { ResultRevealType } from "@prisma/client";
import { prisma } from "../config/prisma.js";

interface RevealAssetInput {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

export function upsertDailyReveal(quizId: string, data: RevealAssetInput) {
  return prisma.resultReveal.upsert({
    where: { quizId },
    create: { type: ResultRevealType.DAILY, quizId, ...data },
    update: data,
  });
}

export function upsertWeeklyReveal(weeklyCompetitionId: string, data: RevealAssetInput) {
  return prisma.resultReveal.upsert({
    where: { weeklyCompetitionId },
    create: { type: ResultRevealType.WEEKLY, weeklyCompetitionId, ...data },
    update: data,
  });
}

export function findRevealByQuiz(quizId: string) {
  return prisma.resultReveal.findUnique({ where: { quizId } });
}

export function findRevealByWeekly(weeklyCompetitionId: string) {
  return prisma.resultReveal.findUnique({ where: { weeklyCompetitionId } });
}

export function markRevealPublished(id: string) {
  return prisma.resultReveal.update({ where: { id }, data: { publishedAt: new Date() } });
}
