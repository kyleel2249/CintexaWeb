import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateInsightForTab,
  getSpecialistByTab,
  readInsightHistory,
  saveInsightHistory,
  type InsightResult,
} from "@/lib/insights";
import {
  createInsightRun,
  fetchInsightFlags,
  fetchInsightNotifications,
  fetchInsightSignals,
  markInsightNotificationRead,
  submitInsightFeedback,
  type InsightNotification,
  type InsightSignal,
} from "@/lib/insights/server-api";
import { pushLocalNotification, readLocalNotifications, markLocalNotificationRead } from "@/lib/insights/notifications";
import {
  useMyActivity,
  useMyContributions,
  useMyLoyalty,
  useMyProfile,
  useMySubscription,
} from "@/hooks/useApi";
import { InsightVisual } from "@/components/insights/InsightVisual";

function statusLabel(s: InsightResult["status"] | string) {
  switch (s) {
    case "ready": return "Ready";
    case "partial": return "Partial data";
    case "insufficient_data": return "Insufficient data";
    case "error": return "Error";
    default: return String(s);
  }
}

function sourceLabel(src: string) {
  switch (src) {
    case "verified": return "Verified";
    case "calculated": return "Calculated";
    case "estimated": return "Estimated";
    case "missing": return "Missing";
    default: return src;
  }
}

type Props = { tab: string; extraContext?: Record<string, unknown> };

/** Structured [Tab] Insight workspace. Client engine always available; server runs preferred when API works. Does not modify Overview command center. */
export function InsightPanel({ tab, extraContext }: Props) {
  const specialist = getSpecialistByTab(tab);
  const profile = useMyProfile();
  const activity = useMyActivity();
  const contributionsQ = useMyContributions();
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();

  const [result, setResult] = useState<InsightResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [serverRunId, setServerRunId] = useState<string | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [signals, setSignals] = useState<InsightSignal[]>([]);
  const [notifications, setNotifications] = useState<InsightNotification[]>([]);
  const [serverError, setServerError] = useState("");

  const accountId =
    (profile.data?.profile as { id?: string } | null | undefined)?.id ??
    (profile.data as { accountId?: string } | undefined)?.accountId ??
    "local";

  const ctx = useMemo(
    () => ({
      accountId,
      profile: profile.data?.profile
        ? {
            username: (profile.data.profile as { username?: string }).username,
            businessName: (profile.data.profile as { businessName?: string | null }).businessName,
            interests: (profile.data.profile as { interests?: string[] }).interests,
            leaderboardVisible: Boolean((profile.data.profile as { leaderboardVisible?: boolean }).leaderboardVisible),
            avatarId: (profile.data.profile as { avatarId?: string }).avatarId,
            role: (profile.data.profile as { role?: string }).role,
          }
        : null,
      activity: activity.data?.activity as Array<{ eventType?: string; title?: string; createdAt?: string; id?: string }> | undefined,
      contributions: contributionsQ.data?.contributions as Array<{ amount?: string | number; currency?: string; status?: string; createdAt?: string }> | undefined,
      loyaltyBalance: loyalty.data?.balance,
      subscriptionPlan: subscription.data?.subscription?.plan ?? null,
      ...extraContext,
    }),
    [accountId, profile.data, activity.data, contributionsQ.data, loyalty.data, subscription.data, extraContext],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = null;
        const [f, s, n] = await Promise.all([
          fetchInsightFlags(token).catch(() => ({ flags: {} as Record<string, boolean> })),
          fetchInsightSignals(token).catch(() => ({ signals: [] as InsightSignal[] })),
          fetchInsightNotifications(token).catch(() => ({ notifications: [] as InsightNotification[] })),
        ]);
        if (cancelled) return;
        setFlags(f.flags);
        setSignals(s.signals);
        const local = readLocalNotifications();
        setNotifications([
          ...n.notifications,
          ...local.map((l) => ({
            id: l.id, specialistId: l.specialistId, title: l.title, body: l.body,
            href: l.href ?? null, read: l.read, createdAt: l.createdAt,
          })),
        ]);
      } catch { /* offline */ }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const enabled = specialist ? flags[specialist.id] !== false : true;

  const generate = useCallback(async () => {
    if (!specialist) return;
    setGenerating(true);
    setFeedback(null);
    setServerError("");
    try {
      try {
        const server = await createInsightRun(specialist.id, null);
        const report = server.report as InsightResult;
        setResult(report);
        setServerRunId(server.run.id);
        saveInsightHistory(report);
        if (report.keyFindings?.some((f) => f.category === "attention")) {
          pushLocalNotification({
            specialistId: specialist.id,
            title: `${specialist.displayName} attention`,
            body: report.summary.slice(0, 160),
            href: `/dashboard/${tab}`,
          });
        }
        return;
      } catch (e) {
        setServerError(e instanceof Error ? e.message : "Server unavailable — using on-device engine");
      }
      const r = generateInsightForTab(tab, ctx);
      saveInsightHistory(r);
      setResult(r);
      setServerRunId(null);
      if (r.keyFindings.some((f) => f.category === "attention")) {
        pushLocalNotification({
          specialistId: specialist.id,
          title: `${specialist.displayName} attention`,
          body: r.summary.slice(0, 160),
          href: `/dashboard/${tab}`,
        });
      }
    } finally {
      setGenerating(false);
    }
  }, [specialist, tab, ctx]);

  const history = historyOpen ? readInsightHistory(specialist?.id) : [];

  async function onFeedback(useful: boolean) {
    setFeedback(useful ? "yes" : "no");
    if (!specialist) return;
    try {
      await submitInsightFeedback({ specialistId: specialist.id, useful, runId: serverRunId ?? undefined }, null);
    } catch { /* local UI state holds feedback */ }
  }

  if (!specialist || !specialist.enabled) return null;
  if (!enabled) {
    return (
      <section className="mt-10 cx-card" aria-label="Insight disabled">
        <p className="cx-eyebrow">{specialist.displayName}</p>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">This specialist is currently disabled by administration.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-4" aria-label={`${specialist.displayName} workspace`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <p className="cx-eyebrow">{specialist.displayName}</p>
          <h2 className="cx-display mt-1 text-xl sm:text-2xl">{specialist.displayName}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg-muted))]">{specialist.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="cx-btn cx-btn-primary cx-btn-sm" onClick={() => void generate()} disabled={generating}>
            {generating ? "Generating…" : result ? "Refresh Insight" : "Generate Insight"}
          </button>
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? "Hide history" : "Insight history"}
          </button>
        </div>
      </div>

      {notifications.filter((n) => !n.read && n.specialistId === specialist.id).length > 0 && (
        <div className="cx-card space-y-2">
          <p className="cx-eyebrow">Notifications</p>
          {notifications.filter((n) => !n.read && n.specialistId === specialist.id).slice(0, 5).map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-[hsl(var(--fg-muted))]">{n.body}</p>
              </div>
              <button type="button" className="cx-btn cx-btn-ghost cx-btn-sm" onClick={() => {
                markLocalNotificationRead(n.id);
                void markInsightNotificationRead(n.id, null);
                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
              }}>Mark read</button>
            </div>
          ))}
        </div>
      )}

      {signals.length > 0 && (
        <div className="cx-card">
          <p className="cx-eyebrow">Cross-tab signals</p>
          <ul className="mt-2 space-y-1 text-sm text-[hsl(var(--fg-muted))]">
            {signals.slice(0, 5).map((s) => (
              <li key={s.id}><span className="font-medium text-[hsl(var(--fg))]">{s.signalType}</span> from {s.sourceSpecialistId} · {s.severity}</li>
            ))}
          </ul>
        </div>
      )}

      {!result && (
        <div className="cx-card">
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            Generate an Insight report for this area. Findings use authorized account data only — missing sources are disclosed, never invented. Server runs are preferred when the API is available; otherwise the on-device engine is used.
          </p>
          {serverError && <p className="mt-2 text-xs text-[hsl(var(--fg-muted))]">{serverError}</p>}
        </div>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="cx-card space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                <span className="cx-badge">{statusLabel(result.status)}</span>
                <span>{result.confidence === "not_assessed" ? "Confidence not assessed" : `Confidence: ${result.confidence}`}</span>
                <span>Generated {new Date(result.generatedAt).toLocaleString()}</span>
                {serverRunId && <span className="cx-badge">Server run</span>}
              </div>
              <h3 className="cx-display text-lg">Summary</h3>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </div>

            {result.metrics.length > 0 && (
              <div className="cx-card">
                <p className="cx-eyebrow">Key metrics</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.metrics.map((m) => (
                    <div key={m.name} className="rounded-xl border border-[hsl(var(--border))] p-3">
                      <p className="text-xs text-[hsl(var(--fg-muted))]">{m.name}</p>
                      <p className="mt-1 cx-display text-xl">{m.value === null || m.value === undefined ? "—" : String(m.value)}{m.unit ? ` ${m.unit}` : ""}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-[hsl(var(--fg-muted))]">{sourceLabel(m.source)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.keyFindings.length > 0 && (
              <div className="cx-card">
                <p className="cx-eyebrow">Key findings</p>
                <ul className="mt-3 space-y-3">
                  {result.keyFindings.map((f, i) => (
                    <li key={`${f.title}-${i}`} className="border-b border-[hsl(var(--border))] pb-3 last:border-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{f.title}</span>
                        <span className="cx-badge text-[10px]">{f.category}</span>
                      </div>
                      <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{f.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div className="cx-card">
                <p className="cx-eyebrow">Recommended actions</p>
                <ul className="mt-3 space-y-3">
                  {result.recommendations.map((r, i) => (
                    <li key={`${r.title}-${i}`} className="rounded-xl border border-[hsl(var(--border))] p-3">
                      <span className="text-sm font-medium">{r.title}</span>
                      <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{r.description}</p>
                      <p className="mt-2 text-xs text-[hsl(var(--fg-muted))]"><strong>Why:</strong> {r.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.evidence.length > 0 && (
              <div className="cx-card">
                <p className="cx-eyebrow">Evidence</p>
                <ul className="mt-3 space-y-2">
                  {result.evidence.map((e) => (
                    <li key={e.id} className="text-sm">
                      <span className="font-mono text-xs text-[hsl(var(--accent))]">{e.id}</span>
                      <span className="mx-2 text-[hsl(var(--fg-muted))]">·</span>
                      <span>{e.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.limitations.length > 0 && (
              <div className="cx-card">
                <p className="cx-eyebrow">Limitations</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--fg-muted))]">
                  {result.limitations.map((l, i) => (<li key={i}>{l}</li>))}
                </ul>
              </div>
            )}

            <div className="cx-card flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[hsl(var(--fg-muted))]">Was this Insight useful?</p>
              <div className="flex gap-2">
                <button type="button" className={`cx-btn cx-btn-sm ${feedback === "yes" ? "cx-btn-primary" : "cx-btn-secondary"}`} onClick={() => void onFeedback(true)}>Yes</button>
                <button type="button" className={`cx-btn cx-btn-sm ${feedback === "no" ? "cx-btn-primary" : "cx-btn-secondary"}`} onClick={() => void onFeedback(false)}>No</button>
              </div>
            </div>
          </div>

          <div className="cx-card flex flex-col items-center justify-center">
            <p className="cx-eyebrow mb-3 self-start">Visualization</p>
            <InsightVisual result={result} tab={tab} />
            <p className="mt-3 text-center text-[10px] text-[hsl(var(--fg-muted))]">Decorative only — all facts remain in the report. Respects reduced motion.</p>
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="cx-card">
          <p className="cx-eyebrow">Insight history</p>
          {history.length === 0 && <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">No previous reports for this specialist yet.</p>}
          <ul className="mt-3 space-y-3">
            {history.map((h) => (
              <li key={h.id} className="border-b border-[hsl(var(--border))] pb-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                  <span className="cx-badge">{statusLabel(h.status)}</span>
                  <span>{new Date(h.generatedAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm">{h.summary}</p>
                <button type="button" className="cx-btn cx-btn-ghost cx-btn-sm mt-2" onClick={() => setResult(h)}>Open this report</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
