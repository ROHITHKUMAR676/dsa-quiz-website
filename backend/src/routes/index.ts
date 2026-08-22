import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";
import { authRouter } from "./auth.routes.js";
import { adminRouter } from "./admin.routes.js";
import { studentRouter } from "./student.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", healthController);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/student", studentRouter);
