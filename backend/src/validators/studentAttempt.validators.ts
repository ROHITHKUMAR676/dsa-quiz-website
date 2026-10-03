import { z } from "zod";

export const quizIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const attemptIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const attemptQuestionParamSchema = z.object({
  params: z.object({ id: z.string().min(1), questionId: z.string().min(1) }),
});

export const answerQuestionSchema = z.object({
  params: z.object({ id: z.string().min(1), questionId: z.string().min(1) }),
  body: z.object({ selectedOptionId: z.string().min(1).nullable() }),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1).optional().nullable(),
  responseTimeMs: z.number().int().nonnegative().optional().nullable(),
});

export const submitAttemptSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    answers: z.array(answerSchema).max(200).default([]),
  }),
});
