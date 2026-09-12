import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { customerRouter } from "./routes/customer.js";
import { contributionsRouter } from "./routes/contributions.js";
import { activityRouter } from "./routes/activity.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { loyaltyRouter } from "./routes/loyalty.js";
import { insightsRouter } from "./routes/insights.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { adminRouter } from "./routes/admin.js";
import { agentsRouter } from "./routes/agents.js";

export function createApp() {
  const app = express();

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === "/health" || req.url === "/health/ready",
      },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.use(
    "/webhooks",
    express.raw({ type: "application/json" }),
    webhooksRouter,
  );

  app.use(express.json());

  app.use("/health", healthRouter);

  // Clerk-authenticated routes only. Scoped here (not app-wide) so public
  // routes are never affected by Clerk key validation.
  app.use("/api/customer", clerkMiddleware(), customerRouter);
  app.use("/api/contributions", clerkMiddleware(), contributionsRouter);
  app.use("/api/activity", clerkMiddleware(), activityRouter);
  app.use("/api/subscriptions", clerkMiddleware(), subscriptionsRouter);
  app.use("/api/loyalty", clerkMiddleware(), loyaltyRouter);
  app.use("/api/insights", clerkMiddleware(), insightsRouter);

  app.use("/api/leaderboard", leaderboardRouter);

  app.use("/api/admin", adminRouter);
  app.use("/api/admin/agents", agentsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use((err: Error, req: Request & { log?: typeof logger }, res: express.Response, _next: express.NextFunction) => {
    req.log?.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
