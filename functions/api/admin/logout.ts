/** POST /api/admin/logout */
import { adminJson, audit, bearer, deleteAdminSession, readAdminSession, type AdminEnv } from "../../lib/admin";

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const token = bearer(request);
  const admin = await readAdminSession(env.KV, token);
  await deleteAdminSession(env.KV, token);
  if (admin) await audit(env, admin.username, "logout", request);
  return adminJson({ ok: true });
};
