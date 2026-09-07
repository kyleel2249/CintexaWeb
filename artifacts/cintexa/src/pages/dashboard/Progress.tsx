import { DashboardShell } from "./DashboardShell";
import { useMyActivity, useMyLoyalty, useMySubscription } from "@/hooks/useApi";

export function DashboardProgress() {
  const activity = useMyActivity();
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();

  const hasActivity = (activity.data?.activity.length ?? 0) > 0;
  const hasContribution = activity.data?.activity.some((a) => a.eventType.startsWith("contribution")) ?? false;
  const plan = subscription.data?.subscription?.plan;
  const balance = loyalty.data?.balance ?? 0;

  const milestones = [
    { title: "Account created", done: true },
    { title: "First activity recorded", done: hasActivity },
    { title: "First contribution", done: hasContribution },
    { title: "On the Growth plan", done: plan === "growth" || plan === "enterprise" },
    { title: "1,000 loyalty points", done: balance >= 1000 },
  ];

  const loading = activity.isLoading || loyalty.isLoading || subscription.isLoading;
  const completed = milestones.filter((m) => m.done).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <DashboardShell>
      <div className="cx-card">
        <div className="flex items-center justify-between">
          <p className="cx-eyebrow">Growth journey</p>
          <span className="text-sm text-[hsl(var(--fg-muted))]">{loading ? "…" : `${pct}%`}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]">
          <div
            className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width]"
            style={{ width: loading ? "0%" : `${pct}%` }}
          />
        </div>
        <ul className="mt-6 flex flex-col gap-3">
          {milestones.map((m) => (
            <li key={m.title} className="flex items-center gap-3 text-sm">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                style={{
                  background: m.done ? "hsl(var(--accent))" : "hsl(var(--bg-inset))",
                  color: m.done ? "hsl(var(--accent-ink))" : "hsl(var(--fg-muted))",
                }}
              >
                {m.done ? "✓" : ""}
              </span>
              <span className={m.done ? "" : "text-[hsl(var(--fg-muted))]"}>{m.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
