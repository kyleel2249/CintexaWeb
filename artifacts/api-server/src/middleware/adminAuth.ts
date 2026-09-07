import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";

/** Gates privileged routes behind a long, static admin API key sent as `x-admin-key`. */
export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-admin-key");
  if (!key || key !== env.ADMIN_API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
