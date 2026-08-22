import { Difficulty, QuizStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  assertQuizReadyToSchedule,
  assertSchedulingDates,
  toQuestionOptionCreateMany,
} from "../src/services/quizValidation.service.js";

const validQuiz = {
  id: "quiz-1",
  title: "August 15 Daily Quiz",
  description: null,
  category: "WebDev",
  difficulty: Difficulty.MEDIUM,
  status: QuizStatus.DRAFT,
  competitionDate: new Date("2026-08-15T00:00:00+05:30"),
  startsAt: new Date("2026-08-15T19:00:00+05:30"),
  endsAt: new Date("2026-08-15T20:00:00+05:30"),
  timezone: "Asia/Kolkata",
  defaultWindowMinutes: null,
  resultReleaseDelayMinutes: null,
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

describe("quiz validation", () => {
  it("accepts a valid quiz for scheduling", () => {
    expect(() => assertQuizReadyToSchedule(validQuiz)).not.toThrow();
  });

  it("rejects invalid quizzes without questions", () => {
    expect(() =>
      assertQuizReadyToSchedule({
        ...validQuiz,
        questions: [],
      }),
    ).toThrow("Quiz must have at least one question");
  });

  it("rejects duplicate question ordering", () => {
    expect(() =>
      assertQuizReadyToSchedule({
        ...validQuiz,
        questions: [
          ...validQuiz.questions,
          {
            id: "question-2",
            order: 1,
            points: 10,
            options: [
              { optionOrder: 1, isCorrect: true },
              { optionOrder: 2, isCorrect: false },
            ],
          },
        ],
      }),
    ).toThrow("Question ordering must be unique");
  });

  it("rejects option sets without exactly one correct answer", () => {
    expect(() =>
      toQuestionOptionCreateMany([
        { optionText: "A", optionOrder: 1, isCorrect: true },
        { optionText: "B", optionOrder: 2, isCorrect: true },
      ]),
    ).toThrow("Each question must have exactly one correct option");
  });

  it("rejects duplicate option ordering", () => {
    expect(() =>
      toQuestionOptionCreateMany([
        { optionText: "A", optionOrder: 1, isCorrect: true },
        { optionText: "B", optionOrder: 1, isCorrect: false },
      ]),
    ).toThrow("Option orders must be unique");
  });

  it("rejects end time before start time", () => {
    expect(() =>
      assertSchedulingDates(
        new Date("2026-08-15T20:00:00+05:30"),
        new Date("2026-08-15T19:00:00+05:30"),
      ),
    ).toThrow("endsAt must be after startsAt");
  });
});