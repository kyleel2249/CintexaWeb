import { escapeHtml, sendEmail } from "../../lib/email";
import {
  corsHeaders,
  createSession,
  userKey,
  verifyPassword,
  type StoredUser,
} from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FAILED_LOGINS = 10;
const FAIL_WINDOW_SEC = 15 * 60;

function failKey(email: string) {
  return `login:fail:${email}`;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    let body: { email?: string; password?: string };
    try {
      body = (await context.request.json()) as { email?: string; password?: string };
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400, headers });
    }
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !EMAIL_RE.test(email) || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400, headers });
    }

    // Soft brute-force protection: too many failures for this email in the window.
    const failures = Number((await context.env.KV.get(failKey(email))) || "0");
    if (failures >= MAX_FAILED_LOGINS) {
      return Response.json(
        { error: "Too many failed attempts. Wait 15 minutes or reset your password." },
        { status: 429, headers: { ...headers, "Retry-After": String(FAIL_WINDOW_SEC) } },
      );
    }
    const recordFailure = () =>
      context.env.KV.put(failKey(email), String(failures + 1), { expirationTtl: FAIL_WINDOW_SEC }).catch(
        () => undefined,
      );

    const raw = await context.env.KV.get(userKey(email));
    if (!raw) {
      await recordFailure();
      return Response.json({ error: "Invalid email or password." }, { status: 401, headers });
    }

    const user = JSON.parse(raw) as StoredUser;
    const ok = await verifyPassword(password, user.salt, user.passwordHash);
    if (!ok) {
      await recordFailure();
      return Response.json({ error: "Invalid email or password." }, { status: 401, headers });
    }
    await context.env.KV.delete(failKey(email)).catch(() => undefined);

    const token = await createSession(context.env.KV, user);

    // Notify the user of this sign-in (fire-and-forget)
    const when = new Date().toISOString();
    const signInNotify = sendEmail(context.env, {
      to: user.email,
      subject: "You signed in to CINTEXA",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0B0F14">
          <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 8px">
            CINTEXA · Security
          </p>
          <h2 style="margin:0 0 12px;font-size:20px">New sign-in</h2>
          <p>Hi ${escapeHtml(user.fullName)},</p>
          <p>Your CINTEXA account was just signed in successfully.</p>
          <p style="color:#555;font-size:14px">Time: ${escapeHtml(when)}</p>
          <p style="color:#555;font-size:14px">
            If this wasn’t you, reset your password immediately at
            <a href="https://cintexa.com/get-started">cintexa.com/get-started</a>
            and contact <a href="mailto:info@cintexa.com">info@cintexa.com</a>.
          </p>
          <p style="margin-top:24px;font-size:13px;color:#777">— CINTEXA Team</p>
        </div>`,
      text: `Hi ${user.fullName}, your CINTEXA account was signed in at ${when}. If this wasn’t you, reset your password at https://cintexa.com/get-started`,
      tags: [
        { name: "type", value: "signin_notify" },
        { name: "source", value: "auth_login" },
      ],
    }).catch((err) => {
      console.error(
        JSON.stringify({
          msg: "signin_notify_failed",
          email: user.email,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return { ok: false as const, error: "notify_failed" };
    });

    if (context.waitUntil) {
      context.waitUntil(signInNotify);
    }

    return Response.json(
      {
        ok: true,
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName },
      },
      { headers },
    );
  } catch (err) {
    console.error("auth/login", err);
    return Response.json({ error: "Login failed." }, { status: 500, headers });
  }
};
