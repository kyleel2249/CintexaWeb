/** Shared Insight Workforce types — customer-facing specialists are named "[Tab] Insight" only. */

export type InsightStatus = "ready" | "partial" | "insufficient_data" | "error";
export type InsightConfidence = "high" | "medium" | "low" | "not_assessed";
export type FindingCategory = "positive" | "attention" | "trend" | "opportunity" | "neutral" | "anomaly";
export type Severity = "informational" | "low" | "medium" | "high" | "critical" | "none";
export type MetricSource = "verified" | "calculated" | "estimated" | "missing";

export type InsightFinding = {
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  evidenceIds: string[];
  relatedMetric?: string;
  period?: string;
};

export type InsightRecommendation = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  rationale: string;
  estimatedEffort?: "low" | "medium" | "high" | "unknown";
  requiresApproval: boolean;
  actionId?: string;
};

export type InsightAlert = {
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved";
  evidenceIds: string[];
};

export type InsightMetric = {
  name: string;
  value: number | string | null;
  unit?: string;
  period?: string;
  comparison?: string;
  source: MetricSource;
};

export type InsightTrend = {
  title: string;
  description: string;
  direction: "up" | "down" | "flat" | "unknown";
  period?: string;
  evidenceIds: string[];
};

export type InsightOpportunity = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  evidenceIds: string[];
};

export type InsightEvidence = {
  id: string;
  sourceType: string;
  sourceReference: string;
  description: string;
  observedAt?: string;
  dataAsOf?: string;
};

export type InsightAction = {
  id: string;
  label: string;
  description: string;
  requiresConfirmation: boolean;
  enabled: boolean;
};

/** Standard structured report produced by every specialist. */
export type InsightResult = {
  id: string;
  specialistId: string;
  displayName: string;
  tab: string;
  accountId: string;
  userId?: string;
  generatedAt: string;
  dataAsOf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  status: InsightStatus;
  summary: string;
  keyFindings: InsightFinding[];
  recommendations: InsightRecommendation[];
  alerts: InsightAlert[];
  metrics: InsightMetric[];
  trends: InsightTrend[];
  opportunities: InsightOpportunity[];
  evidence: InsightEvidence[];
  limitations: string[];
  suggestedActions: InsightAction[];
  confidence: InsightConfidence;
  sourceTypes: string[];
  specialistVersion: string;
  version: string;
};

export type InsightSpecialistConfig = {
  id: string;
  displayName: string;
  tab: string;
  description: string;
  capabilities: string[];
  requiredDataSources: string[];
  allowedScopes: string[];
  version: string;
  enabled: boolean;
};

export type InsightContext = {
  accountId: string;
  userId?: string;
  profile?: {
    username?: string | null;
    businessName?: string | null;
    interests?: string[];
    leaderboardVisible?: boolean;
    avatarId?: string;
    role?: string;
  } | null;
  activity?: Array<{ eventType?: string; title?: string; createdAt?: string; id?: string }>;
  contributions?: Array<{ amount?: string | number; currency?: string; status?: string; createdAt?: string }>;
  loyaltyBalance?: number;
  subscriptionPlan?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};
