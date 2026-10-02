import express from "express";
import { pinoHttp } from "pino-http";
import { apiRouter } from "./routes/index.js";
import { corsMiddleware, helmetMiddleware } from "./config/security.js";
import { logger } from "./config/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthController } from "./controllers/health.controller.js";

export function createApp() {
  const app = express();

  app.use(pinoHttp({
    logger,
    redact: ["req.headers.authorization", "req.headers.cookie"],
  }));
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/", healthController);
  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
