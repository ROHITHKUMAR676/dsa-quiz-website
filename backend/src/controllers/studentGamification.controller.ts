import type { Request, Response } from "express";
import { getDailyLeaderboard, getGlobalLeaderboard } from "../services/leaderboard.service.js";
import { getWeeklyLeaderboardForStudent, getOrCreateWeeklyCompetition } from "../services/weekly.service.js";
import { getDailyRevealForStudent } from "../services/resultReveal.service.js";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../repositories/notification.repository.js";
import { listBadgesForUser } from "../repositories/badge.repository.js";

export async function dailyLeaderboardController(req: Request, res: Response) {
  const leaderboard = await getDailyLeaderboard(req.params.id);
  return res.json({ leaderboard });
}

export async function globalLeaderboardController(_req: Request, res: Response) {
  const leaderboard = await getGlobalLeaderboard();
  return res.json({ leaderboard });
}

export async function currentWeeklyLeaderboardController(_req: Request, res: Response) {
  const weekly = await getOrCreateWeeklyCompetition(new Date());
  const leaderboard = await getWeeklyLeaderboardForStudent(weekly.id);
  return res.json(leaderboard);
}

export async function weeklyLeaderboardController(req: Request, res: Response) {
  const leaderboard = await getWeeklyLeaderboardForStudent(req.params.id);
  return res.json(leaderboard);
}

export async function dailyRevealController(req: Request, res: Response) {
  const reveal = await getDailyRevealForStudent(req.params.id);
  return res.json(reveal);
}

export async function listNotificationsController(req: Request, res: Response) {
  const notifications = await listNotificationsForUser(req.auth!.userId, req.query.unread === "true");
  return res.json({ notifications });
}

export async function listBadgesController(req: Request, res: Response) {
  const badges = await listBadgesForUser(req.auth!.userId);
  return res.json({ badges });
}

export async function markNotificationReadController(req: Request, res: Response) {
  await markNotificationRead(req.params.id, req.auth!.userId);
  return res.status(204).send();
}

export async function markAllNotificationsReadController(req: Request, res: Response) {
  await markAllNotificationsRead(req.auth!.userId);
  return res.status(204).send();
}
