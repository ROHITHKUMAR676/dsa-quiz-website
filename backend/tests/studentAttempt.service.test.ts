import { AttemptStatus, Difficulty, Prisma, QuizStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const quizRepository = vi.hoisted(() => ({
  listQuizzesForStudent: vi.fn(),
  findQuizForAttempt: vi.fn(),
}));

const attemptRepository = vi.hoisted(() => ({
  findAttemptByQuizAndUser: vi.fn(),
  findAttemptById: vi.fn(),
  createAttempt: vi.fn(),
  markAttemptExpired: vi.fn(),
  submitAttempt: vi.fn(),
  beginQuestion: vi.fn(),
  findAttemptAnswers: vi.fn(),
  findAttemptAnswer: vi.fn(),
  saveQuestionAnswer: vi.fn(),
}));

const rewardService = vi.hoisted(() => ({
  applyImmediateRewards: vi.fn(),
}));

vi.mock("../src/repositories/quiz.repository.js", () => quizRepository);
vi.mock("../src/repositories/attempt.repository.js", () => attemptRepository);
vi.mock("../src/services/reward.service.js", () => rewardService);

const { startAttempt, submitAttempt, getAttemptForStudent, answerQuestion } = await import(
  "../src/services/studentAttempt.service.js"
);

function buildLiveQuiz(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date();
  return {
    id: "quiz-1",
    title: "August 16 Daily Quiz",
    description: null,
    category: "General",
    difficulty: Difficulty.MEDIUM,
    status: QuizStatus.LIVE,
    competitionDate: null,
    startsAt: new Date(now.getTime() - 60_000),
    endsAt: new Date(now.getTime() + 60 * 60_000),
    timezone: "Asia/Kolkata",
    defaultWindowMinutes: null,
    timeLimit: 600,
    timeLimitPerQuestion: null,
    questions: [
      {
        id: "q1",
        quizId: "quiz-1",
        questionText: "2 + 2 = ?",
        difficulty: Difficulty.EASY,
        points: 10,
        order: 1,
        explanation: null,
        options: [
          { id: "q1-a", questionId: "q1", optionText: "3", optionOrder: 1, isCorrect: false },
          { id: "q1-b", questionId: "q1", optionText: "4", optionOrder: 2, isCorrect: true },
        ],
      },
      {
        id: "q2",
        quizId: "quiz-1",
        questionText: "Capital of France?",
        difficulty: Difficulty.EASY,
        points: 20,
        order: 2,
        explanation: null,
        options: [
          { id: "q2-a", questionId: "q2", optionText: "Paris", optionOrder: 1, isCorrect: true },
          { id: "q2-b", questionId: "q2", optionText: "Rome", optionOrder: 2, isCorrect: false },
        ],
      },
    ],
    ...overrides,
  };
}

describe("startAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects starting a quiz that is not LIVE", async () => {
    quizRepository.findQuizForAttempt.mockResolvedValue(buildLiveQuiz({ status: QuizStatus.SCHEDULED, startsAt: new Date(Date.now() + 60 * 60_000) }));

    await expect(startAttempt("quiz-1", "user-1")).rejects.toMatchObject({
      statusCode: 409,
      code: "QUIZ_NOT_LIVE",
    });
    expect(attemptRepository.createAttempt).not.toHaveBeenCalled();
  });

  it("returns questions without isCorrect or the correct option id", async () => {
    const quiz = buildLiveQuiz();
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.findAttemptAnswers.mockResolvedValue([
      { questionId: "q1", selectedOptionId: "q1-b", isCorrect: true, pointsAwarded: 100, responseTimeMs: 1000 },
      { questionId: "q2", selectedOptionId: "q2-b", isCorrect: false, pointsAwarded: 0, responseTimeMs: 1000 },
    ]);
    attemptRepository.createAttempt.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    const result = await startAttempt("quiz-1", "user-1");

    expect(result.questions).toHaveLength(2);
    for (const question of result.questions) {
      expect(question).not.toHaveProperty("isCorrect");
      for (const option of question.options) {
        expect(option).not.toHaveProperty("isCorrect");
      }
    }
  });

  it("turns a unique-constraint race into a clean 409 instead of a 500", async () => {
    const quiz = buildLiveQuiz();
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.createAttempt.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await expect(startAttempt("quiz-1", "user-1")).rejects.toMatchObject({
      statusCode: 409,
      code: "ATTEMPT_ALREADY_EXISTS",
    });
  });

  it("rejects a quiz with no questions", async () => {
    quizRepository.findQuizForAttempt.mockResolvedValue(buildLiveQuiz({ questions: [] }));

    await expect(startAttempt("quiz-1", "user-1")).rejects.toMatchObject({
      statusCode: 409,
      code: "QUIZ_NOT_READY",
    });
  });
});

describe("submitAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes an authoritative server-side score and never trusts a client-sent score", async () => {
    const quiz = buildLiveQuiz();
    const startedAt = new Date(Date.now() - 30_000);

    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt,
      submittedAt: null,
      quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.submitAttempt.mockResolvedValue({});

    const result = await submitAttempt("attempt-1", "user-1", [
      { questionId: "q1", selectedOptionId: "q1-b" }, // correct
      { questionId: "q2", selectedOptionId: "q2-b" }, // incorrect
    ]);

    expect(result.status).toBe(AttemptStatus.SUBMITTED);
    // Score is intentionally NOT returned to the student before result release.
    expect(result).not.toHaveProperty("score");
    expect(result).not.toHaveProperty("correctAnswers");

    expect(attemptRepository.submitAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "attempt-1",
        totalQuestions: 2,
        correctAnswers: 1,
        incorrectAnswers: 1,
        unansweredQuestions: 0,
        score: 100,
      })
    );
  });

  it("treats an unanswered question as unanswered, not incorrect", async () => {
    const quiz = buildLiveQuiz();
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 10_000),
      submittedAt: null,
      quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.findAttemptAnswers.mockResolvedValue([
      { questionId: "q1", selectedOptionId: "q1-b", isCorrect: true, pointsAwarded: 100, responseTimeMs: 1000 },
      { questionId: "q2", selectedOptionId: "q2-b", isCorrect: false, pointsAwarded: 0, responseTimeMs: 1000 },
    ]);
    attemptRepository.findAttemptAnswers.mockResolvedValue([
      { questionId: "q1", selectedOptionId: "q1-b", isCorrect: true, pointsAwarded: 100, responseTimeMs: 1000 },
    ]);
    attemptRepository.submitAttempt.mockResolvedValue({});

    await submitAttempt("attempt-1", "user-1", [{ questionId: "q1", selectedOptionId: "q1-b" }]);

    expect(attemptRepository.submitAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        correctAnswers: 1,
        incorrectAnswers: 0,
        unansweredQuestions: 1,
        score: 100,
      })
    );
  });

  it("rejects an attempt belonging to a different user (404, not 403, to avoid confirming existence)", async () => {
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "someone-else",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      submittedAt: null,
      quiz: buildLiveQuiz(),
    });

    await expect(submitAttempt("attempt-1", "user-1", [])).rejects.toMatchObject({
      statusCode: 404,
      code: "ATTEMPT_NOT_FOUND",
    });
  });

  it("rejects a second submission of an already-submitted attempt", async () => {
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.SUBMITTED,
      startedAt: new Date(Date.now() - 10_000),
      submittedAt: new Date(),
      quiz: buildLiveQuiz(),
    });

    await expect(submitAttempt("attempt-1", "user-1", [])).rejects.toMatchObject({
      statusCode: 409,
      code: "ATTEMPT_ALREADY_SUBMITTED",
    });
  });

  it("rejects submission after the quiz window has closed and marks the attempt EXPIRED", async () => {
  const quiz = buildLiveQuiz({
    startsAt: new Date(Date.now() - 2 * 60 * 60_000),
    endsAt: new Date(Date.now() - 60 * 60_000),
  });

  const attempt = {
    id: "attempt-1",
    quizId: "quiz-1",
    userId: "user-1",
    status: AttemptStatus.IN_PROGRESS,
    startedAt: new Date(Date.now() - 2 * 60 * 60_000),
    submittedAt: null,
    quiz,
  };

  attemptRepository.findAttemptById.mockResolvedValue(attempt);

  attemptRepository.markAttemptExpired.mockResolvedValue({
    ...attempt,
    status: AttemptStatus.EXPIRED,
  });

  quizRepository.findQuizForAttempt.mockResolvedValue(quiz);

  await expect(
    submitAttempt("attempt-1", "user-1", [])
  ).rejects.toMatchObject({
    statusCode: 409,
    code: "SUBMISSION_WINDOW_CLOSED",
  });

  expect(attemptRepository.markAttemptExpired).toHaveBeenCalledWith(
    "attempt-1"
  );

  expect(attemptRepository.submitAttempt).not.toHaveBeenCalled();
});

  it("rejects question answers outside the quiz before saving", async () => {
    const quiz = buildLiveQuiz();
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 10_000),
      submittedAt: null,
      quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);

    await expect(
      answerQuestion("attempt-1", "user-1", "not-in-quiz", "q1-b")
    ).rejects.toMatchObject({ statusCode: 400, code: "INVALID_ANSWER_QUESTION" });
  });
});

describe("answerQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the correct option only after saving a selected answer", async () => {
    const quiz = buildLiveQuiz();
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(Date.now() - 10_000),
      submittedAt: null,
      quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.findAttemptAnswer.mockResolvedValue({
      id: "answer-1",
      attemptId: "attempt-1",
      questionId: "q1",
      selectedOptionId: null,
      answeredAt: new Date(Date.now() - 1_000),
    });
    attemptRepository.saveQuestionAnswer.mockResolvedValue({ count: 1 });

    const result = await answerQuestion("attempt-1", "user-1", "q1", "q1-a");

    expect(attemptRepository.saveQuestionAnswer).toHaveBeenCalledWith("answer-1", expect.objectContaining({
      selectedOptionId: "q1-a",
      isCorrect: false,
    }));
    expect(result).toMatchObject({
      questionId: "q1",
      answered: true,
      correctOptionId: "q1-b",
    });
  });
});

describe("getAttemptForStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores correctness only for previously selected answers", async () => {
    const quiz = buildLiveQuiz();
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      submittedAt: null,
      quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.findAttemptAnswers.mockResolvedValue([
      {
        questionId: "q1",
        selectedOptionId: "q1-a",
        isCorrect: false,
        pointsAwarded: 0,
        responseTimeMs: 1_000,
        answeredAt: new Date(),
      },
      {
        questionId: "q2",
        selectedOptionId: null,
        isCorrect: false,
        pointsAwarded: 0,
        responseTimeMs: 30_000,
        answeredAt: new Date(),
      },
    ]);

    const attempt = await getAttemptForStudent("attempt-1", "user-1");

    if (!("questionStates" in attempt) || !("questions" in attempt)) {
      throw new Error("Expected an in-progress attempt with question states");
    }
    expect(attempt.questionStates?.[0]).toMatchObject({
      selectedOptionId: "q1-a",
      correctOptionId: "q1-b",
    });
    expect(attempt.questionStates?.[1]).not.toHaveProperty("correctOptionId");
    expect(attempt.questions?.[0].options[1]).not.toHaveProperty("isCorrect");
  });

  it("never exposes questions or answer keys once an attempt is submitted", async () => {
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1",
      quizId: "quiz-1",
      userId: "user-1",
      status: AttemptStatus.SUBMITTED,
      startedAt: new Date(),
      submittedAt: new Date(),
      quiz: buildLiveQuiz(),
    });

    const attempt = await getAttemptForStudent("attempt-1", "user-1");

    expect(attempt).not.toHaveProperty("questions");
    expect(attempt).not.toHaveProperty("score");
  });
});
