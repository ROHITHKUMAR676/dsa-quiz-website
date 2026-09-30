import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.ALLOWED_EMAIL_DOMAIN = "rajalakshmi.edu.in";

const mocks = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    authChallenge: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
  return {
    tx,
    prisma: {
      $transaction: vi.fn((callback: (transaction: typeof tx) => unknown) => callback(tx)),
      authChallenge: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
    },
    repository: {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      createUser: vi.fn(),
      updateLastActiveAt: vi.fn(),
    },
    sendAuthCode: vi.fn(),
    hashPassword: vi.fn(),
  };
});

vi.mock("../src/config/prisma.js", () => ({ prisma: mocks.prisma }));
vi.mock("../src/repositories/user.repository.js", () => mocks.repository);
vi.mock("../src/utils/email.js", () => ({
  assertInstitutionalEmail: (email: string) => {
    if (!email.toLowerCase().endsWith("@rajalakshmi.edu.in")) throw new Error("invalid test domain");
  },
  sendAuthCode: mocks.sendAuthCode,
}));
vi.mock("../src/utils/password.js", () => ({ hashPassword: mocks.hashPassword }));

const { beginPasswordReset, beginRegistration } = await import("../src/services/authVerification.service.js");
const { ApiError } = await import("../src/utils/apiError.js");

const registration = {
  fullName: "Test Student",
  email: "student@rajalakshmi.edu.in",
  password: "password123",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.repository.findUserByEmail.mockResolvedValue(null);
  mocks.hashPassword.mockResolvedValue("hashed-password");
  mocks.sendAuthCode.mockResolvedValue(undefined);
  mocks.prisma.authChallenge.findUnique.mockResolvedValue(null);
  mocks.prisma.authChallenge.updateMany.mockResolvedValue({ count: 1 });
  mocks.tx.authChallenge.findUnique.mockResolvedValue(null);
  mocks.tx.authChallenge.upsert.mockResolvedValue({});
});

describe("authentication email delivery", () => {
  it("sends registration codes through the shared sender", async () => {
    const result = await beginRegistration(registration);

    expect(result.message).toBe("Verification code sent");
    expect(mocks.sendAuthCode).toHaveBeenCalledOnce();
    expect(mocks.sendAuthCode).toHaveBeenCalledWith(
      registration.email,
      expect.stringMatching(/^\d{6}$/),
      "REGISTRATION",
    );
  });

  it("sends reset codes for eligible password accounts", async () => {
    mocks.repository.findUserByEmail.mockResolvedValue({ id: "user-1", passwordHash: "hash" });

    const result = await beginPasswordReset(registration.email);

    expect(mocks.sendAuthCode).toHaveBeenCalledWith(
      registration.email,
      expect.stringMatching(/^\d{6}$/),
      "PASSWORD_RESET",
    );
    expect(result.message).not.toMatch(/code has been sent/i);
  });

  it("does not send for unknown accounts and uses the same generic reset response", async () => {
    const result = await beginPasswordReset(registration.email);

    expect(mocks.sendAuthCode).not.toHaveBeenCalled();
    expect(result.message).toMatch(/^If this address is eligible/);
  });

  it("does not claim reset email delivery on SMTP failure and releases retry cooldown", async () => {
    const unknownAccountResponse = await beginPasswordReset(registration.email);
    mocks.repository.findUserByEmail.mockResolvedValue({ id: "user-1", passwordHash: "hash" });
    mocks.sendAuthCode.mockRejectedValue(
      new ApiError(503, "Could not send the email", "EMAIL_DELIVERY_FAILED"),
    );

    const result = await beginPasswordReset(registration.email);

    expect(result).toEqual(unknownAccountResponse);
    expect(result.message).not.toMatch(/has been sent/i);
    expect(mocks.prisma.authChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ purpose: "PASSWORD_RESET" }),
    }));
  });

  it("surfaces registration delivery errors and releases retry cooldown", async () => {
    mocks.sendAuthCode.mockRejectedValue(
      new ApiError(503, "Could not send the email", "EMAIL_DELIVERY_FAILED"),
    );

    await expect(beginRegistration(registration)).rejects.toMatchObject({
      statusCode: 503,
      code: "EMAIL_DELIVERY_FAILED",
    });
    expect(mocks.prisma.authChallenge.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ purpose: "REGISTRATION" }),
    }));
  });
});
