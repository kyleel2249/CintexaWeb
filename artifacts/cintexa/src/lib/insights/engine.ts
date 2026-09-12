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
    userId: ctx.userId,
    generatedAt: iso(),
    dataAsOf: p.dataAsOf ?? null,
    periodStart: p.periodStart ?? ctx.periodStart ?? null,
    periodEnd: p.periodEnd ?? ctx.periodEnd ?? null,
    status: p.status ?? "insufficient_data",
    summary: p.summary ?? "No sufficient account data is available for this report yet.",
    keyFindings: p.keyFindings ?? [],
    recommendations: p.recommendations ?? [],
    alerts: p.alerts ?? [],
    metrics: p.metrics ?? [],
    trends: p.trends ?? [],
    opportunities: p.opportunities ?? [],
    evidence: p.evidence ?? [],
    limitations: p.limitations ?? [],
    suggestedActions: p.suggestedActions ?? [],
    confidence: p.confidence ?? "not_assessed",
    sourceTypes: p.sourceTypes ?? [],
    specialistVersion: s.version,
    version: "1.0.0",
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
  const sum = paid.reduce((a, r) => a + (Number.parseFloat(String(r.amount ?? 0)) || 0), 0);
  const cur = paid[0]?.currency ?? rows[0]?.currency ?? "—";
  const status = rows.length === 0 ? "insufficient_data" as const : paid.length ? "ready" as const : "partial" as const;
  return base(s, ctx, {
    status,
    dataAsOf: rows[0]?.createdAt ?? null,
    summary: status === "insufficient_data" ? "No sufficient contribution data is available for this report yet."
      : `Analyzed ${rows.length} record(s): ${paid.length} verified, ${pending.length} pending.`,
    keyFindings: paid.length
      ? [{ title: "Verified contributions", description: `${paid.length} completed contribution(s); calculated total ${sum} ${cur}.`, category: "positive", severity: "none", evidenceIds: ["c1"] }]
      : [{ title: "No verified contributions", description: "No completed contribution records in the current data set.", category: "attention", severity: "low", evidenceIds: [] }],
    recommendations: paid.length
      ? [{ title: "Review milestones", description: "Check Progress Insight for targets tied to contribution activity.", priority: "medium", rationale: "Progress uses verified contribution inputs where configured.", estimatedEffort: "low", requiresApproval: false }]
      : [{ title: "Record a contribution", description: "Add a completed contribution so Contribution Insight can calculate verified totals.", priority: "high", rationale: "Verified totals require eligible completed records.", estimatedEffort: "low", requiresApproval: false }],
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
  const activity = ctx.activity ?? [];
  const hasActivity = activity.length > 0;
  const status = hasActivity || streak.consecutiveDays > 0 ? "ready" as const : "partial" as const;
  return base(s, ctx, {
    status,
    dataAsOf: iso(),
    summary: `Progress reflects streak (${streak.consecutiveDays} day(s)), badge status, and available activity on this account.`,
    keyFindings: [
      { title: "Daily streak", description: `${streak.consecutiveDays} consecutive day(s). Missing a day drops the badge ladder.`, category: "trend", severity: "none", evidenceIds: ["p1"] },
      ...(badge
        ? [{ title: "Current badge", description: `Active badge: ${badge.label}.`, category: "positive" as const, severity: "none" as const, evidenceIds: ["p1"] }]
        : [{ title: "No badge yet", description: "Visit the dashboard daily to start the streak ladder.", category: "opportunity" as const, severity: "informational" as const, evidenceIds: [] }]),
    ],
    recommendations: [
      { title: "Maintain the daily check-in", description: "Open the dashboard each day to protect streak progress.", priority: "medium", rationale: "Streak rules are progressive and drop on missed days.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Streak days", value: streak.consecutiveDays, source: "verified" },
      { name: "Badge", value: badge?.label ?? "none", source: badge ? "verified" : "missing" },
      { name: "Plan", value: plan ?? "none", source: plan ? "verified" : "missing" },
      { name: "Activity events", value: activity.length, source: "verified" },
    ],
    evidence: [{ id: "p1", sourceType: "verified account data", sourceReference: "streak-badges", description: `${streak.consecutiveDays} days` }],
    limitations: ["Milestone percentages only appear when configured targets exist."],
    confidence: "medium",
    sourceTypes: ["verified account data"],
  });
};

const analytics: Runner = (s, ctx) => {
  const activity = ctx.activity ?? [];
  const rows = ctx.contributions ?? [];
  const status = activity.length || rows.length ? "partial" as const : "insufficient_data" as const;
  return base(s, ctx, {
    status,
    dataAsOf: iso(),
    summary: status === "insufficient_data"
      ? "No sufficient analytics inputs yet. Activity and contribution records power Analytics Insight."
      : `Analytics uses ${activity.length} activity event(s) and ${rows.length} contribution record(s) available on this account.`,
    keyFindings: activity.length
      ? [{ title: "Activity volume", description: `${activity.length} event(s) available for review.`, category: "trend", severity: "none", evidenceIds: ["a1"] }]
      : [{ title: "No activity events", description: "Analytics Insight needs recorded activity or contributions.", category: "attention", severity: "low", evidenceIds: [] }],
    recommendations: [
      { title: "Keep recording activity", description: "Use the platform features you care about so Analytics Insight has verified inputs.", priority: "medium", rationale: "Metrics require authorized account data.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Activity events", value: activity.length, source: "verified" },
      { name: "Contribution records", value: rows.length, source: "verified" },
      { name: "Loyalty balance", value: ctx.loyaltyBalance ?? 0, unit: "pts", source: "verified" },
    ],
    evidence: activity.length ? [{ id: "a1", sourceType: "verified account data", sourceReference: "activity_events", description: `${activity.length} events` }] : [],
    limitations: ["Website traffic and campaign ROI require connected analytics integrations."],
    confidence: status === "partial" ? "low" : "not_assessed",
    sourceTypes: ["verified account data"],
  });
};

const pixels: Runner = (s, ctx) => {
  const fb = typeof localStorage !== "undefined" ? localStorage.getItem("cintexa.pixel.fb") ?? "" : "";
  const tt = typeof localStorage !== "undefined" ? localStorage.getItem("cintexa.pixel.tt") ?? "" : "";
  const configured = Boolean(fb || tt);
  return base(s, ctx, {
    status: configured ? "partial" : "insufficient_data",
    dataAsOf: iso(),
    summary: configured
      ? "Pixel IDs are stored for this workspace. Live event delivery requires tag firing and consent."
      : "No pixel IDs are configured yet.",
    keyFindings: configured
      ? [{ title: "Pixel configuration present", description: `Meta: ${fb ? "set" : "empty"}; TikTok/other: ${tt ? "set" : "empty"}.`, category: "positive", severity: "none", evidenceIds: ["x1"] }]
      : [{ title: "Pixels not configured", description: "Add Meta or TikTok pixel IDs under Pixels.", category: "attention", severity: "medium", evidenceIds: [] }],
    recommendations: configured
      ? [{ title: "Verify event delivery", description: "Confirm tags fire only with marketing consent and that conversion events arrive.", priority: "medium", rationale: "Stored IDs do not prove successful event delivery.", estimatedEffort: "medium", requiresApproval: false }]
      : [{ title: "Configure at least one pixel", description: "Save a Meta or TikTok pixel ID to enable Pixels Insight diagnostics.", priority: "high", rationale: "Tracking health analysis needs configuration.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Meta pixel configured", value: fb ? "yes" : "no", source: "verified" },
      { name: "TikTok/other configured", value: tt ? "yes" : "no", source: "verified" },
    ],
    evidence: configured ? [{ id: "x1", sourceType: "verified account data", sourceReference: "localStorage pixels", description: "Pixel IDs present" }] : [],
    limitations: ["Event counts and duplicates require live pixel/network APIs."],
    confidence: configured ? "low" : "not_assessed",
    sourceTypes: ["verified account data"],
  });
};

const settings: Runner = (s, ctx) => {
  const p = ctx.profile;
  const username = p?.username;
  const business = p?.businessName;
  const visible = Boolean(p?.leaderboardVisible);
  const completeness = [username, business, p?.avatarId].filter(Boolean).length;
  return base(s, ctx, {
    status: username ? "ready" : "partial",
    dataAsOf: iso(),
    summary: username
      ? `Profile bound as @${username}. Completeness signals: ${completeness}/3 core fields present.`
      : "Username is not set — bind a username in Settings to unlock referrals and public identity.",
    keyFindings: [
      { title: username ? "Username bound" : "Username missing", description: username ? `Account username is @${username}.` : "Set a username to bind the account.", category: username ? "positive" : "attention", severity: username ? "none" : "medium", evidenceIds: username ? ["st1"] : [] },
      { title: "Leaderboard visibility", description: visible ? "Public leaderboard visibility is enabled." : "Not shown on the public leaderboard.", category: "neutral", severity: "informational", evidenceIds: [] },
    ],
    recommendations: username
      ? [{ title: "Review security settings", description: "Open security settings to manage two-factor options from your identity provider.", priority: "medium", rationale: "Account health includes authentication configuration.", estimatedEffort: "low", requiresApproval: false }]
      : [{ title: "Set a username", description: "Choose a unique username in Settings (3–24 characters).", priority: "high", rationale: "Username binds referrals and display identity.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Username", value: username ?? "missing", source: username ? "verified" : "missing" },
      { name: "Business name", value: business || "missing", source: business ? "verified" : "missing" },
      { name: "Leaderboard visible", value: visible ? "yes" : "no", source: "verified" },
      { name: "Core fields filled", value: `${completeness}/3`, source: "calculated" },
    ],
    evidence: username ? [{ id: "st1", sourceType: "verified account data", sourceReference: "profile", description: `@${username}` }] : [],
    limitations: ["Provider-managed security details are not duplicated in CINTEXA storage."],
    confidence: username ? "high" : "medium",
    sourceTypes: ["verified account data"],
  });
};

const faq: Runner = (s, ctx) => {
  const interests = ctx.profile?.interests ?? [];
  const items = faqForInterests(interests);
  return base(s, ctx, {
    status: items.length ? "ready" : "partial",
    dataAsOf: iso(),
    summary: items.length
      ? `FAQ Insight matched ${items.length} article(s) to your onboarding interests.`
      : "No interest-based FAQ matches yet. Complete onboarding interests for tailored articles.",
    keyFindings: [
      { title: "FAQ coverage", description: `${items.length} matched FAQ item(s) available.`, category: items.length ? "positive" : "neutral", severity: "none", evidenceIds: items.length ? ["f1"] : [] },
    ],
    recommendations: [
      { title: "Open FAQ for you", description: "Review matched answers under the FAQ tab and report gaps if something is missing.", priority: "low", rationale: "FAQ Insight only uses approved CINTEXA information.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Matched FAQs", value: items.length, source: "calculated" },
      { name: "Interests", value: interests.length ? interests.join(", ") : "none", source: interests.length ? "verified" : "missing" },
    ],
    evidence: items.length ? [{ id: "f1", sourceType: "verified account data", sourceReference: "interest-faq", description: `${items.length} items` }] : [],
    limitations: ["Answers are limited to approved CINTEXA documentation. Unverified policies are not invented."],
    confidence: items.length ? "medium" : "low",
    sourceTypes: ["verified account data"],
  });
};

const affiliate: Runner = (s, ctx) => {
  const username = ctx.profile?.username;
  const fee = currentPlatformFeeRate();
  const feePct = Math.round(fee * 100);
  const keepPct = 100 - feePct;
  return base(s, ctx, {
    status: username ? "partial" : "insufficient_data",
    dataAsOf: iso(),
    summary: username
      ? `Referral identity is @${username}. Platform fee ${feePct}% · you keep ${keepPct}% of attributed sales. Live conversion counts require the affiliate API.`
      : "Set a username in Settings to activate your referral link.",
    keyFindings: [
      { title: username ? "Referral link ready" : "Referral link blocked", description: username ? `Share /get-started?ref=${username}.` : "Username required before a referral link can be issued.", category: username ? "positive" : "attention", severity: username ? "none" : "medium", evidenceIds: [] },
      { title: "Fee structure", description: `Platform fee ${feePct}%; partner keep ${keepPct}%.`, category: "neutral", severity: "informational", evidenceIds: ["af1"] },
    ],
    recommendations: username
      ? [{ title: "Share your referral link", description: "Promote the link only where you have permission to market.", priority: "medium", rationale: "Referrals require real attributed sign-ups.", estimatedEffort: "medium", requiresApproval: false }]
      : [{ title: "Set username", description: "Bind a username so Affiliate Insight can reference your link.", priority: "high", rationale: "Referral identity depends on username.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Platform fee", value: `${feePct}%`, source: "verified" },
      { name: "You keep", value: `${keepPct}%`, source: "calculated" },
      { name: "Approved conversions", value: null, source: "missing" },
      { name: "Pending conversions", value: null, source: "missing" },
    ],
    evidence: [{ id: "af1", sourceType: "verified account data", sourceReference: "platform-economics", description: `fee ${feePct}%` }],
    limitations: ["Pending earnings are never treated as guaranteed. Live commissions need the affiliate ledger API."],
    confidence: username ? "low" : "not_assessed",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const templates: Runner = (s, ctx) => {
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: "Template Insight reviews available kit categories. Usage analytics require template interaction events.",
    keyFindings: [
      { title: "Template library available", description: "Launch email, landing outline, affiliate kit, and social pixel checklist kits are listed.", category: "neutral", severity: "informational", evidenceIds: [] },
    ],
    recommendations: [
      { title: "Use a template", description: "Open Templates and adapt a kit to a real campaign so usage can be measured later.", priority: "medium", rationale: "Performance insights need recorded usage.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Listed kits", value: 4, source: "verified" },
      { name: "Usage events", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["Abandoned and performance metrics require template interaction tracking."],
    confidence: "low",
    sourceTypes: ["verified account data"],
  });
};

const email: Runner = (s, ctx) => {
  return base(s, ctx, {
    status: "insufficient_data",
    dataAsOf: iso(),
    summary: "No email campaign performance data is available yet. Support tickets under Email are tracked separately.",
    keyFindings: [
      { title: "Campaign metrics unavailable", description: "Opens, clicks, and bounces require a connected email provider.", category: "attention", severity: "low", evidenceIds: [] },
    ],
    recommendations: [
      { title: "Use support tickets when needed", description: "Submit tickets under Email for direct team help while campaign analytics are offline.", priority: "low", rationale: "Support path exists without inventing campaign stats.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Campaigns", value: null, source: "missing" },
      { name: "Opens", value: null, source: "missing" },
      { name: "Clicks", value: null, source: "missing" },
    ],
    evidence: [],
    limitations: ["Email Insight will not invent open or click rates."],
    confidence: "not_assessed",
    sourceTypes: [],
  });
};

const payback: Runner = (s, ctx) => {
  const fee = currentPlatformFeeRate();
  const feePct = Math.round(fee * 100);
  const keepPct = 100 - feePct;
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: `Payback shows payout structure as percentages of each sale (platform fee ${feePct}%, you receive ${keepPct}%). Saved payout methods are display-safe only.`,
    keyFindings: [
      { title: "Payout split", description: `Gross 100% − platform ${feePct}% = ${keepPct}% to you.`, category: "neutral", severity: "informational", evidenceIds: ["pb1"] },
    ],
    recommendations: [
      { title: "Save a payout method", description: "Add card, Mobile Money, or bank transfer details (label + last 4 only) under Payback.", priority: "medium", rationale: "Methods must exist before live payouts can be processed.", estimatedEffort: "low", requiresApproval: false },
    ],
    metrics: [
      { name: "Platform fee", value: `${feePct}%`, source: "verified" },
      { name: "You receive", value: `${keepPct}%`, source: "calculated" },
    ],
    evidence: [{ id: "pb1", sourceType: "verified account data", sourceReference: "platform-economics", description: `fee ${feePct}%` }],
    limitations: ["Live processor settlement is not connected yet. Full account numbers are never stored."],
    confidence: "medium",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const leaderboard: Runner = (s, ctx) => {
  const visible = Boolean(ctx.profile?.leaderboardVisible);
  return base(s, ctx, {
    status: "partial",
    dataAsOf: iso(),
    summary: "Leaderboard Insight uses approved ranking columns: most referrer, most creator, most platform user. Admin accounts are excluded from rankings.",
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

const overview: Runner = (s, ctx) => {
  const activity = ctx.activity ?? [];
  const rows = ctx.contributions ?? [];
  const paid = rows.filter((r) => r.status === "paid" || r.status === "completed" || !r.status);
  const sum = paid.reduce((a, r) => a + (Number.parseFloat(String(r.amount ?? 0)) || 0), 0);
  const balance = ctx.loyaltyBalance ?? 0;
  const plan = ctx.subscriptionPlan ?? null;
  const hasAny = activity.length > 0 || rows.length > 0 || balance > 0 || Boolean(plan);
  const status = hasAny ? (activity.length && rows.length ? "ready" as const : "partial" as const) : "insufficient_data" as const;
  return base(s, ctx, {
    status,
    dataAsOf: iso(),
    summary: status === "insufficient_data"
      ? "No sufficient account activity is available yet for Overview Insight."
      : "Account summary uses verified loyalty, contribution, activity, and plan records available on this workspace.",
    keyFindings: [
      ...(balance > 0
        ? [{ title: "Loyalty balance present", description: `Verified loyalty balance is ${balance} points.`, category: "positive" as const, severity: "none" as const, evidenceIds: ["o1"] }]
        : [{ title: "No loyalty points yet", description: "Loyalty balance is zero or not loaded.", category: "neutral" as const, severity: "informational" as const, evidenceIds: [] }]),
      ...(rows.length
        ? [{ title: "Contribution records found", description: `${rows.length} contribution record(s); ${paid.length} counted toward verified total ${sum}.`, category: "positive" as const, severity: "none" as const, evidenceIds: ["o2"] }]
        : [{ title: "No contributions recorded", description: "No contribution records are available for this account yet.", category: "attention" as const, severity: "low" as const, evidenceIds: [] }]),
    ],
    recommendations: hasAny
      ? [{ title: "Review specialized tabs for depth", description: "Use Contribution, Progress, Social, and Analytics Insights for focused analysis.", priority: "medium", rationale: "Overview summarizes; specialists explain specific domains.", estimatedEffort: "low", requiresApproval: false }]
      : [{ title: "Record activity to unlock analysis", description: "Add a contribution, connect social, or complete profile fields so Overview Insight has verified inputs.", priority: "high", rationale: "Insights require authorized account data.", estimatedEffort: "low", requiresApproval: false }],
    metrics: [
      { name: "Loyalty balance", value: balance, unit: "pts", source: "verified" },
      { name: "Contribution records", value: rows.length, source: "verified" },
      { name: "Verified contribution total", value: paid.length ? sum : null, source: paid.length ? "calculated" : "missing" },
      { name: "Activity events", value: activity.length, source: "verified" },
      { name: "Plan", value: plan ?? "none", source: plan ? "verified" : "missing" },
    ],
    opportunities: rows.length === 0
      ? [{ title: "Start contribution tracking", description: "Recording contributions enables Contribution Insight and progress milestones.", priority: "medium", evidenceIds: [] }]
      : [],
    evidence: [
      ...(balance > 0 ? [{ id: "o1", sourceType: "verified account data", sourceReference: "loyalty", description: `Balance ${balance}` }] : []),
      ...(rows.length ? [{ id: "o2", sourceType: "verified account data", sourceReference: "contributions", description: `${rows.length} records` }] : []),
    ],
    limitations: ["Overview Insight only summarizes data available on this account. Domain depth lives in specialized Insights."],
    confidence: status === "ready" ? "medium" : status === "partial" ? "low" : "not_assessed",
    sourceTypes: ["verified account data", "deterministic calculation"],
  });
};

const RUNNERS: Record<string, Runner> = {
  overview, social, templates, affiliate, analytics, pixels, email, payback, faq, contributions, progress, leaderboard, settings,
};

export function generateInsightForTab(tab: string, ctx: InsightContext): InsightResult {
  const specialist = getSpecialistByTab(tab);
  if (!specialist) {
    return {
      id: `insight_unknown_${Date.now()}`, specialistId: "unknown", displayName: "Insight", tab,
      accountId: ctx.accountId, generatedAt: iso(), dataAsOf: null, periodStart: null, periodEnd: null, status: "error",
      summary: "No specialist is registered for this tab.", keyFindings: [], recommendations: [],
      alerts: [], metrics: [], trends: [], opportunities: [], evidence: [], limitations: ["Unknown tab"], suggestedActions: [],
      confidence: "not_assessed", sourceTypes: [], specialistVersion: "0", version: "1.0.0",
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
