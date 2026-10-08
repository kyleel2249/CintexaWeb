export type SendSmsResult =
  | { ok: true; sid?: string; dryRun?: boolean }
  | { ok: false; error: string };

/**
 * Send SMS via Twilio when credentials are configured.
 * Without credentials, logs a dry-run and returns ok so email-only recovery still works.
 */
export async function sendSms(
  env: {
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_FROM_NUMBER?: string;
  },
  to: string,
  body: string,
): Promise<SendSmsResult> {
  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const token = env.TWILIO_AUTH_TOKEN?.trim();
  const from = env.TWILIO_FROM_NUMBER?.trim();
  const digits = to.replace(/[^\d+]/g, "");

  if (!sid || !token || !from) {
    console.log(
      JSON.stringify({
        level: "warn",
        msg: "sms_dry_run_missing_twilio",
        to: digits.slice(0, 4) + "…",
      }),
    );
    return { ok: true, dryRun: true };
  }

  if (digits.length < 8) {
    return { ok: false, error: "Invalid phone number" };
  }

  try {
    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams({ To: digits.startsWith("+") ? digits : `+${digits}`, From: from, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = (await res.json()) as { sid?: string; message?: string; error_message?: string };
    if (!res.ok) {
      return { ok: false, error: data.error_message || data.message || `Twilio HTTP ${res.status}` };
    }
    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "sms_failed" };
  }
}
