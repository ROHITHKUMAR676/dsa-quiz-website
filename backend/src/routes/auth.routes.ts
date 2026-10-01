import express, { Router } from "express";
import {
  loginController,
  googleLoginController,
  logoutController,
  meController,
  registerController,
  verifyRegistrationController,
  resendRegistrationController,
  forgotPasswordController,
  verifyResetCodeController,
  resendResetCodeController,
  resetPasswordController,
  updateMeController,
  uploadMyAvatarController,
  getAvatarController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { emailCodeSchema, googleLoginSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema, verifyCodeSchema } from "../validators/auth.validators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authChallengeRateLimiter, authRateLimiter } from "../config/security.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate(registerSchema), asyncHandler(registerController));
authRouter.post("/verify-registration", authChallengeRateLimiter, validate(verifyCodeSchema), asyncHandler(verifyRegistrationController));
authRouter.post("/resend-registration-code", authChallengeRateLimiter, validate(emailCodeSchema), asyncHandler(resendRegistrationController));
authRouter.post("/forgot-password", authChallengeRateLimiter, validate(emailCodeSchema), asyncHandler(forgotPasswordController));
authRouter.post("/verify-reset-code", authChallengeRateLimiter, validate(verifyCodeSchema), asyncHandler(verifyResetCodeController));
authRouter.post("/resend-reset-code", authChallengeRateLimiter, validate(emailCodeSchema), asyncHandler(resendResetCodeController));
authRouter.post("/reset-password", authChallengeRateLimiter, validate(resetPasswordSchema), asyncHandler(resetPasswordController));
authRouter.get("/avatar/:userId", asyncHandler(getAvatarController));
authRouter.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(loginController));
authRouter.post("/google", authRateLimiter, validate(googleLoginSchema), asyncHandler(googleLoginController));
authRouter.post("/logout", authenticate, asyncHandler(logoutController));
authRouter.get("/me", authenticate, asyncHandler(meController));
authRouter.patch("/me", authenticate, validate(updateProfileSchema), asyncHandler(updateMeController));
authRouter.put("/me/avatar", authenticate, express.raw({ type: "image/webp", limit: "512kb" }), asyncHandler(uploadMyAvatarController));
