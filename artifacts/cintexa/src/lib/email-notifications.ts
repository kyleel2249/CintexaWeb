/**
 * Client for CINTEXA email notification endpoints.
 * Prefers same-origin Pages Function; falls back to VITE_API_URL when set.
 */

export type CareerAlertPayload = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  education?: string;
  interests?: string[];
  message?: string;
  source?: string;
};

export type CareerAlertResponse = {
  ok: boolean;
  id?: string;
  confirmation?: { ok: boolean; id?: string; dryRun?: boolean; error?: string };
  adminNotify?: { ok: boolean; id?: string; dryRun?: boolean; error?: string };
  error?: string;
};

function apiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
  // Same-origin Pages Function when deployed on Cloudflare
  if (typeof window !== "undefined" && !fromEnv) return "";
  return fromEnv || "";
}

export async function submitCareerAlert(payload: CareerAlertPayload): Promise<CareerAlertResponse> {
  const url = `${apiBase()}/api/notifications/career-alert`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<CareerAlertResponse>;
  if (!res.ok) {
    return { ok: false, error: data.error || `Request failed (${res.status})` };
  }
  // Spread first so ok:true is authoritative (avoids TS2783)
  return { ...data, ok: true };
}
