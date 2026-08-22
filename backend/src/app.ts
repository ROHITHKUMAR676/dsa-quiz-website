import express from "express";
import { pinoHttp } from "pino-http";
import { apiRouter } from "./routes/index.js";
import { corsMiddleware, helmetMiddleware } from "./config/security.js";
import { logger } from "./config/logger.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
