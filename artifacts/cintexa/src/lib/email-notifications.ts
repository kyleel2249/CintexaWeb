/**
 * Client for CINTEXA email / signup notification endpoints.
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

export type SignupPayload = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  message?: string;
  source?: string;
  clerkUserId?: string;
};

export type NotifyResponse = {
  ok: boolean;
  id?: string;
  stored?: boolean;
  confirmation?: { ok: boolean; id?: string; dryRun?: boolean; error?: string };
  adminNotify?: { ok: boolean; id?: string; dryRun?: boolean; error?: string };
  error?: string;
};

function apiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
  if (typeof window !== "undefined" && !fromEnv) return "";
  return fromEnv || "";
}

async function postJson(path: string, payload: unknown): Promise<NotifyResponse> {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<NotifyResponse>;
  if (!res.ok) {
    return { ok: false, error: (data.error as string) || `Request failed (${res.status})` };
  }
  return { ...data, ok: true };
}

export async function submitCareerAlert(payload: CareerAlertPayload): Promise<NotifyResponse> {
  return postJson("/api/notifications/career-alert", payload);
}

export async function submitGetStartedSignup(payload: SignupPayload): Promise<NotifyResponse> {
  return postJson("/api/notifications/signup", payload);
}
