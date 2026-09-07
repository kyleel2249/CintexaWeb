import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useApi";

export function DashboardSettings() {
  const { user } = useUser();
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [businessName, setBusinessName] = useState("");
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  useEffect(() => {
    if (profile.data?.profile) {
      setBusinessName(profile.data.profile.businessName ?? "");
      setLeaderboardVisible(profile.data.profile.leaderboardVisible);
    }
  }, [profile.data]);

  return (
    <DashboardShell>
      <form
        className="cx-card flex max-w-md flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile.mutate({
            businessName: businessName || undefined,
            displayName: user?.fullName ?? undefined,
            leaderboardVisible,
          });
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
        <button type="submit" className="cx-btn cx-btn-primary w-fit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </button>
        {updateProfile.isSuccess && <p className="text-sm" style={{ color: "hsl(var(--success))" }}>Saved.</p>}
        {updateProfile.isError && (
          <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>
            Couldn't save — try again.
          </p>
        )}
      </form>
    </DashboardShell>
  );
}
