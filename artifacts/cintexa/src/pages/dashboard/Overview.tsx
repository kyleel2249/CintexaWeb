import { DashboardShell } from "./DashboardShell";
import { useMyLoyalty, useMySubscription } from "@/hooks/useApi";

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

  const plan = subscription.data?.subscription?.plan;
  const planLabel = plan ? plan[0].toUpperCase() + plan.slice(1) : "Starter";

  return (
    <DashboardShell>
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
