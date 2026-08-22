import type { Question, QuestionOption, User } from "@prisma/client";

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    year: user.year,
    registerNumber: user.registerNumber,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage,
    bio: user.bio,
    avatar: user.avatar,
    xp: user.xp,
    coins: user.coins,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type QuestionWithOptions = Question & { options: QuestionOption[] };

/**
 * Strips every answer-key secret (isCorrect, and nothing else that could
 * leak it) before a question is sent to a student. See spec section 24
 * "Question security" - students must never receive isCorrect / the
 * correct option id while attempting a quiz.
 */
export function sanitizeQuestionForAttempt(question: QuestionWithOptions) {
  return {
    id: question.id,
    questionText: question.questionText,
    difficulty: question.difficulty,
    points: question.points,
    order: question.order,
    options: question.options.map((option) => ({
      id: option.id,
      optionText: option.optionText,
      optionOrder: option.optionOrder,
    })),
  };
}

export function sanitizeQuestionsForAttempt(questions: QuestionWithOptions[]) {
  return questions.map(sanitizeQuestionForAttempt);
}
