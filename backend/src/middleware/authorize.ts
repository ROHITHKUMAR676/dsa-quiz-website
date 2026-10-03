import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { isAdminEmail } from "../config/admin.js";
import { ApiError } from "../utils/apiError.js";

export function authorize(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new ApiError(401, "Authentication required", "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN"));
    }

    if (roles.includes(Role.ADMIN)) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.auth.userId },
          select: { email: true, role: true },
        });
        if (
          user?.role !== Role.ADMIN ||
          !user?.email ||
          !isAdminEmail(user.email)
        ) {
          return next(new ApiError(403, "You do not have permission to perform this action", "FORBIDDEN"));
        }
      } catch (error) {
        return next(error);
      }
    }

    return next();
  };
}
