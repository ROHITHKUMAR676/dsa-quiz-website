import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../config/logger.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: { code: error.code, message: error.message },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "A record with this unique value already exists" },
    });
  }

  logger.error({ error }, "Unhandled request error");

  return res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
  });
}
