import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { DashboardShell } from "./DashboardShell";
import {
  useMyActivity,
  useMyContributions,
  useMyLoyalty,
  useMyProfile,
  useMySubscription,
} from "@/hooks/useApi";
import { ROLE_META, getRecommendations } from "@/lib/roles";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { checkInStreak, readStreak, badgeMeta } from "@/lib/streak-badges";
import { useMoney } from "@/lib/currency/useMoney";
import { browserLocale, formatMoney, regionName } from "@/lib/currency/format";
import { isSettled } from "@/lib/contributions";

function StatCard({
  label,
  value,
  loading,
  failed,
  href,
}: {
  label: string;
  value: string;
  loading: boolean;
  failed?: boolean;
  href?: string;
}) {
  const inner = (
    <div className="cx-card h-full">
      <p className="cx-eyebrow">{label}</p>
      <p className="cx-display mt-2 text-2xl">
        {loading ? (
          <span className="inline-block h-6 w-16 animate-pulse rounded bg-[hsl(var(--bg-inset))]" />
        ) : failed ? (
          <span title="Couldn't load" aria-label="Unavailable">
            —
          </span>
        ) : (
          value
        )}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function monthLabel(d: string | Date) {
  return new Date(d).toLocaleString(browserLocale(), { month: "short", year: "numeric", timeZone: "UTC" });
}

export function DashboardOverview() {
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();
  const profileQuery = useMyProfile();
  const contributions = useMyContributions();
  const activity = useMyActivity();
  const money = useMoney(["GHS"]);
  const [showOverviewInsight, setShowOverviewInsight] = useState(false);

  const plan = subscription.data?.subscription?.plan;
  const planLabel = plan ? plan[0].toUpperCase() + plan.slice(1) : "Starter";
  const status = subscription.data?.subscription?.status ?? "None yet";

  const profile = profileQuery.data?.profile;
  const role = profile?.role;
  const recommendations = role ? getRecommendations(profile?.interests ?? []) : [];

  const contribList = useMemo(() => contributions.data?.contributions ?? [], [contributions.data]);
  const settled = useMemo(() => contribList.filter(isSettled), [contribList]);
  // One consistent rule for the total AND the list below it, shown in the visitor's own currency.
  const display = useMemo(() => money.plan(settled), [money, settled]);
  const totalContributed = display.items.reduce((sum, i) => sum + i.amount, 0);
  const recent = useMemo(
    () =>
      [...display.items]
        .sort((a, b) => new Date(b.row.createdAt).getTime() - new Date(a.row.createdAt).getTime())
        .slice(0, 6),
    [display.items],
  );

  const contribCount = contributions.data?.pagination.total ?? contribList.length;
  const activityCount = activity.data?.pagination.total ?? activity.data?.activity?.length ?? 0;
  const recentActivity = (activity.data?.activity ?? []).slice(0, 5);

  // Reading the streak is pure; recording today's check-in writes storage, so it lives in an effect.
  const [streak, setStreak] = useState(() => readStreak());
  useEffect(() => {
    setStreak(checkInStreak());
  }, []);
  const badge = badgeMeta(streak.badgeId);

  const loading =
    loyalty.isLoading || subscription.isLoading || contributions.isLoading || activity.isLoading;

  const failedQueries = [loyalty, subscription, activity].filter((q) => q.isError);
  const showFxNote = display.usedConversion || display.fellBack;

  return (
    <DashboardShell>
      {role && (
        <div className="cx-card mb-4 border-t-2" style={{ borderTopColor: `hsl(var(--${ROLE_META[role].color}))` }}>
          <p className="cx-eyebrow" style={{ color: `hsl(var(--${ROLE_META[role].color}))` }}>
            Tailored for {ROLE_META[role].label.toLowerCase()}s
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            Based on what you picked during setup, here is where to start.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <Link key={rec.href} href={rec.href}>
                <div className="cx-card-inset cx-card-interactive rounded-lg p-3">
                  <p className="text-sm font-medium">{rec.title}</p>
                  <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">{rec.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {failedQueries.length > 0 && (
        <div
          className="cx-card mb-4 flex flex-wrap items-center justify-between gap-3"
          style={{ borderColor: "hsl(var(--danger) / .5)" }}
          role="alert"
        >
          <p className="text-sm">
            Some live account data couldn’t be loaded, so those figures show “—” instead of a number.
          </p>
          <button
            type="button"
            className="cx-btn cx-btn-secondary cx-btn-sm"
            onClick={() => failedQueries.forEach((q) => void q.refetch())}
          >
            Try again
          </button>
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="cx-eyebrow">Account command center</p>
          <h2 className="cx-display mt-1 text-xl">Verified activity on your CINTEXA account</h2>
        </div>
        <button
          type="button"
          className="cx-btn cx-btn-secondary cx-btn-sm"
          onClick={() => setShowOverviewInsight((v) => !v)}
        >
          {showOverviewInsight ? "Hide account analysis" : "View account analysis"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Loyalty balance"
          value={`${loyalty.data?.balance ?? 0} pts`}
          loading={loyalty.isLoading}
          failed={loyalty.isError}
          href="/dashboard/progress"
        />
        <StatCard
          label="Current plan"
          value={planLabel}
          loading={subscription.isLoading}
          failed={subscription.isError}
          href="/dashboard/settings"
        />
        <StatCard
          label="Subscription status"
          value={status}
          loading={subscription.isLoading}
          failed={subscription.isError}
        />
        <StatCard
          label="Contributions recorded"
          value={loading ? "…" : String(contribCount)}
          loading={contributions.isLoading}
          href="/dashboard/contributions"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="cx-card lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <p className="cx-eyebrow">Contribution summary</p>
            <Link href="/dashboard/contributions" className="text-xs text-[hsl(var(--accent))]">
              Monthly summary
            </Link>
          </div>
          <p className="cx-display mt-2 text-2xl tabular-nums">
            {contributions.isLoading ? "…" : formatMoney(totalContributed, display.currency)}
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
            Sum of settled contributions on this account. Pending, failed or cancelled records are excluded.
          </p>
          {showFxNote && !contributions.isLoading && (
            <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
              {display.fellBack
                ? `Live exchange rate unavailable — showing ${display.currency}, the currency these were recorded in.`
                : `Converted to ${money.currency}${money.country ? ` (${regionName(money.country)})` : ""} at today’s exchange rate. Recorded in ${[
                    ...new Set(display.items.map((i) => i.original.currency)),
                  ].join(", ")}.`}
            </p>
          )}
          {display.excluded.length > 0 && (
            <p className="mt-1 text-xs" style={{ color: "hsl(var(--danger))" }}>
              {display.excluded.length} payment{display.excluded.length === 1 ? "" : "s"} in another currency{" "}
              couldn’t be converted and {display.excluded.length === 1 ? "is" : "are"} not included.
            </p>
          )}
          {contribList.length === 0 && !contributions.isLoading && (
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">No contributions recorded on this account yet.</p>
          )}
          {recent.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-[hsl(var(--border))] pt-3">
              {recent.map((i) => (
                <li key={i.row.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[hsl(var(--fg-muted))]">{monthLabel(i.row.createdAt)}</span>
                  <span
                    className="tabular-nums font-medium"
                    title={i.converted ? `Recorded as ${formatMoney(i.original.amount, i.original.currency)}` : undefined}
                  >
                    {formatMoney(i.amount, display.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {settled.length > recent.length && (
            <Link href="/dashboard/contributions" className="mt-3 inline-block text-xs text-[hsl(var(--accent))]">
              View all {settled.length} →
            </Link>
          )}
        </div>

        <div className="cx-card">
          <p className="cx-eyebrow">Daily streak</p>
          <p className="cx-display mt-2 text-2xl">
            {streak.consecutiveDays} day{streak.consecutiveDays === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
            {badge ? (
              <>
                Badge: <span style={{ color: badge.color }}>{badge.label}</span>
              </>
            ) : (
              "No badge yet — visit the dashboard daily"
            )}
          </p>
          <Link href="/dashboard/progress" className="mt-3 inline-block text-xs text-[hsl(var(--accent))]">
            Progress & milestones
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="cx-card">
          <div className="flex items-center justify-between">
            <p className="cx-eyebrow">Recent activity</p>
            <span className="text-xs text-[hsl(var(--fg-muted))]">{activity.isError ? "—" : `${activityCount} total`}</span>
          </div>
          {activity.isLoading && <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
          {activity.isError && (
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Activity couldn’t be loaded right now.</p>
          )}
          {!activity.isLoading && !activity.isError && recentActivity.length === 0 && (
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">No activity events recorded yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {recentActivity.map((a, i) => {
              const createdAt = (a as { createdAt?: string | Date }).createdAt;
              return (
                <li
                  key={(a as { id?: string }).id ?? i}
                  className="flex items-start justify-between gap-2 border-b border-[hsl(var(--border))] pb-2 text-sm last:border-0"
                >
                  <span>
                    {(a as { title?: string }).title ?? (a as { eventType?: string }).eventType ?? "Event"}
                  </span>
                  <span className="shrink-0 text-xs text-[hsl(var(--fg-muted))]">
                    {createdAt ? new Date(createdAt).toLocaleDateString(browserLocale()) : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="cx-card">
          <p className="cx-eyebrow">Quick links</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/dashboard/progress", label: "Progress" },
              { href: "/dashboard/contributions", label: "Contributions" },
              { href: "/dashboard/leaderboard", label: "Leaderboard" },
              { href: "/dashboard/social", label: "Social" },
              { href: "/dashboard/analytics", label: "Analytics" },
              { href: "/dashboard/careers", label: "Careers" },
              { href: "/dashboard/email", label: "Email" },
              { href: "/dashboard/settings", label: "Settings" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="cx-btn cx-btn-secondary cx-btn-sm w-full justify-center">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showOverviewInsight && (
        <div className="mt-6">
          <InsightPanel tab="overview" />
        </div>
      )}
    </DashboardShell>
  );
}
