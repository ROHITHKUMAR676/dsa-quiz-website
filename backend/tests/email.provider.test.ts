import { afterEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.EMAIL_FROM = "Intellexa <auth@example.com>";
delete process.env.GMAIL_USER;
delete process.env.GMAIL_APP_PASSWORD;

const logger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
const smtp = vi.hoisted(() => ({ createTransport: vi.fn() }));
vi.mock("../src/config/logger.js", () => ({ logger }));
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.createTransport } }));

const { sendAuthCode } = await import("../src/utils/email.js");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Resend auth email provider", () => {
  it.each([
    ["REGISTRATION", "Verify your email address"],
    ["PASSWORD_RESET", "Your password reset verification code"],
  ] as const)("sends %s through the Resend HTTP API", async (purpose, expectedSubject) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "resend-email-id" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await sendAuthCode("student@rajalakshmi.edu.in", "123456", purpose);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer test-resend-key");
    expect(JSON.parse(String(init.body))).toMatchObject({
      from: "Intellexa <auth@example.com>",
      to: ["student@rajalakshmi.edu.in"],
      subject: expectedSubject,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("123456");
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("test-resend-key");
  });

  it("surfaces provider rejection without logging response content or secrets", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "sensitive provider details" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendAuthCode("student@rajalakshmi.edu.in", "123456", "REGISTRATION"))
      .rejects.toMatchObject({ statusCode: 503, code: "EMAIL_DELIVERY_FAILED" });

    const logs = JSON.stringify([...logger.info.mock.calls, ...logger.error.mock.calls]);
    expect(logs).not.toContain("123456");
    expect(logs).not.toContain("test-resend-key");
    expect(logs).not.toContain("sensitive provider details");
    expect(logs).toContain("401");
  });

  it("maps HTTP timeouts to a retryable delivery error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));

    await expect(sendAuthCode("student@rajalakshmi.edu.in", "123456", "PASSWORD_RESET"))
      .rejects.toMatchObject({ statusCode: 503, code: "EMAIL_DELIVERY_TIMEOUT" });
  });

  it("keeps the Gmail SMTP fallback available when Resend is not configured", async () => {
    const { env } = await import("../src/config/env.js");
    const previous = {
      RESEND_API_KEY: env.RESEND_API_KEY,
      EMAIL_FROM: env.EMAIL_FROM,
      GMAIL_USER: env.GMAIL_USER,
      GMAIL_APP_PASSWORD: env.GMAIL_APP_PASSWORD,
    };
    const sendMail = vi.fn().mockResolvedValue({
      messageId: "local-message-id",
      accepted: ["student@rajalakshmi.edu.in"],
      rejected: [],
    });
    smtp.createTransport.mockReturnValue({ sendMail });
    Object.assign(env, {
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
      GMAIL_USER: "local@example.com",
      GMAIL_APP_PASSWORD: "test-app-password",
    });

    try {
      await sendAuthCode("student@rajalakshmi.edu.in", "123456", "REGISTRATION");
      expect(smtp.createTransport).toHaveBeenCalledOnce();
      expect(sendMail).toHaveBeenCalledOnce();
    } finally {
      Object.assign(env, previous);
    }
  });
});

describe("email environment validation", () => {
  it("requires Resend configuration in production", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message).join(" "))
        .toContain("Production requires RESEND_API_KEY and EMAIL_FROM");
    }
  });

  it("accepts a complete production Resend configuration", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
      RESEND_API_KEY: "test-resend-key",
      EMAIL_FROM: "Intellexa <auth@example.com>",
    });

    expect(result.success).toBe(true);
  });
});
