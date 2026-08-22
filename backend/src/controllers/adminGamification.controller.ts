import type { Request, Response } from "express";
import { adminSetDailyReveal, adminSetWeeklyReveal } from "../services/resultReveal.service.js";
import {
  finalizeWeeklyCompetition,
  getOrCreateWeeklyCompetition,
  listWeeklyCompetitions,
} from "../services/weekly.service.js";
import { getPlatformStats, getQuizParticipationStats } from "../services/analytics.service.js";

export async function setDailyRevealController(req: Request, res: Response) {
  const reveal = await adminSetDailyReveal(req.params.id, req.body);
  return res.json({ reveal });
}

export async function setWeeklyRevealController(req: Request, res: Response) {
  const reveal = await adminSetWeeklyReveal(req.params.id, req.body);
  return res.json({ reveal });
}

export async function listWeeklyCompetitionsController(_req: Request, res: Response) {
  const weeklyCompetitions = await listWeeklyCompetitions();
  return res.json({ weeklyCompetitions });
}

export async function getOrCreateCurrentWeeklyController(req: Request, res: Response) {
  const referenceDate = req.body.referenceDate ? new Date(req.body.referenceDate) : new Date();
  const weekly = await getOrCreateWeeklyCompetition(referenceDate);
  return res.status(201).json({ weekly });
}

export async function finalizeWeeklyController(req: Request, res: Response) {
  const result = await finalizeWeeklyCompetition(req.params.id);
  return res.json(result);
}

export async function quizAnalyticsController(req: Request, res: Response) {
  const stats = await getQuizParticipationStats(req.params.id);
  return res.json({ stats });
}

export async function platformAnalyticsController(_req: Request, res: Response) {
  const stats = await getPlatformStats();
  return res.json({ stats });
}
