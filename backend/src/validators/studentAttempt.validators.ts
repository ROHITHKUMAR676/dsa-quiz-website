import { z } from "zod";

export const quizIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const attemptIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1).optional().nullable(),
});

export const answerQuestionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: answerSchema,
});
