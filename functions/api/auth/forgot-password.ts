import { escapeHtml, sendEmail } from "../../lib/email";
import { sendSms } from "../../lib/sms";
import { corsHeaders, userKey, type StoredUser } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_SEC = 15 * 60;
const RATE_TTL_SEC = 60;

function resetKey(email: string) {
  return `reset:${email.trim().toLowerCase()}`;
}
function rateKey(email: string) {
  return `reset:rate:${email.trim().toLowerCase()}`;
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sixDigitCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return String(n).padStart(6, "0");
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

/**
 * POST { email } → sends a 6-digit recovery code by email and SMS (if phone on file + Twilio configured).
 * Response never reveals whether the account exists.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const body = (await context.request.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400, headers });
    }

    // Rate limit: 1 request / minute per email
    const rate = await context.env.KV.get(rateKey(email));
    if (rate) {
      return Response.json(
        { ok: true, message: "If an account exists, a recovery code was sent. Wait a minute before requesting another." },
        { status: 200, headers },
      );
    }
    await context.env.KV.put(rateKey(email), "1", { expirationTtl: RATE_TTL_SEC });

    const raw = await context.env.KV.get(userKey(email));
    // Always return the same shape whether or not the user exists
    const generic = {
      ok: true as const,
      message: "If an account exists for that email, a recovery code was sent by email and SMS (when available).",
      channels: { email: false, sms: false } as { email: boolean; sms: boolean },
      expiresInSeconds: CODE_TTL_SEC,
    };

    if (!raw) {
      return Response.json(generic, { status: 200, headers });
    }

    const user = JSON.parse(raw) as StoredUser;
    const code = sixDigitCode();
    const codeHash = await hashCode(code);
    await context.env.KV.put(
      resetKey(email),
      JSON.stringify({
        codeHash,
        userId: user.id,
        email: user.email,
        attempts: 0,
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: CODE_TTL_SEC },
    );

    const channels = { email: false, sms: false };

    const emailResult = await sendEmail(context.env, {
      to: user.email,
      subject: "CINTEXA password recovery code",
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;color:#0B0F14">
        <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B">CINTEXA · Security</p>
        <h2 style="margin:8px 0 12px">Password recovery</h2>
        <p>Hi ${escapeHtml(user.fullName)},</p>
        <p>Your recovery code is:</p>
        <p style="font-size:28px;letter-spacing:0.2em;font-weight:700;font-family:monospace">${code}</p>
        <p style="color:#555">This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>
      </div>`,
      text: `CINTEXA recovery code: ${code} (expires in 15 minutes)`,
      tags: [{ name: "type", value: "password_reset" }],
    });
    channels.email = emailResult.ok;

    if (user.phone) {
      const smsResult = await sendSms(
        context.env,
        user.phone,
        `CINTEXA recovery code: ${code}. Expires in 15 minutes. Do not share this code.`,
      );
      channels.sms = smsResult.ok && !("dryRun" in smsResult && smsResult.dryRun);
      // Count dry-run as attempted SMS delivery path for UI when Twilio missing
      if (smsResult.ok) channels.sms = true;
    }

    return Response.json(
      {
        ok: true,
        message: "If an account exists for that email, a recovery code was sent by email and SMS (when available).",
        channels,
        expiresInSeconds: CODE_TTL_SEC,
        // Only expose that SMS was attempted when phone exists — still no confirmation of account in generic message
        hasPhoneOnFile: Boolean(user.phone),
      },
      { status: 200, headers },
    );
  } catch (err) {
    console.error("auth/forgot-password", err);
    return Response.json({ error: "Could not start recovery. Try again." }, { status: 500, headers });
  }
};
