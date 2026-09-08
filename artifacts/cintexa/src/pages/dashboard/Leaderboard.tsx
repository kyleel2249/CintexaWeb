import { useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile } from "@/hooks/useApi";
import { ADMIN_USERNAME } from "@/lib/platform-economics";
import { demoLeaderboard, readFollowing, toggleFollow } from "@/lib/social-hub";

const COLUMNS = [
  { key: "mostReferrer" as const, title: "Most referrer" },
  { key: "mostCreator" as const, title: "Most creator" },
  { key: "mostUser" as const, title: "Most user of the platform" },
];

export function DashboardLeaderboard() {
  const board = demoLeaderboard();
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

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <div key={col.key} className="cx-card !p-0 overflow-hidden">
            <div className="border-b border-[hsl(var(--border))] px-4 py-3">
              <h3 className="text-sm font-semibold">{col.title}</h3>
            </div>
            <ul>
              {board[col.key]
                .filter((r) => r.username.toUpperCase() !== ADMIN_USERNAME)
                .map((r, i) => {
                  const isSelf = self && r.username === self;
                  const isFollowing = following.some((f) => f.username === r.username);
                  return (
                    <li
                      key={r.username}
                      className="flex items-center justify-between gap-2 border-b border-[hsl(var(--border))] px-4 py-3 last:border-0"
                      style={isSelf ? { background: "hsl(var(--accent) / 0.08)" } : undefined}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          #{i + 1} @{r.username}
                        </p>
                        <p className="text-xs text-[hsl(var(--fg-muted))]">{r.score.toLocaleString()} pts</p>
                      </div>
                      {!isSelf && (
                        <button
                          type="button"
                          className={`cx-btn cx-btn-sm ${isFollowing ? "cx-btn-secondary" : "cx-btn-primary"}`}
                          onClick={() => onFollow(r.username)}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
