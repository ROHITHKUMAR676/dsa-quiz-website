import { afterEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
process.env.GMAIL_USER = "intellexa@example.com";
process.env.GMAIL_API_CLIENT_ID = "test-client-id";
process.env.GMAIL_API_CLIENT_SECRET = "test-client-secret";
process.env.GMAIL_API_REFRESH_TOKEN = "test-refresh-token";

const logger = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
vi.mock("../src/config/logger.js", () => ({ logger }));

const { sendAuthCode } = await import("../src/utils/email.js");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Gmail API authentication email provider", () => {
  it.each([
    ["REGISTRATION", "Verify your email address"],
    ["PASSWORD_RESET", "Your password reset verification code"],
  ] as const)("sends %s using Gmail API over HTTPS", async (purpose, expectedSubject) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "short-lived-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "gmail-message-id" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendAuthCode("student@rajalakshmi.edu.in", "123456", purpose);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
    const tokenBody = fetchMock.mock.calls[0][1]?.body as URLSearchParams;
    expect(tokenBody.get("refresh_token")).toBe("test-refresh-token");
    expect(fetchMock.mock.calls[1][0]).toBe("https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    const sendOptions = fetchMock.mock.calls[1][1] as RequestInit;
    expect(new Headers(sendOptions.headers).get("authorization")).toBe("Bearer short-lived-token");
    const encodedMessage = JSON.parse(String(sendOptions.body)).raw as string;
    const mimeMessage = Buffer.from(encodedMessage, "base64url").toString("utf8");
    expect(mimeMessage).toContain("From: Intellexa <intellexa@example.com>");
    expect(mimeMessage).toContain(`Subject: ${expectedSubject}`);
    expect(mimeMessage).toContain("Your verification code is 123456");
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("123456");
  });

  it("does not log Google response details or credentials on API failure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "short-lived-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("private Google response details", { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendAuthCode("student@rajalakshmi.edu.in", "123456", "REGISTRATION"))
      .rejects.toMatchObject({ statusCode: 503, code: "EMAIL_DELIVERY_FAILED" });

    const logs = JSON.stringify([...logger.info.mock.calls, ...logger.error.mock.calls]);
    expect(logs).not.toContain("123456");
    expect(logs).not.toContain("test-client-secret");
    expect(logs).not.toContain("test-refresh-token");
    expect(logs).not.toContain("private Google response details");
    expect(logs).toContain("403");
  });

  it("maps token endpoint timeouts to a retryable delivery error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));

    await expect(sendAuthCode("student@rajalakshmi.edu.in", "123456", "PASSWORD_RESET"))
      .rejects.toMatchObject({ statusCode: 503, code: "EMAIL_DELIVERY_TIMEOUT" });
  });
});

describe("email environment validation", () => {
  it("requires Gmail API credentials in production", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message).join(" "))
        .toContain("Production requires GMAIL_USER and complete Gmail API OAuth credentials");
    }
  });

  it("accepts complete Gmail API configuration", async () => {
    const { envSchema } = await import("../src/config/env.js");
    const result = envSchema.safeParse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://db.example/app",
      JWT_SECRET: "test-secret-with-at-least-thirty-two-characters",
      GMAIL_USER: "intellexa@example.com",
      GMAIL_API_CLIENT_ID: "test-client-id",
      GMAIL_API_CLIENT_SECRET: "test-client-secret",
      GMAIL_API_REFRESH_TOKEN: "test-refresh-token",
    });

    expect(result.success).toBe(true);
  });
});
