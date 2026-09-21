import { logger } from "./logger.js";

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

/**
 * Send transactional email via Resend HTTP API.
 * When RESEND_API_KEY is unset, logs a dry-run and returns success so local/dev
 * and staging never hard-fail on missing provider credentials.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM || "CINTEXA <onboarding@resend.dev>";
  const key = process.env.RESEND_API_KEY?.trim();
  const to = Array.isArray(input.to) ? input.to : [input.to];

  if (!key) {
    logger.info({ to, subject: input.subject }, "email_dry_run");
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
      logger.warn({ status: res.status, data }, "email_send_failed");
      return { ok: false, error: data.message || `Resend HTTP ${res.status}` };
    }
    return { ok: true, id: data.id || `resend_${Date.now()}` };
  } catch (err) {
    logger.error({ err }, "email_send_exception");
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}
