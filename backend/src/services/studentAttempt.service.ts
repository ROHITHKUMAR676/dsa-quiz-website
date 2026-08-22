import { AttemptStatus, Prisma, QuizStatus, type Quiz } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { sanitizeQuestionsForAttempt } from "../utils/sanitize.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { getEffectiveEndsAt, getServerAvailabilityState } from "./quizLifecycle.service.js";
import { applyImmediateRewards } from "./reward.service.js";

const STUDENT_VISIBLE_STATUSES = [
  QuizStatus.SCHEDULED,
  QuizStatus.LIVE,
  QuizStatus.CLOSED,
  QuizStatus.FINALIZED,
  QuizStatus.ARCHIVED,
];

interface SubmitAnswerInput {
  questionId: string;
  selectedOptionId?: string | null;
  responseTimeMs?: number | null;
}

function toQuizAvailabilitySummary(quiz: Pick<Quiz, "status" | "startsAt" | "endsAt" | "defaultWindowMinutes">, now: Date) {
  return {
    status: quiz.status,
    availability: getServerAvailabilityState(quiz, now),
    startsAt: quiz.startsAt,
    endsAt: getEffectiveEndsAt(quiz),
  };
}

/**
 * List of quizzes a student is allowed to see, each annotated with the
 * server-computed live availability state and whether this student has
 * already attempted it. Never trusts the raw `status` column alone -
 * SCHEDULED quizzes past their startsAt must show as LIVE, etc.
 */
export async function listQuizzesForStudent(userId: string) {
  const now = new Date();
  const quizzes = await quizRepository.listQuizzesForStudent(STUDENT_VISIBLE_STATUSES);

  return Promise.all(
    quizzes.map(async (quiz) => {
      const attempt = await attemptRepository.findAttemptByQuizAndUser(quiz.id, userId);
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        competitionDate: quiz.competitionDate,
        timeLimit: quiz.timeLimit,
        timeLimitPerQuestion: quiz.timeLimitPerQuestion,
        ...toQuizAvailabilitySummary(quiz, now),
        hasAttempted: Boolean(attempt),
        attemptStatus: attempt?.status ?? null,
      };
    })
  );
}

async function getQuizOr404(quizId: string) {
  const quiz = await quizRepository.findQuizForAttempt(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");
  return quiz;
}

export async function getQuizForStudent(quizId: string, userId: string) {
  const quiz = await getQuizOr404(quizId);
  const now = new Date();
  const attempt = await attemptRepository.findAttemptByQuizAndUser(quiz.id, userId);

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    difficulty: quiz.difficulty,
    competitionDate: quiz.competitionDate,
    timeLimit: quiz.timeLimit,
    timeLimitPerQuestion: quiz.timeLimitPerQuestion,
    questionCount: quiz.questions.length,
    ...toQuizAvailabilitySummary(quiz, now),
    hasAttempted: Boolean(attempt),
    attemptStatus: attempt?.status ?? null,
  };
}

/**
 * Lazily expires an IN_PROGRESS attempt whose quiz window has passed. This
 * is what makes the one-hour-window / no-late-submission rule (spec
 * sections 8, 23, 25) hold even if no background job has run yet.
 */
async function resolveInProgressAttempt(
  attempt: NonNullable<Awaited<ReturnType<typeof attemptRepository.findAttemptById>>>
) {
  if (attempt.status !== AttemptStatus.IN_PROGRESS) return attempt;

  const effectiveEndsAt = getEffectiveEndsAt(attempt.quiz);
  if (effectiveEndsAt && effectiveEndsAt <= new Date()) {
    return attemptRepository.markAttemptExpired(attempt.id);
  }

  return attempt;
}

export async function startAttempt(quizId: string, userId: string) {
  const quiz = await getQuizOr404(quizId);
  const now = new Date();

  const availability = getServerAvailabilityState(quiz, now);
  if (availability !== QuizStatus.LIVE) {
    throw new ApiError(409, "This quiz is not currently live", "QUIZ_NOT_LIVE");
  }

  if (quiz.questions.length === 0) {
    throw new ApiError(409, "This quiz has no questions yet", "QUIZ_NOT_READY");
  }

  try {
    const attempt = await attemptRepository.createAttempt({
      quizId: quiz.id,
      userId,
      totalQuestions: quiz.questions.length,
    });

    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        status: attempt.status,
        startedAt: attempt.startedAt,
      },
      serverTime: now,
      deadline: getEffectiveEndsAt(quiz),
      questions: sanitizeQuestionsForAttempt(quiz.questions),
    };
  } catch (error) {
    // Database-level @@unique([quizId, userId]) is the real guarantee here;
    // this just turns a race-condition duplicate into a clean 409 instead
    // of a 500. Survives concurrent/duplicate requests per spec section 5.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "You have already attempted this quiz", "ATTEMPT_ALREADY_EXISTS");
    }
    throw error;
  }
}

async function getOwnedInProgressAttemptOrThrow(attemptId: string, userId: string) {
  const attempt = await attemptRepository.findAttemptById(attemptId);
  if (!attempt) throw new ApiError(404, "Attempt not found", "ATTEMPT_NOT_FOUND");
  if (attempt.userId !== userId) {
    // Deliberately 404, not 403: don't confirm another user's attempt exists.
    throw new ApiError(404, "Attempt not found", "ATTEMPT_NOT_FOUND");
  }
  return resolveInProgressAttempt(attempt);
}

export async function getAttemptForStudent(attemptId: string, userId: string) {
  const attempt = await getOwnedInProgressAttemptOrThrow(attemptId, userId);
  return buildAttemptResponse(attempt);
}

/**
 * Resume support: recovers an in-progress (or checks a submitted) attempt
 * for a quiz without already knowing the attempt id - e.g. after a page
 * refresh mid-quiz.
 */
export async function getMyAttemptForQuiz(quizId: string, userId: string) {
  const existing = await attemptRepository.findAttemptByQuizAndUser(quizId, userId);
  if (!existing) return null;
  const full = await attemptRepository.findAttemptById(existing.id);
  if (!full) return null;
  const resolved = await resolveInProgressAttempt(full);
  return buildAttemptResponse(resolved);
}

async function buildAttemptResponse(
  attempt: NonNullable<Awaited<ReturnType<typeof attemptRepository.findAttemptById>>>
) {
  const base = {
    id: attempt.id,
    quizId: attempt.quizId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    deadline: getEffectiveEndsAt(attempt.quiz),
  };

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    // Score/correctness stay hidden until official result release
    // (Phase 5) - see spec sections 9, 10, 33.
    return base;
  }

  const quiz = await getQuizOr404(attempt.quizId);
  return { ...base, questions: sanitizeQuestionsForAttempt(quiz.questions) };
}

export async function submitAttempt(attemptId: string, userId: string, answers: SubmitAnswerInput[]) {
  const attempt = await getOwnedInProgressAttemptOrThrow(attemptId, userId);

  if (attempt.status === AttemptStatus.EXPIRED) {
    throw new ApiError(409, "The submission window for this quiz has closed", "SUBMISSION_WINDOW_CLOSED");
  }
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new ApiError(409, "This attempt has already been submitted", "ATTEMPT_ALREADY_SUBMITTED");
  }

  const quiz = await getQuizOr404(attempt.quizId);
  const submittedAt = new Date();

  const effectiveEndsAt = getEffectiveEndsAt(quiz);
  if (effectiveEndsAt && effectiveEndsAt <= submittedAt) {
    await attemptRepository.markAttemptExpired(attempt.id);
    throw new ApiError(409, "The submission window for this quiz has closed", "SUBMISSION_WINDOW_CLOSED");
  }

  const questionsById = new Map(quiz.questions.map((question) => [question.id, question]));

  const seenQuestionIds = new Set<string>();
  const gradedAnswers = answers.map((answer) => {
    const question = questionsById.get(answer.questionId);
    if (!question) {
      throw new ApiError(400, "Answer references a question outside this quiz", "INVALID_ANSWER_QUESTION");
    }
    if (seenQuestionIds.has(answer.questionId)) {
      throw new ApiError(400, "Duplicate answer for the same question", "DUPLICATE_ANSWER");
    }
    seenQuestionIds.add(answer.questionId);

    let selectedOption = null as (typeof question.options)[number] | null;
    if (answer.selectedOptionId) {
      selectedOption = question.options.find((option) => option.id === answer.selectedOptionId) ?? null;
      if (!selectedOption) {
        throw new ApiError(400, "Selected option does not belong to this question", "INVALID_ANSWER_OPTION");
      }
    }

    const isCorrect = selectedOption?.isCorrect ?? false;
    return {
      questionId: question.id,
      selectedOptionId: selectedOption?.id ?? null,
      isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
      responseTimeMs: answer.responseTimeMs ?? null,
      difficulty: question.difficulty,
    };
  });

  const totalQuestions = quiz.questions.length;
  const correctAnswers = gradedAnswers.filter((answer) => answer.isCorrect).length;
  const answeredCount = gradedAnswers.filter((answer) => answer.selectedOptionId !== null).length;
  const incorrectAnswers = answeredCount - correctAnswers;
  const unansweredQuestions = totalQuestions - answeredCount;
  const score = gradedAnswers.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0;
  const completionTimeMs = submittedAt.getTime() - attempt.startedAt.getTime();

  await attemptRepository.submitAttempt({
    attemptId: attempt.id,
    submittedAt,
    completionTimeMs,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    score,
    accuracy,
    answers: gradedAnswers,
  });

  await applyImmediateRewards({
    userId,
    quizId: quiz.id,
    category: quiz.category,
    attemptId: attempt.id,
    submittedAt,
    totalQuestions,
    correctAnswers,
    answeredCount,
    completionTimeMs,
    gradedAnswers: gradedAnswers.map((answer) => ({ isCorrect: answer.isCorrect, difficulty: answer.difficulty })),
  });

  // Score, correctness and rank are intentionally withheld here - they are
  // only revealed once results are officially published (Phase 5/6).
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    status: AttemptStatus.SUBMITTED,
    submittedAt,
    message: "Your quiz has been submitted. Results will be available after the official result release.",
  };
}
