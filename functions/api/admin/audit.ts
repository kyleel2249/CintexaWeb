/** GET /api/admin/audit — what admins did (newest first). */
import { adminJson, requireAdmin, type AdminEnv, type AuditRow } from "../../lib/admin";
import { listEvents } from "../../lib/events";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  const url = new URL(request.url);
  const page = await listEvents(env.KV, { prefix: "audit:", limit: Number(url.searchParams.get("limit")) || 100, cursor: url.searchParams.get("cursor") });
  return adminJson({ audit: page.events as unknown as AuditRow[], cursor: page.cursor });
};
