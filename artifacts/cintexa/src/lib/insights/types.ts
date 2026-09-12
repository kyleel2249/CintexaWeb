/** Shared Insight Workforce types — customer-facing specialists are named "[Tab] Insight". */

export type InsightStatus = "ready" | "partial" | "insufficient_data" | "error";
export type InsightConfidence = "high" | "medium" | "low" | "not_assessed";
export type FindingCategory = "positive" | "attention" | "trend" | "opportunity" | "neutral";
export type Severity = "low" | "medium" | "high" | "none";
export type MetricSource = "verified" | "calculated" | "estimated" | "missing";

export type InsightFinding = {
  title: string;
  description: string;
  category: FindingCategory;
  severity: Severity;
  evidenceIds: string[];
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

export type InsightResult = {
  id: string;
  specialistId: string;
  displayName: string;
  tab: string;
  accountId: string;
  generatedAt: string;
  dataAsOf: string | null;
  status: InsightStatus;
  summary: string;
  keyFindings: InsightFinding[];
  recommendations: InsightRecommendation[];
  alerts: InsightAlert[];
  metrics: InsightMetric[];
  evidence: InsightEvidence[];
  limitations: string[];
  suggestedActions: InsightAction[];
  confidence: InsightConfidence;
  sourceTypes: string[];
  specialistVersion: string;
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
  username?: string;
  profile?: Record<string, unknown> | null;
  activity?: Array<{ eventType: string; title: string; description: string; createdAt: string }>;
  contributions?: Array<{ amount: string; status: string; description: string; createdAt: string; currency?: string }>;
  loyaltyBalance?: number;
  subscriptionPlan?: string | null;
  periodDays?: number;
};
