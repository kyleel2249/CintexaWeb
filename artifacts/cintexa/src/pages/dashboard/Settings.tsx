import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { DashboardShell } from "./DashboardShell";
import { useDeleteMyData, useExportMyData, useMyProfile, useUpdateProfile } from "@/hooks/useApi";
import { AVATAR_OPTIONS } from "@/lib/local-profile";
import { clerkAppearance } from "@/lib/clerk-appearance";

export function DashboardSettings() {
  const { user } = useUser();
  const clerk = useClerk();
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();
  const exportData = useExportMyData();
  const deleteData = useDeleteMyData();

  const [businessName, setBusinessName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarId, setAvatarId] = useState("orbit");
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    const p = profile.data?.profile as
      | ({
          businessName?: string | null;
          username?: string;
          avatarId?: string;
          leaderboardVisible?: boolean;
        } & Record<string, unknown>)
      | null
      | undefined;
    if (p) {
      setBusinessName(p.businessName ?? "");
      setUsername(p.username ?? "");
      setAvatarId(p.avatarId ?? "orbit");
      setLeaderboardVisible(Boolean(p.leaderboardVisible));
    }
  }, [profile.data]);

  function validateUsername(value: string) {
    if (!value) return "Username is required to bind your account.";
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(value)) return "3–24 characters: letters, numbers, underscore.";
    return "";
  }

  return (
    <DashboardShell>
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          className="cx-card flex max-w-md flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            const err = validateUsername(username);
            setUsernameError(err);
            if (err) return;
            updateProfile.mutate({
              businessName: businessName || undefined,
              displayName: user?.fullName ?? undefined,
              leaderboardVisible,
              username: username.toLowerCase(),
              avatarId,
            });
          }}
        >
          <h2 className="cx-display text-lg">Profile</h2>
          <div className="cx-field">
            <label className="cx-label" htmlFor="username">
              Username (binds your account)
            </label>
            <input
              id="username"
              className="cx-input"
              placeholder="your_handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            {usernameError ? (
              <p className="text-xs" style={{ color: "hsl(var(--danger))" }}>
                {usernameError}
              </p>
            ) : (
              <p className="text-xs text-[hsl(var(--fg-muted))]">Shown as @{username || "…"} across the portal.</p>
            )}
          </div>

          <div>
            <p className="cx-label mb-2">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  onClick={() => setAvatarId(a.id)}
                  className="h-10 w-10 rounded-xl border-2"
                  style={{
                    background: a.color,
                    borderColor: avatarId === a.id ? "hsl(var(--fg))" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="cx-field">
            <label className="cx-label" htmlFor="displayName">
              Display name
            </label>
            <input id="displayName" className="cx-input" defaultValue={user?.fullName ?? ""} disabled />
            <p className="text-xs text-[hsl(var(--fg-muted))]">Managed by your account provider.</p>
          </div>
          <div className="cx-field">
            <label className="cx-label" htmlFor="businessName">
              Business name
            </label>
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
          {updateProfile.isSuccess && (
            <p className="text-sm" style={{ color: "hsl(var(--success))" }}>
              Saved.
            </p>
          )}
        </form>

        <div className="flex max-w-md flex-col gap-6">
          <section className="cx-card space-y-3">
            <h2 className="cx-display text-lg">Security · two-factor authentication</h2>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              Enable TOTP / 2FA in your account security center. Multi-factor options are managed by your identity provider for this deployment.
            </p>
            <button
              type="button"
              className="cx-btn cx-btn-secondary w-fit"
              onClick={() => clerk.openUserProfile({ appearance: clerkAppearance })}
            >
              Open security settings
            </button>
          </section>

          <section className="cx-card space-y-3">
            <h2 className="cx-display text-lg">Privacy · export &amp; delete</h2>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              Download a copy of your stored profile data, or permanently delete local data and request server deletion.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="cx-btn cx-btn-secondary"
                disabled={exportData.isPending}
                onClick={async () => {
                  const json = await exportData.mutateAsync();
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `cintexa-export-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export my data
              </button>
              <button type="button" className="cx-btn cx-btn-ghost" onClick={() => setDeleteOpen(true)}>
                Delete my data
              </button>
            </div>
          </section>
        </div>
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="cx-card max-w-md space-y-4">
            <h3 id="delete-title" className="cx-display text-xl">
              Delete your data?
            </h3>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              This clears profile data stored on this device and requests deletion on the server when available. This
              cannot be undone from the dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="cx-btn cx-btn-primary"
                style={{ background: "hsl(var(--danger))", color: "#fff" }}
                disabled={deleteData.isPending}
                onClick={async () => {
                  await deleteData.mutateAsync();
                  setDeleteOpen(false);
                  window.location.href = "/";
                }}
              >
                {deleteData.isPending ? "Deleting…" : "Yes, delete my data"}
              </button>
              <button type="button" className="cx-btn cx-btn-secondary" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
