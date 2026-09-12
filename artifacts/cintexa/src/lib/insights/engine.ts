/**
 * Deterministic Insight engine — evidence-first, zero fabrication.
 * Customer-facing names: "[Tab] Insight" only.
 */
import type { InsightContext, InsightResult, InsightSpecialistConfig } from "./types";
import { getSpecialistByTab } from "./registry";
import { readConnections, readPosts, readFollowing } from "@/lib/social-hub";
import { readStreak, badgeMeta } from "@/lib/streak-badges";
import { currentPlatformFeeRate, ADMIN_USERNAME } from "@/lib/platform-economics";
import { faqForInterests } from "@/lib/interest-faq";

const iso = () => new Date().toISOString();

function base(s: InsightSpecialistConfig, ctx: InsightContext, p: Partial<InsightResult>): InsightResult {
  return {
    id: `insight_${s.id}_${Date.now()}`,
    specialistId: s.id,
    displayName: s.displayName,
    tab: s.tab,
    accountId: ctx.accountId,
    generatedAt: iso(),
    dataAsOf: p.dataAsOf ?? null,
    status: p.status ?? "insufficient_data",
    summary: p.summary ?? "No sufficient account data is available for this report yet.",
    keyFindings: p.keyFindings ?? [],
    recommendations: p.recommendations ?? [],
    alerts: p.alerts ?? [],
    metrics: p.metrics ?? [],
    evidence: p.evidence ?? [],
    limitations: p.limitations ?? [],
    suggestedActions: p.suggestedActions ?? [],
    confidence: p.confidence ?? "not_assessed",
    sourceTypes: p.sourceTypes ?? [],
    specialistVersion: s.version,
  };
}

type Runner = (s: InsightSpecialistConfig, ctx: InsightContext) => InsightResult;

const social: Runner = (s, ctx) => {
  const connections = readConnections();
  const posts = readPosts();
  const following = readFollowing();
  const status = connections.length || posts.length
    ? connections.length && posts.length ? "ready" as const : "partial" as const
    : "insufficient_data" as const;
  return base(s, ctx, {
    status,
    dataAsOf: iso(),
    summary: status === "insufficient_data"
      ? "No sufficient social data is available yet."
      : `Reviewed ${connections.length} connection(s) and ${posts.length} post(s). Live platform metrics require OAuth APIs.`,
    keyFindings: connections.length
      ? [{ title: "Social accounts connected", description: `Your records show ${connections.length} network(s): ${connections.map(c => c.network).join(", ")}.`, category: "positive", severity: "none", evidenceIds: ["s1"] }]
      : [{ title: "No social networks connected", description: "Connect accounts under Social to enable analysis.", category: "attention", severity: "medium", evidenceIds: [] }],
    recommendations: connections.length ? [] : [{ title: "Connect at least one network", description: "Connect Facebook, Instagram, X, LinkedIn, TikTok, or YouTube.", priority: "high", rationale: "Required for Social Insight.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Connected networks", value: connections.length, source: "verified" },
      { name: "Local posts", value: posts.length, source: "verified" },
      { name: "Following", value: following.length, source: "verified" },
    ],
    evidence: connections.length ? [{ id: "s1", sourceType: "verified account data", sourceReference: "cintexa.social.connections", description: connections.map(c => c.network).join(", ") }] : [],
    limitations: ["Live impressions/reach require authorized platform APIs."],
    confidence: status === "ready" ? "medium" : status === "partial" ? "low" : "not_assessed",
    sourceTypes: ["verified account data"],
  });
};

const contributions: Runner = (s, ctx) => {
  const rows = ctx.contributions ?? [];
  const paid = rows.filter(r => r.status === "paid" || r.status === "completed");
  const pending = rows.filter(r => r.status === "pending");
  const sum = paid.reduce((a, r) => a + (Number.parseFloat(r.amount) || 0), 0);
  const cur = paid[0]?.currency ?? rows[0]?.currency ?? "—";
  const status = rows.length === 0 ? "insufficient_data" as const : paid.length ? "ready" as const : "partial" as const;
  return base(s, ctx, {
    status,
    dataAsOf: rows[0]?.createdAt ?? null,
    summary: status === "insufficient_data" ? "No sufficient contribution data is available for this report yet."
      : `Analyzed ${rows.length} record(s): ${paid.length} verified, ${pending.length} pending.`,
    keyFindings: paid.length
      ? [{ title: "Verified contribution activity", description: `${paid.length} verified record(s). Calculated total: ${sum} ${cur}. Pending/failed excluded.`, category: "positive", severity: "none", evidenceIds: ["c1"] }]
      : [{ title: "No verified contributions yet", description: "No paid or completed contribution records.", category: "neutral", severity: "none", evidenceIds: [] }],
    recommendations: paid.length ? [] : [{ title: "Record a contribution when ready", description: "Verified totals appear after completed contributions.", priority: "low", rationale: "No eligible records.", estimatedEffort: "unknown", requiresApproval: false }],
    metrics: [
      { name: "Verified count", value: paid.length, source: "verified" },
      { name: "Verified total", value: paid.length ? sum : null, unit: paid.length ? cur : undefined, source: paid.length ? "calculated" : "missing" },
      { name: "Pending", value: pending.length, source: "verified" },
    ],
    evidence: paid.length ? [{ id: "c1", sourceType: "verified account data", sourceReference: "contributions", description: `${paid.length} completed; total ${sum} ${cur}` }] : [],
    limitations: ["Failed, cancelled, and pending records are excluded from verified totals."],
    confidence: paid.length ? "high" : rows.length ? "medium" : "not_assessed",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const progress: Runner = (s, ctx) => {
  const streak = readStreak();
  const badge = badgeMeta(streak.badgeId);
  const plan = ctx.subscriptionPlan;
  const balance = ctx.loyaltyBalance ?? 0;
  const hasActivity = (ctx.activity?.length ?? 0) > 0;
  const hasContribution = (ctx.activity?.some(a => a.eventType.startsWith("contribution")) ?? false)
    || (ctx.contributions?.some(c => c.status === "paid") ?? false);
  const milestones = [
    { title: "Account created", done: true },
    { title: "First activity recorded", done: hasActivity },
    { title: "First contribution", done: hasContribution },
    { title: "On the Growth plan", done: plan === "growth" || plan === "enterprise" },
    { title: "1,000 loyalty points", done: balance >= 1000 },
  ];
  const done = milestones.filter(m => m.done).length;
  const pct = Math.round((done / milestones.length) * 100);
  const next = milestones.find(m => !m.done);
  return base(s, ctx, {
    status: "ready",
    dataAsOf: iso(),
    summary: `Progress Insight: ${pct}% of core milestones complete. Streak ${streak.consecutiveDays} day(s).`,
    keyFindings: [
      { title: "Growth journey progress", description: `${done} of ${milestones.length} milestones complete (${pct}%).`, category: pct >= 60 ? "positive" : "trend", severity: "none", evidenceIds: ["p1"] },
      { title: "Daily streak status", description: streak.consecutiveDays ? `Streak: ${streak.consecutiveDays} day(s)${badge ? ` · Badge ${badge.label}` : ""}.` : "No active streak. Dashboard visits check you in.", category: streak.consecutiveDays ? "positive" : "opportunity", severity: "none", evidenceIds: ["p2"] },
    ],
    recommendations: next
      ? [{ title: `Next milestone: ${next.title}`, description: `Focus on completing "${next.title}".`, priority: "medium", rationale: "Incomplete milestones.", estimatedEffort: "medium", requiresApproval: false }]
      : [{ title: "All core milestones complete", description: "Consider custom goals when available.", priority: "low", rationale: "All listed milestones done.", estimatedEffort: "unknown", requiresApproval: false }],
    metrics: [
      { name: "Milestone completion", value: pct, unit: "%", source: "calculated" },
      { name: "Daily streak", value: streak.consecutiveDays, unit: "days", source: "verified" },
      { name: "Loyalty balance", value: balance, source: "verified" },
      { name: "Plan", value: plan ?? "unknown", source: plan ? "verified" : "missing" },
    ],
    evidence: [
      { id: "p1", sourceType: "deterministic calculation", sourceReference: "milestones", description: `${done}/${milestones.length}` },
      { id: "p2", sourceType: "verified account data", sourceReference: "cintexa.streak", description: `Streak ${streak.consecutiveDays}` },
    ],
    limitations: ["Custom goals are not yet stored server-side."],
    confidence: "high",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const analytics: Runner = (s, ctx) => {
  const activity = ctx.activity ?? [];
  const paid = (ctx.contributions ?? []).filter(c => c.status === "paid" || c.status === "completed");
  const has = activity.length || paid.length;
  return base(s, ctx, {
    status: has ? "partial" : "insufficient_data",
    dataAsOf: activity[0]?.createdAt ?? null,
    summary: has ? "Summarized authorized account activity. External traffic sources are not connected." : "No sufficient account data is available for this report yet.",
    keyFindings: [has
      ? { title: "Account activity baseline", description: `${activity.length} activity event(s), ${paid.length} verified contribution(s).`, category: "neutral", severity: "none", evidenceIds: [] }
      : { title: "Limited analytics inputs", description: "No activity or contribution history. Demo rates are not verified metrics.", category: "attention", severity: "medium", evidenceIds: [] }],
    recommendations: [{ title: "Connect analytics sources when ready", description: "Link website or campaign analytics for channel analysis.", priority: "medium", rationale: "Platform activity alone cannot explain acquisition.", estimatedEffort: "high", requiresApproval: true }],
    metrics: [
      { name: "Activity events", value: activity.length, source: "verified" },
      { name: "Verified contributions", value: paid.length, source: "verified" },
    ],
    evidence: [],
    limitations: ["Do not treat UI demo numbers as production metrics."],
    confidence: activity.length ? "low" : "not_assessed",
    sourceTypes: ["verified account data"],
  });
};

const pixels: Runner = (s, ctx) => {
  const fb = typeof localStorage !== "undefined" ? localStorage.getItem("cintexa.pixel.fb") ?? "" : "";
  const tt = typeof localStorage !== "undefined" ? localStorage.getItem("cintexa.pixel.tt") ?? "" : "";
  const ok = Boolean(fb || tt);
  return base(s, ctx, {
    status: ok ? "partial" : "insufficient_data",
    dataAsOf: iso(),
    summary: ok ? "Found stored pixel configuration. Event delivery diagnostics are not connected." : "No sufficient pixel configuration is available for this report yet.",
    keyFindings: [ok
      ? { title: "Pixel configuration present", description: `Meta ${fb ? "set" : "missing"}, secondary ${tt ? "set" : "missing"}.`, category: "positive", severity: "none", evidenceIds: [] }
      : { title: "No pixel IDs stored", description: "Save Meta/TikTok pixel IDs in the Pixels tab.", category: "attention", severity: "medium", evidenceIds: [] }],
    recommendations: [{ title: "Save pixel IDs and grant marketing consent", description: "Required before tracking health can be evaluated.", priority: "high", rationale: "No pipeline without IDs and consent.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Meta pixel configured", value: fb ? "yes" : "no", source: "verified" },
      { name: "Secondary pixel configured", value: tt ? "yes" : "no", source: "verified" },
    ],
    evidence: [],
    limitations: ["No live event logs without a connected tracking pipeline."],
    confidence: "low",
    sourceTypes: ["verified account data"],
  });
};

const settings: Runner = (s, ctx) => {
  const p = ctx.profile as { username?: string; businessName?: string; onboardingCompleted?: boolean; leaderboardVisible?: boolean } | null;
  const username = p?.username || ctx.username;
  const checks = [
    { name: "Username set", ok: Boolean(username) },
    { name: "Onboarding completed", ok: Boolean(p?.onboardingCompleted) },
    { name: "Business name", ok: Boolean(p?.businessName) },
    { name: "Leaderboard visibility preference", ok: p?.leaderboardVisible !== undefined },
  ];
  const n = checks.filter(c => c.ok).length;
  return base(s, ctx, {
    status: "ready",
    dataAsOf: iso(),
    summary: `Settings Insight: ${n}/${checks.length} profile configuration checks passed.`,
    keyFindings: checks.map(c => ({ title: c.name, description: c.ok ? "Configured." : "Incomplete — update under Settings.", category: c.ok ? "positive" as const : "attention" as const, severity: c.ok ? "none" as const : "low" as const, evidenceIds: [] })),
    recommendations: checks.filter(c => !c.ok).map(c => ({ title: `Complete: ${c.name}`, description: "Update in Settings. Security changes require identity-provider confirmation.", priority: "medium" as const, rationale: "Profile checklist.", estimatedEffort: "low" as const, requiresApproval: false })),
    metrics: checks.map(c => ({ name: c.name, value: c.ok ? "complete" : "incomplete", source: "verified" as const })),
    evidence: [],
    limitations: ["Password, 2FA, and payment settings are not modified by Settings Insight."],
    confidence: "high",
    sourceTypes: ["verified account data"],
  });
};

const faq: Runner = (s, ctx) => {
  const interests = (ctx.profile as { interests?: string[] } | null)?.interests ?? [];
  const items = faqForInterests(interests);
  return base(s, ctx, {
    status: items.length ? "ready" : "partial",
    dataAsOf: iso(),
    summary: `FAQ Insight prepared ${items.length} topic(s) from interests and approved documentation.`,
    keyFindings: [{ title: "Documentation-backed topics", description: "Includes platform fee percentages, 2FA, data export, and interest-specific guidance.", category: "neutral", severity: "none", evidenceIds: [] }],
    recommendations: [{ title: "Review top FAQ for your interests", description: items[0] ? `Start with: "${items[0].q}"` : "Complete onboarding interests to personalize FAQ.", priority: "low", rationale: "Matched to interests when available.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [{ name: "FAQ topics available", value: items.length, source: "verified" }],
    evidence: [],
    limitations: ["Does not invent policies."],
    confidence: "medium",
    sourceTypes: ["user-provided information", "approved documentation"],
  });
};

const affiliate: Runner = (s, ctx) => {
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  const code = typeof localStorage !== "undefined" ? localStorage.getItem("cintexa.aff") ?? "DEMO01" : "DEMO01";
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: `Referral code CX-${code} available. Live commission ledgers are not connected.`,
    keyFindings: [
      { title: "Referral identity", description: `Code CX-${code}. Linked to @${ADMIN_USERNAME}. Platform fee: ${feePct}%.`, category: "neutral", severity: "none", evidenceIds: [] },
      { title: "Commission data not connected", description: "Approved/pending/paid commissions require the affiliate ledger API. Never treat pending as guaranteed earnings.", category: "attention", severity: "medium", evidenceIds: [] },
    ],
    recommendations: [{ title: "Share referral code transparently", description: "Promote with disclosure. Do not promise income.", priority: "medium", rationale: "Affiliate terms apply.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Platform fee rate", value: `${feePct}%`, source: "calculated" },
      { name: "Approved commissions", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["No live affiliate conversion feed in this deployment."],
    confidence: "low",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const templates: Runner = (s, ctx) => {
  const library = ["Launch email sequence", "Product landing outline", "Affiliate promo kit", "Social pixel checklist"];
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: `${library.length} kits in the library. Usage analytics are not tracked yet.`,
    keyFindings: [{ title: "Template library available", description: `Catalog: ${library.join("; ")}.`, category: "neutral", severity: "none", evidenceIds: [] }],
    recommendations: [{ title: "Start with a kit matching your goal", description: "Affiliate promo kit for referrals; Social pixel checklist before ads.", priority: "medium", rationale: "Library without usage telemetry.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Templates in library", value: library.length, source: "verified" },
      { name: "Usage events", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["Template usage events are not persisted yet."],
    confidence: "low",
    sourceTypes: ["verified account data"],
  });
};

const email: Runner = (s, ctx) => base(s, ctx, {
  status: "insufficient_data",
  summary: "No sufficient email campaign data is available for this report yet.",
  keyFindings: [{ title: "Email campaign metrics unavailable", description: "Delivery/open/click require a connected email provider. Support: support@cintexa.com.", category: "attention", severity: "low", evidenceIds: [] }],
  recommendations: [{ title: "Connect an email provider when ready", description: "Until campaigns exist, Email Insight cannot report engagement.", priority: "medium", rationale: "No campaign data source.", estimatedEffort: "high", requiresApproval: true }],
  metrics: [{ name: "Campaigns", value: null, source: "missing" }],
  evidence: [],
  limitations: ["Open events alone are not proof an email was read."],
  confidence: "not_assessed",
  sourceTypes: [],
});

const payback: Runner = (s, ctx) => {
  const feePct = (currentPlatformFeeRate() * 100).toFixed(0);
  return base(s, ctx, {
    status: "insufficient_data",
    summary: "Payback ledger not implemented. Platform fee rules available as percentages only.",
    keyFindings: [{ title: "Payback data source unavailable", description: `Fee share ${feePct}% with promo rules. No payment status changes by Payback Insight.`, category: "attention", severity: "medium", evidenceIds: [] }],
    recommendations: [{ title: "Use Contributions for verified payment history", description: "Verified totals live under Contributions until a payback ledger is connected.", priority: "medium", rationale: "Avoid mixing fee rules with unfinished records.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Platform fee rate", value: `${feePct}%`, source: "calculated" },
      { name: "Payback records", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["Does not promise returns, issue refunds, or change payment status."],
    confidence: "not_assessed",
    sourceTypes: ["deterministic calculation"],
  });
};

const leaderboard: Runner = (s, ctx) => {
  const visible = Boolean((ctx.profile as { leaderboardVisible?: boolean } | null)?.leaderboardVisible);
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: "Uses approved public ranking columns only. Admin @FREE2026 is never listed.",
    keyFindings: [
      { title: "Public ranking columns", description: "Most referrer, Most creator, Most user of the platform.", category: "neutral", severity: "none", evidenceIds: [] },
      { title: "Visibility preference", description: visible ? "Profile allows public leaderboard visibility." : "Not marked visible (Settings).", category: visible ? "positive" : "opportunity", severity: "none", evidenceIds: [] },
    ],
    recommendations: [{ title: "Improve participation legitimately", description: "Earn rank through real referrals, creation, and usage.", priority: "low", rationale: "Transparent metrics only.", estimatedEffort: "high", requiresApproval: false }],
    metrics: [
      { name: "Leaderboard visible", value: visible ? "yes" : "no", source: "verified" },
      { name: "Personal rank", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["Live personal rank requires the public leaderboard API."],
    confidence: "low",
    sourceTypes: ["verified account data"],
  });
};

const RUNNERS: Record<string, Runner> = {
  social, templates, affiliate, analytics, pixels, email, payback, faq, contributions, progress, leaderboard, settings,
};

export function generateInsightForTab(tab: string, ctx: InsightContext): InsightResult {
  const specialist = getSpecialistByTab(tab);
  if (!specialist) {
    return {
      id: `insight_unknown_${Date.now()}`, specialistId: "unknown", displayName: "Insight", tab,
      accountId: ctx.accountId, generatedAt: iso(), dataAsOf: null, status: "error",
      summary: "No specialist is registered for this tab.", keyFindings: [], recommendations: [],
      alerts: [], metrics: [], evidence: [], limitations: ["Unknown tab"], suggestedActions: [],
      confidence: "not_assessed", sourceTypes: [], specialistVersion: "0",
    };
  }
  const runner = RUNNERS[specialist.id];
  if (!runner) return base(specialist, ctx, { status: "error", summary: `${specialist.displayName} has no runner yet.`, limitations: ["Runner not implemented"] });
  return runner(specialist, ctx);
}

const HISTORY_KEY = "cintexa.insight.history";

export function saveInsightHistory(result: InsightResult) {
  try {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as InsightResult[];
    localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...prev].slice(0, 40)));
  } catch { /* ignore */ }
}

export function readInsightHistory(specialistId?: string): InsightResult[] {
  try {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as InsightResult[];
    return specialistId ? prev.filter(r => r.specialistId === specialistId) : prev;
  } catch { return []; }
}
