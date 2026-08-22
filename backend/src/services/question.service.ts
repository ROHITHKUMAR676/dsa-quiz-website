import type { Difficulty } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";
import * as quizRepository from "../repositories/quiz.repository.js";
import { assertQuizEditable } from "./quizLifecycle.service.js";
import { toQuestionOptionCreateMany } from "./quizValidation.service.js";

interface OptionInput {
  optionText: string;
  optionOrder: number;
  isCorrect: boolean;
}

interface QuestionInput {
  questionText: string;
  difficulty: Difficulty;
  points: number;
  order: number;
  explanation?: string | null;
  options: OptionInput[];
}

type QuestionUpdateInput = Partial<Omit<QuestionInput, "options">> & { options?: OptionInput[] };

export async function createAdminQuestion(quizId: string, input: QuestionInput) {
  const quiz = await quizRepository.findQuizById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");
  assertQuizEditable(quiz.status);

  return quizRepository.createQuestionWithOptions(
    quizId,
    {
      questionText: input.questionText,
      difficulty: input.difficulty,
      points: input.points,
      order: input.order,
      explanation: input.explanation,
    },
    toQuestionOptionCreateMany(input.options)
  );
}

export async function updateAdminQuestion(id: string, input: QuestionUpdateInput) {
  const question = await quizRepository.findQuestionById(id);
  if (!question) throw new ApiError(404, "Question not found", "QUESTION_NOT_FOUND");
  assertQuizEditable(question.quiz.status);

  return quizRepository.updateQuestionWithOptions(
    id,
    {
      questionText: input.questionText,
      difficulty: input.difficulty,
      points: input.points,
      order: input.order,
      explanation: input.explanation,
    },
    input.options ? toQuestionOptionCreateMany(input.options) : undefined
  );
}

export async function deleteAdminQuestion(id: string) {
  const question = await quizRepository.findQuestionById(id);
  if (!question) throw new ApiError(404, "Question not found", "QUESTION_NOT_FOUND");
  assertQuizEditable(question.quiz.status);
  return quizRepository.deleteQuestion(id);
}

export async function reorderAdminQuestions(quizId: string, questionIds: string[]) {
  const quiz = await quizRepository.findQuizById(quizId);
  if (!quiz) throw new ApiError(404, "Quiz not found", "QUIZ_NOT_FOUND");
  assertQuizEditable(quiz.status);

  const existingIds = new Set(quiz.questions.map((question) => question.id));
  if (questionIds.length !== existingIds.size || questionIds.some((id) => !existingIds.has(id))) {
    throw new ApiError(400, "Reorder payload must include every quiz question exactly once", "INVALID_REORDER_PAYLOAD");
  }

  if (new Set(questionIds).size !== questionIds.length) {
    throw new ApiError(400, "Question IDs must be unique", "DUPLICATE_QUESTION_ID");
  }

  return quizRepository.reorderQuestions(quizId, questionIds);
}
