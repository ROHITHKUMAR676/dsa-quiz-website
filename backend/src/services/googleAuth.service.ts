import { AuthProvider, Prisma, Role } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleSub,
  findUserById,
  linkGoogleAccountIfUnlinked,
  updateLastActiveAt,
} from "../repositories/user.repository.js";
import { ApiError } from "../utils/apiError.js";
import { signAccessToken } from "../utils/jwt.js";
import { sanitizeUser } from "../utils/sanitize.js";

const GOOGLE_WORKSPACE_DOMAIN = "rajalakshmi.edu.in";

interface GoogleIdentity {
  sub: string;
  email: string;
  name?: string;
}

async function verifyGoogleCredential(credential: string): Promise<GoogleIdentity> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(503, "Google sign-in is not configured yet", "GOOGLE_AUTH_UNAVAILABLE");
  }

  let payload;
  try {
    const ticket = await new OAuth2Client(env.GOOGLE_CLIENT_ID).verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Google sign-in could not be verified. Please try again.", "GOOGLE_TOKEN_INVALID");
  }

  if (!payload?.sub || !payload.email) {
    throw new ApiError(401, "Google sign-in could not be verified. Please try again.", "GOOGLE_TOKEN_INVALID");
  }
  if (payload.email_verified !== true) {
    throw new ApiError(403, "Verify your Google account email before signing in", "GOOGLE_EMAIL_UNVERIFIED");
  }
  if (
    payload.hd !== GOOGLE_WORKSPACE_DOMAIN ||
    payload.email.trim().toLowerCase().split("@")[1] !== GOOGLE_WORKSPACE_DOMAIN
  ) {
    throw new ApiError(403, `Use your @${GOOGLE_WORKSPACE_DOMAIN} Google Workspace account`, "GOOGLE_DOMAIN_NOT_ALLOWED");
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name,
  };
}

function accountConflict() {
  return new ApiError(
    409,
    "This Google account cannot be linked to the existing account. Sign in with your original method or contact support.",
    "GOOGLE_ACCOUNT_LINK_CONFLICT",
  );
}

async function findOrCreateGoogleUser(identity: GoogleIdentity) {
  const accountBySub = await findUserByGoogleSub(identity.sub);
  if (accountBySub) {
    if (accountBySub.email.trim().toLowerCase() !== identity.email) throw accountConflict();
    return accountBySub;
  }

  const accountByEmail = await findUserByEmail(identity.email);
  if (accountByEmail) {
    if (accountByEmail.googleSub && accountByEmail.googleSub !== identity.sub) throw accountConflict();
    if (accountByEmail.googleSub === identity.sub) return accountByEmail;

    try {
      await linkGoogleAccountIfUnlinked(
        accountByEmail.id,
        identity.sub,
        Boolean(accountByEmail.passwordHash),
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw accountConflict();
      }
      throw error;
    }
    const currentAccount = await findUserById(accountByEmail.id);
    if (!currentAccount || currentAccount.googleSub !== identity.sub) throw accountConflict();
    // A concurrent request may have linked the same Google identity. The
    // conditional update ensures a different identity cannot overwrite it.
    return currentAccount;
  }

  try {
    return await createUser({
      fullName: identity.name?.trim().slice(0, 120) || identity.email.split("@")[0] || "Student",
      email: identity.email,
      emailVerified: true,
      role: Role.STUDENT,
      authProvider: AuthProvider.GOOGLE,
      googleSub: identity.sub,
      settings: { create: {} },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;

    // If two first-time Google requests race to create the same user, reload
    // the row created by the winner and apply the same linking checks.
    const createdByConcurrentRequest = await findUserByGoogleSub(identity.sub);
    if (createdByConcurrentRequest?.email.trim().toLowerCase() === identity.email) {
      return createdByConcurrentRequest;
    }
    const emailCreatedByConcurrentRequest = await findUserByEmail(identity.email);
    if (emailCreatedByConcurrentRequest) {
      if (emailCreatedByConcurrentRequest.googleSub === identity.sub) return emailCreatedByConcurrentRequest;
      if (!emailCreatedByConcurrentRequest.googleSub) {
        await linkGoogleAccountIfUnlinked(
          emailCreatedByConcurrentRequest.id,
          identity.sub,
          Boolean(emailCreatedByConcurrentRequest.passwordHash),
        );
        const linkedConcurrentAccount = await findUserById(emailCreatedByConcurrentRequest.id);
        if (linkedConcurrentAccount?.googleSub === identity.sub) return linkedConcurrentAccount;
      }
    }
    throw accountConflict();
  }
}

export async function loginWithGoogle(credential: string) {
  const identity = await verifyGoogleCredential(credential);
  const user = await findOrCreateGoogleUser(identity);
  const activeUser = await updateLastActiveAt(user.id);

  return {
    user: sanitizeUser(activeUser),
    token: signAccessToken({ sub: activeUser.id, role: activeUser.role }),
  };
}
