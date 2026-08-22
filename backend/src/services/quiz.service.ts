import { QuizStatus, type Difficulty } from "@prisma/client";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import { assertQuizEditable, assertTransitionAllowed } from "./quizLifecycle.service.js";
import { assertQuizReadyToSchedule, assertSchedulingDates } from "./quizValidation.service.js";
import { finalizeQuizResults } from "./finalization.service.js";

interface QuizInput {
  title: string;
  description?: string | null;
  category: string;
  difficulty: Difficulty;
  competitionDate?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string;
  defaultWindowMinutes?: number | null;
  timeLimit: number;
  timeLimitPerQuestion?: number | null;
}

type QuizUpdateInput = Partial<QuizInput>;

function optionalDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function createAdminQuiz(adminId: string, input: QuizInput) {
  const startsAt = optionalDate(input.startsAt);
  const endsAt = optionalDate(input.endsAt);
  if (startsAt) assertSchedulingDates(startsAt, endsAt);

  return quizRepository.createQuiz({
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    competitionDate: optionalDate(input.competitionDate),
    startsAt,
    endsAt,
    timezone: input.timezone ?? env.APP_TIMEZONE,
    defaultWindowMinutes: input.defaultWindowMinutes,
    timeLimit: input.timeLimit,
    timeLimitPerQuestion: input.timeLimitPerQuestion,
    maxAttempts: 1,
    createdById: adminId,
  });
}

export function listAdminQuizzes(status?: QuizStatus) {
  return quizRepository.listQuizzes(status);
}

export async function getAdminQuiz(id: string) {
  const quiz = await quizRepository.findQuizById(id);
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");
  return quiz;
}

export async function updateAdminQuiz(id: string, input: QuizUpdateInput) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);

  const startsAt = "startsAt" in input ? optionalDate(input.startsAt) : undefined;
  const endsAt = "endsAt" in input ? optionalDate(input.endsAt) : undefined;
  if (startsAt || endsAt) assertSchedulingDates(startsAt ?? quiz.startsAt!, endsAt ?? quiz.endsAt);

  return quizRepository.updateQuiz(id, {
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    competitionDate: "competitionDate" in input ? optionalDate(input.competitionDate) : undefined,
    startsAt,
    endsAt,
    timezone: input.timezone,
    defaultWindowMinutes: input.defaultWindowMinutes,
    timeLimit: input.timeLimit,
    timeLimitPerQuestion: input.timeLimitPerQuestion,
  });
}

export async function deleteAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);
  return quizRepository.deleteQuiz(id);
}

export async function scheduleAdminQuiz(
  id: string,
  input: { competitionDate: string; startsAt: string; endsAt?: string | null; timezone?: string; defaultWindowMinutes?: number | null }
) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);

  const startsAt = new Date(input.startsAt);
  const endsAt = optionalDate(input.endsAt);
  assertQuizReadyToSchedule(quiz, { startsAt, endsAt });

  return quizRepository.updateQuiz(id, {
    status: QuizStatus.SCHEDULED,
    competitionDate: new Date(input.competitionDate),
    startsAt,
    endsAt,
    timezone: input.timezone ?? env.APP_TIMEZONE,
    defaultWindowMinutes: input.defaultWindowMinutes,
    publishedAt: new Date(),
  });
}

export async function publishAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);
  assertQuizReadyToSchedule(quiz);

  return quizRepository.updateQuiz(id, {
    status: QuizStatus.SCHEDULED,
    publishedAt: quiz.publishedAt ?? new Date(),
  });
}

export async function closeAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertTransitionAllowed(quiz.status, QuizStatus.CLOSED);
  return quizRepository.updateQuiz(id, { status: QuizStatus.CLOSED, closedAt: new Date() });
}

export async function finalizeAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertTransitionAllowed(quiz.status, QuizStatus.FINALIZED);
  const finalized = await quizRepository.updateQuiz(id, { status: QuizStatus.FINALIZED, finalizedAt: new Date() });

  // Rank rewards + finalization badges (Phase 6). Idempotent - safe to
  // re-run finalize if this step ever needs to be retried.
  const results = await finalizeQuizResults(id);

  return { quiz: finalized, results };
}

export async function archiveAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertTransitionAllowed(quiz.status, QuizStatus.ARCHIVED);
  return quizRepository.updateQuiz(id, { status: QuizStatus.ARCHIVED, archivedAt: new Date() });
}
