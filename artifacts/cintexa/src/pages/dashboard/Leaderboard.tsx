import { DashboardShell } from "./DashboardShell";

const ROWS = [
  { rank: 1, name: "Amara O.", score: 4820 },
  { rank: 2, name: "Kwesi B.", score: 4390 },
  { rank: 3, name: "Fatima A.", score: 4110 },
  { rank: 8, name: "You", score: 2260, isYou: true },
];

export function DashboardLeaderboard() {
  return (
    <DashboardShell>
      <div className="cx-card !p-0 overflow-hidden">
        {ROWS.map((r) => (
          <div
            key={r.rank}
            className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3 last:border-0"
            style={r.isYou ? { background: "hsl(var(--accent) / 0.08)" } : undefined}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 font-mono text-sm text-[hsl(var(--fg-muted))]">#{r.rank}</span>
              <span className="text-sm font-medium">{r.name}</span>
            </div>
            <span className="text-sm text-[hsl(var(--fg-muted))]">{r.score.toLocaleString()} pts</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[hsl(var(--fg-muted))]">
        Visible only to customers who opt in (`leaderboardVisible` in the customer schema).
      </p>
    </DashboardShell>
  );
}
