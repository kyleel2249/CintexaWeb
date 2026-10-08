export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { ok: true; id: string; dryRun?: boolean }
  | { ok: false; error: string; status?: number };

export async function sendEmail(
  env: { RESEND_API_KEY?: string; EMAIL_FROM?: string },
  input: SendEmailInput,
  options?: { allowDryRun?: boolean },
): Promise<SendEmailResult> {
  const from = (env.EMAIL_FROM || "").trim() || "CINTEXA <onboarding@resend.dev>";
  const to = Array.isArray(input.to) ? input.to : [input.to];
  const key = (env.RESEND_API_KEY || "").trim();
  // Default: allow dry-run for non-critical mail. Password reset passes allowDryRun: false.
  const allowDryRun = options?.allowDryRun !== false;

  if (!key) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "email_missing_RESEND_API_KEY",
        to,
        subject: input.subject,
      }),
    );
    if (allowDryRun) {
      return { ok: true, id: `dry_${Date.now()}`, dryRun: true };
    }
    return {
      ok: false,
      error: "Email service is not configured (RESEND_API_KEY). Contact info@cintexa.com.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      from,
      to,
      subject: input.subject,
      html: input.html,
    };
    if (input.text) payload.text = input.text;
    if (input.replyTo) payload.reply_to = input.replyTo;
    if (input.tags?.length) payload.tags = input.tags;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
      statusCode?: number;
    };
    if (!res.ok) {
      const errMsg = data.message || data.name || `Resend HTTP ${res.status}`;
      console.error(JSON.stringify({ msg: "resend_error", status: res.status, data, from, to }));
      return { ok: false, error: errMsg, status: res.status };
    }
    return { ok: true, id: data.id || `resend_${Date.now()}` };
  } catch (err) {
    const error = err instanceof Error ? err.message : "send_failed";
    console.error(JSON.stringify({ msg: "resend_exception", error }));
    return { ok: false, error };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function careerAlertSubscriberHtml(name: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0B0F14">
    <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#B8860B">CINTEXA · Careers</p>
    <h1 style="font-size:22px;line-height:1.3">You're on the job &amp; scholarship list</h1>
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for signing up. We'll email you when new roles and scholarship opportunities are posted.</p>
    <p style="color:#555">You can update your interests any time by writing to
      <a href="mailto:info@cintexa.com">info@cintexa.com</a>.</p>
    <p style="margin-top:28px;font-size:13px;color:#777">— CINTEXA</p>
  </div>`;
}

export function careerAlertAdminHtml(payload: Record<string, unknown>): string {
  const rows = Object.entries(payload)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 8px;color:#666">${escapeHtml(k)}</td><td style="padding:4px 8px">${escapeHtml(String(v ?? "—"))}</td></tr>`,
    )
    .join("");
  return `
  <div style="font-family:system-ui,sans-serif;max-width:640px">
    <h2>New career / scholarship alert signup</h2>
    <table style="border-collapse:collapse">${rows}</table>
  </div>`;
}

export function opportunityBroadcastHtml(opts: {
  title: string;
  kind: string;
  summary: string;
  href?: string;
}): string {
  const cta = opts.href
    ? `<p><a href="${escapeHtml(opts.href)}" style="display:inline-block;background:#F5C518;color:#0B0F14;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">View opportunity</a></p>`
    : "";
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
    <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#B8860B">CINTEXA · ${escapeHtml(opts.kind)}</p>
    <h1 style="font-size:22px">${escapeHtml(opts.title)}</h1>
    <p>${escapeHtml(opts.summary)}</p>
    ${cta}
    <p style="font-size:12px;color:#777;margin-top:24px">You're receiving this because you signed up for job &amp; scholarship alerts at cintexa.com.</p>
  </div>`;
}
