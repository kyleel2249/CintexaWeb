/** GET /api/admin/activity?type=&limit=&cursor= — newest-first account & security events. */
import { adminJson, requireAdmin, type AdminEnv } from "../../lib/admin";
import { listEvents } from "../../lib/events";

const TYPES = new Set([
  "signup", "login_success", "login_failed", "logout", "password_reset_requested", "password_reset",
  "profile_update", "application", "alert_signup", "admin_setup", "admin_login", "admin_login_failed", "admin_reset",
]);

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? undefined;
  if (type && !TYPES.has(type)) return adminJson({ error: "Unknown event type." }, 400);
  const page = await listEvents(env.KV, {
    type,
    limit: Number(url.searchParams.get("limit")) || 50,
    cursor: url.searchParams.get("cursor"),
  });
  return adminJson(page);
};
