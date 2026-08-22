import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  archiveQuizController,
  closeQuizController,
  createQuestionController,
  createQuizController,
  deleteQuestionController,
  deleteQuizController,
  finalizeQuizController,
  getQuizController,
  listQuizzesController,
  publishQuizController,
  reorderQuestionsController,
  scheduleQuizController,
  updateQuestionController,
  updateQuizController,
} from "../controllers/adminQuiz.controller.js";
import {
  createQuestionSchema,
  createQuizSchema,
  questionIdParamSchema,
  quizIdParamSchema,
  quizListSchema,
  reorderQuestionsSchema,
  scheduleQuizSchema,
  transitionQuizSchema,
  updateQuestionSchema,
  updateQuizSchema,
} from "../validators/quiz.validators.js";
import {
  finalizeWeeklyController,
  getOrCreateCurrentWeeklyController,
  adminGlobalLeaderboardController,
  participantsController,
  listWeeklyCompetitionsController,
  platformAnalyticsController,
  quizAnalyticsController,
  setDailyRevealController,
  setWeeklyRevealController,
} from "../controllers/adminGamification.controller.js";
import {
  optionalDateBodySchema,
  revealAssetSchema,
  weeklyIdParamSchema,
} from "../validators/gamification.validators.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize(Role.ADMIN));

adminRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", scope: "admin" });
});

adminRouter.post("/quizzes", validate(createQuizSchema), asyncHandler(createQuizController));
adminRouter.get("/quizzes", validate(quizListSchema), asyncHandler(listQuizzesController));
adminRouter.get("/quizzes/:id", validate(quizIdParamSchema), asyncHandler(getQuizController));
adminRouter.patch("/quizzes/:id", validate(updateQuizSchema), asyncHandler(updateQuizController));
adminRouter.delete("/quizzes/:id", validate(quizIdParamSchema), asyncHandler(deleteQuizController));

adminRouter.post("/quizzes/:id/questions", validate(createQuestionSchema), asyncHandler(createQuestionController));
adminRouter.patch("/questions/:id", validate(updateQuestionSchema), asyncHandler(updateQuestionController));
adminRouter.delete("/questions/:id", validate(questionIdParamSchema), asyncHandler(deleteQuestionController));
adminRouter.post("/quizzes/:id/questions/reorder", validate(reorderQuestionsSchema), asyncHandler(reorderQuestionsController));

adminRouter.post("/quizzes/:id/schedule", validate(scheduleQuizSchema), asyncHandler(scheduleQuizController));
adminRouter.post("/quizzes/:id/publish", validate(transitionQuizSchema), asyncHandler(publishQuizController));
adminRouter.post("/quizzes/:id/close", validate(transitionQuizSchema), asyncHandler(closeQuizController));
adminRouter.post("/quizzes/:id/finalize", validate(transitionQuizSchema), asyncHandler(finalizeQuizController));
adminRouter.post("/quizzes/:id/archive", validate(transitionQuizSchema), asyncHandler(archiveQuizController));

// Phase 6: result reveal assets
adminRouter.put("/quizzes/:id/reveal", validate(revealAssetSchema), asyncHandler(setDailyRevealController));
adminRouter.put("/weekly/:id/reveal", validate(revealAssetSchema), asyncHandler(setWeeklyRevealController));

// Phase 7: weekly competition
adminRouter.get("/weekly", asyncHandler(listWeeklyCompetitionsController));
adminRouter.post("/weekly/current", validate(optionalDateBodySchema), asyncHandler(getOrCreateCurrentWeeklyController));
adminRouter.post("/weekly/:id/finalize", validate(weeklyIdParamSchema), asyncHandler(finalizeWeeklyController));

// Phase 8: analytics
adminRouter.get("/participants", asyncHandler(participantsController));
adminRouter.get("/leaderboard/global", asyncHandler(adminGlobalLeaderboardController));
adminRouter.get("/analytics/quizzes/:id", validate(quizIdParamSchema), asyncHandler(quizAnalyticsController));
adminRouter.get("/analytics/platform", asyncHandler(platformAnalyticsController));
