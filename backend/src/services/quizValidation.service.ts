import type { Prisma, Quiz } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

type QuizWithQuestions = Quiz & {
  questions: Array<{
    id: string;
    order: number;
    points: number;
    options: Array<{ optionOrder: number; isCorrect: boolean }>;
  }>;
};

export function assertExactlyOneCorrectOption(options: Array<{ isCorrect: boolean }>) {
  const correctCount = options.filter((option) => option.isCorrect).length;
  if (correctCount !== 1) {
    throw new ApiError(400, "Each question must have exactly one correct option", "INVALID_CORRECT_OPTION_COUNT");
  }
}

export function assertUniqueOptionOrders(options: Array<{ optionOrder: number }>) {
  const orders = new Set(options.map((option) => option.optionOrder));
  if (orders.size !== options.length) {
    throw new ApiError(400, "Option orders must be unique", "DUPLICATE_OPTION_ORDER");
  }
}

export function assertSchedulingDates(startsAt: Date, endsAt?: Date | null) {
  if (Number.isNaN(startsAt.getTime())) {
    throw new ApiError(400, "startsAt must be a valid date", "INVALID_START_TIME");
  }

  if (endsAt && Number.isNaN(endsAt.getTime())) {
    throw new ApiError(400, "endsAt must be a valid date", "INVALID_END_TIME");
  }

  if (endsAt && endsAt <= startsAt) {
    throw new ApiError(400, "endsAt must be after startsAt", "END_BEFORE_START");
  }
}

export function assertQuizReadyToSchedule(quiz: QuizWithQuestions, schedule?: { startsAt?: Date | null; endsAt?: Date | null }) {
  const startsAt = schedule?.startsAt ?? quiz.startsAt;
  const endsAt = schedule?.endsAt ?? quiz.endsAt;

  if (!quiz.title.trim()) throw new ApiError(400, "Quiz title is required", "QUIZ_TITLE_REQUIRED");
  if (!quiz.category.trim()) throw new ApiError(400, "Quiz category is required", "QUIZ_CATEGORY_REQUIRED");
  if (!quiz.difficulty) throw new ApiError(400, "Quiz difficulty is required", "QUIZ_DIFFICULTY_REQUIRED");
  if (!quiz.competitionDate && !schedule?.startsAt) {
    throw new ApiError(400, "Competition date is required", "COMPETITION_DATE_REQUIRED");
  }
  if (!startsAt) throw new ApiError(400, "startsAt is required", "START_TIME_REQUIRED");
  assertSchedulingDates(startsAt, endsAt);
  if (quiz.timeLimit <= 0) throw new ApiError(400, "Quiz time limit must be positive", "INVALID_TIME_LIMIT");
  if (quiz.questions.length === 0) throw new ApiError(400, "Quiz must have at least one question", "QUIZ_REQUIRES_QUESTIONS");

  const orders = new Set<number>();
  for (const question of quiz.questions) {
    if (question.points <= 0) throw new ApiError(400, "Question points must be positive", "INVALID_QUESTION_POINTS");
    if (orders.has(question.order)) throw new ApiError(400, "Question ordering must be unique", "DUPLICATE_QUESTION_ORDER");
    orders.add(question.order);
    if (question.options.length < 2) throw new ApiError(400, "Each question must have at least two options", "QUESTION_REQUIRES_OPTIONS");
    assertUniqueOptionOrders(question.options);
    assertExactlyOneCorrectOption(question.options);
  }
}

export function toQuestionOptionCreateMany(options: Array<{ optionText: string; optionOrder: number; isCorrect: boolean }>): Prisma.QuestionOptionCreateManyQuestionInput[] {
  assertUniqueOptionOrders(options);
  assertExactlyOneCorrectOption(options);
  return options.map((option) => ({
    optionText: option.optionText,
    optionOrder: option.optionOrder,
    isCorrect: option.isCorrect,
  }));
}
