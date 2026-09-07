import { DashboardShell } from "./DashboardShell";

const STATS = [
  { label: "Active contributions", value: "12" },
  { label: "Loyalty tier", value: "Growth" },
  { label: "Leaderboard rank", value: "#8" },
];

export function DashboardOverview() {
  return (
    <DashboardShell>
      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="cx-card">
            <p className="cx-eyebrow">{s.label}</p>
            <p className="cx-display mt-2 text-2xl">{s.value}</p>
          </div>
        ))}
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

      <p className="mt-6 text-xs text-[hsl(var(--fg-muted))]">
        Figures above are sample data for layout purposes — not a live account summary yet.
      </p>
    </DashboardShell>
  );
}
