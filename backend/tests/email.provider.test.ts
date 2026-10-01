import { afterEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.GMAIL_USER = "intellexa@example.com";
process.env.GMAIL_APP_PASSWORD = "test-app-password";

const logger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
const smtp = vi.hoisted(() => ({ createTransport: vi.fn() }));
vi.mock("../src/config/logger.js", () => ({ logger }));
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.createTransport } }));

const { sendAuthCode } = await import("../src/utils/email.js");

afterEach(() => vi.clearAllMocks());

describe("Gmail SMTP auth email provider", () => {
  it.each([
    ["REGISTRATION", "Verify your email address"],
    ["PASSWORD_RESET", "Your password reset verification code"],
  ] as const)("sends %s through Gmail SMTP", async (purpose, expectedSubject) => {
    const sendMail = vi.fn().mockResolvedValue({
      messageId: "smtp-message-id",
      accepted: ["student@rajalakshmi.edu.in"],
      rejected: [],
    });
    smtp.createTransport.mockReturnValue({ sendMail });

    await sendAuthCode("student@rajalakshmi.edu.in", "123456", purpose);

    expect(smtp.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      service: "gmail",
      auth: { user: "intellexa@example.com", pass: "test-app-password" },
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "student@rajalakshmi.edu.in",
      subject: expectedSubject,
    }));
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("123456");
  });

  it("maps SMTP failure to a retryable delivery error without logging secrets", async () => {
    smtp.createTransport.mockReturnValue({ sendMail: vi.fn().mockRejectedValue(new Error("private SMTP details")) });

    await expect(sendAuthCode("student@rajalakshmi.edu.in", "123456", "REGISTRATION"))
      .rejects.toMatchObject({ statusCode: 503, code: "EMAIL_DELIVERY_FAILED" });

    const logs = JSON.stringify([...logger.info.mock.calls, ...logger.error.mock.calls]);
    expect(logs).not.toContain("123456");
    expect(logs).not.toContain("test-app-password");
    expect(logs).not.toContain("private SMTP details");
  });
});

describe("email environment validation", () => {
  it("requires Gmail SMTP credentials in production", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message).join(" "))
        .toContain("Production requires GMAIL_USER and GMAIL_APP_PASSWORD");
    }
  });

  it("accepts complete Gmail SMTP configuration", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
      GMAIL_USER: "intellexa@example.com",
      GMAIL_APP_PASSWORD: "test-app-password",
    });

    expect(result.success).toBe(true);
  });
});
