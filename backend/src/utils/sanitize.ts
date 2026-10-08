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
    totalCompetitionPoints: user.totalCompetitionPoints,
    totalCorrectAnswers: user.totalCorrectAnswers,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type QuestionWithOptions = Question & { options: QuestionOption[] };

/**
 * Strips answer-key fields from question objects sent to students. The
 * correct option is disclosed separately only after that question is
 * answered and locked.
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
