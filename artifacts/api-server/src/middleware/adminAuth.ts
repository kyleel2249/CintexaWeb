import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { env } from "../lib/env.js";

/** Gates privileged routes behind a long, static admin API key sent as `x-admin-key`. */
export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-admin-key");

  if (!key || !constantTimeEquals(key, env.ADMIN_API_KEY)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * Constant-time string comparison. A plain `!==`/`===` short-circuits on the first
 * differing byte, which leaks how many leading characters of a guessed key were
 * correct via response timing. `timingSafeEqual` closes that side channel, mirroring
 * the same pattern already used for webhook signatures in webhookAuth.ts.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths, so pad to a common length first;
  // the extra Buffer.alloc padding keeps this branch itself constant-time.
  if (bufA.length !== bufB.length) {
    const padded = Buffer.alloc(bufB.length);
    timingSafeEqual(padded, bufB);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
