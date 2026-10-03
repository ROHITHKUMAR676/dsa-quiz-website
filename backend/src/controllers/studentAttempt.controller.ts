import type { Request, Response } from "express";
import {
  getAttemptForStudent,
  getMyAttemptForQuiz,
  getQuizForStudent,
  listQuizzesForStudent,
  startAttempt,
  submitAttempt,
  answerQuestion,
  beginAttemptQuestion,
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

export async function submitAttemptController(req: Request, res: Response) {
  const result = await submitAttempt(req.params.id, req.auth!.userId, req.body.answers);
  return res.json({ attempt: result });
}

export async function beginQuestionController(req: Request, res: Response) {
  return res.json(await beginAttemptQuestion(req.params.id, req.auth!.userId, req.params.questionId));
}

export async function answerQuestionController(req: Request, res: Response) {
  return res.json(await answerQuestion(req.params.id, req.auth!.userId, req.params.questionId, req.body.selectedOptionId));
}
