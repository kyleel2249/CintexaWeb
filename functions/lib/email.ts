export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string; dryRun?: boolean }
  | { ok: false; error: string };

export async function sendEmail(
  env: { RESEND_API_KEY?: string; EMAIL_FROM?: string },
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const from = env.EMAIL_FROM || "CINTEXA <onboarding@resend.dev>";
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const key = env.RESEND_API_KEY?.trim();

  if (!key) {
    console.log(JSON.stringify({ level: "warn", msg: "email_dry_run_missing_RESEND_API_KEY", to, subject: input.subject }));
    return { ok: true, id: `dry_${Date.now()}`, dryRun: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    const data = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      console.error(JSON.stringify({ msg: "resend_error", status: res.status, data }));
      return { ok: false, error: data.message || `Resend HTTP ${res.status}` };
    }
    return { ok: true, id: data.id || `resend_${Date.now()}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
