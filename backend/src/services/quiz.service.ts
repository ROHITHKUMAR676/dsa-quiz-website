import { QuizStatus, type Difficulty } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import { assertQuizEditable, assertTransitionAllowed, getIstDailyWindow } from "./quizLifecycle.service.js";
import { assertQuizReadyToSchedule } from "./quizValidation.service.js";
import { finalizeQuizResults } from "./finalization.service.js";

interface QuizInput {
  title: string;
  description?: string | null;
  category: string;
  difficulty: Difficulty;
  competitionDate?: string | null;
  timeLimit: number;
}

type QuizUpdateInput = Partial<QuizInput>;

function optionalDate(value?: string | null) {
  return value ? new Date(value) : null;
}

export async function createAdminQuiz(adminId: string, input: QuizInput) {
  return quizRepository.createQuiz({
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    competitionDate: optionalDate(input.competitionDate),
    timezone: "Asia/Kolkata",
    timeLimitPerQuestion: 30,
    timeLimit: 3600,
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

  return quizRepository.updateQuiz(id, {
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    competitionDate: "competitionDate" in input ? optionalDate(input.competitionDate) : undefined,
    timeLimit: input.timeLimit,
  });
}

export async function deleteAdminQuiz(id: string) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);
  return quizRepository.deleteQuiz(id);
}

export async function scheduleAdminQuiz(
  id: string,
  input: { competitionDate: string }
) {
  const quiz = await getAdminQuiz(id);
  assertQuizEditable(quiz.status);

  const day = input.competitionDate.slice(0, 10);
  const { competitionDate, startsAt, endsAt } = getIstDailyWindow(day);
  const assignedQuiz = await quizRepository.findQuizByCompetitionDate(competitionDate);
  if (assignedQuiz && assignedQuiz.id !== quiz.id) {
    throw new ApiError(409, "A daily quiz is already assigned to this date", "DAILY_QUIZ_ALREADY_SCHEDULED");
  }
  assertQuizReadyToSchedule(quiz, { startsAt, endsAt });

  return quizRepository.updateQuiz(id, {
    status: QuizStatus.SCHEDULED,
    competitionDate,
    startsAt,
    endsAt,
    timezone: "Asia/Kolkata",
    defaultWindowMinutes: 60,
    publishedAt: new Date(),
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
