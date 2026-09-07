import type { NextFunction, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../lib/env.js";

/**
 * Verifies an HMAC-SHA256 signature on incoming webhook payloads (e.g. contribution
 * events from a payment provider). Expects a hex signature in `x-webhook-signature`,
 * computed over the raw request body using WEBHOOK_SECRET.
 */
export function requireWebhookSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.header("x-webhook-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!signature || !rawBody) {
    res.status(401).json({ error: "Missing signature" });
    return;
  }

  const expected = createHmac("sha256", env.WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }
  next();
}
