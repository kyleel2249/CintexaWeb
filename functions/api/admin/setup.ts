/** POST /api/admin/setup — create the first admin with the one-time link (or ADMIN_SETUP_TOKEN). */
import {
  adminExists,
  adminJson,
  audit,
  consumeOneTimeToken,
  createAdmin,
  createAdminSession,
  normalizeUsername,
  passwordProblem,
  securityNotice,
  setupTokenMatchesEnv,
  type AdminEnv,
} from "../../lib/admin";
import { recordEvent, requestMeta } from "../../lib/events";
import { clientIp, rateLimit } from "../../lib/ratelimit";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env, waitUntil }) => {
  let body: { token?: unknown; username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return adminJson({ error: "Invalid request." }, 400);
  }
  if (await adminExists(env.KV)) return adminJson({ error: "Admin access is already set up." }, 409);

  const limit = await rateLimit(env.KV, `rl:admin:setup-submit:${clientIp(request)}`, 10, 3600);
  if (!limit.ok) return adminJson({ error: "Too many attempts. Please try again later." }, 429, { "Retry-After": String(limit.retryAfter) });

  const viaEnv = setupTokenMatchesEnv(env, body.token);
  // Look at the link without burning it, so a typo or weak password doesn't waste it.
  if (!viaEnv && !(await consumeOneTimeToken(env.KV, body.token, "setup", true))) {
    return adminJson({ error: "This setup link is invalid or has expired." }, 403);
  }

  const username = normalizeUsername(body.username);
  if (!username) return adminJson({ error: "Username must be 3–32 characters: letters, numbers, dots, dashes or underscores." }, 400);
  const problem = passwordProblem(body.password, username);
  if (problem) return adminJson({ error: problem }, 400);

  if (!viaEnv && !(await consumeOneTimeToken(env.KV, body.token, "setup"))) {
    return adminJson({ error: "This setup link is invalid or has expired." }, 403);
  }
  if (await adminExists(env.KV)) return adminJson({ error: "Admin access is already set up." }, 409);
  const admin = await createAdmin(env.KV, username, body.password as string);
  const session = await createAdminSession(env.KV, admin);
  const meta = requestMeta(request);
  await audit(env, username, "admin_setup", request);
  await recordEvent(env, { type: "admin_setup", email: username, ...meta, detail: "first admin created" });
  waitUntil(securityNotice(env, "Admin account created", username, meta));
  return adminJson({ ok: true, username, token: session.token, expiresAt: session.expiresAt }, 201);
};
