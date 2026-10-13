/**
 * GET /api/admin/users?q=&page=&pageSize=  — list / search.
 * GET /api/admin/users?email=…             — one user in full, with sign-in history.
 * The password hash and salt are never returned.
 */
import { adminJson, audit, requireAdmin, type AdminEnv } from "../../lib/admin";
import { adminUserView, getUser, getUsers, readUserIndex, scanUsers } from "../../lib/admin-data";
import { readUserLog } from "../../lib/events";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  const url = new URL(request.url);

  const email = url.searchParams.get("email");
  if (email) {
    const user = await getUser(env.KV, email);
    if (!user) return adminJson({ error: "User not found." }, 404);
    await audit(env, guard.admin.username, "view_user", request, user.email);
    return adminJson({ user: adminUserView(user), history: await readUserLog(env.KV, user.id) });
  }

  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize")) || 25, 5), 100);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);

  if (!q) {
    const index = await readUserIndex(env.KV);
    const slice = index.slice((page - 1) * pageSize, page * pageSize);
    const users = await getUsers(env.KV, slice);
    return adminJson({ users: users.map(adminUserView), total: index.length, page, pageSize, truncated: false });
  }

  const { users, scanned, truncated } = await scanUsers(env.KV);
  const hits = users.filter((u) => {
    const x = u as typeof u & { phone?: string; company?: string };
    return [u.email, u.fullName, x.phone, x.company, u.id, u.role, u.signup?.country].some((v) => v?.toString().toLowerCase().includes(q));
  });
  await audit(env, guard.admin.username, "search_users", request, q);
  return adminJson({
    users: hits.slice((page - 1) * pageSize, page * pageSize).map(adminUserView),
    total: hits.length,
    page,
    pageSize,
    scanned,
    truncated,
  });
};
