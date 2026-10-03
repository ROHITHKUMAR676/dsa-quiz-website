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
  recordQuestionAnswer: vi.fn(),
}));

const rewardService = vi.hoisted(() => ({
  applyImmediateRewards: vi.fn(),
}));

vi.mock("../src/repositories/quiz.repository.js", () => quizRepository);
vi.mock("../src/repositories/attempt.repository.js", () => attemptRepository);
vi.mock("../src/services/reward.service.js", () => rewardService);

const { startAttempt, answerQuestion, getAttemptForStudent } = await import(
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
    competitionDate: now,
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

describe("answerQuestion", () => {
  beforeEach(() => vi.clearAllMocks());

  function setupAttempt(startedAt: Date, quiz = buildLiveQuiz()) {
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1", quizId: "quiz-1", userId: "user-1", status: AttemptStatus.IN_PROGRESS,
      startedAt, submittedAt: null, answers: [], quiz,
    });
    quizRepository.findQuizForAttempt.mockResolvedValue(quiz);
    attemptRepository.recordQuestionAnswer.mockResolvedValue({});
  }

  it("records 100 points for a correct answer using server elapsed time, regardless of question points", async () => {
    setupAttempt(new Date(Date.now() - 1_000));
    const result = await answerQuestion("attempt-1", "user-1", "q1", "q1-b");
    expect(result.status).toBe(AttemptStatus.IN_PROGRESS);
    expect(attemptRepository.recordQuestionAnswer).toHaveBeenCalledWith(expect.objectContaining({
      questionId: "q1", selectedOptionId: "q1-b", isCorrect: true, pointsAwarded: 100,
    }));
  });

  it("records an incorrect answer as zero", async () => {
    setupAttempt(new Date(Date.now() - 1_000));
    await answerQuestion("attempt-1", "user-1", "q1", "q1-a");
    expect(attemptRepository.recordQuestionAnswer).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: false, pointsAwarded: 0 }));
  });

  it("forces answers received at or after 30 seconds to unanswered and zero", async () => {
    setupAttempt(new Date(Date.now() - 30_000));
    await answerQuestion("attempt-1", "user-1", "q1", "q1-b");
    expect(attemptRepository.recordQuestionAnswer).toHaveBeenCalledWith(expect.objectContaining({
      selectedOptionId: null, isCorrect: false, pointsAwarded: 0, responseTimeMs: expect.any(Number),
    }));
  });

  it("rejects an attempt belonging to a different user", async () => {
    attemptRepository.findAttemptById.mockResolvedValue({
      id: "attempt-1", quizId: "quiz-1", userId: "someone-else", status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(), submittedAt: null, answers: [], quiz: buildLiveQuiz(),
    });
    await expect(answerQuestion("attempt-1", "user-1", "q1", "q1-b")).rejects.toMatchObject({ statusCode: 404, code: "ATTEMPT_NOT_FOUND" });
  });

  it("rejects answering questions out of order", async () => {
    setupAttempt(new Date());
    await expect(answerQuestion("attempt-1", "user-1", "q2", "q2-a")).rejects.toMatchObject({ statusCode: 409, code: "QUESTION_OUT_OF_ORDER" });
  });
});

describe("getAttemptForStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
