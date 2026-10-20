import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { cintexaAuthMiddleware } from "./middleware/cintexaAuth.js";
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
import { notificationsRouter } from "./routes/notifications.js";

/** Same JSON shape as every other API error. */
function limiter(opts: { windowMs: number; limit: number; message?: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: opts.message ?? "Too many requests. Please try again later." },
  });
}

export function createApp() {
  const app = express();

  // Behind Cloudflare / a load balancer the real client IP is in X-Forwarded-For; without this every
  // visitor would share one bucket. Set TRUST_PROXY=0 when the API is exposed directly.
  const trustProxy = process.env.TRUST_PROXY ?? "1";
  app.set("trust proxy", /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === "true");

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

  // Every request — whichever route it is headed for, including unknown paths — passes this ceiling.
  // Health probes come from a handful of fixed IPs, so they get their own generous bucket instead.
  const healthLimiter = limiter({ windowMs: 60_000, limit: 600 });
  const globalLimiter = limiter({ windowMs: 60_000, limit: 300 });
  app.use((req, res, next) =>
    req.path === "/health" || req.path.startsWith("/health/") ? healthLimiter(req, res, next) : globalLimiter(req, res, next),
  );

  // Tiered budgets per area (all per client IP). Routers may add stricter limits of their own.
  const apiLimiter = limiter({ windowMs: 60_000, limit: 120 });
  const adminLimiter = limiter({ windowMs: 60_000, limit: 60 });
  const notificationsLimiter = limiter({ windowMs: 60 * 60_000, limit: 30 });
  // Webhooks come from a provider's fixed addresses and are signature-checked; allow bursts but not floods.
  const webhookLimiter = limiter({ windowMs: 60_000, limit: 300 });

  app.use("/api", apiLimiter);
  app.use("/api/admin", adminLimiter);
  app.use("/api/notifications", notificationsLimiter);
  app.use("/webhooks", webhookLimiter);

  app.use(
    "/webhooks",
    express.raw({ type: "application/json" }),
    webhooksRouter,
  );

  app.use(express.json());

  app.use("/health", healthRouter);

  // Authenticated routes only. Scoped here (not app-wide) so public
  // routes are never affected by auth failures on public paths.
  app.use("/api/customer", cintexaAuthMiddleware(), customerRouter);
  app.use("/api/contributions", cintexaAuthMiddleware(), contributionsRouter);
  app.use("/api/activity", cintexaAuthMiddleware(), activityRouter);
  app.use("/api/subscriptions", cintexaAuthMiddleware(), subscriptionsRouter);
  app.use("/api/loyalty", cintexaAuthMiddleware(), loyaltyRouter);
  app.use("/api/insights", cintexaAuthMiddleware(), insightsRouter);

  app.use("/api/leaderboard", leaderboardRouter);

  // Public + lightly rate-limited notification endpoints (career alerts, etc.)
  app.use("/api/notifications", notificationsRouter);

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
