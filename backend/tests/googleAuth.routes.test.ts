import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/intellexa_test?schema=public";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";

const mocks = vi.hoisted(() => ({ loginWithGoogle: vi.fn() }));
vi.mock("../src/services/googleAuth.service.js", () => ({ loginWithGoogle: mocks.loginWithGoogle }));

describe("POST /api/auth/google", () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import("../src/app.js");
    app = createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loginWithGoogle.mockResolvedValue({
      user: { id: "student-1", email: "student@rajalakshmi.edu.in", role: "STUDENT" },
      token: "application-jwt",
    });
  });

  it("returns the same user and application token shape as password login", async () => {
    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: "signed-google-id-token" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      user: { id: "student-1", email: "student@rajalakshmi.edu.in", role: "STUDENT" },
      token: "application-jwt",
    });
    expect(mocks.loginWithGoogle).toHaveBeenCalledWith("signed-google-id-token");
  });

  it("rejects a missing Google credential", async () => {
    const response = await request(app).post("/api/auth/google").send({});

    expect(response.status).toBe(400);
    expect(mocks.loginWithGoogle).not.toHaveBeenCalled();
  });
});
