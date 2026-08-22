import type { Request, Response } from "express";
import { env } from "../config/env.js";

export function healthController(_req: Request, res: Response) {
  return res.json({
    status: "ok",
    service: "intellexa-backend",
    timezone: env.APP_TIMEZONE,
  });
}
