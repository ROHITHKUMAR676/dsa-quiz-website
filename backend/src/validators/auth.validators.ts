import { z } from "zod";

export const googleLoginSchema = z.object({
  body: z.object({ credential: z.string().min(1).max(10_000) }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120).optional(),
    department: z.string().max(120).nullable().optional(),
    year: z.string().max(40).nullable().optional(),
    registerNumber: z.string().max(80).nullable().optional(),
    phone: z.string().max(40).nullable().optional(),
    preferredLanguage: z.string().max(60).nullable().optional(),
    bio: z.string().max(500).nullable().optional(),
    avatar: z.string().url().max(500).nullable().optional(),
  }),
});
