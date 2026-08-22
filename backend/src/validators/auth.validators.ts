import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().toLowerCase(),
    password: z.string().min(8).max(128),
    department: z.string().max(120).optional(),
    year: z.string().max(40).optional(),
    registerNumber: z.string().max(80).optional(),
    phone: z.string().max(40).optional(),
    preferredLanguage: z.string().max(60).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
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
