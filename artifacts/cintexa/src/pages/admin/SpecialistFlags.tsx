import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";

const SPECIALISTS = [
  "overview",
  "social",
  "templates",
  "affiliate",
  "analytics",
  "pixels",
  "email",
  "payback",
  "faq",
  "contributions",
  "progress",
  "leaderboard",
  "settings",
] as const;

type FlagRow = { specialistId: string; enabled: boolean; notes?: string | null };

export function SpecialistFlags({ adminKey }: { adminKey: string }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await adminFetch<{ flags: FlagRow[] }>("/admin/insights/flags", adminKey);
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        for (const id of SPECIALISTS) map[id] = true;
        for (const f of data.flags) map[f.specialistId] = f.enabled;
        setFlags(map);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load flags");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  async function toggle(id: string) {
    const next = !flags[id];
    setSaving(id);
    setError("");
    try {
      await adminFetch("/admin/insights/flags", adminKey, {
        method: "PUT",
        body: { specialistId: id, enabled: next },
      });
      setFlags((prev) => ({ ...prev, [id]: next }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="cx-card">
      <p className="cx-eyebrow">Insight specialists</p>
      <h2 className="cx-display mt-1 text-lg">Enable / disable flags</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Server-authoritative. Disabled specialists return 403 on generate. Defaults to enabled when no flag row exists.
      </p>
      {loading && <p className="mt-4 text-sm text-[hsl(var(--fg-muted))]">Loading…</p>}
      {error && (
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--danger))" }}>
          {error}
        </p>
      )}
      <ul className="mt-4 space-y-2">
        {SPECIALISTS.map((id) => (
          <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] px-3 py-2">
            <span className="text-sm font-medium capitalize">{id.replace(/-/g, " ")} Insight</span>
            <button
              type="button"
              className={`cx-btn cx-btn-sm ${flags[id] ? "cx-btn-primary" : "cx-btn-secondary"}`}
              disabled={saving === id || loading}
              onClick={() => toggle(id)}
            >
              {saving === id ? "…" : flags[id] ? "Enabled" : "Disabled"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
