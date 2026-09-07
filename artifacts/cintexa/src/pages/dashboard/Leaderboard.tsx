import { DashboardShell } from "./DashboardShell";
import { useLeaderboard, useMyProfile } from "@/hooks/useApi";

export function DashboardLeaderboard() {
  const { data, isLoading } = useLeaderboard();
  const profile = useMyProfile();
  const rows = data?.leaderboard ?? [];
  const myName = profile.data?.profile?.displayName;

  return (
    <DashboardShell>
      {isLoading && (
        <div className="cx-card !p-0 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-[hsl(var(--border))] px-5 py-3 last:border-0">
              <span className="inline-block h-4 w-2/3 animate-pulse rounded bg-[hsl(var(--bg-inset))]" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <div className="cx-card text-center">
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            No one's opted into the public leaderboard yet — be the first from Settings.
          </p>
        </div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="cx-card !p-0 overflow-hidden">
          {rows.map((r) => (
            <div
              key={r.rank}
              className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-3 last:border-0"
              style={r.name === myName ? { background: "hsl(var(--accent) / 0.08)" } : undefined}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 font-mono text-sm text-[hsl(var(--fg-muted))]">#{r.rank}</span>
                <span className="text-sm font-medium">{r.name}</span>
              </div>
              <span className="text-sm text-[hsl(var(--fg-muted))]">{r.score.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-[hsl(var(--fg-muted))]">
        Visible only to customers who opt in from Settings.
      </p>
    </DashboardShell>
  );
}
