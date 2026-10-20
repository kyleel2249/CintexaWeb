import { escapeHtml, resolveResendConfigAsync, sendEmail } from "../../lib/email";
import { sendSms } from "../../lib/sms";
import { corsHeaders, userKey, type StoredUser } from "../../lib/cintexa-auth";
import { recordEvent, requestMeta } from "../../lib/events";

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

/**
 * The ONE answer a password-reset request gets once the address is well formed, whether or not an account
 * exists, whether the mail went out, or whether the visitor is being throttled. Identical status, shape
 * and wording means the endpoint can't be used to discover which email addresses are registered.
 */
export const GENERIC_RESET_MESSAGE = "If this accounts exists a password reset link has been sent.";

function genericResetResponse(headers: Record<string, string>): Response {
  return Response.json(
    { ok: true, message: GENERIC_RESET_MESSAGE, expiresInSeconds: CODE_TTL_SEC },
    { status: 200, headers },
  );
}

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

    // Throttled addresses get the same answer as everyone else (no second mail is sent).
    const rate = await context.env.KV.get(rateKey(email));
    if (rate) return genericResetResponse(headers);

    const raw = await context.env.KV.get(userKey(email));

    // Unknown account — do not send mail; same success shape (no enumeration of existence via email)
    if (!raw) {
      await context.env.KV.put(rateKey(email), "1", { expirationTtl: RATE_TTL_SEC });
      await recordEvent(context.env, { type: "password_reset_requested", email, ...requestMeta(context.request), detail: "unknown account" });
      return genericResetResponse(headers);
    }

    const user = JSON.parse(raw) as StoredUser;
    await recordEvent(context.env, { type: "password_reset_requested", userId: user.id, email, ...requestMeta(context.request) });
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

    // Rate-limit as soon as a code is issued, so the response never depends on whether delivery succeeds.
    await context.env.KV.put(rateKey(email), "1", { expirationTtl: RATE_TTL_SEC });

    // Deliver in the background: an existing account must not take measurably longer to answer than an
    // unknown one, and a delivery failure must not change what the visitor is told.
    const deliver = (async () => {
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
        // Logged for operators only; the visitor is never told (that would reveal the account exists).
        await context.env.KV.delete(resetKey(email));
        await context.env.KV.delete(rateKey(email));
        console.error(
          JSON.stringify({ msg: "forgot_password_email_failed", error: emailResult.error, status: emailResult.status }),
        );
        return;
      }

      if (user.phone) {
        await sendSms(
          context.env,
          user.phone,
          `CINTEXA recovery code: ${code}. Expires in 15 minutes. Do not share this code.`,
        );
      }
    })().catch((err) => console.error("auth/forgot-password delivery", err));

    if (typeof context.waitUntil === "function") context.waitUntil(deliver);
    else await deliver;

    return genericResetResponse(headers);
  } catch (err) {
    console.error("auth/forgot-password", err);
    return Response.json(
      { error: "Could not start recovery. Try again or contact info@cintexa.com." },
      { status: 500, headers },
    );
  }
};
