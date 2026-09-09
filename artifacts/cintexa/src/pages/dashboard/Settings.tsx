import { useEffect, useState } from "react";
import { useUser, UserProfile } from "@clerk/clerk-react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";

function CintexaSettingsForm() {
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
      <p className="cx-eyebrow">Platform preferences</p>
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
          {updateProfile.error instanceof ApiError ? updateProfile.error.message : "Couldn't save — try again."}
        </p>
      )}
    </form>
  );
}

export function DashboardSettings() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <CintexaSettingsForm />

        <div>
          <p className="cx-eyebrow mb-3">Account & security</p>
          <p className="mb-4 text-sm text-[hsl(var(--fg-muted))]">
            Username, profile photo, password, and two-factor authentication are all managed here —
            handled by our account provider so your login stays secure.
          </p>
          <div className="cx-card !p-0 overflow-hidden">
            <UserProfile routing="virtual" appearance={{ elements: { rootBox: { width: "100%" }, card: { boxShadow: "none", background: "transparent" } } }} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
