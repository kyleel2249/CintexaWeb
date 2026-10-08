import type { Request, Response, NextFunction, RequestHandler } from "express";

export type AuthPayload = {
  userId: string;
  sessionId?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      cintexaAuth?: AuthPayload | null;
    }
  }
}

/**
 * Lightweight Bearer token auth (replaces Clerk).
 * Accepts Authorization: Bearer <token>.
 * When AUTH_DEV_BYPASS=1, treats missing auth as user "dev-user" for local demos.
 * Production should validate sessions via shared store or JWT (AUTH_SECRET).
 */
export function cintexaAuthMiddleware(): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization || "";
    const m = /^Bearer\s+(.+)$/i.exec(header);
    if (m?.[1]) {
      // Token format from Pages Functions: opaque session id.
      // userId is resolved downstream when a user directory is available;
      // for API routes we embed user id after a colon when present: userId:session
      const token = m[1].trim();
      if (token.includes(":")) {
        const [userId, sessionId] = token.split(":", 2);
        req.cintexaAuth = { userId: userId || "anonymous", sessionId };
      } else {
        // Opaque session — use token fingerprint as stable user key until KV lookup is wired on this host
        req.cintexaAuth = { userId: `sess_${token.slice(0, 32)}`, sessionId: token };
      }
    } else if (process.env.AUTH_DEV_BYPASS === "1") {
      req.cintexaAuth = { userId: "dev-user" };
    } else {
      req.cintexaAuth = null;
    }
    next();
  };
}

export function requireAuth(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.cintexaAuth?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}

export function getAuth(req: Request): { userId: string | null } {
  return { userId: req.cintexaAuth?.userId ?? null };
}
