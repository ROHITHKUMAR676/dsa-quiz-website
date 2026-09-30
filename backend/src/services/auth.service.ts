import { ApiError } from "../utils/apiError.js";
import { verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { sanitizeUser } from "../utils/sanitize.js";
import { assertInstitutionalEmail } from "../utils/email.js";
import { findUserByEmail, findUserById, updateLastActiveAt, updateUser } from "../repositories/user.repository.js";

interface LoginInput {
  email: string;
  password: string;
}

interface UpdateProfileInput {
  fullName?: string;
  department?: string | null;
  year?: string | null;
  registerNumber?: string | null;
  phone?: string | null;
  preferredLanguage?: string | null;
  bio?: string | null;
  avatar?: string | null;
}

function optionalText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function login(input: LoginInput) {
  assertInstitutionalEmail(input.email);
  const user = await findUserByEmail(input.email);
  if (!user?.passwordHash) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (!user.emailVerified) {
    throw new ApiError(403, "Please verify your email before signing in", "EMAIL_NOT_VERIFIED");
  }

  const validPassword = await verifyPassword(input.password, user.passwordHash);
  if (!validPassword) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const activeUser = await updateLastActiveAt(user.id);
  const token = signAccessToken({ sub: activeUser.id, role: activeUser.role });
  return { token, user: sanitizeUser(activeUser) };
}

export async function getAuthenticatedUser(userId: string) {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(401, "Authenticated user no longer exists", "INVALID_TOKEN_SUBJECT");
  }

  return sanitizeUser(user);
}

export async function updateAuthenticatedUser(userId: string, input: UpdateProfileInput) {
  const fullName = input.fullName?.trim();
  if (input.fullName !== undefined && (!fullName || fullName.length < 2)) {
    throw new ApiError(400, "Full name must be at least 2 characters", "INVALID_FULL_NAME");
  }

  const user = await updateUser(userId, {
    ...(fullName !== undefined ? { fullName } : {}),
    ...(input.department !== undefined ? { department: optionalText(input.department) } : {}),
    ...(input.year !== undefined ? { year: optionalText(input.year) } : {}),
    ...(input.registerNumber !== undefined ? { registerNumber: optionalText(input.registerNumber) } : {}),
    ...(input.phone !== undefined ? { phone: optionalText(input.phone) } : {}),
    ...(input.preferredLanguage !== undefined ? { preferredLanguage: optionalText(input.preferredLanguage) } : {}),
    ...(input.bio !== undefined ? { bio: optionalText(input.bio) } : {}),
    ...(input.avatar !== undefined ? { avatar: optionalText(input.avatar) } : {}),
  });

  return sanitizeUser(user);
}
