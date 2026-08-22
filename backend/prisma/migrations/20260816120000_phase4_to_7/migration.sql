-- Phase 4-7: weekly competition, result reveal, and quiz result-delay override.
-- NOTE: written by hand because this environment could not reach Prisma's
-- engine binary host to run `prisma migrate dev`. Please run
-- `npx prisma migrate deploy` (or `dev` in a fresh dev DB) against a real
-- Postgres instance to verify before relying on this.

-- AlterEnum
ALTER TYPE "RewardSource" ADD VALUE IF NOT EXISTS 'WEEKLY_RANK';

-- CreateEnum
CREATE TYPE "ResultRevealType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "WeeklyStatus" AS ENUM ('OPEN', 'CLOSED', 'FINALIZED');

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "resultReleaseDelayMinutes" INTEGER;

-- CreateTable
CREATE TABLE "WeeklyCompetition" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "status" "WeeklyStatus" NOT NULL DEFAULT 'OPEN',
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyCompetition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyResult" (
    "id" TEXT NOT NULL,
    "weeklyCompetitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "totalCorrectAnswers" INTEGER NOT NULL,
    "quizzesCompleted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultReveal" (
    "id" TEXT NOT NULL,
    "type" "ResultRevealType" NOT NULL,
    "quizId" TEXT,
    "weeklyCompetitionId" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultReveal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCompetition_weekStart_weekEnd_key" ON "WeeklyCompetition"("weekStart", "weekEnd");

-- CreateIndex
CREATE INDEX "WeeklyCompetition_status_idx" ON "WeeklyCompetition"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyResult_weeklyCompetitionId_userId_key" ON "WeeklyResult"("weeklyCompetitionId", "userId");

-- CreateIndex
CREATE INDEX "WeeklyResult_weeklyCompetitionId_rank_idx" ON "WeeklyResult"("weeklyCompetitionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ResultReveal_quizId_key" ON "ResultReveal"("quizId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultReveal_weeklyCompetitionId_key" ON "ResultReveal"("weeklyCompetitionId");

-- CreateIndex
CREATE INDEX "ResultReveal_type_idx" ON "ResultReveal"("type");

-- AddForeignKey
ALTER TABLE "WeeklyResult" ADD CONSTRAINT "WeeklyResult_weeklyCompetitionId_fkey" FOREIGN KEY ("weeklyCompetitionId") REFERENCES "WeeklyCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyResult" ADD CONSTRAINT "WeeklyResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultReveal" ADD CONSTRAINT "ResultReveal_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultReveal" ADD CONSTRAINT "ResultReveal_weeklyCompetitionId_fkey" FOREIGN KEY ("weeklyCompetitionId") REFERENCES "WeeklyCompetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
