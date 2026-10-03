import { AttemptStatus, Prisma, QuizStatus, type Quiz } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { sanitizeQuestionsForAttempt } from "../utils/sanitize.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { getEffectiveEndsAt, getServerAvailabilityState } from "./quizLifecycle.service.js";
import { applyImmediateRewards } from "./reward.service.js";
import { calculateQuestionScore, QUESTION_TIME_LIMIT_MS } from "./quizScoring.service.js";

const STUDENT_VISIBLE_STATUSES = [
  QuizStatus.SCHEDULED,
  QuizStatus.LIVE,
  QuizStatus.CLOSED,
  QuizStatus.FINALIZED,
  QuizStatus.ARCHIVED,
];

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
 * The public quiz window controls arena entry; once an attempt starts,
 * every question keeps its full server-measured 30-second window.
 */
async function resolveInProgressAttempt(
  attempt: NonNullable<Awaited<ReturnType<typeof attemptRepository.findAttemptById>>>
) {
  if (attempt.status !== AttemptStatus.IN_PROGRESS) return attempt;

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
      questionStartedAt: attempt.startedAt,
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
  const answers = attempt.answers ?? [];
  const base = {
    id: attempt.id,
    quizId: attempt.quizId,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    questionStartedAt: answers.at(-1)?.answeredAt ?? attempt.startedAt,
    currentQuestionIndex: answers.length,
    serverTime: new Date(),
  };

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    // Score/correctness stay hidden until official result release
    // (Phase 5) - see spec sections 9, 10, 33.
    return base;
  }

  const quiz = await getQuizOr404(attempt.quizId);
  return { ...base, questions: sanitizeQuestionsForAttempt(quiz.questions) };
}

export async function answerQuestion(
  attemptId: string,
  userId: string,
  questionId: string,
  selectedOptionId?: string | null
) {
  const attempt = await getOwnedInProgressAttemptOrThrow(attemptId, userId);
  const previousAnswers = attempt.answers ?? [];
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    if (attempt.status === AttemptStatus.SUBMITTED && previousAnswers.some((answer) => answer.questionId === questionId)) {
      return {
        id: attempt.id,
        quizId: attempt.quizId,
        status: AttemptStatus.SUBMITTED,
        currentQuestionIndex: previousAnswers.length,
        questionStartedAt: previousAnswers.at(-1)?.answeredAt ?? attempt.startedAt,
        serverTime: new Date(),
        timedOut: false,
        message: "Your quiz has been submitted. You can view the results between 9 PM and 12 AM IST today.",
      };
    }
    throw new ApiError(409, "This attempt has already been submitted", "ATTEMPT_ALREADY_SUBMITTED");
  }

  const quiz = await getQuizOr404(attempt.quizId);
  const orderedQuestions = [...quiz.questions].sort((a, b) => a.order - b.order);
  const currentIndex = previousAnswers.length;
  const question = orderedQuestions[currentIndex];
  if (!question || question.id !== questionId) {
    const alreadyRecorded = previousAnswers.find((answer) => answer.questionId === questionId);
    if (alreadyRecorded) {
      const complete = currentIndex >= orderedQuestions.length;
      return {
        id: attempt.id,
        quizId: attempt.quizId,
        status: complete ? AttemptStatus.SUBMITTED : AttemptStatus.IN_PROGRESS,
        currentQuestionIndex: currentIndex,
        questionStartedAt: previousAnswers.at(-1)?.answeredAt ?? attempt.startedAt,
        serverTime: new Date(),
        timedOut: false,
        message: complete ? "Your quiz has already been submitted." : undefined,
      };
    }
    throw new ApiError(409, "Answer the current question before moving on", "QUESTION_OUT_OF_ORDER");
  }

  const answeredAt = new Date();
  const questionStartedAt = previousAnswers.at(-1)?.answeredAt ?? attempt.startedAt;
  const responseTimeMs = Math.max(0, answeredAt.getTime() - questionStartedAt.getTime());
  const timedOut = responseTimeMs >= QUESTION_TIME_LIMIT_MS;
  const effectiveOptionId = timedOut ? null : selectedOptionId ?? null;
  const selectedOption = effectiveOptionId
    ? question.options.find((option) => option.id === effectiveOptionId)
    : null;
  if (effectiveOptionId && !selectedOption) {
    throw new ApiError(400, "Selected option does not belong to this question", "INVALID_ANSWER_OPTION");
  }

  const isCorrect = selectedOption?.isCorrect ?? false;
  const pointsAwarded = calculateQuestionScore(isCorrect, responseTimeMs);
  const gradedAnswers = [
    ...previousAnswers.map((answer) => ({
      isCorrect: answer.isCorrect,
      selectedOptionId: answer.selectedOptionId,
      pointsAwarded: answer.pointsAwarded,
      responseTimeMs: answer.responseTimeMs ?? 0,
      difficulty: orderedQuestions.find((item) => item.id === answer.questionId)?.difficulty ?? question.difficulty,
    })),
    { isCorrect, selectedOptionId: effectiveOptionId, pointsAwarded, responseTimeMs, difficulty: question.difficulty },
  ];
  const complete = currentIndex + 1 === orderedQuestions.length;
  const correctAnswers = gradedAnswers.filter((answer) => answer.isCorrect).length;
  const answeredCount = gradedAnswers.filter((answer) => answer.selectedOptionId !== null).length;
  const score = gradedAnswers.reduce((sum, answer) => sum + answer.pointsAwarded, 0);
  const completionTimeMs = gradedAnswers.reduce((sum, answer) => sum + answer.responseTimeMs, 0);

  await attemptRepository.recordQuestionAnswer({
    attemptId: attempt.id,
    questionId: question.id,
    selectedOptionId: effectiveOptionId,
    isCorrect,
    responseTimeMs,
    pointsAwarded,
    answeredAt,
    completion: complete ? {
      totalQuestions: orderedQuestions.length,
      correctAnswers,
      incorrectAnswers: answeredCount - correctAnswers,
      unansweredQuestions: orderedQuestions.length - answeredCount,
      score,
      accuracy: orderedQuestions.length ? Math.round((correctAnswers / orderedQuestions.length) * 10000) / 100 : 0,
      completionTimeMs,
    } : undefined,
  });

  if (complete) {
    await applyImmediateRewards({
      userId,
      quizId: quiz.id,
      category: quiz.category,
      attemptId: attempt.id,
      submittedAt: answeredAt,
      totalQuestions: orderedQuestions.length,
      correctAnswers,
      answeredCount,
      completionTimeMs,
      gradedAnswers: gradedAnswers.map(({ isCorrect: correct, difficulty }) => ({ isCorrect: correct, difficulty })),
    });
  }

  return {
    id: attempt.id,
    quizId: attempt.quizId,
    status: complete ? AttemptStatus.SUBMITTED : AttemptStatus.IN_PROGRESS,
    currentQuestionIndex: currentIndex + 1,
    questionStartedAt: answeredAt,
    serverTime: answeredAt,
    timedOut,
    message: complete ? "Your quiz has been submitted. You can view the results between 9 PM and 12 AM IST today." : undefined,
  };
}
