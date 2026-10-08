import { escapeHtml, resolveResendConfigAsync, sendEmail } from "../../lib/email";
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
 * POST { email } → sends a 6-digit recovery code by email (required) and SMS when possible.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const body = (await context.request.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400, headers });
    }

    // Require Resend (Pages env and/or KV secrets:RESEND_API_KEY)
    const resend = await resolveResendConfigAsync(context.env);
    if (!resend.configured) {
      console.error(
        JSON.stringify({
          msg: "forgot_password_no_resend_key",
          source: resend.source,
          hint: "Set RESEND_API_KEY in Pages Production env and redeploy, or KV key secrets:RESEND_API_KEY",
        }),
      );
      return Response.json(
        {
          error:
            "Password recovery email is not configured yet. Set RESEND_API_KEY in Cloudflare Pages (Production) and redeploy, or store it in KV as secrets:RESEND_API_KEY. Meanwhile contact info@cintexa.com.",
          code: "EMAIL_NOT_CONFIGURED",
        },
        { status: 503, headers },
      );
    }

    const rate = await context.env.KV.get(rateKey(email));
    if (rate) {
      return Response.json(
        {
          error: "Please wait about a minute before requesting another recovery code.",
        },
        { status: 429, headers },
      );
    }

    const raw = await context.env.KV.get(userKey(email));

    // Unknown account — do not send mail; same success shape (no enumeration of existence via email)
    if (!raw) {
      await context.env.KV.put(rateKey(email), "1", { expirationTtl: RATE_TTL_SEC });
      return Response.json(
        {
          ok: true,
          message:
            "If an account exists for that email, a recovery code has been sent. Check your inbox and spam folder.",
          channels: { email: true, sms: false },
          expiresInSeconds: CODE_TTL_SEC,
        },
        { status: 200, headers },
      );
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

    const emailResult = await sendEmail(
      context.env,
      {
      to: user.email,
      subject: "Your CINTEXA password recovery code",
      html: `<div style="font-family:system-ui,sans-serif;max-width:480px;color:#0B0F14">
        <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 8px">CINTEXA · Security</p>
        <h2 style="margin:0 0 12px;font-size:22px">Password recovery</h2>
        <p style="margin:0 0 12px">Hi ${escapeHtml(user.fullName)},</p>
        <p style="margin:0 0 8px">Your recovery code is:</p>
        <p style="font-size:32px;letter-spacing:0.25em;font-weight:700;font-family:ui-monospace,monospace;margin:16px 0;color:#0B0F14">${code}</p>
        <p style="color:#555;margin:0 0 8px">This code expires in <strong>15 minutes</strong>.</p>
        <p style="color:#555;margin:0">If you did not request a password reset, you can ignore this email.</p>
        <p style="margin-top:28px;font-size:13px;color:#777">— CINTEXA · <a href="https://cintexa.com/get-started">cintexa.com</a></p>
      </div>`,
      text: `CINTEXA password recovery code: ${code}\n\nThis code expires in 15 minutes.\nIf you did not request this, ignore this email.\n\n— CINTEXA`,
      tags: [
        { name: "type", value: "password_reset" },
        { name: "category", value: "transactional" },
      ],
      },
      { allowDryRun: false },
    );

    if (!emailResult.ok) {
      // Allow retry — do not rate-limit on failure
      await context.env.KV.delete(resetKey(email));
      console.error(
        JSON.stringify({
          msg: "forgot_password_email_failed",
          error: emailResult.error,
          status: emailResult.status,
          to: user.email,
        }),
      );
      return Response.json(
        {
          error: `Could not send the recovery email (${emailResult.error}). Check the address and try again, or contact info@cintexa.com.`,
        },
        { status: 502, headers },
      );
    }

    // Rate-limit only after a real send
    await context.env.KV.put(rateKey(email), "1", { expirationTtl: RATE_TTL_SEC });

    const channels = { email: true, sms: false };
    if (user.phone) {
      const smsResult = await sendSms(
        context.env,
        user.phone,
        `CINTEXA recovery code: ${code}. Expires in 15 minutes. Do not share this code.`,
      );
      channels.sms = Boolean(smsResult.ok);
    }

    return Response.json(
      {
        ok: true,
        message:
          "A recovery code was sent to your email. Check your inbox and spam folder. The code expires in 15 minutes.",
        channels,
        expiresInSeconds: CODE_TTL_SEC,
        hasPhoneOnFile: Boolean(user.phone),
        emailId: emailResult.id,
      },
      { status: 200, headers },
    );
  } catch (err) {
    console.error("auth/forgot-password", err);
    return Response.json(
      { error: "Could not start recovery. Try again or contact info@cintexa.com." },
      { status: 500, headers },
    );
  }
};
