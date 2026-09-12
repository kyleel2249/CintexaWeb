import { apiFetch } from "@/lib/api";

export type ServerInsightRun = {
  id: string;
  userId: string;
  specialistId: string;
  tab: string;
  status: string;
  confidence: string;
  summary: string;
  report: unknown;
  createdAt: string;
};

export type InsightNotification = {
  id: string;
  specialistId: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type InsightSignal = {
  id: string;
  sourceSpecialistId: string;
  signalType: string;
  payload: Record<string, unknown>;
  severity: string;
  consumed: boolean;
  createdAt: string;
};

export async function createInsightRun(
  specialistId: string,
  token: string | null | undefined,
): Promise<{ run: ServerInsightRun; report: unknown }> {
  return apiFetch("/insights/runs", {
    method: "POST",
    token,
    body: { specialistId },
  });
}

export async function fetchInsightRuns(
  token: string | null | undefined,
  specialistId?: string,
): Promise<{ runs: ServerInsightRun[] }> {
  const q = specialistId ? `?specialistId=${encodeURIComponent(specialistId)}` : "";
  return apiFetch(`/insights/runs${q}`, { token });
}

export async function fetchInsightFlags(token: string | null | undefined): Promise<{ flags: Record<string, boolean> }> {
  return apiFetch("/insights/flags", { token });
}

export async function fetchInsightSignals(token: string | null | undefined): Promise<{ signals: InsightSignal[] }> {
  return apiFetch("/insights/signals", { token });
}

export async function consumeInsightSignal(id: string, token: string | null | undefined) {
  return apiFetch(`/insights/signals/${id}/consume`, { method: "POST", token });
}

export async function fetchInsightNotifications(
  token: string | null | undefined,
): Promise<{ notifications: InsightNotification[] }> {
  return apiFetch("/insights/notifications", { token });
}

export async function markInsightNotificationRead(id: string, token: string | null | undefined) {
  return apiFetch(`/insights/notifications/${id}/read`, { method: "POST", token });
}

export async function submitInsightFeedback(
  body: { specialistId: string; useful: boolean; runId?: string; note?: string },
  token: string | null | undefined,
) {
  return apiFetch("/insights/feedback", { method: "POST", token, body });
}
