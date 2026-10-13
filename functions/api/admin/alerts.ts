/** GET /api/admin/alerts — job & scholarship alert subscribers. */
import { adminJson, audit, requireAdmin, type AdminEnv } from "../../lib/admin";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  let emails: string[];
  try {
    emails = (JSON.parse((await env.KV.get("career_alert:index")) ?? "[]") as string[]).slice(0, 300);
  } catch {
    emails = [];
  }
  const rows = (await Promise.all(emails.map((e) => env.KV.get(`career_alert:${e}`))))
    .map((v) => {
      try {
        return v ? (JSON.parse(v) as Record<string, unknown>) : null;
      } catch {
        return null;
      }
    })
    .filter((r): r is Record<string, unknown> => r !== null);
  await audit(env, guard.admin.username, "view_alerts", request);
  return adminJson({ subscribers: rows });
};
