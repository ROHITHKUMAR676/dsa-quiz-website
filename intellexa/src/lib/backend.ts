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
  currentStreak: number;
  longestStreak: number;
}

export const authApi = {
  register: (input: { fullName: string; email: string; password: string }) =>
    api.post<{ user: BackendUser; token: string }>("/auth/register", input),
  login: (input: { email: string; password: string }) =>
    api.post<{ user: BackendUser; token: string }>("/auth/login", input),
  me: () => api.get<{ user: BackendUser }>("/auth/me"),
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
        questions?: BackendQuestion[];
      } | null;
    }>(`/student/quizzes/${quizId}/attempt`),
  start: (quizId: string) =>
    api.post<{
      attempt: { id: string; quizId: string; status: string; startedAt: string };
      serverTime: string;
      deadline: string | null;
      questions: BackendQuestion[];
    }>(`/student/quizzes/${quizId}/start`),
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

export const leaderboardApi = {
  daily: (quizId: string) => api.get<{ leaderboard: BackendDailyLeaderboard }>(`/student/leaderboard/daily/${quizId}`),
  global: () => api.get<{ leaderboard: BackendGlobalLeaderboardEntry[] }>("/student/leaderboard/global"),
};
