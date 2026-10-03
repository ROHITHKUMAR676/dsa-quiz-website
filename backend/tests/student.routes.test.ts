import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

const studentAttemptService = vi.hoisted(() => ({
  listQuizzesForStudent: vi.fn(),
  getQuizForStudent: vi.fn(),
  startAttempt: vi.fn(),
  getAttemptForStudent: vi.fn(),
  answerQuestion: vi.fn(),
}));

vi.mock("../src/services/studentAttempt.service.js", () => studentAttemptService);

describe("student routes", () => {
  let app: Express;
  let studentToken: string;
  let adminToken: string;

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
    studentToken = jwtModule.signAccessToken({ sub: "student-1", role: "STUDENT" });
    adminToken = jwtModule.signAccessToken({ sub: "admin-1", role: "ADMIN" });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access to the student quiz list", async () => {
    const response = await request(app).get("/api/student/quizzes");
    expect(response.status).toBe(401);
  });

  it("rejects admin tokens on student routes", async () => {
    const response = await request(app)
      .get("/api/student/quizzes")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("lets an authenticated student list quizzes", async () => {
    studentAttemptService.listQuizzesForStudent.mockResolvedValue([{ id: "quiz-1" }]);

    const response = await request(app)
      .get("/api/student/quizzes")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.quizzes).toHaveLength(1);
    expect(studentAttemptService.listQuizzesForStudent).toHaveBeenCalledWith("student-1");
  });

  it("lets an authenticated student start an attempt", async () => {
    studentAttemptService.startAttempt.mockResolvedValue({
      attempt: { id: "attempt-1", quizId: "quiz-1", status: "IN_PROGRESS" },
      questions: [],
    });

    const response = await request(app)
      .post("/api/student/quizzes/quiz-1/start")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(201);
    expect(studentAttemptService.startAttempt).toHaveBeenCalledWith("quiz-1", "student-1");
  });

  it("lets an authenticated student submit the current answer", async () => {
    studentAttemptService.answerQuestion.mockResolvedValue({
      id: "attempt-1",
      status: "IN_PROGRESS",
    });

    const response = await request(app)
      .post("/api/student/attempts/attempt-1/answer")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ questionId: "q1", selectedOptionId: "q1-b" });

    expect(response.status).toBe(200);
    expect(studentAttemptService.answerQuestion).toHaveBeenCalledWith(
      "attempt-1",
      "student-1",
      "q1",
      "q1-b"
    );
  });

  it("rejects an answer payload with no question id", async () => {
    const response = await request(app)
      .post("/api/student/attempts/attempt-1/answer")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ selectedOptionId: "q1-b" });

    expect(response.status).toBe(400);
    expect(studentAttemptService.answerQuestion).not.toHaveBeenCalled();
  });
});
