/** GET /api/admin/export — every user's details (never passwords) as CSV. Audited. */
import { adminJson, audit, requireAdmin, type AdminEnv } from "../../lib/admin";
import { adminUserView, scanUsers, toCsv } from "../../lib/admin-data";

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;
  const { users, truncated, total } = await scanUsers(env.KV);
  const rows = users.map(adminUserView).map((u) => [
    u.id, u.email, u.fullName, u.phone, u.company, u.role, u.dateOfBirth, u.timeZone,
    u.signup?.country, u.signup?.city, u.signup?.ip, u.createdAt, u.lastLoginAt, u.loginCount, u.birthdayEmail,
  ]);
  await audit(env, guard.admin.username, "export_users", request, `${rows.length} of ${total}`);
  const csv = toCsv(
    ["id", "email", "full_name", "phone", "company", "role", "date_of_birth", "time_zone", "signup_country", "signup_city", "signup_ip", "created_at", "last_login_at", "login_count", "birthday_email"],
    rows,
  );
  if (!csv) return adminJson({ error: "Nothing to export." }, 404);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cintexa-users-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Truncated": String(truncated),
    },
  });
};
