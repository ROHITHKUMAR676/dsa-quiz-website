import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authRateLimiter } from "../config/security.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate(registerSchema), asyncHandler(registerController));
authRouter.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(loginController));
authRouter.post("/logout", authenticate, asyncHandler(logoutController));
authRouter.get("/me", authenticate, asyncHandler(meController));
