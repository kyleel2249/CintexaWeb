import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { DashboardShell } from "./DashboardShell";

export function DashboardSettings() {
  const { user } = useUser();
  const [businessName, setBusinessName] = useState("");
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <DashboardShell>
      <form
        className="cx-card flex max-w-md flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        <div className="cx-field">
          <label className="cx-label" htmlFor="displayName">Display name</label>
          <input id="displayName" className="cx-input" defaultValue={user?.fullName ?? ""} disabled />
          <p className="text-xs text-[hsl(var(--fg-muted))]">Managed by your account provider.</p>
        </div>
        <div className="cx-field">
          <label className="cx-label" htmlFor="businessName">Business name</label>
          <input
            id="businessName"
            className="cx-input"
            placeholder="Acme Co."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={leaderboardVisible}
            onChange={(e) => setLeaderboardVisible(e.target.checked)}
          />
          Show me on the public leaderboard
        </label>
        <button type="submit" className="cx-btn cx-btn-primary w-fit">
          Save changes
        </button>
        {saved && <p className="text-sm" style={{ color: "hsl(var(--success))" }}>Saved.</p>}
      </form>
    </DashboardShell>
  );
}
