/**
 * POST /api/admin/reset-request — e-mails a one-time password-reset link to the CINTEXA security inbox.
 * The answer never reveals whether a username exists.
 */
import { adminResetLinkEmail } from "../../lib/admin-email";
import { TOKEN_TTL_MIN, adminJson, getAdmin, issueOneTimeToken, normalizeUsername, securityEmail, type AdminEnv } from "../../lib/admin";
import { sendEmail } from "../../lib/email";
import { clientIp, rateLimit } from "../../lib/ratelimit";

/** Same wording as customer password resets — and the same answer whether or not the admin exists. */
const GENERIC_RESET_MESSAGE = "If this accounts exists a password reset link has been sent.";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  let body: { username?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return adminJson({ error: "Invalid request." }, 400);
  }
  const byIp = await rateLimit(env.KV, `rl:admin:reset:ip:${clientIp(request)}`, 5, 3600);
  const global = await rateLimit(env.KV, "rl:admin:reset:global", 10, 3600);
  if (!byIp.ok || !global.ok) {
    return adminJson({ error: "Too many requests. Please try again later." }, 429, { "Retry-After": String(Math.max(byIp.retryAfter, global.retryAfter)) });
  }

  const username = normalizeUsername(body.username);
  const admin = username ? await getAdmin(env.KV, username) : null;
  if (admin) {
    const token = await issueOneTimeToken(env.KV, { type: "reset", username: admin.username });
    const link = `${new URL(request.url).origin}/admin?reset=${token}`;
    const sent = await sendEmail(env, { to: securityEmail(env), ...adminResetLinkEmail(admin.username, link, TOKEN_TTL_MIN), tags: [{ name: "category", value: "admin_reset" }] }, { allowDryRun: false });
    // A delivery failure is logged for operators; telling the visitor would reveal that the admin exists.
    if (!sent.ok) console.error(JSON.stringify({ msg: "admin_reset_email_failed", error: sent.error, status: sent.status }));
  }
  return adminJson({ ok: true, message: GENERIC_RESET_MESSAGE });
};
