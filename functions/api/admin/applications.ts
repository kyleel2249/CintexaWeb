/** GET /api/admin/applications — job applications received through the careers pages. */
import { adminJson, audit, requireAdmin, type AdminEnv } from "../../lib/admin";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  const listed = await env.KV.list({ prefix: "application:", limit: 300 });
  const keys = listed.keys.filter((k) => !k.name.startsWith("application:dedupe:")).slice(0, 200);
  const rows = (await Promise.all(keys.map((k) => env.KV.get(k.name))))
    .map((v) => {
      try {
        return v ? (JSON.parse(v) as { createdAt: string }) : null;
      } catch {
        return null;
      }
    })
    .filter((r): r is { createdAt: string } => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await audit(env, guard.admin.username, "view_applications", request);
  return adminJson({ applications: rows, truncated: !listed.list_complete });
};
