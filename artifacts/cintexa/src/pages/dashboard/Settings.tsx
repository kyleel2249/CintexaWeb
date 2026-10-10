import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@/lib/auth";
import { DashboardShell } from "./DashboardShell";
import { useDeleteMyData, useExportMyData, useMyProfile, useUpdateProfile } from "@/hooks/useApi";
import { AVATAR_OPTIONS } from "@/lib/local-profile";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { useCurrency } from "@/lib/currency/context";
import { COMMON_CURRENCIES, COUNTRY_CURRENCY } from "@/lib/currency/countries";
import { currencyName, regionName } from "@/lib/currency/format";
import { countryFromProfile } from "@/lib/currency/geo";

const SOURCE_LABEL = {
  preference: "your choice below",
  profile: "the country on your profile",
  network: "your current location",
  locale: "your browser language",
  timezone: "your time zone",
  default: "the platform default",
} as const;

export function DashboardSettings() {
  const { user } = useUser();
  const { signOut } = useAuth();
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
  const [country, setCountry] = useState("");
  const { currency, country: detectedCountry, source, preference, setPreference } = useCurrency();
  const countryOptions = useMemo(
    () =>
      Object.keys(COUNTRY_CURRENCY)
        .map((cc) => ({ cc, name: regionName(cc) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const currencyOptions = useMemo(() => {
    const list: string[] = [...COMMON_CURRENCIES];
    if (preference !== "auto" && !list.includes(preference)) list.push(preference);
    return list;
  }, [preference]);

  useEffect(() => {
    const p = profile.data?.profile as
      | ({
          businessName?: string | null;
          username?: string;
          avatarId?: string;
          leaderboardVisible?: boolean;
          country?: string | null;
        } & Record<string, unknown>)
      | null
      | undefined;
    if (p) {
      setBusinessName(p.businessName ?? "");
      setUsername(p.username ?? "");
      setAvatarId(p.avatarId ?? "orbit");
      setLeaderboardVisible(Boolean(p.leaderboardVisible));
      setCountry(countryFromProfile(p.country) ?? "");
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
            <input id="displayName" className="cx-input" value={user?.fullName ?? ""} readOnly disabled />
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
          <section className="cx-card space-y-4" aria-labelledby="region-title">
            <div>
              <h2 id="region-title" className="cx-display text-lg">
                Region &amp; currency
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
                Amounts on your dashboard are shown in your own currency, converted from the currency they were
                recorded in at today’s exchange rate. Currently showing <strong>{currency}</strong>
                {detectedCountry && preference === "auto" ? ` (${regionName(detectedCountry)})` : ""}, based on{" "}
                {SOURCE_LABEL[source]}.
              </p>
            </div>
            <div className="cx-field">
              <label className="cx-label" htmlFor="country">
                Country
              </label>
              <select
                id="country"
                className="cx-input"
                value={country}
                onChange={(e) => {
                  const next = e.target.value;
                  setCountry(next);
                  updateProfile.mutate({ country: next || null });
                }}
              >
                <option value="">Not set — detect automatically</option>
                {countryOptions.map((o) => (
                  <option key={o.cc} value={o.cc}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="cx-field">
              <label className="cx-label" htmlFor="display-currency">
                Display currency
              </label>
              <select
                id="display-currency"
                className="cx-input"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
              >
                <option value="auto">Automatic (match my location)</option>
                {currencyOptions.map((code) => (
                  <option key={code} value={code}>
                    {code} — {currencyName(code)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[hsl(var(--fg-muted))]">
                Only how amounts are displayed changes — your recorded payments stay exactly as paid.
              </p>
            </div>
          </section>

          <section className="cx-card space-y-3">
            <h2 className="cx-display text-lg">Session</h2>
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              You are signed in with your CINTEXA account. Log out on shared devices when you are done.
            </p>
            <button
              type="button"
              className="cx-btn cx-btn-secondary w-fit"
              onClick={() => void signOut().then(() => { window.location.href = "/get-started"; })}
            >
              Log out
            </button>
          </section>

          <section className="cx-card space-y-3">
            <h2 className="cx-display text-lg">Privacy · export & delete</h2>
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

      <InsightPanel tab="settings" />
    </DashboardShell>
  );
}
