/** POST /api/admin/reset — set a new password with a one-time link. Signs out every existing session. */
import {
  adminJson,
  audit,
  consumeOneTimeToken,
  getAdmin,
  passwordProblem,
  securityNotice,
  setAdminPassword,
  clearAdminFailures,
  type AdminEnv,
} from "../../lib/admin";
import { recordEvent, requestMeta } from "../../lib/events";
import { clientIp, rateLimit } from "../../lib/ratelimit";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env, waitUntil }) => {
  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return adminJson({ error: "Invalid request." }, 400);
  }
  const limit = await rateLimit(env.KV, `rl:admin:reset-submit:${clientIp(request)}`, 10, 3600);
  if (!limit.ok) return adminJson({ error: "Too many attempts. Please try again later." }, 429, { "Retry-After": String(limit.retryAfter) });

  // Look at the link without burning it, so a typo or weak password doesn't waste it.
  const data = await consumeOneTimeToken(env.KV, body.token, "reset", true);
  const admin = data?.username ? await getAdmin(env.KV, data.username) : null;
  if (!admin) return adminJson({ error: "This reset link is invalid or has expired." }, 403);

  const problem = passwordProblem(body.password, admin.username);
  if (problem) return adminJson({ error: problem }, 400);

  if (!(await consumeOneTimeToken(env.KV, body.token, "reset"))) {
    return adminJson({ error: "This reset link is invalid or has expired." }, 403);
  }
  await setAdminPassword(env.KV, admin, body.password as string);
  await clearAdminFailures(env.KV, admin.username);
  const meta = requestMeta(request);
  await audit(env, admin.username, "password_reset", request);
  await recordEvent(env, { type: "admin_reset", email: admin.username, ...meta });
  waitUntil(securityNotice(env, "Admin password was reset", admin.username, meta));
  return adminJson({ ok: true });
};
