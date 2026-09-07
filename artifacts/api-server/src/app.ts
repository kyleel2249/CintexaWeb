import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./lib/env.js";
import { healthRouter } from "./routes/health.js";
import { customerRouter } from "./routes/customer.js";
import { contributionsRouter } from "./routes/contributions.js";
import { activityRouter } from "./routes/activity.js";
import { webhooksRouter } from "./routes/webhooks.js";

export function createApp() {
  const app = express();

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

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Central error handler — always returns JSON, never Express's default HTML page.
  app.use((err: Error, _req: Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
