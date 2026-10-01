import type { Request, Response } from "express";
import { getAuthenticatedUser, login, updateAuthenticatedUser } from "../services/auth.service.js";
import { loginWithGoogle } from "../services/googleAuth.service.js";
import { beginPasswordReset, beginRegistration, resendPasswordResetCode, resendRegistrationCode, resetPassword, verifyPasswordResetCode, verifyRegistration } from "../services/authVerification.service.js";
import { getAvatar, saveAvatar } from "../services/avatar.service.js";

export async function registerController(req: Request, res: Response) {
  const result = await beginRegistration(req.body);
  return res.status(201).json(result);
}

export async function verifyRegistrationController(req: Request, res: Response) {
  return res.json(await verifyRegistration(req.body.email, req.body.code));
}

export async function resendRegistrationController(req: Request, res: Response) {
  return res.json(await resendRegistrationCode(req.body.email));
}

export async function forgotPasswordController(req: Request, res: Response) {
  return res.json(await beginPasswordReset(req.body.email));
}

export async function verifyResetCodeController(req: Request, res: Response) {
  return res.json(await verifyPasswordResetCode(req.body.email, req.body.code));
}

export async function resendResetCodeController(req: Request, res: Response) {
  return res.json(await resendPasswordResetCode(req.body.email));
}

export async function resetPasswordController(req: Request, res: Response) {
  return res.json(await resetPassword(req.body.token, req.body.password));
}

export async function loginController(req: Request, res: Response) {
  const result = await login(req.body);
  return res.json(result);
}

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
