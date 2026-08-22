import { AttemptStatus, QuizStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { getServerAvailabilityState } from "./quizLifecycle.service.js";

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
  const now = new Date();

  const [
    totalStudents,
    totalQuizzes,
    totalSubmittedAttempts,
    activeStudentsLast7Days,
    totalBadgesAwarded,
    completedQuizzes,
    pendingScheduled,
    quizzes,
    attempts,
    students,
    difficultyCounts,
    categoryScores,
  ] =
    await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.quiz.count(),
      prisma.quizAttempt.count({ where: { status: AttemptStatus.SUBMITTED } }),
      prisma.user.count({ where: { role: Role.STUDENT, lastActiveAt: { gte: sevenDaysAgo } } }),
      prisma.userBadge.count(),
      prisma.quiz.count({ where: { status: { in: [QuizStatus.FINALIZED, QuizStatus.ARCHIVED, QuizStatus.CLOSED] } } }),
      prisma.quiz.count({ where: { status: QuizStatus.SCHEDULED } }),
      prisma.quiz.findMany({
        select: { id: true, title: true, category: true, status: true, startsAt: true, endsAt: true, defaultWindowMinutes: true },
      }),
      prisma.quizAttempt.findMany({
        where: { startedAt: { gte: sevenDaysAgo } },
        select: { id: true, userId: true, submittedAt: true, startedAt: true },
      }),
      prisma.user.findMany({
        where: { role: Role.STUDENT, createdAt: { gte: sevenDaysAgo } },
        select: { id: true, createdAt: true },
      }),
      prisma.quiz.groupBy({ by: ["difficulty"], _count: { _all: true } }),
      prisma.quizAttempt.groupBy({
        by: ["quizId"],
        where: { status: AttemptStatus.SUBMITTED },
        _avg: { score: true },
      }),
    ]);

  const liveQuizIds = quizzes
    .filter((quiz) => getServerAvailabilityState(quiz, now) === QuizStatus.LIVE)
    .map((quiz) => quiz.id);
  const liveParticipants = liveQuizIds.length
    ? await prisma.quizAttempt.count({ where: { quizId: { in: liveQuizIds }, status: AttemptStatus.IN_PROGRESS } })
    : 0;
  const todaysQuiz = quizzes.find((quiz) => liveQuizIds.includes(quiz.id))?.title ?? null;
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const activeUserIds = new Set(
      attempts
        .filter((attempt) => attempt.startedAt.toISOString().slice(0, 10) === key)
        .map((attempt) => attempt.userId)
    );
    students
      .filter((student) => student.createdAt.toISOString().slice(0, 10) === key)
      .forEach((student) => activeUserIds.add(student.id));
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      users: activeUserIds.size,
      submissions: attempts.filter((attempt) => attempt.submittedAt?.toISOString().slice(0, 10) === key).length,
    };
  });
  const colors = { EASY: "#34D399", MEDIUM: "#FBBF24", HARD: "#F87171" } as const;
  const difficultyBreakdown = difficultyCounts.map((row) => ({
    name: row.difficulty,
    value: row._count._all,
    color: colors[row.difficulty],
  }));
  const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const categoryTotals = new Map<string, { total: number; count: number }>();
  for (const row of categoryScores) {
    const quiz = quizzesById.get(row.quizId);
    if (!quiz) continue;
    const current = categoryTotals.get(quiz.category) ?? { total: 0, count: 0 };
    current.total += row._avg.score ?? 0;
    current.count += 1;
    categoryTotals.set(quiz.category, current);
  }
  const categoryPerformance = Array.from(categoryTotals.entries()).slice(0, 8).map(([category, value]) => ({
    category,
    avgScore: value.count ? Math.round(value.total / value.count) : 0,
  }));

  return {
    totalStudents,
    totalQuizzes,
    totalSubmittedAttempts,
    activeStudentsLast7Days,
    totalBadgesAwarded,
    liveParticipants,
    completedQuizzes,
    pendingScheduled,
    todaysQuiz,
    weeklyActivity,
    difficultyBreakdown,
    categoryPerformance,
  };
}

export async function listParticipants() {
  const users = await prisma.user.findMany({
    where: { role: Role.STUDENT },
    orderBy: [
      { xp: "desc" },
      { totalCompetitionPoints: "desc" },
      { totalCorrectAnswers: "desc" },
      { id: "asc" },
    ],
    select: {
      id: true,
      fullName: true,
      email: true,
      avatar: true,
      department: true,
      year: true,
      registerNumber: true,
      xp: true,
      coins: true,
      totalCompetitionPoints: true,
      totalCorrectAnswers: true,
      currentStreak: true,
      _count: { select: { badges: true, attempts: true } },
    },
  });

  return users.map((user, index) => ({ rank: index + 1, ...user }));
}
