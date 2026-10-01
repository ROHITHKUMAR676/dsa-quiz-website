import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.GOOGLE_CLIENT_ID = "google-web-client.apps.googleusercontent.com";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByGoogleSub: vi.fn(),
  findUserById: vi.fn(),
  linkGoogleAccountIfUnlinked: vi.fn(),
  updateLastActiveAt: vi.fn(),
  signAccessToken: vi.fn(() => "application-jwt"),
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({ verifyIdToken: mocks.verifyIdToken })),
}));
vi.mock("../src/repositories/user.repository.js", () => ({
  createUser: mocks.createUser,
  findUserByEmail: mocks.findUserByEmail,
  findUserByGoogleSub: mocks.findUserByGoogleSub,
  findUserById: mocks.findUserById,
  linkGoogleAccountIfUnlinked: mocks.linkGoogleAccountIfUnlinked,
  updateLastActiveAt: mocks.updateLastActiveAt,
}));
vi.mock("../src/utils/jwt.js", () => ({ signAccessToken: mocks.signAccessToken }));

const { loginWithGoogle } = await import("../src/services/googleAuth.service.js");

const verifiedWorkspaceIdentity = {
  sub: "google-sub-1",
  email: "student@rajalakshmi.edu.in",
  email_verified: true,
  hd: "rajalakshmi.edu.in",
  name: "Test Student",
};

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    fullName: "Test Student",
    email: "student@rajalakshmi.edu.in",
    emailVerified: true,
    passwordHash: null,
    role: "STUDENT",
    authProvider: "GOOGLE",
    googleSub: "google-sub-1",
    department: null,
    year: null,
    registerNumber: null,
    phone: null,
    preferredLanguage: null,
    bio: null,
    avatar: null,
    xp: 0,
    coins: 0,
    totalCompetitionPoints: 0,
    totalCorrectAnswers: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyIdToken.mockResolvedValue({ getPayload: () => verifiedWorkspaceIdentity });
  mocks.findUserByGoogleSub.mockResolvedValue(null);
  mocks.findUserByEmail.mockResolvedValue(null);
  mocks.findUserById.mockResolvedValue(makeUser());
  mocks.linkGoogleAccountIfUnlinked.mockResolvedValue({ count: 1 });
  mocks.createUser.mockResolvedValue(makeUser());
  mocks.updateLastActiveAt.mockResolvedValue(makeUser());
});

describe("Google Workspace authentication", () => {
  it("verifies the token audience and creates a student with the app JWT", async () => {
    const result = await loginWithGoogle("signed-google-id-token");

    expect(mocks.verifyIdToken).toHaveBeenCalledWith({
      idToken: "signed-google-id-token",
      audience: "google-web-client.apps.googleusercontent.com",
    });
    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "student@rajalakshmi.edu.in",
      emailVerified: true,
      role: "STUDENT",
      authProvider: "GOOGLE",
      googleSub: "google-sub-1",
    }));
    expect(result.token).toBe("application-jwt");
    expect(mocks.signAccessToken).toHaveBeenCalledWith({ sub: "user-1", role: "STUDENT" });
  });

  it("links a verified same-email account without replacing its password or database role", async () => {
    const existingAdmin = makeUser({
      role: "ADMIN",
      authProvider: "PASSWORD",
      passwordHash: "existing-password-hash",
      googleSub: null,
    });
    mocks.findUserByEmail.mockResolvedValue(existingAdmin);
    mocks.findUserById.mockResolvedValue({ ...existingAdmin, googleSub: "google-sub-1", emailVerified: true });
    mocks.updateLastActiveAt.mockResolvedValue({ ...existingAdmin, googleSub: "google-sub-1", emailVerified: true });

    const result = await loginWithGoogle("signed-google-id-token");

    expect(mocks.linkGoogleAccountIfUnlinked).toHaveBeenCalledWith("user-1", "google-sub-1", true);
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.signAccessToken).toHaveBeenCalledWith({ sub: "user-1", role: "ADMIN" });
    expect(result.user.role).toBe("ADMIN");
  });

  it.each([
    ["personal Gmail account", { ...verifiedWorkspaceIdentity, email: "example@gmail.com", hd: undefined }],
    ["another institution", { ...verifiedWorkspaceIdentity, email: "student@othercollege.edu", hd: "othercollege.edu" }],
    ["missing hosted domain", { ...verifiedWorkspaceIdentity, hd: undefined }],
    ["unverified email", { ...verifiedWorkspaceIdentity, email_verified: false }],
  ])("rejects Google accounts with %s before looking up users", async (_description, payload) => {
    mocks.verifyIdToken.mockResolvedValue({ getPayload: () => payload });

    await expect(loginWithGoogle("signed-google-id-token")).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.findUserByGoogleSub).not.toHaveBeenCalled();
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects an invalid Google ID token", async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error("invalid signature"));

    await expect(loginWithGoogle("forged-token")).rejects.toMatchObject({
      statusCode: 401,
      code: "GOOGLE_TOKEN_INVALID",
    });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects a different Google identity already linked to the email", async () => {
    mocks.findUserByEmail.mockResolvedValue(makeUser({ googleSub: "different-google-sub" }));

    await expect(loginWithGoogle("signed-google-id-token")).rejects.toMatchObject({
      statusCode: 409,
      code: "GOOGLE_ACCOUNT_LINK_CONFLICT",
    });
    expect(mocks.linkGoogleAccountIfUnlinked).not.toHaveBeenCalled();
  });
});
