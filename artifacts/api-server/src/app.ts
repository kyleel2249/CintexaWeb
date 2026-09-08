import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { customerRouter } from "./routes/customer.js";
import { contributionsRouter } from "./routes/contributions.js";
import { activityRouter } from "./routes/activity.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { loyaltyRouter } from "./routes/loyalty.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { adminRouter } from "./routes/admin.js";
import { agentsRouter } from "./routes/agents.js";

export function createApp() {
  const app = express();

  app.use(
    pinoHttp<import("http").IncomingMessage, import("http").ServerResponse>({
      logger,
      genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
      // Health checks are noisy at info level in a container/uptime-monitor
      // setup — log them at debug instead so real traffic isn't buried.
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      autoLogging: {
        ignore: (req) => req.url === "/health",
      },
      // Default serializers dump every response header (CSP, rate-limit
      // headers, etag, ...) on every single request — real log volume cost
      // in production. Keep only what's useful for tracing a request.
      serializers: {
        req: (req) => ({ method: req.method, url: req.url, id: req.id }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  // Webhooks need the raw body for HMAC signature verification, so they get
  // their own body parser (capturing rawBody) ahead of the general JSON parser,
  // and they never touch Clerk middleware — signature verification is their auth.
  app.use(
    "/api/webhooks",
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
    webhooksRouter,
  );

  app.use(express.json());

  // Public — mounted before Clerk so a misconfigured/placeholder key can
  // never take the health check down.
  app.use("/health", healthRouter);

  // Clerk-authenticated routes only. Scoped here (not app-wide) so public
  // routes are never affected by Clerk key validation.
  app.use("/api/customer", clerkMiddleware(), customerRouter);
  app.use("/api/contributions", clerkMiddleware(), contributionsRouter);
  app.use("/api/activity", clerkMiddleware(), activityRouter);
  app.use("/api/subscriptions", clerkMiddleware(), subscriptionsRouter);
  app.use("/api/loyalty", clerkMiddleware(), loyaltyRouter);

  // Public — opted-in customers only, no auth required to view rankings.
  app.use("/api/leaderboard", leaderboardRouter);

  // Admin — gated by ADMIN_API_KEY (x-admin-key header), not Clerk.
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/agents", agentsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Central error handler — always returns JSON, never Express's default HTML page.
  app.use((err: Error, req: Request & { log?: typeof logger }, res: express.Response, _next: express.NextFunction) => {
    (req.log ?? logger).error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
