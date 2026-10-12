export type ApplyPayload = {
  jobSlug: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  message?: string;
  /** Honeypot — real people never fill this in. */
  website?: string;
};

export type ApplyResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Sends an application for one vacancy. Never throws; always returns a displayable result. */
export async function submitApplication(payload: ApplyPayload, fetchImpl: typeof fetch = fetch): Promise<ApplyResult> {
  try {
    const res = await fetchImpl("/api/careers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
      fieldErrors?: Record<string, string>;
    };
    if (res.ok && data.id) return { ok: true, id: data.id };
    return {
      ok: false,
      error: data.error || (res.status === 429 ? "Too many attempts. Please try again later." : "We couldn’t send your application. Please try again."),
      fieldErrors: data.fieldErrors,
    };
  } catch {
    return { ok: false, error: "We couldn’t reach CINTEXA. Check your connection and try again." };
  }
}
