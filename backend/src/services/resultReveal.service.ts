import * as resultRevealRepository from "../repositories/resultReveal.repository.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import { ApiError } from "../utils/apiError.js";
import { getResultState } from "./quizLifecycle.service.js";

interface RevealAssetInput {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

export function adminSetDailyReveal(quizId: string, data: RevealAssetInput) {
  return resultRevealRepository.upsertDailyReveal(quizId, data);
}

export function adminSetWeeklyReveal(weeklyCompetitionId: string, data: RevealAssetInput) {
  return resultRevealRepository.upsertWeeklyReveal(weeklyCompetitionId, data);
}

/**
 * A student can only ever see the reveal asset once results are actually
 * PUBLISHED (spec section 14: reveal happens "when daily results are
 * officially released") - never before, regardless of whether an admin
 * already uploaded/associated the video.
 */
export async function getDailyRevealForStudent(quizId: string) {
  const quiz = await quizRepository.findQuizForAttempt(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  const resultState = getResultState(quiz, new Date());
  if (resultState !== "PUBLISHED") {
    return { available: false, resultState };
  }

  const reveal = await resultRevealRepository.findRevealByQuiz(quizId);
  if (!reveal || !reveal.videoUrl) return { available: false, resultState };

  return { available: true, resultState, reveal };
}
