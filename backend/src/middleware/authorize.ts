import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new ApiError(401, "Authentication required", "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN"));
    }

    return next();
  };
}
