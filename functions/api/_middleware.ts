/**
 * Runs in front of EVERY /api/* Pages Function: one per-IP, per-policy rate limit for all endpoints.
 * Budgets live in lib/rate-policy.ts. Fixed window on Workers KV (see lib/ratelimit.ts).
 * If KV is missing or errors, the request is allowed (and the problem logged) rather than taking the API down.
 */
import { corsHeaders } from "../lib/cintexa-auth";
import { policyFor } from "../lib/rate-policy";
import { clientIp, rateLimit } from "../lib/ratelimit";

interface Env {
  KV?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  // CORS pre-flights carry no payload and must always be answerable.
  if (request.method === "OPTIONS" || request.method === "HEAD") return context.next();
  if (!env.KV) {
    console.error(JSON.stringify({ msg: "rate_limit_skipped_no_kv" }));
    return context.next();
  }

  const url = new URL(request.url);
  const policy = policyFor(request.method, url.pathname);
  let result;
  try {
    result = await rateLimit(env.KV, `rl:${policy.name}:${clientIp(request)}`, policy.limit, policy.windowSec);
  } catch (err) {
    console.error(JSON.stringify({ msg: "rate_limit_error", error: String(err) }));
    return context.next();
  }

  if (!result.ok) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: corsHeaders({ "Content-Type": "application/json", "Retry-After": String(result.retryAfter) }),
      },
    );
  }
  return context.next();
};
