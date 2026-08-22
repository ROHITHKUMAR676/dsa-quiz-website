import type { Request, Response } from "express";
import {
  archiveAdminQuiz,
  closeAdminQuiz,
  createAdminQuiz,
  deleteAdminQuiz,
  finalizeAdminQuiz,
  getAdminQuiz,
  listAdminQuizzes,
  publishAdminQuiz,
  scheduleAdminQuiz,
  updateAdminQuiz,
} from "../services/quiz.service.js";
import {
  createAdminQuestion,
  deleteAdminQuestion,
  reorderAdminQuestions,
  updateAdminQuestion,
} from "../services/question.service.js";

export async function createQuizController(req: Request, res: Response) {
  const quiz = await createAdminQuiz(req.auth!.userId, req.body);
  return res.status(201).json({ quiz });
}

export async function listQuizzesController(req: Request, res: Response) {
  const quizzes = await listAdminQuizzes(req.query.status as never);
  return res.json({ quizzes });
}

export async function getQuizController(req: Request, res: Response) {
  const quiz = await getAdminQuiz(req.params.id);
  return res.json({ quiz });
}

export async function updateQuizController(req: Request, res: Response) {
  const quiz = await updateAdminQuiz(req.params.id, req.body);
  return res.json({ quiz });
}

export async function deleteQuizController(req: Request, res: Response) {
  await deleteAdminQuiz(req.params.id);
  return res.status(204).send();
}

export async function createQuestionController(req: Request, res: Response) {
  const question = await createAdminQuestion(req.params.id, req.body);
  return res.status(201).json({ question });
}

export async function updateQuestionController(req: Request, res: Response) {
  const question = await updateAdminQuestion(req.params.id, req.body);
  return res.json({ question });
}

export async function deleteQuestionController(req: Request, res: Response) {
  await deleteAdminQuestion(req.params.id);
  return res.status(204).send();
}

export async function reorderQuestionsController(req: Request, res: Response) {
  const questions = await reorderAdminQuestions(req.params.id, req.body.questionIds);
  return res.json({ questions });
}

export async function scheduleQuizController(req: Request, res: Response) {
  const quiz = await scheduleAdminQuiz(req.params.id, req.body);
  return res.json({ quiz });
}

export async function publishQuizController(req: Request, res: Response) {
  const quiz = await publishAdminQuiz(req.params.id);
  return res.json({ quiz });
}

export async function closeQuizController(req: Request, res: Response) {
  const quiz = await closeAdminQuiz(req.params.id);
  return res.json({ quiz });
}

export async function finalizeQuizController(req: Request, res: Response) {
  const { quiz, results } = await finalizeAdminQuiz(req.params.id);
  return res.json({ quiz, results });
}

export async function archiveQuizController(req: Request, res: Response) {
  const quiz = await archiveAdminQuiz(req.params.id);
  return res.json({ quiz });
}
