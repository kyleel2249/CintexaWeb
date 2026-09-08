import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@cintexa/db";
import { logger } from "../lib/logger.js";

export const healthRouter = Router();

/**
 * Verifies the database is actually reachable, not just that the process is
 * running. A "healthy" process with a dead DB connection is the classic
 * false-positive health check — this catches that instead.
 */
healthRouter.get("/", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Health check: database unreachable");
    res.status(503).json({ status: "degraded", database: "unreachable", timestamp: new Date().toISOString() });
  }
});
