import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";

describe("health routes", () => {
  let app: Express;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://localhost:5432/intellexa_test?schema=public";
    process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
    process.env.FRONTEND_URL = "https://dsa-quiz-websitee.vercel.app/";

    const appModule = await import("../src/app.js");
    app = appModule.createApp();
  });

  it("returns a successful health response at the service root", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "intellexa-backend",
      timezone: "Asia/Kolkata",
    });
  });

  it("keeps the API health route and permits the Vercel origin without a trailing slash", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://dsa-quiz-websitee.vercel.app");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://dsa-quiz-websitee.vercel.app"
    );
  });
});
