/**
 * Small fixed-window rate limiter on Workers KV. Not atomic (KV isn't), which is fine for abuse
 * protection: the worst case under a race is a couple of extra requests slipping through.
 */
export type RateResult = { ok: boolean; retryAfter: number };

export async function rateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSec: number,
  nowMs: number = Date.now(),
): Promise<RateResult> {
  let count = 0;
  let resetAt = nowMs + windowSec * 1000;
  const raw = await kv.get(key);
  if (raw) {
    try {
      const data = JSON.parse(raw) as { c?: number; r?: number };
      if (typeof data.r === "number" && data.r > nowMs) {
        count = Number(data.c) || 0;
        resetAt = data.r;
      }
    } catch {
      /* corrupt entry: start a fresh window */
    }
  }
  const retryAfter = Math.max(1, Math.ceil((resetAt - nowMs) / 1000));
  if (count >= limit) return { ok: false, retryAfter };
  // KV needs a TTL of at least 60 seconds.
  await kv.put(key, JSON.stringify({ c: count + 1, r: resetAt }), { expirationTtl: Math.max(60, retryAfter) });
  return { ok: true, retryAfter };
}

export function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown";
}
