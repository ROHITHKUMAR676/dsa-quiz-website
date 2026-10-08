import { AttemptStatus, Prisma, QuizStatus, type Quiz } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { sanitizeQuestionsForAttempt } from "../utils/sanitize.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import * as attemptRepository from "../repositories/attempt.repository.js";
import { getEffectiveEndsAt, getEffectiveStartsAt, getServerAvailabilityState } from "./quizLifecycle.service.js";
import { applyImmediateRewards } from "./reward.service.js";
import { calculateQuestionScore, QUESTION_TIME_LIMIT_MS } from "./quizScoring.service.js";

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

function toQuizAvailabilitySummary(quiz: Pick<Quiz, "status" | "startsAt" | "endsAt" | "defaultWindowMinutes" | "competitionDate">, now: Date) {
  return {
    status: quiz.status,
    availability: getServerAvailabilityState(quiz, now),
    startsAt: getEffectiveStartsAt(quiz),
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
    await attemptRepository.beginQuestion(attempt.id, quiz.questions[0].id);

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
    serverTime: new Date(),
  };

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    // Score/correctness stay hidden until official result release
    // (Phase 5) - see spec sections 9, 10, 33.
    return base;
  }

  const quiz = await getQuizOr404(attempt.quizId);
  const answers = await attemptRepository.findAttemptAnswers(attempt.id);
  return {
    ...base,
    questions: sanitizeQuestionsForAttempt(quiz.questions),
    questionStates: answers.map((answer) => {
      const correctOption = answer.selectedOptionId
        ? quiz.questions.find((question) => question.id === answer.questionId)?.options.find((option) => option.isCorrect)
        : undefined;
      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        responseTimeMs: answer.responseTimeMs,
        startedAt: answer.answeredAt,
        deadline: new Date(answer.answeredAt.getTime() + QUESTION_TIME_LIMIT_MS),
        ...(correctOption && { correctOptionId: correctOption.id }),
      };
    }),
  };
}

export async function answerQuestion(attemptId: string, userId: string, questionId: string, selectedOptionId: string | null) {
  const attempt = await getOwnedInProgressAttemptOrThrow(attemptId, userId);
  if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new ApiError(409, "This attempt is no longer active", "ATTEMPT_ALREADY_SUBMITTED");
  const quiz = await getQuizOr404(attempt.quizId);
  const now = new Date();
  const endsAt = getEffectiveEndsAt(quiz);
  if (endsAt && now >= endsAt) throw new ApiError(409, "The quiz arena has closed", "SUBMISSION_WINDOW_CLOSED");
  const question = quiz.questions.find((item) => item.id === questionId);
  if (!question) throw new ApiError(400, "Question is outside this quiz", "INVALID_ANSWER_QUESTION");
  const saved = await attemptRepository.findAttemptAnswer(attempt.id, questionId);
  if (!saved) throw new ApiError(409, "Start this question before answering", "QUESTION_NOT_STARTED");
  if (saved.selectedOptionId) throw new ApiError(409, "This question has already been answered", "QUESTION_ALREADY_ANSWERED");
  const elapsedMs = now.getTime() - saved.answeredAt.getTime();
  const timedOut = elapsedMs >= QUESTION_TIME_LIMIT_MS;
  if (selectedOptionId && timedOut) throw new ApiError(409, "The question timer has expired", "QUESTION_TIMER_EXPIRED");
  const option = selectedOptionId ? question.options.find((item) => item.id === selectedOptionId) : null;
  if (selectedOptionId && !option) throw new ApiError(400, "Selected option does not belong to this question", "INVALID_ANSWER_OPTION");
  if (!selectedOptionId && !timedOut) return { questionId, answered: false, remainingMs: QUESTION_TIME_LIMIT_MS - elapsedMs, serverTime: now };
  const isCorrect = option?.isCorrect ?? false;
  const responseTimeMs = Math.min(Math.max(0, elapsedMs), QUESTION_TIME_LIMIT_MS);
  const updated = await attemptRepository.saveQuestionAnswer(saved.id, {
    selectedOptionId: option?.id ?? null, isCorrect,
    pointsAwarded: calculateQuestionScore(isCorrect, responseTimeMs), responseTimeMs,
  });
  if (updated.count === 0) throw new ApiError(409, "This question has already been answered", "QUESTION_ALREADY_ANSWERED");
  const correctOption = option && question.options.find((item) => item.isCorrect);
  return {
    questionId,
    answered: true,
    timedOut,
    responseTimeMs,
    ...(correctOption && { correctOptionId: correctOption.id }),
    serverTime: now,
  };
}

export async function beginAttemptQuestion(attemptId: string, userId: string, questionId: string) {
  const attempt = await getOwnedInProgressAttemptOrThrow(attemptId, userId);
  if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new ApiError(409, "This attempt is no longer active", "ATTEMPT_ALREADY_SUBMITTED");
  const quiz = await getQuizOr404(attempt.quizId);
  const endsAt = getEffectiveEndsAt(quiz);
  if (endsAt && endsAt <= new Date()) {
    await attemptRepository.markAttemptExpired(attempt.id);
    throw new ApiError(409, "The quiz arena has closed", "SUBMISSION_WINDOW_CLOSED");
  }
  const index = quiz.questions.findIndex((question) => question.id === questionId);
  if (index < 0) throw new ApiError(400, "Question is outside this quiz", "INVALID_ANSWER_QUESTION");
  const previousQuestion = quiz.questions[index - 1];
  if (previousQuestion) {
    const previous = await attemptRepository.findAttemptAnswer(attempt.id, previousQuestion.id);
    if (!previous || (!previous.selectedOptionId && Date.now() - previous.answeredAt.getTime() < QUESTION_TIME_LIMIT_MS)) {
      throw new ApiError(409, "Finish the previous question before continuing", "QUESTION_STILL_ACTIVE");
    }
  }
  const entry = await attemptRepository.beginQuestion(attempt.id, questionId);
  return { questionId, startedAt: entry.answeredAt, deadline: new Date(entry.answeredAt.getTime() + QUESTION_TIME_LIMIT_MS), serverTime: new Date() };
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

  // Client answer arrays and response-time values are never authoritative.
  // Grading is based only on Answer rows created and timed by this server.
  void answers;
  const persisted = await attemptRepository.findAttemptAnswers(attempt.id);
  const answerByQuestion = new Map(persisted.map((answer) => [answer.questionId, answer]));
  const gradedAnswers = quiz.questions.map((question) => {
    const answer = answerByQuestion.get(question.id);
    return {
      questionId: question.id,
      selectedOptionId: answer?.selectedOptionId ?? null,
      isCorrect: answer?.isCorrect ?? false,
      pointsAwarded: answer?.pointsAwarded ?? 0,
      responseTimeMs: answer?.responseTimeMs ?? null,
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
