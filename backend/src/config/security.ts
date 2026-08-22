import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: env.FRONTEND_URL,
  credentials: true,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
});
