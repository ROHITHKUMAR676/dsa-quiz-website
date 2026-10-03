import type { Request, Response } from "express";
import {
  getAttemptForStudent,
  getMyAttemptForQuiz,
  getQuizForStudent,
  listQuizzesForStudent,
  startAttempt,
  answerQuestion,
} from "../services/studentAttempt.service.js";

export async function listQuizzesController(req: Request, res: Response) {
  const quizzes = await listQuizzesForStudent(req.auth!.userId);
  return res.json({ quizzes });
}

export async function getQuizController(req: Request, res: Response) {
  const quiz = await getQuizForStudent(req.params.id, req.auth!.userId);
  return res.json({ quiz });
}

export async function startAttemptController(req: Request, res: Response) {
  const result = await startAttempt(req.params.id, req.auth!.userId);
  return res.status(201).json(result);
}

export async function getMyAttemptForQuizController(req: Request, res: Response) {
  const attempt = await getMyAttemptForQuiz(req.params.id, req.auth!.userId);
  return res.json({ attempt });
}

export async function getAttemptController(req: Request, res: Response) {
  const attempt = await getAttemptForStudent(req.params.id, req.auth!.userId);
  return res.json({ attempt });
}

export async function answerQuestionController(req: Request, res: Response) {
  const result = await answerQuestion(req.params.id, req.auth!.userId, req.body.questionId, req.body.selectedOptionId);
  return res.json({ attempt: result });
}
