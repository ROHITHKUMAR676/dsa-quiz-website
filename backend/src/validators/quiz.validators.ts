import { Difficulty, QuizStatus } from "@prisma/client";
import { z } from "zod";

const difficultySchema = z.nativeEnum(Difficulty);
const isoDateSchema = z.string().datetime({ offset: true });

const quizBaseBody = z.object({
  title: z.string().min(1).max(180).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(120).optional(),
  difficulty: difficultySchema.optional(),
  competitionDate: isoDateSchema.optional().nullable(),
  startsAt: isoDateSchema.optional().nullable(),
  endsAt: isoDateSchema.optional().nullable(),
  timezone: z.string().min(1).max(80).optional(),
  defaultWindowMinutes: z.number().int().positive().optional().nullable(),
  timeLimit: z.number().int().positive().optional(),
  timeLimitPerQuestion: z.number().int().positive().optional().nullable(),
});

export const createQuizSchema = z.object({
  body: quizBaseBody.extend({
    title: z.string().min(1).max(180),
    category: z.string().min(1).max(120),
    difficulty: difficultySchema,
    timeLimit: z.number().int().positive(),
  }),
});

export const updateQuizSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: quizBaseBody.refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const quizIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const questionIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const optionSchema = z.object({
  optionText: z.string().min(1).max(500),
  optionOrder: z.number().int().min(1),
  isCorrect: z.boolean().default(false),
});

export const createQuestionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    questionText: z.string().min(1).max(2000),
    difficulty: difficultySchema,
    points: z.number().int().positive(),
    order: z.number().int().min(1),
    explanation: z.string().max(2000).optional().nullable(),
    options: z.array(optionSchema).min(2).max(6),
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    questionText: z.string().min(1).max(2000).optional(),
    difficulty: difficultySchema.optional(),
    points: z.number().int().positive().optional(),
    order: z.number().int().min(1).optional(),
    explanation: z.string().max(2000).optional().nullable(),
    options: z.array(optionSchema).min(2).max(6).optional(),
  }).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  }),
});

export const reorderQuestionsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    questionIds: z.array(z.string().min(1)).min(1),
  }),
});

export const scheduleQuizSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    competitionDate: isoDateSchema,
    startsAt: isoDateSchema,
    endsAt: isoDateSchema.optional().nullable(),
    timezone: z.string().min(1).max(80).default("Asia/Kolkata"),
    defaultWindowMinutes: z.number().int().positive().optional().nullable(),
  }),
});

export const transitionQuizSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({}).optional(),
});

export const quizListSchema = z.object({
  query: z.object({
    status: z.nativeEnum(QuizStatus).optional(),
  }),
});
