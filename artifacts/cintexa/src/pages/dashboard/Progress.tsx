import { DashboardShell } from "./DashboardShell";

const MILESTONES = [
  { title: "Account created", done: true },
  { title: "First contribution", done: true },
  { title: "Ads Boost activated", done: true },
  { title: "Loyalty tier: Growth", done: true },
  { title: "Loyalty tier: Scale", done: false },
];

export function DashboardProgress() {
  const completed = MILESTONES.filter((m) => m.done).length;
  const pct = Math.round((completed / MILESTONES.length) * 100);

  return (
    <DashboardShell>
      <div className="cx-card">
        <div className="flex items-center justify-between">
          <p className="cx-eyebrow">Growth journey</p>
          <span className="text-sm text-[hsl(var(--fg-muted))]">{pct}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]">
          <div
            className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <ul className="mt-6 flex flex-col gap-3">
          {MILESTONES.map((m) => (
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
