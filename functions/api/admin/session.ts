/** GET /api/admin/session — who am I (also tells the UI whether first-time setup is needed). */
import { adminExists, adminJson, requireAdmin, type AdminEnv } from "../../lib/admin";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) {
    // Signed out: say whether an admin exists so the UI can offer first-time setup.
    return adminJson({ error: "Unauthorized", setupNeeded: !(await adminExists(env.KV)) }, 401);
  }
  return adminJson({ username: guard.admin.username });
};
