import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "1d";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.APP_TIMEZONE = "Asia/Kolkata";
process.env.DEFAULT_DAILY_QUIZ_WINDOW_MINUTES = "60";
process.env.ALLOWED_EMAIL_DOMAIN = "rajalakshmi.edu.in";

const userRepository = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateLastActiveAt: vi.fn(),
}));

vi.mock("../src/repositories/user.repository.js", () => userRepository);

const { login } = await import("../src/services/auth.service.js");
const { beginRegistration } = await import("../src/services/authVerification.service.js");
const { isAllowedInstitutionalEmail } = await import("../src/utils/email.js");

describe("isAllowedInstitutionalEmail", () => {
  it("allows a valid Rajalakshmi email", () => {
    expect(isAllowedInstitutionalEmail("student@rajalakshmi.edu.in")).toBe(true);
  });

  it("allows a valid Rajalakshmi email regardless of case", () => {
    expect(isAllowedInstitutionalEmail("Student@RAJALAKSHMI.EDU.IN")).toBe(true);
  });

  it("rejects gmail addresses", () => {
    expect(isAllowedInstitutionalEmail("student@gmail.com")).toBe(false);
  });

  it("rejects yahoo addresses", () => {
    expect(isAllowedInstitutionalEmail("test@yahoo.com")).toBe(false);
  });

  it("rejects other .edu.in institutions", () => {
    expect(isAllowedInstitutionalEmail("someone@othercollege.edu.in")).toBe(false);
  });

  it("rejects a domain that merely contains the allowed domain as a substring", () => {
    expect(isAllowedInstitutionalEmail("student@notrajalakshmi.edu.in")).toBe(false);
    expect(isAllowedInstitutionalEmail("student@rajalakshmi.edu.in.evil.com")).toBe(false);
  });
});

describe("auth.service server-side domain enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration with a non-institutional email before touching the database", async () => {
    await expect(
      beginRegistration({
        fullName: "Test Student",
        email: "student@gmail.com",
        password: "password123",
      })
    ).rejects.toMatchObject({ statusCode: 403, code: "EMAIL_DOMAIN_NOT_ALLOWED" });

    expect(userRepository.findUserByEmail).not.toHaveBeenCalled();
    expect(userRepository.createUser).not.toHaveBeenCalled();
  });

  it("accepts only the configured institutional email domain for registration", () => {
    expect(isAllowedInstitutionalEmail("student@rajalakshmi.edu.in")).toBe(true);
  });

  it("rejects login with a non-institutional email before checking credentials", async () => {
    await expect(
      login({ email: "test@yahoo.com", password: "whatever" })
    ).rejects.toMatchObject({ statusCode: 403, code: "EMAIL_DOMAIN_NOT_ALLOWED" });

    expect(userRepository.findUserByEmail).not.toHaveBeenCalled();
  });
});
