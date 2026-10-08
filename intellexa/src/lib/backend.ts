import { api } from "./api";

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  department: string | null;
  year: string | null;
  registerNumber: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  xp: number;
  coins: number;
  totalCompetitionPoints: number;
  totalCorrectAnswers: number;
  currentStreak: number;
  longestStreak: number;
  preferredLanguage: string | null;
  lastActiveAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const authApi = {
  googleLogin: (credential: string) =>
    api.post<{ user: BackendUser; token: string }>("/auth/google", { credential }),
  me: () => api.get<{ user: BackendUser }>("/auth/me"),
  updateProfile: (input: {
    fullName?: string;
    department?: string | null;
    year?: string | null;
    registerNumber?: string | null;
    phone?: string | null;
    preferredLanguage?: string | null;
    bio?: string | null;
    avatar?: string | null;
  }) => api.patch<{ user: BackendUser }>("/auth/me", input),
  uploadAvatar: (file: File) => api.putRaw<{ user: BackendUser }>("/auth/me/avatar", file, "image/webp"),
};

export type BackendQuizAvailability = "LIVE" | "SCHEDULED" | "CLOSED" | "FINALIZED" | "ARCHIVED" | "DRAFT";

export interface BackendQuizSummary {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: string;
  availability: BackendQuizAvailability;
  startsAt: string | null;
  endsAt: string | null;
  competitionDate: string | null;
  timeLimit?: number;
  timeLimitPerQuestion?: number | null;
  hasAttempted: boolean;
  attemptStatus: string | null;
}

export interface BackendQuestionOption {
  id: string;
  optionText: string;
  optionOrder: number;
}

export interface BackendQuestion {
  id: string;
  questionText: string;
  difficulty: string;
  points: number;
  order: number;
  options: BackendQuestionOption[];
}

export const studentQuizApi = {
  list: () => api.get<{ quizzes: BackendQuizSummary[] }>("/student/quizzes"),
  get: (quizId: string) => api.get<{ quiz: BackendQuizSummary & { questionCount: number } }>(`/student/quizzes/${quizId}`),
  myAttempt: (quizId: string) =>
    api.get<{
      attempt: {
        id: string;
        quizId: string;
        status: string;
        startedAt: string;
        submittedAt: string | null;
        deadline: string | null;
        serverTime?: string;
        questions?: BackendQuestion[];
        questionStates?: Array<{ questionId: string; selectedOptionId: string | null; correctOptionId?: string; responseTimeMs: number | null; startedAt: string; deadline: string }>;
      } | null;
    }>(`/student/quizzes/${quizId}/attempt`),
  start: (quizId: string) =>
    api.post<{
      attempt: { id: string; quizId: string; status: string; startedAt: string };
      serverTime: string;
      deadline: string | null;
      questions: BackendQuestion[];
    }>(`/student/quizzes/${quizId}/start`),
  startQuestion: (attemptId: string, questionId: string) =>
    api.post<{ questionId: string; startedAt: string; deadline: string; serverTime: string }>(`/student/attempts/${attemptId}/questions/${questionId}/start`, {}),
  answerQuestion: (attemptId: string, questionId: string, selectedOptionId: string | null) =>
    api.post<{ questionId: string; answered: boolean; timedOut?: boolean; remainingMs?: number; correctOptionId?: string; serverTime: string }>(`/student/attempts/${attemptId}/questions/${questionId}/answer`, { selectedOptionId }),
  getAttempt: (attemptId: string) =>
    api.get<{
      attempt: {
        id: string;
        quizId: string;
        status: string;
        startedAt: string;
        submittedAt: string | null;
        deadline: string | null;
        questions?: BackendQuestion[];
      };
    }>(`/student/attempts/${attemptId}`),
  submit: (attemptId: string, answers: Array<{ questionId: string; selectedOptionId: string | null }>) =>
    api.post<{ attempt: { id: string; status: string; submittedAt: string; message: string } }>(
      `/student/attempts/${attemptId}/submit`,
      { answers }
    ),
};

export interface BackendDailyLeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatar: string | null;
  department: string | null;
  score: number;
  correctAnswers: number;
  completionTimeMs: number | null;
}

export interface BackendDailyLeaderboard {
  quizId: string;
  resultState: "LIVE" | "WAITING_FOR_RESULTS" | "PUBLISHED";
  resultsAvailableAt: string | null;
  isPreviousResult: boolean;
  entries: BackendDailyLeaderboardEntry[];
  message?: string;
}

export interface BackendGlobalLeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  avatar: string | null;
  department: string | null;
  xp: number;
  totalCompetitionPoints: number;
  totalCorrectAnswers: number;
  currentStreak: number;
}

export interface BackendWeeklyCompetition {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: "OPEN" | "CLOSED" | "FINALIZED";
  finalizedAt?: string | null;
}

export interface BackendWeeklyLeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatar: string | null;
  department: string | null;
  totalScore: number;
  totalCorrectAnswers: number;
  quizzesCompleted: number;
}

export interface BackendWeeklyLeaderboard {
  weekly: BackendWeeklyCompetition;
  entries: BackendWeeklyLeaderboardEntry[];
  message?: string;
}

export interface BackendMonthlyLeaderboardEntry {
  rank: number; userId: string; fullName: string; avatar: string | null; department: string | null;
  totalScore: number; totalCorrectAnswers: number; totalResponseTimeMs: number;
}
export interface BackendMonthlyLeaderboard {
  period: string; leaderboard: BackendMonthlyLeaderboardEntry[]; previousPeriod: string;
  previousPeriodTop3: BackendMonthlyLeaderboardEntry[];
}

export const leaderboardApi = {
  daily: (quizId: string) => api.get<{ leaderboard: BackendDailyLeaderboard }>(`/student/leaderboard/daily/${quizId}`),
  global: () => api.get<{ leaderboard: BackendGlobalLeaderboardEntry[] }>("/student/leaderboard/global"),
  monthly: () => api.get<BackendMonthlyLeaderboard>("/student/leaderboard/monthly"),
  weeklyCurrent: () => api.get<BackendWeeklyLeaderboard>("/student/leaderboard/weekly/current"),
};

export interface BackendNotification {
  id: string;
  type: "QUIZ" | "BADGE" | "LEVEL" | "RANK" | "STREAK" | "SYSTEM";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BackendBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  coinReward: number;
  earned: boolean;
  earnedAt: string | null;
}

export const studentGamificationApi = {
  notifications: () => api.get<{ notifications: BackendNotification[] }>("/student/notifications"),
  markNotificationRead: (id: string) => api.post<void>(`/student/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post<void>("/student/notifications/read-all"),
  badges: () => api.get<{ badges: BackendBadge[] }>("/student/badges"),
};

export interface BackendAdminQuiz {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" | "FINALIZED" | "ARCHIVED";
  startsAt: string | null;
  endsAt: string | null;
  competitionDate: string | null;
  timezone: string;
  timeLimit: number;
  timeLimitPerQuestion: number | null;
  createdAt: string;
  updatedAt: string;
  questions: Array<{ id: string }>;
}

export interface BackendPlatformStats {
  totalStudents: number;
  totalQuizzes: number;
  totalSubmittedAttempts: number;
  activeStudentsLast7Days: number;
  totalBadgesAwarded: number;
  liveParticipants: number;
  completedQuizzes: number;
  pendingScheduled: number;
  todaysQuiz: string | null;
  weeklyActivity: Array<{ day: string; users: number; submissions: number }>;
  difficultyBreakdown: Array<{ name: "EASY" | "MEDIUM" | "HARD"; value: number; color: string }>;
  categoryPerformance: Array<{ category: string; avgScore: number }>;
}

export interface BackendParticipant {
  rank: number;
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  department: string | null;
  year: string | null;
  registerNumber: string | null;
  xp: number;
  coins: number;
  totalCompetitionPoints: number;
  totalCorrectAnswers: number;
  currentStreak: number;
  _count: { badges: number; attempts: number };
}

export const adminApi = {
  platformStats: () => api.get<{ stats: BackendPlatformStats }>("/admin/analytics/platform"),
  listQuizzes: (status?: BackendAdminQuiz["status"]) =>
    api.get<{ quizzes: BackendAdminQuiz[] }>(status ? `/admin/quizzes?status=${encodeURIComponent(status)}` : "/admin/quizzes"),
  createQuiz: (input: {
    title: string;
    description?: string | null;
    category: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    competitionDate?: string | null;
    timeLimit: number;
  }) => api.post<{ quiz: BackendAdminQuiz }>("/admin/quizzes", input),
  createQuestion: (
    quizId: string,
    input: {
      questionText: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      points: number;
      order: number;
      options: Array<{ optionText: string; optionOrder: number; isCorrect: boolean }>;
    }
  ) => api.post<{ question: unknown }>(`/admin/quizzes/${quizId}/questions`, input),
  scheduleQuiz: (
    quizId: string,
    input: { competitionDate: string }
  ) => api.post<{ quiz: BackendAdminQuiz }>(`/admin/quizzes/${quizId}/schedule`, input),
  deleteQuiz: (quizId: string) => api.delete<void>(`/admin/quizzes/${quizId}`),
  participants: () => api.get<{ participants: BackendParticipant[] }>("/admin/participants"),
  leaderboard: () => api.get<{ leaderboard: BackendGlobalLeaderboardEntry[] }>("/admin/leaderboard/global"),
  monthlyLeaderboard: () => api.get<BackendMonthlyLeaderboard>("/admin/leaderboard/monthly"),
};
