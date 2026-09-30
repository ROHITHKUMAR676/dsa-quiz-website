import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  DEFAULT_DAILY_QUIZ_WINDOW_MINUTES: z.coerce.number().int().positive().default(60),
  ALLOWED_EMAIL_DOMAIN: z.string().min(1).default("rajalakshmi.edu.in"),
  // Results publish this many minutes after the quiz closes. The default is
  // immediate release at close; with the default 60-minute quiz window, that
  // means leaderboard results release one hour after the scheduled start.
  // Per-quiz override: Quiz.resultReleaseDelayMinutes.
  RESULT_RELEASE_DELAY_MINUTES: z.coerce.number().int().nonnegative().default(0),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GMAIL_USER: z.string().email().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
});

const testDefaults = process.env.NODE_ENV === "test"
  ? {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public",
      PORT: "4000",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
      FRONTEND_URL: "http://localhost:5173",
      APP_TIMEZONE: "Asia/Kolkata",
      DEFAULT_DAILY_QUIZ_WINDOW_MINUTES: "60",
    }
  : {};

const environment = { ...testDefaults, ...process.env };
if (process.env.NODE_ENV === "test" && !(Number(environment.PORT) > 0)) environment.PORT = "4000";

export const env = envSchema.parse(environment);
