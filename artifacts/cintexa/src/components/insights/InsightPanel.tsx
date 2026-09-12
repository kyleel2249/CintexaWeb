import { useCallback, useMemo, useState } from "react";
import {
  generateInsightForTab,
  getSpecialistByTab,
  readInsightHistory,
  saveInsightHistory,
  type InsightResult,
} from "@/lib/insights";
import {
  useMyActivity,
  useMyContributions,
  useMyLoyalty,
  useMyProfile,
  useMySubscription,
} from "@/hooks/useApi";

function statusLabel(s: InsightResult["status"]) {
  switch (s) {
    case "ready":
      return "Ready";
    case "partial":
      return "Partial data";
    case "insufficient_data":
      return "Insufficient data";
    case "error":
      return "Error";
    default:
      return s;
  }
}

function sourceLabel(src: string) {
  switch (src) {
    case "verified":
      return "Verified";
    case "calculated":
      return "Calculated";
    case "estimated":
      return "Estimated";
    case "missing":
      return "Missing";
    default:
      return src;
  }
}

type Props = {
  tab: string;
  extraContext?: Record<string, unknown>;
};

/**
 * Structured [Tab] Insight workspace.
 * Never fabricates metrics. Empty / partial states are explicit.
 */
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
      contributions: contributionsQ.data?.contributions as
        | Array<{ amount?: string | number; currency?: string; status?: string; createdAt?: string }>
        | undefined,
      loyaltyBalance: loyalty.data?.balance,
      subscriptionPlan: subscription.data?.subscription?.plan ?? null,
      ...extraContext,
    }),
    [accountId, profile.data, activity.data, contributionsQ.data, loyalty.data, subscription.data, extraContext],
  );

  const generate = useCallback(() => {
    if (!specialist) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const r = generateInsightForTab(tab, ctx);
      saveInsightHistory(r);
      setResult(r);
    } finally {
      setGenerating(false);
    }
  }, [specialist, tab, ctx]);

  const history = historyOpen ? readInsightHistory(specialist?.id) : [];

  if (!specialist || !specialist.enabled) return null;

  return (
    <section className="mt-10 space-y-4" aria-label={`${specialist.displayName} workspace`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <p className="cx-eyebrow">{specialist.displayName}</p>
          <h2 className="cx-display mt-1 text-xl sm:text-2xl">{specialist.displayName}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[hsl(var(--fg-muted))]">{specialist.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="cx-btn cx-btn-primary cx-btn-sm" onClick={generate} disabled={generating}>
            {generating ? "Generating…" : result ? "Refresh Insight" : "Generate Insight"}
          </button>
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? "Hide history" : "Insight history"}
          </button>
        </div>
      </div>

      {!result && (
        <div className="cx-card">
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            Generate an Insight report for this area. Findings use authorized account data only — missing sources are
            disclosed, never invented.
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="cx-card space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
              <span className="cx-badge">{statusLabel(result.status)}</span>
              <span>
                {result.confidence === "not_assessed" ? "Confidence not assessed" : `Confidence: ${result.confidence}`}
              </span>
              <span>Generated {new Date(result.generatedAt).toLocaleString()}</span>
              {result.dataAsOf && <span>Data as of {new Date(result.dataAsOf).toLocaleString()}</span>}
              {result.periodStart && result.periodEnd && (
                <span>
                  Period {new Date(result.periodStart).toLocaleDateString()} –{" "}
                  {new Date(result.periodEnd).toLocaleDateString()}
                </span>
              )}
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
                    <p className="mt-1 cx-display text-xl">
                      {m.value === null || m.value === undefined ? "—" : String(m.value)}
                      {m.unit ? ` ${m.unit}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[hsl(var(--fg-muted))]">
                      {sourceLabel(m.source)}
                      {m.period ? ` · ${m.period}` : ""}
                    </p>
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
                      {f.severity !== "none" && (
                        <span className="text-[10px] uppercase text-[hsl(var(--fg-muted))]">{f.severity}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{f.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.trends && result.trends.length > 0 && (
            <div className="cx-card">
              <p className="cx-eyebrow">Trends</p>
              <ul className="mt-3 space-y-2">
                {result.trends.map((t, i) => (
                  <li key={`${t.title}-${i}`} className="text-sm">
                    <span className="font-medium">{t.title}</span>
                    <span className="ml-2 text-xs uppercase text-[hsl(var(--fg-muted))]">{t.direction}</span>
                    <p className="mt-1 text-[hsl(var(--fg-muted))]">{t.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.opportunities && result.opportunities.length > 0 && (
            <div className="cx-card">
              <p className="cx-eyebrow">Opportunities</p>
              <ul className="mt-3 space-y-2">
                {result.opportunities.map((o, i) => (
                  <li key={`${o.title}-${i}`} className="text-sm">
                    <span className="font-medium">{o.title}</span>
                    <span className="ml-2 text-xs uppercase text-[hsl(var(--fg-muted))]">{o.priority}</span>
                    <p className="mt-1 text-[hsl(var(--fg-muted))]">{o.description}</p>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{r.title}</span>
                      <span className="cx-badge text-[10px]">{r.priority}</span>
                      {r.requiresApproval && (
                        <span className="text-[10px] uppercase text-[hsl(var(--danger))]">Requires confirmation</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{r.description}</p>
                    <p className="mt-2 text-xs text-[hsl(var(--fg-muted))]">
                      <strong>Why:</strong> {r.rationale}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.alerts.length > 0 && (
            <div className="cx-card">
              <p className="cx-eyebrow">Attention</p>
              <ul className="mt-3 space-y-2">
                {result.alerts.map((a, i) => (
                  <li key={`${a.title}-${i}`} className="text-sm">
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-2 text-xs uppercase text-[hsl(var(--fg-muted))]">{a.severity}</span>
                    <p className="mt-1 text-[hsl(var(--fg-muted))]">{a.description}</p>
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
                    <p className="mt-0.5 text-xs text-[hsl(var(--fg-muted))]">
                      {e.sourceType} · {e.sourceReference}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.limitations.length > 0 && (
            <div className="cx-card">
              <p className="cx-eyebrow">Limitations</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--fg-muted))]">
                {result.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="cx-card flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[hsl(var(--fg-muted))]">Was this Insight useful?</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`cx-btn cx-btn-sm ${feedback === "yes" ? "cx-btn-primary" : "cx-btn-secondary"}`}
                onClick={() => setFeedback("yes")}
              >
                Yes
              </button>
              <button
                type="button"
                className={`cx-btn cx-btn-sm ${feedback === "no" ? "cx-btn-primary" : "cx-btn-secondary"}`}
                onClick={() => setFeedback("no")}
              >
                No
              </button>
            </div>
            {feedback && (
              <p className="w-full text-xs text-[hsl(var(--fg-muted))]">
                Thanks — feedback is stored locally for quality review.
              </p>
            )}
          </div>
        </div>
      )}

      {historyOpen && (
        <div className="cx-card">
          <p className="cx-eyebrow">Insight history</p>
          {history.length === 0 && (
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">No previous reports for this specialist yet.</p>
          )}
          <ul className="mt-3 space-y-3">
            {history.map((h) => (
              <li key={h.id} className="border-b border-[hsl(var(--border))] pb-3 last:border-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
                  <span className="cx-badge">{statusLabel(h.status)}</span>
                  <span>{new Date(h.generatedAt).toLocaleString()}</span>
                  <span>{h.displayName}</span>
                </div>
                <p className="mt-1 text-sm">{h.summary}</p>
                <button type="button" className="cx-btn cx-btn-ghost cx-btn-sm mt-2" onClick={() => setResult(h)}>
                  Open this report
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
