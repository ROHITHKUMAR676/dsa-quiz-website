import { z } from "zod";

export const quizIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const weeklyIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const revealAssetSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    videoUrl: z.string().url().optional().nullable(),
    thumbnailUrl: z.string().url().optional().nullable(),
    duration: z.number().int().positive().optional().nullable(),
  }),
});

export const optionalDateBodySchema = z.object({
  body: z.object({
    referenceDate: z.string().datetime().optional(),
  }),
});
