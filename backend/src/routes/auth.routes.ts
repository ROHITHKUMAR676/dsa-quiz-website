import express, { Router } from "express";
import {
  googleLoginController,
  logoutController,
  meController,
  updateMeController,
  uploadMyAvatarController,
  getAvatarController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { googleLoginSchema, updateProfileSchema } from "../validators/auth.validators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authRateLimiter } from "../config/security.js";

export const authRouter = Router();

authRouter.get("/avatar/:userId", asyncHandler(getAvatarController));
authRouter.post("/google", authRateLimiter, validate(googleLoginSchema), asyncHandler(googleLoginController));
authRouter.post("/logout", authenticate, asyncHandler(logoutController));
authRouter.get("/me", authenticate, asyncHandler(meController));
authRouter.patch("/me", authenticate, validate(updateProfileSchema), asyncHandler(updateMeController));
authRouter.put("/me/avatar", authenticate, express.raw({ type: "image/webp", limit: "512kb" }), asyncHandler(uploadMyAvatarController));
