import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

const quizService = vi.hoisted(() => ({
  createAdminQuiz: vi.fn(),
  listAdminQuizzes: vi.fn(),
  getAdminQuiz: vi.fn(),
  updateAdminQuiz: vi.fn(),
  deleteAdminQuiz: vi.fn(),
  scheduleAdminQuiz: vi.fn(),
  publishAdminQuiz: vi.fn(),
  closeAdminQuiz: vi.fn(),
  finalizeAdminQuiz: vi.fn(),
  archiveAdminQuiz: vi.fn(),
}));

const questionService = vi.hoisted(() => ({
  createAdminQuestion: vi.fn(),
  updateAdminQuestion: vi.fn(),
  deleteAdminQuestion: vi.fn(),
  reorderAdminQuestions: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));
vi.mock("../src/config/prisma.js", () => ({ prisma: prismaMock }));

vi.mock("../src/services/quiz.service.js", () => quizService);
vi.mock("../src/services/question.service.js", () => questionService);

describe("admin quiz routes", () => {
  let app: Express;
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
    process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
    process.env.JWT_EXPIRES_IN = "1d";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.APP_TIMEZONE = "Asia/Kolkata";
    process.env.DEFAULT_DAILY_QUIZ_WINDOW_MINUTES = "60";

    const appModule = await import("../src/app.js");
    const jwtModule = await import("../src/utils/jwt.js");
    app = appModule.createApp();
    adminToken = jwtModule.signAccessToken({ sub: "admin-id", role: "ADMIN" });
    studentToken = jwtModule.signAccessToken({ sub: "student-id", role: "STUDENT" });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ email: "rohithkumar.s.2024.cse@rajalakshmi.edu.in", role: "ADMIN" });
  });

  it("allows admin to create a quiz", async () => {
    quizService.createAdminQuiz.mockResolvedValue({ id: "quiz-1", title: "August 15 Daily Quiz" });

    const response = await request(app)
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "August 15 Daily Quiz",
        category: "WebDev",
        difficulty: "MEDIUM",
        timeLimit: 600,
      });

    expect(response.status).toBe(201);
    expect(response.body.quiz.id).toBe("quiz-1");
    expect(quizService.createAdminQuiz).toHaveBeenCalledWith("admin-id", expect.objectContaining({ title: "August 15 Daily Quiz" }));
  });

  it("rejects student quiz creation", async () => {
    const response = await request(app)
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Nope", category: "WebDev", difficulty: "EASY", timeLimit: 300 });

    expect(response.status).toBe(403);
    expect(quizService.createAdminQuiz).not.toHaveBeenCalled();
  });

  it("allows admin to add a question with exactly one correct answer", async () => {
    questionService.createAdminQuestion.mockResolvedValue({ id: "question-1" });

    const response = await request(app)
      .post("/api/admin/quizzes/quiz-1/questions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        questionText: "Which hook synchronizes with external systems?",
        difficulty: "MEDIUM",
        points: 20,
        order: 1,
        options: [
          { optionText: "useState", optionOrder: 1, isCorrect: false },
          { optionText: "useEffect", optionOrder: 2, isCorrect: true },
          { optionText: "useMemo", optionOrder: 3, isCorrect: false },
          { optionText: "useRef", optionOrder: 4, isCorrect: false },
        ],
      });

    expect(response.status).toBe(201);
    expect(questionService.createAdminQuestion).toHaveBeenCalledWith("quiz-1", expect.objectContaining({ order: 1 }));
  });

  it("rejects students from adding questions", async () => {
    const response = await request(app)
      .post("/api/admin/quizzes/quiz-1/questions")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        questionText: "Unauthorized",
        difficulty: "EASY",
        points: 10,
        order: 1,
        options: [
          { optionText: "A", optionOrder: 1, isCorrect: true },
          { optionText: "B", optionOrder: 2, isCorrect: false },
        ],
      });

    expect(response.status).toBe(403);
    expect(questionService.createAdminQuestion).not.toHaveBeenCalled();
  });

  it("allows admin to update the correct answer", async () => {
    questionService.updateAdminQuestion.mockResolvedValue({ id: "question-1" });

    const response = await request(app)
      .patch("/api/admin/questions/question-1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        options: [
          { optionText: "A", optionOrder: 1, isCorrect: false },
          { optionText: "B", optionOrder: 2, isCorrect: true },
        ],
      });

    expect(response.status).toBe(200);
    expect(questionService.updateAdminQuestion).toHaveBeenCalledWith("question-1", expect.objectContaining({ options: expect.any(Array) }));
  });

  it("rejects students from modifying correct answers", async () => {
    const response = await request(app)
      .patch("/api/admin/questions/question-1")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        options: [
          { optionText: "A", optionOrder: 1, isCorrect: false },
          { optionText: "B", optionOrder: 2, isCorrect: true },
        ],
      });

    expect(response.status).toBe(403);
    expect(questionService.updateAdminQuestion).not.toHaveBeenCalled();
  });

  it("assigns a daily quiz to a date using the fixed IST schedule", async () => {
    quizService.scheduleAdminQuiz.mockResolvedValue({ id: "quiz-1", status: "SCHEDULED", timezone: "Asia/Kolkata" });

    const response = await request(app)
      .post("/api/admin/quizzes/quiz-1/schedule")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        competitionDate: "2026-08-15",
      });

    expect(response.status).toBe(200);
    expect(quizService.scheduleAdminQuiz).toHaveBeenCalledWith("quiz-1", { competitionDate: "2026-08-15" });
  });

  it("rejects invalid end time before service execution", async () => {
    const response = await request(app)
      .post("/api/admin/quizzes/quiz-1/schedule")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ competitionDate: "bad-date" });

    expect(response.status).toBe(400);
    expect(quizService.scheduleAdminQuiz).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated admin mutation routes", async () => {
    const response = await request(app)
      .delete("/api/admin/quizzes/quiz-1");

    expect(response.status).toBe(401);
    expect(quizService.deleteAdminQuiz).not.toHaveBeenCalled();
  });

  it("rejects student JWTs from admin mutation routes", async () => {
    const routes = [
      request(app).patch("/api/admin/quizzes/quiz-1").send({ title: "Nope" }),
      request(app).delete("/api/admin/quizzes/quiz-1"),
      request(app).post("/api/admin/quizzes/quiz-1/close").send({}),
      request(app).post("/api/admin/quizzes/quiz-1/finalize").send({}),
      request(app).post("/api/admin/quizzes/quiz-1/archive").send({}),
    ];

    for (const route of routes) {
      const response = await route.set("Authorization", `Bearer ${studentToken}`);
      expect(response.status).toBe(403);
    }
  });
});
