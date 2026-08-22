import type { Request, Response } from "express";
import { getAuthenticatedUser, login, register } from "../services/auth.service.js";

export async function registerController(req: Request, res: Response) {
  const result = await register(req.body);
  return res.status(201).json(result);
}

export async function loginController(req: Request, res: Response) {
  const result = await login(req.body);
  return res.json(result);
}

export async function logoutController(_req: Request, res: Response) {
  return res.status(204).send();
}

export async function meController(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req.auth!.userId);
  return res.json({ user });
}
