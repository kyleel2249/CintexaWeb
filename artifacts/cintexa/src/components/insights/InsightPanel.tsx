import { useCallback, useMemo, useState } from "react";
import { generateInsightForTab, readInsightHistory, saveInsightHistory } from "@/lib/insights/engine";
import { getSpecialistByTab } from "@/lib/insights/registry";
import type { InsightContext, InsightResult } from "@/lib/insights/types";
import { useMyActivity, useMyContributions, useMyLoyalty, useMyProfile, useMySubscription } from "@/hooks/useApi";

type Props = { tab: string; extraContext?: Partial<InsightContext> };

function statusLabel(s: InsightResult["status"]) {
  if (s === "ready") return "Ready";
  if (s === "partial") return "Partial data";
  if (s === "insufficient_data") return "Insufficient data";
  if (s === "error") return "Error";
  return s;
}

export function InsightPanel({ tab, extraContext }: Props) {
  const specialist = getSpecialistByTab(tab);
  const profile = useMyProfile();
  const activity = useMyActivity();
  const contributionsQ = useMyContributions();
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();
  const [result, setResult] = useState<InsightResult | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const accountId =
    (profile.data?.profile as { userId?: string } | null)?.userId ??
    (profile.data?.profile as { username?: string } | null)?.username ??
    "local";

  const ctx: InsightContext = useMemo(
    () => ({
      accountId,
      username: (profile.data?.profile as { username?: string } | null)?.username,
      profile: (profile.data?.profile as Record<string, unknown> | null) ?? null,
      activity: (activity.data?.activity as InsightContext["activity"]) ?? [],
      contributions:
        extraContext?.contributions ??
        (contributionsQ.data?.contributions as InsightContext["contributions"]) ??
        [],
      loyaltyBalance: loyalty.data?.balance ?? 0,
      subscriptionPlan: subscription.data?.subscription?.plan ?? null,
      ...extraContext,
    }),
    [accountId, profile.data, activity.data, contributionsQ.data, loyalty.data, subscription.data, extraContext],
  );

  const generate = useCallback(() => {
    if (!specialist) return;
    setGenerating(true);
    try {
      const r = generateInsightForTab(tab, ctx);
      saveInsightHistory(r);
      setResult(r);
    } finally {
      setGenerating(false);
    }
  }, [specialist, tab, ctx]);

  const history = historyOpen ? readInsightHistory(specialist?.id) : [];

  if (!specialist) return null;

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
            {generating ? "Generating…" : "Generate Insight"}
          </button>
          <button type="button" className="cx-btn cx-btn-secondary cx-btn-sm" onClick={() => setHistoryOpen((v) => !v)}>
            {historyOpen ? "Hide history" : "Insight history"}
          </button>
        </div>
      </div>

      {!result && (
        <div className="cx-card">
          <p className="text-sm text-[hsl(var(--fg-muted))]">
            Generate an Insight report for this tab. Findings use authorized account data only — missing sources are
            disclosed, never invented.
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="cx-card space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[hsl(var(--fg-muted))]">
              <span className="cx-badge">{statusLabel(result.status)}</span>
              <span>{result.confidence === "not_assessed" ? "Confidence not assessed" : `Confidence: ${result.confidence}`}</span>
              <span>Generated {new Date(result.generatedAt).toLocaleString()}</span>
              {result.dataAsOf && <span>Data as of {new Date(result.dataAsOf).toLocaleString()}</span>}
              <span>v{result.specialistVersion}</span>
            </div>
            <p className="text-sm leading-relaxed">{result.summary}</p>
            {result.limitations.length > 0 && (
              <ul className="list-inside list-disc text-xs text-[hsl(var(--fg-muted))]">
                {result.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </div>

          {result.metrics.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Metrics</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {result.metrics.map((m) => (
                  <div key={m.name} className="cx-card !p-4">
                    <p className="text-xs text-[hsl(var(--fg-muted))]">{m.name}</p>
                    <p className="mt-1 cx-display text-xl">
                      {m.value === null || m.value === undefined ? "—" : String(m.value)}
                      {m.unit ? ` ${m.unit}` : ""}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-[hsl(var(--fg-muted))]">
                      {m.source}{m.period ? ` · ${m.period}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.keyFindings.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Findings</h3>
              <ul className="mt-3 space-y-3">
                {result.keyFindings.map((f) => (
                  <li key={f.title} className="cx-card !p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{f.title}</span>
                      <span className="cx-badge">{f.category}</span>
                    </div>
                    <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{f.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Recommendations</h3>
              <ul className="mt-3 space-y-3">
                {result.recommendations.map((r) => (
                  <li key={r.title} className="cx-card !p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{r.title}</span>
                      <span className="cx-badge">{r.priority} priority</span>
                      {r.requiresApproval && <span className="text-xs text-[hsl(var(--fg-muted))]">Requires approval</span>}
                    </div>
                    <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{r.description}</p>
                    <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">Why: {r.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.evidence.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold">Evidence</h3>
              <ul className="mt-3 space-y-2">
                {result.evidence.map((e) => (
                  <li key={e.id} className="text-xs text-[hsl(var(--fg-muted))]">
                    <strong>{e.sourceType}</strong> — {e.description}
                    {e.sourceReference ? ` (${e.sourceReference})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {historyOpen && (
        <div className="cx-card">
          <h3 className="text-sm font-semibold">Insight history</h3>
          {history.length === 0 ? (
            <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">No prior reports for this specialist on this device.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] py-2 text-sm last:border-0">
                  <span>{new Date(h.generatedAt).toLocaleString()}</span>
                  <span className="text-xs text-[hsl(var(--fg-muted))]">{statusLabel(h.status)}</span>
                  <button type="button" className="cx-btn cx-btn-ghost cx-btn-sm" onClick={() => setResult(h)}>
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
