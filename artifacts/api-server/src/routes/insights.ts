import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  insightRunsTable,
  insightSignalsTable,
  insightNotificationsTable,
  insightFeedbackTable,
  insightSpecialistFlagsTable,
  contributionsTable,
  activityEventsTable,
  customerProfilesTable,
  loyaltyLedgerTable,
  subscriptionsTable,
} from "@cintexa/db";

export const insightsRouter = Router();

const SPECIALIST_IDS = [
  "overview", "social", "templates", "affiliate", "analytics", "pixels", "email",
  "payback", "faq", "contributions", "progress", "leaderboard", "settings",
] as const;

type SpecialistId = (typeof SPECIALIST_IDS)[number];

const DISPLAY: Record<string, string> = {
  overview: "Overview Insight", social: "Social Insight", templates: "Template Insight",
  affiliate: "Affiliate Insight", analytics: "Analytics Insight", pixels: "Pixels Insight",
  email: "Email Insight", payback: "Payback Insight", faq: "FAQ Insight",
  contributions: "Contribution Insight", progress: "Progress Insight",
  leaderboard: "Leaderboard Insight", settings: "Settings Insight",
};

async function isSpecialistEnabled(id: string): Promise<boolean> {
  const [row] = await db.select().from(insightSpecialistFlagsTable).where(eq(insightSpecialistFlagsTable.specialistId, id));
  if (!row) return true;
  return row.enabled;
}

async function loadAccountContext(userId: string) {
  const [profile] = await db.select().from(customerProfilesTable).where(eq(customerProfilesTable.userId, userId));
  const contributions = await db.select().from(contributionsTable).where(eq(contributionsTable.userId, userId)).orderBy(desc(contributionsTable.createdAt)).limit(100);
  const activity = await db.select().from(activityEventsTable).where(eq(activityEventsTable.userId, userId)).orderBy(desc(activityEventsTable.createdAt)).limit(50);
  const [loyalty] = await db.select({ balance: sql<number>`coalesce(sum(${loyaltyLedgerTable.delta}), 0)::int` }).from(loyaltyLedgerTable).where(eq(loyaltyLedgerTable.userId, userId));
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId));
  const signals = await db.select().from(insightSignalsTable).where(and(eq(insightSignalsTable.userId, userId), eq(insightSignalsTable.consumed, false))).orderBy(desc(insightSignalsTable.createdAt)).limit(20);
  return { profile, contributions, activity, loyaltyBalance: loyalty?.balance ?? 0, plan: sub?.plan ?? null, signals };
}

function buildReport(specialistId: SpecialistId, userId: string, ctx: Awaited<ReturnType<typeof loadAccountContext>>) {
  const displayName = DISPLAY[specialistId] ?? `${specialistId} Insight`;
  const paid = ctx.contributions.filter((c) => c.status === "completed" || c.status === "paid");
  const pending = ctx.contributions.filter((c) => c.status === "pending");
  const sum = paid.reduce((a, c) => a + (Number.parseFloat(String(c.amount)) || 0), 0);
  const currency = paid[0]?.currency ?? ctx.contributions[0]?.currency ?? "—";
  const now = new Date().toISOString();

  const base: Record<string, unknown> = {
    id: `server_${specialistId}_${Date.now()}`,
    specialistId,
    displayName,
    tab: specialistId === "contributions" ? "contributions" : specialistId,
    accountId: userId,
    generatedAt: now,
    dataAsOf: now,
    periodStart: null,
    periodEnd: null,
    status: "ready",
    summary: "",
    keyFindings: [] as Array<Record<string, unknown>>,
    recommendations: [] as Array<Record<string, unknown>>,
    alerts: [],
    metrics: [] as Array<Record<string, unknown>>,
    trends: [],
    opportunities: [] as Array<Record<string, unknown>>,
    evidence: [] as Array<Record<string, unknown>>,
    limitations: [] as string[],
    suggestedActions: [],
    confidence: "not_assessed",
    sourceTypes: ["verified account data", "server calculation"],
    specialistVersion: "1.0.0",
    version: "1.0.0",
    crossTabSignals: ctx.signals.map((s) => ({
      id: s.id, type: s.signalType, source: s.sourceSpecialistId, severity: s.severity, payload: s.payload,
    })),
  };

  const findings = base.keyFindings as Array<Record<string, unknown>>;
  const metrics = base.metrics as Array<Record<string, unknown>>;
  const evidence = base.evidence as Array<Record<string, unknown>>;
  const recommendations = base.recommendations as Array<Record<string, unknown>>;
  const limitations = base.limitations as string[];

  if (specialistId === "contributions" || specialistId === "overview" || specialistId === "analytics") {
    metrics.push(
      { name: "Verified contributions", value: paid.length, source: "verified" },
      { name: "Verified total", value: paid.length ? sum : null, unit: currency, source: paid.length ? "calculated" : "missing" },
      { name: "Pending", value: pending.length, source: "verified" },
      { name: "Loyalty balance", value: ctx.loyaltyBalance, unit: "pts", source: "verified" },
      { name: "Activity events", value: ctx.activity.length, source: "verified" },
    );
    if (paid.length) {
      evidence.push({ id: "srv-c1", sourceType: "verified account data", sourceReference: "contributions", description: `${paid.length} completed; total ${sum} ${currency}` });
      findings.push({ title: "Verified contribution total", description: `Server calculated ${sum} ${currency} across ${paid.length} eligible record(s).`, category: "positive", severity: "none", evidenceIds: ["srv-c1"] });
      base.confidence = "high";
      base.status = "ready";
      base.summary = `Analyzed ${ctx.contributions.length} contribution record(s) from the account ledger.`;
    } else {
      base.status = ctx.contributions.length ? "partial" : "insufficient_data";
      base.confidence = ctx.contributions.length ? "medium" : "not_assessed";
      base.summary = base.status === "insufficient_data"
        ? "No sufficient contribution data is available for this report yet."
        : "Contribution records exist but none are in a verified completed state.";
      findings.push({ title: "No verified totals yet", description: "Eligible completed contributions are required for verified totals.", category: "attention", severity: "low", evidenceIds: [] });
      recommendations.push({ title: "Record a completed contribution", description: "Add an eligible contribution so verified totals can be calculated.", priority: "high", rationale: "Financial figures must come from verified ledger rows.", estimatedEffort: "low", requiresApproval: false });
    }
    limitations.push("Failed, cancelled, and pending records are excluded from verified totals.");
  }

  if (specialistId === "overview") {
    base.summary = base.status === "insufficient_data"
      ? "No sufficient account activity is available yet for Overview Insight."
      : "Server-side account summary using loyalty, contributions, activity, and plan records.";
    base.opportunities = ctx.signals.slice(0, 3).map((s) => ({
      title: `Signal: ${s.signalType}`, description: `From ${s.sourceSpecialistId}`,
      priority: s.severity === "critical" || s.severity === "warning" ? "high" : "medium", evidenceIds: [],
    }));
  }

  if (specialistId === "settings") {
    base.status = ctx.profile ? "ready" : "partial";
    base.summary = ctx.profile ? "Server profile row present for this account." : "Profile incomplete.";
    base.metrics = [
      { name: "Profile row", value: ctx.profile ? "present" : "missing", source: "verified" },
      { name: "Plan", value: ctx.plan ?? "none", source: ctx.plan ? "verified" : "missing" },
    ];
    base.confidence = ctx.profile ? "high" : "medium";
  }

  if (specialistId === "progress") {
    metrics.push(
      { name: "Loyalty balance", value: ctx.loyaltyBalance, unit: "pts", source: "verified" },
      { name: "Activity events", value: ctx.activity.length, source: "verified" },
    );
    base.summary = `Progress inputs from server: ${ctx.loyaltyBalance} loyalty pts, ${ctx.activity.length} activity event(s).`;
    base.status = ctx.loyaltyBalance > 0 || ctx.activity.length > 0 ? "partial" : "insufficient_data";
    base.confidence = "medium";
  }

  if (!base.summary) {
    base.status = "partial";
    base.summary = `${displayName} ran on the server. Specialized live integrations may still be required for full metrics.`;
    limitations.push("Some domain metrics require connected integrations.");
    base.confidence = "low";
    metrics.push(
      { name: "Loyalty balance", value: ctx.loyaltyBalance, unit: "pts", source: "verified" },
      { name: "Activity events", value: ctx.activity.length, source: "verified" },
    );
  }

  return base;
}

const generateSchema = z.object({
  specialistId: z.enum(SPECIALIST_IDS),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
});

insightsRouter.post("/runs", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const { specialistId } = parsed.data;
  if (!(await isSpecialistEnabled(specialistId))) {
    res.status(403).json({ error: `${DISPLAY[specialistId]} is disabled by administration.` });
    return;
  }
  const ctx = await loadAccountContext(userId);
  const report = buildReport(specialistId, userId, ctx);
  const [run] = await db.insert(insightRunsTable).values({
    userId, specialistId, tab: String(report.tab), status: String(report.status),
    confidence: String(report.confidence), summary: String(report.summary), report,
    dataAsOf: report.dataAsOf ? new Date(String(report.dataAsOf)) : null, version: String(report.version),
  }).returning();

  const attention = (report.keyFindings as Array<{ category?: string; severity?: string; title?: string }>).filter(
    (f) => f.category === "attention" || f.severity === "high" || f.severity === "critical",
  );
  if (attention.length > 0) {
    await db.insert(insightSignalsTable).values({
      userId, sourceSpecialistId: specialistId, signalType: "attention_finding",
      payload: { titles: attention.map((a) => a.title), runId: run.id }, severity: "warning",
    });
    await db.insert(insightNotificationsTable).values({
      userId, specialistId,
      title: `${DISPLAY[specialistId]} flagged attention items`,
      body: attention.map((a) => a.title).join("; ").slice(0, 280),
      href: `/dashboard/${report.tab === "contributions" ? "contributions" : report.tab}`,
    });
  }
  res.status(201).json({ run, report });
});

insightsRouter.get("/runs", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const specialistId = typeof req.query.specialistId === "string" ? req.query.specialistId : undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const rows = specialistId
    ? await db.select().from(insightRunsTable).where(and(eq(insightRunsTable.userId, userId), eq(insightRunsTable.specialistId, specialistId))).orderBy(desc(insightRunsTable.createdAt)).limit(limit)
    : await db.select().from(insightRunsTable).where(eq(insightRunsTable.userId, userId)).orderBy(desc(insightRunsTable.createdAt)).limit(limit);
  res.json({ runs: rows });
});

insightsRouter.get("/flags", requireAuth(), async (_req, res) => {
  const rows = await db.select().from(insightSpecialistFlagsTable);
  const map: Record<string, boolean> = {};
  for (const id of SPECIALIST_IDS) map[id] = true;
  for (const r of rows) map[r.specialistId] = r.enabled;
  res.json({ flags: map });
});

insightsRouter.get("/signals", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(insightSignalsTable).where(and(eq(insightSignalsTable.userId, userId), eq(insightSignalsTable.consumed, false))).orderBy(desc(insightSignalsTable.createdAt)).limit(30);
  res.json({ signals: rows });
});

insightsRouter.post("/signals/:id/consume", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(insightSignalsTable).set({ consumed: true }).where(and(eq(insightSignalsTable.id, req.params.id), eq(insightSignalsTable.userId, userId)));
  res.json({ ok: true });
});

insightsRouter.get("/notifications", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(insightNotificationsTable).where(eq(insightNotificationsTable.userId, userId)).orderBy(desc(insightNotificationsTable.createdAt)).limit(40);
  res.json({ notifications: rows });
});

insightsRouter.post("/notifications/:id/read", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  await db.update(insightNotificationsTable).set({ read: true }).where(and(eq(insightNotificationsTable.id, req.params.id), eq(insightNotificationsTable.userId, userId)));
  res.json({ ok: true });
});

insightsRouter.post("/feedback", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const schema = z.object({ specialistId: z.string().min(1), useful: z.boolean(), runId: z.string().uuid().optional(), note: z.string().max(500).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const [row] = await db.insert(insightFeedbackTable).values({ userId, specialistId: parsed.data.specialistId, useful: parsed.data.useful, runId: parsed.data.runId, note: parsed.data.note }).returning();
  res.status(201).json({ feedback: row });
});
