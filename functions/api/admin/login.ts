/** POST /api/admin/login — username + password → session token. */
import {
  LOCK_WINDOW_SEC,
  MAX_FAILS,
  adminJson,
  audit,
  checkAdminPassword,
  clearAdminFailures,
  createAdminSession,
  getAdmin,
  isLockedOut,
  loginAlert,
  normalizeUsername,
  recordAdminFailure,
  securityNotice,
  type AdminEnv,
} from "../../lib/admin";
import { recordEvent, requestMeta } from "../../lib/events";
import { clientIp, rateLimit } from "../../lib/ratelimit";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env, waitUntil }) => {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return adminJson({ error: "Invalid request." }, 400);
  }
  const meta = requestMeta(request);

  const byIp = await rateLimit(env.KV, `rl:admin:login:${clientIp(request)}`, 20, 900);
  if (!byIp.ok) return adminJson({ error: "Too many attempts. Try again in a few minutes." }, 429, { "Retry-After": String(byIp.retryAfter) });

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password.slice(0, 256) : "";
  const generic = () => adminJson({ error: "Invalid username or password." }, 401);

  if (!username) {
    await checkAdminPassword(null, password); // same work as a real attempt
    return generic();
  }
  if (await isLockedOut(env.KV, username)) {
    return adminJson({ error: "Too many failed attempts. Try again in 15 minutes, or reset the password." }, 429, { "Retry-After": String(LOCK_WINDOW_SEC) });
  }

  const admin = await getAdmin(env.KV, username);
  const ok = await checkAdminPassword(admin, password);
  if (!admin || !ok) {
    const fails = await recordAdminFailure(env.KV, username);
    await recordEvent(env, { type: "admin_login_failed", email: username, ...meta, detail: admin ? "wrong password" : "unknown admin" });
    if (admin && fails === MAX_FAILS) waitUntil(securityNotice(env, "Admin account locked after failed sign-ins", username, meta));
    return generic();
  }

  await clearAdminFailures(env.KV, username);
  const session = await createAdminSession(env.KV, admin);
  await env.KV.put(`admin:${username}`, JSON.stringify({ ...admin, lastLoginAt: new Date().toISOString() }));
  await audit(env, username, "login", request);
  await recordEvent(env, { type: "admin_login", email: username, ...meta });
  waitUntil(loginAlert(env, username, meta));
  return adminJson({ ok: true, username, token: session.token, expiresAt: session.expiresAt });
};
