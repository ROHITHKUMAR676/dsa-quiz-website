import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn().mockResolvedValue({ email: "rohithkumar.s.2024.cse@rajalakshmi.edu.in", role: "ADMIN" }) } }));
vi.mock("../src/config/prisma.js", () => ({ prisma: prismaMock }));

describe("auth route protection", () => {
  let app: Express;
  let signAccessToken: typeof import("../src/utils/jwt.js").signAccessToken;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
    process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
    process.env.JWT_EXPIRES_IN = "1d";
    process.env.FRONTEND_URL = "http://localhost:5173";
    process.env.APP_TIMEZONE = "Asia/Kolkata";
    process.env.DEFAULT_DAILY_QUIZ_WINDOW_MINUTES = "60";

    const appModule = await import("../src/app.js");
    const jwtModule = await import("../src/utils/jwt.js");
    app = appModule.createApp();
    signAccessToken = jwtModule.signAccessToken;
  });

  it("rejects unauthenticated /me requests", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("rejects unauthenticated admin requests", async () => {
    const response = await request(app).get("/api/admin/health");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("rejects student tokens on admin routes", async () => {
    const token = signAccessToken({ sub: "student-user-id", role: "STUDENT" });

    const response = await request(app)
      .get("/api/admin/health")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("allows admin tokens on admin routes", async () => {
    const token = signAccessToken({ sub: "admin-user-id", role: "ADMIN" });

    const response = await request(app)
      .get("/api/admin/health")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", scope: "admin" });
  });
});
