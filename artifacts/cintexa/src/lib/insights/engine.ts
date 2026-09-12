/** Placeholder — full engine follows in next commit */
export function generateInsightForTab(tab: string, ctx: { accountId?: string }): {
  id: string;
  specialistId: string;
  displayName: string;
  tab: string;
  accountId: string;
  generatedAt: string;
  dataAsOf: string | null;
  status: "error";
  summary: string;
  keyFindings: never[];
  recommendations: never[];
  alerts: never[];
  metrics: never[];
  evidence: never[];
  limitations: string[];
  suggestedActions: never[];
  confidence: "not_assessed";
  sourceTypes: never[];
  specialistVersion: string;
} {
  return {
    id: "pending",
    specialistId: tab,
    displayName: `${tab} Insight`,
    tab,
    accountId: ctx?.accountId ?? "local",
    generatedAt: new Date().toISOString(),
    dataAsOf: null,
    status: "error",
    summary: "Insight engine loading…",
    keyFindings: [],
    recommendations: [],
    alerts: [],
    metrics: [],
    evidence: [],
    limitations: ["Engine file being deployed"],
    suggestedActions: [],
    confidence: "not_assessed",
    sourceTypes: [],
    specialistVersion: "0",
  };
}
export function saveInsightHistory(): void {}
export function readInsightHistory(): never[] {
  return [];
}
