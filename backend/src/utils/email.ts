import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "./apiError.js";

export function isAllowedInstitutionalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return domain === env.ALLOWED_EMAIL_DOMAIN.toLowerCase();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
}

export function assertInstitutionalEmail(email: string) {
  if (!isAllowedInstitutionalEmail(email)) {
    throw new ApiError(403, `Only @${env.ALLOWED_EMAIL_DOMAIN} email addresses are allowed`, "EMAIL_DOMAIN_NOT_ALLOWED");
  }
}

async function getGmailAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GMAIL_API_CLIENT_ID!,
      client_secret: env.GMAIL_API_CLIENT_SECRET!,
      refresh_token: env.GMAIL_API_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const error = new Error("Google OAuth token request failed") as Error & { code: string; responseCode: number };
    error.code = "GMAIL_OAUTH_REJECTED";
    error.responseCode = response.status;
    throw error;
  }

  const result = await response.json() as { access_token?: unknown };
  if (typeof result.access_token !== "string" || !result.access_token) {
    throw new Error("Google OAuth returned no access token");
  }
  return result.access_token;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function sendWithGmailApi(email: string, subject: string, text: string, html: string) {
  const accessToken = await getGmailAccessToken();
  const boundary = `intellexa-${randomUUID()}`;
  const mimeMessage = [
    `From: Intellexa <${env.GMAIL_USER}>`,
    `To: ${email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(mimeMessage) }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const error = new Error("Gmail API rejected the email request") as Error & { code: string; responseCode: number };
    error.code = "GMAIL_API_REJECTED";
    error.responseCode = response.status;
    throw error;
  }

  const result = await response.json() as { id?: unknown };
  if (typeof result.id !== "string" || !result.id) {
    throw new Error("Gmail API returned no message id");
  }
  return result.id;
}

export async function sendAuthCode(email: string, code: string, purpose: "REGISTRATION" | "PASSWORD_RESET") {
  const provider = "gmail-api";
  if (!env.GMAIL_USER || !env.GMAIL_API_CLIENT_ID || !env.GMAIL_API_CLIENT_SECRET || !env.GMAIL_API_REFRESH_TOKEN) {
    logger.error("Email delivery is not configured: set GMAIL_USER and Gmail API OAuth credentials");
    throw new ApiError(503, "Email delivery is temporarily unavailable. Please try again later.", "EMAIL_UNAVAILABLE");
  }
  const registration = purpose === "REGISTRATION";
  const subject = registration ? "Verify your email address" : "Your password reset verification code";
  const heading = registration ? "Welcome! Let's verify your email" : "Reset your password";
  const explanation = registration
    ? "Enter this code to verify your email and complete your Intellexa registration."
    : "Enter this code to continue resetting your Intellexa password.";
  const footer = registration
    ? "If you did not start this registration, you can ignore this email. No account will be created without email verification."
    : "If you did not request a password reset, ignore this email. Your password will remain unchanged.";
  const safeEmail = escapeHtml(email);
  const html = `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border:1px solid #e4e9f1;border-radius:12px"><tr><td style="padding:32px"><div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#087e8b">INTELLEXA</div><h1 style="font-size:24px;margin:24px 0 12px">${heading}</h1><p style="font-size:15px;line-height:1.6;color:#4b5565">${explanation}<br/>Requested for ${safeEmail}.</p><div style="margin:28px 0;padding:20px;background:#f3f8fa;border-radius:8px;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;color:#086f7b">${code}</div><p style="font-size:14px;line-height:1.6;color:#4b5565">This code expires in 10 minutes. Never share it with anyone.</p><p style="font-size:12px;line-height:1.6;color:#7a8493;border-top:1px solid #e8ecf1;padding-top:18px;margin-top:28px">${footer}</p></td></tr></table></td></tr></table></body></html>`;
  logger.info({ purpose, provider }, "Attempting authentication email delivery");
  try {
    const text = `${heading}\n${explanation}\nYour verification code is ${code}. It expires in 10 minutes. Do not share it.\n${footer}`;
    const messageId = await sendWithGmailApi(email, subject, text, html);
    const recipientAccepted = true;

    logger.info({
      purpose,
      provider,
      messageId,
      recipientAccepted,
    }, "Authentication email accepted by provider");
    if (!recipientAccepted) {
      throw new ApiError(503, "The email provider did not accept the recipient. Please check the email address and try again.", "EMAIL_RECIPIENT_REJECTED");
    }
  } catch (error) {
    const providerError = error as { name?: string; code?: string; responseCode?: number };
    logger.error({
      purpose,
      provider,
      errorName: providerError.name,
      errorCode: providerError.code ?? (error instanceof ApiError ? error.code : undefined),
      responseCode: providerError.responseCode,
    }, "Failed to send authentication email");
    if (error instanceof ApiError) throw error;
    if (providerError.name === "TimeoutError" || providerError.name === "AbortError") {
      throw new ApiError(503, "Email delivery timed out. Please try again later.", "EMAIL_DELIVERY_TIMEOUT");
    }
    throw new ApiError(503, "Could not send the email. Please try again later.", "EMAIL_DELIVERY_FAILED");
  }
}
