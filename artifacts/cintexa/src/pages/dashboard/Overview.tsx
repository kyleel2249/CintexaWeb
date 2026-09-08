import { Link } from "wouter";
import { DashboardShell } from "./DashboardShell";
import { useMyLoyalty, useMyProfile, useMySubscription } from "@/hooks/useApi";
import { ROLE_META, getRecommendations } from "@/lib/roles";

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="cx-card">
      <p className="cx-eyebrow">{label}</p>
      <p className="cx-display mt-2 text-2xl">
        {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-[hsl(var(--bg-inset))]" /> : value}
      </p>
    </div>
  );
}

export function DashboardOverview() {
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();
  const profileQuery = useMyProfile();

  const plan = subscription.data?.subscription?.plan;
  const planLabel = plan ? plan[0].toUpperCase() + plan.slice(1) : "Starter";

  const profile = profileQuery.data?.profile;
  const role = profile?.role;
  const recommendations = role ? getRecommendations(profile?.interests ?? []) : [];

  return (
    <DashboardShell>
      {role && (
        <div className="cx-card mb-4 border-t-2" style={{ borderTopColor: `hsl(var(--${ROLE_META[role].color}))` }}>
          <p className="cx-eyebrow" style={{ color: `hsl(var(--${ROLE_META[role].color}))` }}>
            Tailored for {ROLE_META[role].label.toLowerCase()}s
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            Based on what you picked during setup, here's where to start.
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Loyalty balance" value={`${loyalty.data?.balance ?? 0} pts`} loading={loyalty.isLoading} />
        <StatCard label="Current plan" value={planLabel} loading={subscription.isLoading} />
        <StatCard
          label="Subscription status"
          value={subscription.data?.subscription?.status ?? "None yet"}
          loading={subscription.isLoading}
        />
      </div>

      <div className="cx-card mt-4">
        <div className="flex items-center justify-between">
          <p className="cx-eyebrow" style={{ color: "hsl(var(--violet))" }}>AI insight</p>
          <span className="cx-badge">Foundation</span>
        </div>
        <p className="mt-3 text-sm text-[hsl(var(--fg-muted))]">
          This is where a generated insight about your account's activity will appear once the
          AI module is connected — for example, a nudge about a contribution pattern or a
          suggestion tied to your progress.
        </p>
      </div>
    </DashboardShell>
  );
}
