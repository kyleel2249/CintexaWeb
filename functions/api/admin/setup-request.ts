/**
 * POST /api/admin/setup-request — e-mails a one-time "create the first admin" link to the CINTEXA security
 * inbox. Whoever triggers it can't read it; only the inbox owner can complete setup. Only works while no
 * admin exists.
 */
import { adminSetupLinkEmail } from "../../lib/admin-email";
import { TOKEN_TTL_MIN, adminExists, adminJson, issueOneTimeToken, securityEmail, type AdminEnv } from "../../lib/admin";
import { sendEmail } from "../../lib/email";
import { clientIp, rateLimit } from "../../lib/ratelimit";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  if (await adminExists(env.KV)) return adminJson({ error: "Admin access is already set up." }, 409);

  // Protect the inbox from being spammed with links.
  const byIp = await rateLimit(env.KV, `rl:admin:setup:ip:${clientIp(request)}`, 3, 3600);
  const global = await rateLimit(env.KV, "rl:admin:setup:global", 6, 3600);
  if (!byIp.ok || !global.ok) {
    return adminJson({ error: "Too many requests. Please try again later." }, 429, { "Retry-After": String(Math.max(byIp.retryAfter, global.retryAfter)) });
  }

  const token = await issueOneTimeToken(env.KV, { type: "setup" });
  const link = `${new URL(request.url).origin}/admin?setup=${token}`;
  const sent = await sendEmail(env, { to: securityEmail(env), ...adminSetupLinkEmail(link, TOKEN_TTL_MIN), tags: [{ name: "category", value: "admin_setup" }] }, { allowDryRun: false });
  if (!sent.ok) {
    return adminJson({ error: "E-mail isn't configured on the server, so the setup link couldn't be sent." }, 503);
  }
  return adminJson({ ok: true, sentTo: securityEmail(env) });
};
