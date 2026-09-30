import {
  createHash,
  createHmac,
  randomInt,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { AuthChallengePurpose, Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";
import { hashPassword } from "../utils/password.js";
import {
  sendAuthCode,
  assertInstitutionalEmail,
} from "../utils/email.js";
import { signAccessToken } from "../utils/jwt.js";
import { sanitizeUser } from "../utils/sanitize.js";
import { ApiError } from "../utils/apiError.js";

const OTP_TTL = 10 * 60 * 1000;
const RESEND_WAIT = 60 * 1000;
const RESET_TTL = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Purpose = "REGISTRATION" | "PASSWORD_RESET";

function digest(value: string) {
  return createHmac("sha256", env.JWT_SECRET).update(value).digest("hex");
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function newCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function cooldownSeconds(lastSentAt: Date) {
  return Math.ceil(
    Math.max(0, RESEND_WAIT - (Date.now() - lastSentAt.getTime())) / 1000,
  );
}

async function issueCode(
  email: string,
  purpose: Purpose,
  pendingRegistration?: Prisma.InputJsonValue,
) {
  const kind =
    purpose === "REGISTRATION"
      ? AuthChallengePurpose.REGISTRATION
      : AuthChallengePurpose.PASSWORD_RESET;

  const code = newCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL);

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${email}),
        hashtext(${purpose})
      ) IS NULL AS locked
    `;

    const existing = await tx.authChallenge.findUnique({
      where: {
        email_purpose: {
          email,
          purpose: kind,
        },
      },
    });

    if (existing && cooldownSeconds(existing.lastSentAt) > 0) {
      throw new ApiError(
        429,
        `Please wait ${cooldownSeconds(existing.lastSentAt)} seconds before requesting another code`,
        "RESEND_COOLDOWN",
      );
    }

    await tx.authChallenge.upsert({
      where: {
        email_purpose: {
          email,
          purpose: kind,
        },
      },
      create: {
        email,
        purpose: kind,
        codeHash: digest(code),
        expiresAt,
        lastSentAt: now,
        pendingRegistration,
      },
      update: {
        codeHash: digest(code),
        expiresAt,
        attempts: 0,
        lastSentAt: now,
        resetTokenHash: null,
        resetExpiresAt: null,
        pendingRegistration,
      },
    });
  });

  // Send after committing the challenge. If SMTP fails, release its cooldown
  // so the user can retry without waiting or using a code they never received.
  try {
    await sendAuthCode(email, code, purpose);
  } catch (error) {
    try {
      await prisma.authChallenge.updateMany({
        where: {
          email,
          purpose: kind,
          codeHash: digest(code),
        },
        data: {
          lastSentAt: new Date(Date.now() - RESEND_WAIT - 1),
        },
      });
    } catch (releaseError) {
      logger.error(
        { purpose, errorName: (releaseError as Error)?.name },
        "Could not release auth email retry cooldown",
      );
    }
    throw error;
  }
}

interface RegistrationInput {
  fullName: string;
  email: string;
  password: string;
  department?: string;
  year?: string;
  registerNumber?: string;
  phone?: string;
  preferredLanguage?: string;
}

export async function beginRegistration(input: RegistrationInput) {
  const email = input.email.trim().toLowerCase();

  assertInstitutionalEmail(email);

  const existing = await findUserByEmail(email);

  if (existing) {
    throw new ApiError(409, "Email is already registered", "EMAIL_EXISTS");
  }

  const challenge = await prisma.authChallenge.findUnique({
    where: {
      email_purpose: {
        email,
        purpose: AuthChallengePurpose.REGISTRATION,
      },
    },
  });

  if (challenge && cooldownSeconds(challenge.lastSentAt) > 0) {
    throw new ApiError(
      429,
      `Please wait ${cooldownSeconds(challenge.lastSentAt)} seconds before requesting another code`,
      "RESEND_COOLDOWN",
    );
  }

  const pending = {
    fullName: input.fullName.trim(),
    passwordHash: await hashPassword(input.password),
    department: input.department ?? null,
    year: input.year ?? null,
    registerNumber: input.registerNumber ?? null,
    phone: input.phone ?? null,
    preferredLanguage: input.preferredLanguage ?? null,
  } satisfies Prisma.InputJsonObject;

  await issueCode(email, "REGISTRATION", pending);

  return {
    message: "Verification code sent",
    email,
    resendAfterSeconds: 60,
  };
}

export async function resendRegistrationCode(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  const challenge = await prisma.authChallenge.findUnique({
    where: {
      email_purpose: {
        email,
        purpose: AuthChallengePurpose.REGISTRATION,
      },
    },
  });

  if (
    !challenge ||
    challenge.expiresAt <= new Date() ||
    !challenge.pendingRegistration
  ) {
    throw new ApiError(
      400,
      "Registration request expired. Please sign up again.",
      "REGISTRATION_EXPIRED",
    );
  }

  await issueCode(
    email,
    "REGISTRATION",
    challenge.pendingRegistration as Prisma.InputJsonValue,
  );

  return {
    message: "Verification code sent",
    resendAfterSeconds: 60,
  };
}

export async function verifyRegistration(emailInput: string, code: string) {
  const email = emailInput.trim().toLowerCase();
  const kind = AuthChallengePurpose.REGISTRATION;

  const challenge = await prisma.authChallenge.findUnique({
    where: {
      email_purpose: {
        email,
        purpose: kind,
      },
    },
  });

  if (
    !challenge ||
    !challenge.pendingRegistration ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= MAX_ATTEMPTS
  ) {
    throw new ApiError(
      400,
      "This code is invalid or expired. Request a new code.",
      "INVALID_OR_EXPIRED_CODE",
    );
  }

  const codeHash = digest(code);

  if (!secureEqual(challenge.codeHash, codeHash)) {
    await prisma.authChallenge.updateMany({
      where: {
        id: challenge.id,
        attempts: {
          lt: MAX_ATTEMPTS,
        },
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new ApiError(
      400,
      "That code is incorrect. Please try again.",
      "INVALID_CODE",
    );
  }

  const data = challenge.pendingRegistration as Record<
    string,
    string | null
  >;

  const user = await prisma.$transaction(async (tx) => {
    const consumed = await tx.authChallenge.updateMany({
      where: {
        id: challenge.id,
        codeHash,
        expiresAt: {
          gt: new Date(),
        },
        attempts: {
          lt: MAX_ATTEMPTS,
        },
      },
      data: {
        attempts: MAX_ATTEMPTS,
      },
    });

    if (consumed.count !== 1) {
      throw new ApiError(
        400,
        "This code is invalid or expired. Request a new code.",
        "INVALID_OR_EXPIRED_CODE",
      );
    }

    const created = await tx.user.create({
      data: {
        fullName: data.fullName!,
        email,
        passwordHash: data.passwordHash!,
        emailVerified: true,
        role: Role.STUDENT,
        department: data.department,
        year: data.year,
        registerNumber: data.registerNumber,
        phone: data.phone,
        preferredLanguage: data.preferredLanguage,
        settings: {
          create: {},
        },
      },
    });

    await tx.authChallenge.delete({
      where: {
        id: challenge.id,
      },
    });

    return created;
  });

  return {
    user: sanitizeUser(user),
    token: signAccessToken({
      sub: user.id,
      role: user.role,
    }),
  };
}

export async function beginPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  assertInstitutionalEmail(email);

  const user = await findUserByEmail(email);

  if (user?.passwordHash) {
    try {
      await issueCode(email, "PASSWORD_RESET");
    } catch (error) {
      if (!(error instanceof ApiError) || ![
        "RESEND_COOLDOWN",
        "EMAIL_UNAVAILABLE",
        "EMAIL_DELIVERY_FAILED",
        "EMAIL_RECIPIENT_REJECTED",
      ].includes(error.code)) throw error;
    }
  } else {
    logger.info(
      { purpose: "PASSWORD_RESET" },
      "Password reset email not attempted for ineligible account",
    );
  }

  return {
    message:
      "If this address is eligible, an email code may be sent. If it does not arrive, check spam or try again later.",
  };
}

export async function resendPasswordResetCode(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  const challenge = await prisma.authChallenge.findUnique({
    where: {
      email_purpose: {
        email,
        purpose: AuthChallengePurpose.PASSWORD_RESET,
      },
    },
  });

  if (challenge && challenge.expiresAt > new Date()) {
    try {
      await issueCode(email, "PASSWORD_RESET");
    } catch (error) {
      if (!(error instanceof ApiError) || ![
        "RESEND_COOLDOWN",
        "EMAIL_UNAVAILABLE",
        "EMAIL_DELIVERY_FAILED",
        "EMAIL_RECIPIENT_REJECTED",
      ].includes(error.code)) throw error;
    }
  }

  return {
    message:
      "If this address is eligible, an email code may be sent. If it does not arrive, check spam or try again later.",
    resendAfterSeconds: 60,
  };
}

export async function verifyPasswordResetCode(
  emailInput: string,
  code: string,
) {
  const email = emailInput.trim().toLowerCase();
  const kind = AuthChallengePurpose.PASSWORD_RESET;

  const challenge = await prisma.authChallenge.findUnique({
    where: {
      email_purpose: {
        email,
        purpose: kind,
      },
    },
  });

  if (
    !challenge ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= MAX_ATTEMPTS
  ) {
    throw new ApiError(
      400,
      "This code is invalid or expired. Request a new code.",
      "INVALID_OR_EXPIRED_CODE",
    );
  }

  if (!secureEqual(challenge.codeHash, digest(code))) {
    await prisma.authChallenge.updateMany({
      where: {
        id: challenge.id,
        attempts: {
          lt: MAX_ATTEMPTS,
        },
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw new ApiError(
      400,
      "That code is incorrect. Please try again.",
      "INVALID_CODE",
    );
  }

  const token = randomBytes(32).toString("hex");

  const changed = await prisma.authChallenge.updateMany({
    where: {
      id: challenge.id,
      codeHash: digest(code),
      expiresAt: {
        gt: new Date(),
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    data: {
      codeHash: digest(randomBytes(32).toString("hex")),
      resetTokenHash: createHash("sha256").update(token).digest("hex"),
      resetExpiresAt: new Date(Date.now() + RESET_TTL),
      attempts: MAX_ATTEMPTS,
    },
  });

  if (changed.count !== 1) {
    throw new ApiError(
      400,
      "This code is invalid or expired. Request a new code.",
      "INVALID_OR_EXPIRED_CODE",
    );
  }

  return {
    resetToken: token,
  };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const challenge = await prisma.authChallenge.findFirst({
    where: {
      purpose: AuthChallengePurpose.PASSWORD_RESET,
      resetTokenHash: tokenHash,
      resetExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!challenge) {
    throw new ApiError(
      400,
      "Password reset session expired. Request a new code.",
      "RESET_TOKEN_INVALID",
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const consumed = await tx.authChallenge.updateMany({
      where: {
        id: challenge.id,
        resetTokenHash: tokenHash,
        resetExpiresAt: {
          gt: new Date(),
        },
      },
      data: {
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    });

    if (consumed.count !== 1) {
      throw new ApiError(
        400,
        "Password reset session expired. Request a new code.",
        "RESET_TOKEN_INVALID",
      );
    }

    await tx.user.update({
      where: {
        email: challenge.email,
      },
      data: {
        passwordHash,
      },
    });

    await tx.authChallenge.deleteMany({
      where: {
        email: challenge.email,
        purpose: AuthChallengePurpose.PASSWORD_RESET,
      },
    });
  });

  logger.info(
    { email: challenge.email },
    "Password updated through recovery flow",
  );

  return {
    message: "Password updated successfully",
  };
}
