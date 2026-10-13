/** GET /api/admin/overview — headline numbers, 30-day trends, breakdowns and the latest activity. */
import { adminJson, audit, requireAdmin, type AdminEnv } from "../../lib/admin";
import { countKeys, scanUsers } from "../../lib/admin-data";
import { dailyCounts, listEvents, type EventType } from "../../lib/events";

const TYPES: EventType[] = ["signup", "login_success", "login_failed", "application", "alert_signup"];
const sum = (a: number[] | undefined, last: number) => (a ?? []).slice(-last).reduce((s, n) => s + n, 0);

export const onRequestGet: PagesFunction<AdminEnv> = async ({ request, env }) => {
  const guard = await requireAdmin(request, env);
  if ("response" in guard) return guard.response;

  const [{ users, total, scanned, truncated }, daily, applications, recent, alertsRaw] = await Promise.all([
    scanUsers(env.KV),
    dailyCounts(env.KV, 30, TYPES),
    countKeys(env.KV, "application:", (n) => n.startsWith("application:dedupe:")),
    listEvents(env.KV, { limit: 10 }),
    env.KV.get("career_alert:index"),
  ]);

  const weekAgo = Date.now() - 7 * 86_400_000;
  const count = (pick: (u: (typeof users)[number]) => unknown) => users.filter((u) => Boolean(pick(u))).length;
  const countries = new Map<string, number>();
  for (const u of users) {
    const c = u.signup?.country;
    if (c) countries.set(c, (countries.get(c) ?? 0) + 1);
  }
  let alertSubscribers = 0;
  try {
    alertSubscribers = (JSON.parse(alertsRaw ?? "[]") as unknown[]).length;
  } catch {
    /* ignore */
  }

  await audit(env, guard.admin.username, "view_overview", request);
  return adminJson({
    totals: {
      users: total,
      newUsers7d: sum(daily.series.signup, 7),
      newUsers30d: sum(daily.series.signup, 30),
      logins7d: sum(daily.series.login_success, 7),
      failedLogins7d: sum(daily.series.login_failed, 7),
      applications: applications.count,
      alertSubscribers,
    },
    trends: { dates: daily.dates, ...daily.series },
    // Computed from the users read in this request (the newest `scanned` accounts).
    profile: {
      scanned,
      sampled: truncated,
      withDateOfBirth: count((u) => u.dateOfBirth),
      withPhone: count((u) => (u as { phone?: string }).phone),
      withCompany: count((u) => (u as { company?: string }).company),
      activeLast7d: users.filter((u) => u.lastLoginAt && Date.parse(u.lastLoginAt) >= weekAgo).length,
      neverSignedInAgain: users.filter((u) => !u.loginCount).length,
    },
    countries: [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, n]) => ({ country, users: n })),
    recent: recent.events,
    applicationsExact: applications.exact,
  });
};
