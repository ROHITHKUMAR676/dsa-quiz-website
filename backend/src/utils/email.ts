import nodemailer from "nodemailer";
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

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 12_000;

async function sendWithResend(email: string, subject: string, text: string, html: string) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = new Error("Resend rejected the email request") as Error & {
      code: string;
      responseCode: number;
    };
    error.code = "EMAIL_PROVIDER_REJECTED";
    error.responseCode = response.status;
    throw error;
  }

  const result = await response.json() as { id?: unknown };
  if (typeof result.id !== "string" || !result.id) {
    throw new Error("Resend returned no email id");
  }
  return result.id;
}

export async function sendAuthCode(email: string, code: string, purpose: "REGISTRATION" | "PASSWORD_RESET") {
  const provider = env.RESEND_API_KEY ? "resend" : "gmail";
  if (provider === "gmail" && (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD)) {
    logger.error("Email delivery is not configured: set Resend credentials or local Gmail credentials");
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
    let messageId: string | undefined;
    let recipientAccepted: boolean;

    if (provider === "resend") {
      messageId = await sendWithResend(email, subject, text, html);
      recipientAccepted = true;
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: env.GMAIL_USER!, pass: env.GMAIL_APP_PASSWORD! },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });
      const result = await transporter.sendMail({
        from: `Intellexa <${env.GMAIL_USER}>`,
        to: email,
        subject,
        text,
        html,
      });
      messageId = result.messageId;
      recipientAccepted = result.accepted.some(
        (address) => String(address).toLowerCase() === email.toLowerCase(),
      );
    }

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
    const providerError = error as { name?: string; code?: string; command?: string; responseCode?: number };
    logger.error({
      purpose,
      provider,
      errorName: providerError.name,
      errorCode: providerError.code ?? (error instanceof ApiError ? error.code : undefined),
      command: providerError.command,
      responseCode: providerError.responseCode,
    }, "Failed to send authentication email");
    if (error instanceof ApiError) throw error;
    if (providerError.name === "TimeoutError" || providerError.name === "AbortError") {
      throw new ApiError(503, "Email delivery timed out. Please try again later.", "EMAIL_DELIVERY_TIMEOUT");
    }
    throw new ApiError(503, "Could not send the email. Please try again later.", "EMAIL_DELIVERY_FAILED");
  }
}
