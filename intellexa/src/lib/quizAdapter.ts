import type { BackendQuizSummary } from "./backend";
import type { Quiz, Difficulty } from "../types";

const difficultyMap: Record<string, Difficulty> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

/** LIVE/SCHEDULED/CLOSED/FINALIZED/ARCHIVED/DRAFT -> the 3-state UI model QuizCard understands. */
function toLegacyStatus(availability: BackendQuizSummary["availability"]): Quiz["status"] {
  if (availability === "LIVE") return "live";
  if (availability === "SCHEDULED" || availability === "DRAFT") return "upcoming";
  return "completed";
}

export function mapBackendQuizToLegacy(quiz: BackendQuizSummary): Quiz {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? "",
    difficulty: difficultyMap[quiz.difficulty] ?? "Medium",
    category: quiz.category,
    timeLimitPerQuestion: quiz.timeLimitPerQuestion ?? quiz.timeLimit ?? 0,
    status: toLegacyStatus(quiz.availability),
    scheduledAt: quiz.startsAt ?? undefined,
    startsAt: quiz.startsAt,
    endsAt: quiz.endsAt,
    hasAttempted: quiz.hasAttempted,
    questions: [],
  };
}