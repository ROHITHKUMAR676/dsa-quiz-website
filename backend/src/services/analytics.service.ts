import { AttemptStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";

export async function getQuizParticipationStats(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, title: true, questions: { select: { id: true } } } });
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  const [statusCounts, submittedAggregate] = await Promise.all([
    prisma.quizAttempt.groupBy({ by: ["status"], where: { quizId }, _count: { _all: true } }),
    prisma.quizAttempt.aggregate({
      where: { quizId, status: AttemptStatus.SUBMITTED },
      _avg: { score: true, accuracy: true, completionTimeMs: true },
    }),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all]));

  return {
    quizId: quiz.id,
    title: quiz.title,
    questionCount: quiz.questions.length,
    totalAttempts: statusCounts.reduce((sum, row) => sum + row._count._all, 0),
    byStatus,
    averageScore: submittedAggregate._avg.score ?? 0,
    averageAccuracy: Number(submittedAggregate._avg.accuracy ?? 0),
    averageCompletionTimeMs: submittedAggregate._avg.completionTimeMs ?? 0,
  };
}

export async function getPlatformStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalStudents, totalQuizzes, totalSubmittedAttempts, activeStudentsLast7Days, totalBadgesAwarded] =
    await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.quiz.count(),
      prisma.quizAttempt.count({ where: { status: AttemptStatus.SUBMITTED } }),
      prisma.user.count({ where: { role: Role.STUDENT, lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.userBadge.count(),
    ]);

  return { totalStudents, totalQuizzes, totalSubmittedAttempts, activeStudentsLast7Days, totalBadgesAwarded };
}
