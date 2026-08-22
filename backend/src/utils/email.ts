import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

/**
 * Server-side enforcement of the institutional email restriction.
 *
 * IMPORTANT: this must never be trusted on the frontend alone. Every path
 * that creates or authenticates a user (password registration, password
 * login, and - if enabled later - Google OAuth) must call this on the
 * server before creating/authenticating an account.
 */
export function isAllowedInstitutionalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  return domain === env.ALLOWED_EMAIL_DOMAIN.toLowerCase();
}

export function assertInstitutionalEmail(email: string) {
  if (!isAllowedInstitutionalEmail(email)) {
    throw new ApiError(
      403,
      `Only @${env.ALLOWED_EMAIL_DOMAIN} email addresses are allowed`,
      "EMAIL_DOMAIN_NOT_ALLOWED"
    );
  }
}
