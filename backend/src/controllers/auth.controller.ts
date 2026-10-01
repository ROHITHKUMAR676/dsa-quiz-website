import type { Request, Response } from "express";
import { getAuthenticatedUser, updateAuthenticatedUser } from "../services/auth.service.js";
import { loginWithGoogle } from "../services/googleAuth.service.js";
import { getAvatar, saveAvatar } from "../services/avatar.service.js";

export async function googleLoginController(req: Request, res: Response) {
  const result = await loginWithGoogle(req.body.credential);
  return res.json(result);
}

export async function logoutController(_req: Request, res: Response) {
  return res.status(204).send();
}

export async function meController(req: Request, res: Response) {
  const user = await getAuthenticatedUser(req.auth!.userId);
  return res.json({ user });
}

export async function updateMeController(req: Request, res: Response) {
  const user = await updateAuthenticatedUser(req.auth!.userId, req.body);
  return res.json({ user });
}

export async function uploadMyAvatarController(req: Request, res: Response) {
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: { code: "INVALID_AVATAR", message: "Choose an image to upload" } });
  }
  const user = await saveAvatar(req.auth!.userId, req.body);
  return res.json({ user });
}

export async function getAvatarController(req: Request, res: Response) {
  const avatar = await getAvatar(req.params.userId);
  res.setHeader("Content-Type", avatar.contentType);
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.status(200).send(Buffer.from(avatar.data));
}
