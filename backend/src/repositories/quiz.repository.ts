import type { Prisma } from "@prisma/client";
import { QuizStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const adminQuizInclude = {
  questions: {
    orderBy: { order: "asc" as const },
    include: { options: { orderBy: { optionOrder: "asc" as const } } },
  },
  createdBy: {
    select: { id: true, fullName: true, email: true },
  },
};

export function createQuiz(data: Prisma.QuizUncheckedCreateInput) {
  return prisma.quiz.create({ data, include: adminQuizInclude });
}

export function listQuizzes(status?: QuizStatus) {
  return prisma.quiz.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: adminQuizInclude,
  });
}

export function findQuizById(id: string) {
  return prisma.quiz.findUnique({ where: { id }, include: adminQuizInclude });
}

export function findQuizByCompetitionDate(competitionDate: Date) {
  return prisma.quiz.findFirst({ where: { competitionDate }, select: { id: true } });
}

export function updateQuiz(id: string, data: Prisma.QuizUncheckedUpdateInput) {
  return prisma.quiz.update({ where: { id }, data, include: adminQuizInclude });
}

export function deleteQuiz(id: string) {
  return prisma.quiz.delete({ where: { id } });
}

export function createQuestionWithOptions(
  quizId: string,
  data: Omit<Prisma.QuestionUncheckedCreateInput, "quizId">,
  options: Prisma.QuestionOptionCreateManyQuestionInput[]
) {
  return prisma.question.create({
    data: {
      ...data,
      quizId,
      options: { createMany: { data: options } },
    },
    include: { options: { orderBy: { optionOrder: "asc" } }, quiz: true },
  });
}

export function findQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: { options: { orderBy: { optionOrder: "asc" } }, quiz: true },
  });
}

export function updateQuestionWithOptions(
  id: string,
  data: Prisma.QuestionUncheckedUpdateInput,
  options?: Prisma.QuestionOptionCreateManyQuestionInput[]
) {
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.update({ where: { id }, data });

    if (options) {
      await tx.questionOption.deleteMany({ where: { questionId: id } });
      await tx.questionOption.createMany({
        data: options.map((option) => ({ ...option, questionId: id })),
      });
    }

    return tx.question.findUniqueOrThrow({
      where: { id: question.id },
      include: { options: { orderBy: { optionOrder: "asc" } }, quiz: true },
    });
  });
}

export function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Student-facing reads.
//
// IMPORTANT: these queries intentionally still fetch `isCorrect` because the
// scoring service needs it server-side. Sanitizing it out of any response
// that reaches a student happens in services/sanitize, never here.
// ---------------------------------------------------------------------------

const studentQuizListSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  difficulty: true,
  status: true,
  competitionDate: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  defaultWindowMinutes: true,
  timeLimit: true,
  timeLimitPerQuestion: true,
} as const;

export function listQuizzesForStudent(statuses: QuizStatus[]) {
  return prisma.quiz.findMany({
    where: { status: { in: statuses } },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    select: studentQuizListSelect,
  });
}

export function findQuizForAttempt(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" as const },
        include: { options: { orderBy: { optionOrder: "asc" as const } } },
      },
    },
  });
}

export function findPreviousPublishedCandidateQuizzes(beforeCompetitionDate: Date) {
  return prisma.quiz.findMany({
    where: {
      status: { in: [QuizStatus.FINALIZED, QuizStatus.ARCHIVED] },
      competitionDate: { lt: beforeCompetitionDate },
    },
    orderBy: { competitionDate: "desc" },
    take: 5,
  });
}

export function findFinalizedQuizzesBetween(start: Date, end: Date) {
  return prisma.quiz.findMany({
    where: {
      status: { in: [QuizStatus.FINALIZED, QuizStatus.ARCHIVED] },
      competitionDate: { gte: start, lt: end },
    },
    orderBy: { competitionDate: "asc" },
  });
}

export function reorderQuestions(quizId: string, questionIds: string[]) {
  return prisma.$transaction(async (tx) => {
    for (const [index, questionId] of questionIds.entries()) {
      await tx.question.update({
        where: { id: questionId },
        data: { order: -(index + 1) },
      });
    }

    for (const [index, questionId] of questionIds.entries()) {
      await tx.question.update({
        where: { id: questionId },
        data: { order: index + 1 },
      });
    }

    return tx.question.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
      include: { options: { orderBy: { optionOrder: "asc" } } },
    });
  });
}
