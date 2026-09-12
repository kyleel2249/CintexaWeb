import { useState } from "react";
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
import { checkInStreak, badgeMeta } from "@/lib/streak-badges";

function StatCard({ label, value, loading, href }: { label: string; value: string; loading: boolean; href?: string }) {
  const inner = (
    <div className="cx-card h-full">
      <p className="cx-eyebrow">{label}</p>
      <p className="cx-display mt-2 text-2xl">
        {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-[hsl(var(--bg-inset))]" /> : value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function DashboardOverview() {
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();
  const profileQuery = useMyProfile();
  const contributions = useMyContributions();
  const activity = useMyActivity();
  const [showOverviewInsight, setShowOverviewInsight] = useState(false);

  const plan = subscription.data?.subscription?.plan;
  const planLabel = plan ? plan[0].toUpperCase() + plan.slice(1) : "Starter";
  const status = subscription.data?.subscription?.status ?? "None yet";

  const profile = profileQuery.data?.profile;
  const role = profile?.role;
  const recommendations = role ? getRecommendations(profile?.interests ?? []) : [];

  const contribList = contributions.data?.contributions ?? [];
  const completed = contribList.filter((c) => (c as { status?: string }).status === "completed" || !(c as { status?: string }).status);
  const totalContributed = completed.reduce((sum, c) => sum + (Number((c as { amount?: number }).amount) || 0), 0);
  const contribCount = contributions.data?.pagination.total ?? completed.length;
  const activityCount = activity.data?.pagination.total ?? activity.data?.activity?.length ?? 0;
  const recentActivity = (activity.data?.activity ?? []).slice(0, 5);

  const streak = checkInStreak();
  const badge = badgeMeta(streak.badgeId);

  const loading =
    loyalty.isLoading || subscription.isLoading || contributions.isLoading || activity.isLoading;

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
          href="/dashboard/progress"
        />
        <StatCard
          label="Current plan"
          value={planLabel}
          loading={subscription.isLoading}
          href="/dashboard/settings"
        />
        <StatCard
          label="Subscription status"
          value={status}
          loading={subscription.isLoading}
        />
        <StatCard
          label="Contributions recorded"
          value={loading ? "…" : String(contribCount)}
          loading={contributions.isLoading}
          href="/dashboard/progress"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="cx-card lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <p className="cx-eyebrow">Contribution summary</p>
            <Link href="/dashboard/progress" className="text-xs text-[hsl(var(--accent))]">
              View progress
            </Link>
          </div>
          <p className="cx-display mt-2 text-2xl">
            {contributions.isLoading
              ? "…"
              : totalContributed > 0
                ? totalContributed.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : "0"}
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
            Sum of completed contribution amounts available on this account. Failed or cancelled records are excluded when status is provided.
          </p>
          {contribList.length === 0 && !contributions.isLoading && (
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
              No contributions recorded on this account yet.
            </p>
          )}
        </div>

        <div className="cx-card">
          <p className="cx-eyebrow">Daily streak</p>
          <p className="cx-display mt-2 text-2xl">{streak.consecutiveDays} day{streak.consecutiveDays === 1 ? "" : "s"}</p>
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
            <span className="text-xs text-[hsl(var(--fg-muted))]">{activityCount} total</span>
          </div>
          {activity.isLoading && <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
          {!activity.isLoading && recentActivity.length === 0 && (
            <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">No activity events recorded yet.</p>
          )}
          <ul className="mt-3 space-y-2">
            {recentActivity.map((a, i) => (
              <li key={(a as { id?: string }).id ?? i} className="flex items-start justify-between gap-2 border-b border-[hsl(var(--border))] pb-2 text-sm last:border-0">
                <span>{(a as { title?: string }).title ?? (a as { eventType?: string }).eventType ?? "Event"}</span>
                <span className="shrink-0 text-xs text-[hsl(var(--fg-muted))]">
                  {(a as { createdAt?: string }).createdAt
                    ? new Date((a as { createdAt: string }).createdAt).toLocaleDateString()
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cx-card">
          <p className="cx-eyebrow">Quick links</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/dashboard/progress", label: "Progress" },
              { href: "/dashboard/leaderboard", label: "Leaderboard" },
              { href: "/dashboard/analytics", label: "Analytics" },
              { href: "/dashboard/email", label: "Email" },
              { href: "/dashboard/faq", label: "FAQ" },
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
