import { useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useLeaderboard, useMyProfile } from "@/hooks/useApi";
import { ADMIN_USERNAME } from "@/lib/platform-economics";
import { readFollowing, toggleFollow } from "@/lib/social-hub";

const COLUMNS = [
  { key: "mostReferrer" as const, title: "Most referrer" },
  { key: "mostCreator" as const, title: "Most creator" },
  { key: "mostUser" as const, title: "Most user of the platform" },
];

export function DashboardLeaderboard() {
  const board = useLeaderboard();
  const profile = useMyProfile();
  const self = (profile.data?.profile as { username?: string } | null)?.username;
  const [following, setFollowing] = useState(() => readFollowing());

  function onFollow(username: string) {
    if (username.toUpperCase() === ADMIN_USERNAME) return;
    setFollowing(toggleFollow(username));
  }

  return (
    <DashboardShell>
      <h2 className="cx-display text-xl">Leaderboard</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Rankings by referrals, creators, and platform usage. Admin account @{ADMIN_USERNAME} is never listed.
      </p>

      {board.isLoading && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.key} className="cx-card !p-0 overflow-hidden">
              <div className="border-b border-[hsl(var(--border))] px-4 py-3">
                <span className="inline-block h-4 w-2/3 animate-pulse rounded bg-[hsl(var(--bg-inset))]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {board.data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const rows = board.data[col.key];
            return (
              <div key={col.key} className="cx-card !p-0 overflow-hidden">
                <div className="border-b border-[hsl(var(--border))] px-4 py-3">
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                </div>
                {rows.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-[hsl(var(--fg-muted))]">No rankings yet.</p>
                )}
                <ul>
                  {rows.map((r) => {
                    const isSelf = self && r.name === self;
                    const isFollowing = following.some((f) => f.username === r.name);
                    return (
                      <li
                        key={r.name}
                        className="flex items-center justify-between gap-2 border-b border-[hsl(var(--border))] px-4 py-3 last:border-0"
                        style={isSelf ? { background: "hsl(var(--accent) / 0.08)" } : undefined}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            #{r.rank} @{r.name}
                          </p>
                          <p className="text-xs text-[hsl(var(--fg-muted))]">{r.score.toLocaleString()} pts</p>
                        </div>
                        {!isSelf && (
                          <button
                            type="button"
                            className={`cx-btn cx-btn-sm ${isFollowing ? "cx-btn-secondary" : "cx-btn-primary"}`}
                            onClick={() => onFollow(r.name)}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
