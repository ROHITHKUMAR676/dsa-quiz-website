import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAttemptController,
  getMyAttemptForQuizController,
  getQuizController,
  listQuizzesController,
  startAttemptController,
  submitAttemptController,
} from "../controllers/studentAttempt.controller.js";
import {
  attemptIdParamSchema,
  quizIdParamSchema,
  submitAttemptSchema,
} from "../validators/studentAttempt.validators.js";
import { weeklyIdParamSchema } from "../validators/gamification.validators.js";
import {
  currentWeeklyLeaderboardController,
  dailyLeaderboardController,
  dailyRevealController,
  globalLeaderboardController,
  listBadgesController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  weeklyLeaderboardController,
} from "../controllers/studentGamification.controller.js";

export const studentRouter = Router();

studentRouter.use(authenticate, authorize(Role.STUDENT));

studentRouter.get("/quizzes", asyncHandler(listQuizzesController));
studentRouter.get("/quizzes/:id", validate(quizIdParamSchema), asyncHandler(getQuizController));
studentRouter.get("/quizzes/:id/attempt", validate(quizIdParamSchema), asyncHandler(getMyAttemptForQuizController));
studentRouter.post("/quizzes/:id/start", validate(quizIdParamSchema), asyncHandler(startAttemptController));

studentRouter.get("/attempts/:id", validate(attemptIdParamSchema), asyncHandler(getAttemptController));
studentRouter.post("/attempts/:id/submit", validate(submitAttemptSchema), asyncHandler(submitAttemptController));

// Phase 5: leaderboards
studentRouter.get("/leaderboard/daily/:id", validate(quizIdParamSchema), asyncHandler(dailyLeaderboardController));
studentRouter.get("/leaderboard/global", asyncHandler(globalLeaderboardController));
studentRouter.get("/leaderboard/weekly/current", asyncHandler(currentWeeklyLeaderboardController));
studentRouter.get("/leaderboard/weekly/:id", validate(weeklyIdParamSchema), asyncHandler(weeklyLeaderboardController));

// Phase 6: result reveal (gated to PUBLISHED results only, see service)
studentRouter.get("/quizzes/:id/reveal", validate(quizIdParamSchema), asyncHandler(dailyRevealController));

// Phase 8: notifications
studentRouter.get("/badges", asyncHandler(listBadgesController));
studentRouter.get("/notifications", asyncHandler(listNotificationsController));
studentRouter.post("/notifications/:id/read", asyncHandler(markNotificationReadController));
studentRouter.post("/notifications/read-all", asyncHandler(markAllNotificationsReadController));
