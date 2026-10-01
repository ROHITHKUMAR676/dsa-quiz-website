import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { isIP } from "node:net";
import type { Request } from "express";
import { env } from "./env.js";

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: new URL(env.FRONTEND_URL).origin,
  credentials: true,
});

// Render supplies True-Client-IP at its Cloudflare edge. Use that canonical
// address for rate limiting without trusting arbitrary X-Forwarded-For chains.
function clientIpKeyGenerator(req: Request) {
  const edgeClientIp = req.get("true-client-ip")?.trim();
  return edgeClientIp && isIP(edgeClientIp)
    ? edgeClientIp
    : req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { xForwardedForHeader: false },
});

export const authChallengeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIpKeyGenerator,
  validate: { xForwardedForHeader: false },
});
