import { Difficulty, QuizStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const quizRepository = vi.hoisted(() => ({
  createQuiz: vi.fn(),
  listQuizzes: vi.fn(),
  findQuizById: vi.fn(),
  updateQuiz: vi.fn(),
  deleteQuiz: vi.fn(),
}));

vi.mock("../src/repositories/quiz.repository.js", () => quizRepository);

const { scheduleAdminQuiz, updateAdminQuiz } = await import("../src/services/quiz.service.js");

const readyQuiz = {
  id: "quiz-1",
  title: "August 15 Daily Quiz",
  description: null,
  category: "WebDev",
  difficulty: Difficulty.MEDIUM,
  status: QuizStatus.DRAFT,
  competitionDate: null,
  startsAt: null,
  endsAt: null,
  timezone: "Asia/Kolkata",
  defaultWindowMinutes: null,
  timeLimit: 600,
  timeLimitPerQuestion: 20,
  maxAttempts: 1,
  publishedAt: null,
  closedAt: null,
  finalizedAt: null,
  archivedAt: null,
  createdById: "admin-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  questions: [
    {
      id: "question-1",
      order: 1,
      points: 20,
      options: [
        { optionOrder: 1, isCorrect: false },
        { optionOrder: 2, isCorrect: true },
      ],
    },
  ],
};

describe("quiz service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
    process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.APP_TIMEZONE = "Asia/Kolkata";
    process.env.DEFAULT_DAILY_QUIZ_WINDOW_MINUTES = "60";
  });

  it("stores schedule timestamps and defaults timezone to Asia/Kolkata", async () => {
    quizRepository.findQuizById.mockResolvedValue(readyQuiz);
    quizRepository.updateQuiz.mockResolvedValue({ ...readyQuiz, status: QuizStatus.SCHEDULED });

    await scheduleAdminQuiz("quiz-1", {
      competitionDate: "2026-08-15T00:00:00+05:30",
      startsAt: "2026-08-15T19:00:00+05:30",
      endsAt: "2026-08-15T20:00:00+05:30",
    });

    expect(quizRepository.updateQuiz).toHaveBeenCalledWith(
      "quiz-1",
      expect.objectContaining({
        status: QuizStatus.SCHEDULED,
        timezone: "Asia/Kolkata",
        startsAt: new Date("2026-08-15T19:00:00+05:30"),
        endsAt: new Date("2026-08-15T20:00:00+05:30"),
      })
    );
  });

  it("rejects modification after appropriate lifecycle states", async () => {
    quizRepository.findQuizById.mockResolvedValue({ ...readyQuiz, status: QuizStatus.FINALIZED });

    await expect(updateAdminQuiz("quiz-1", { title: "Changed" })).rejects.toThrow("Quiz cannot be modified while FINALIZED");
  });
});
