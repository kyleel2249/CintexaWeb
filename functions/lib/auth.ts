/**
 * Constant-time string comparison for the Cloudflare Pages Functions (Workers)
 * runtime, where node:crypto's timingSafeEqual isn't available. Mirrors the same
 * rationale as adminAuth.ts on the api-server side: a plain `!==`/`===` short-
 * circuits on the first differing byte, which can leak how many leading
 * characters of a guessed secret were correct via response timing.
 *
 * Iterates the full max(a.length, b.length) regardless of where or whether the
 * two strings differ (folding a length mismatch into the same XOR accumulator
 * rather than returning early), so total work depends only on input length, not
 * on how close a guess got - safe for both fixed-length values (HMAC signatures)
 * and free-form ones (admin API keys).
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (i < a.length ? a.charCodeAt(i) : 0) ^ (i < b.length ? b.charCodeAt(i) : 0);
  }
  return diff === 0;
}
