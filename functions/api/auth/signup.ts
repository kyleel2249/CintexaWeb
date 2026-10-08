import { escapeHtml, sendEmail } from "../../lib/email";
import {
  corsHeaders,
  createSession,
  hashPassword,
  userKey,
  type StoredUser,
} from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Always notified on new signups — not exposed to the end user. */
const ADMIN_INBOX = "info@cintexa.com";

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

/**
 * Silent admin alert for every successful signup.
 * Never included in the JSON response or shown in the UI.
 */
async function notifyAdminOfSignup(
  env: Env,
  user: StoredUser,
  extras: { phone: string; company: string; role: string },
): Promise<void> {
  const recipients = new Set<string>([ADMIN_INBOX]);
  const extra = (env.NOTIFY_ADMIN_EMAIL || "").trim().toLowerCase();
  if (extra && EMAIL_RE.test(extra)) recipients.add(extra);

  const when = user.createdAt;
  const subject = `New CINTEXA signup — ${user.fullName}`;
  const text = [
    "New CINTEXA account signup",
    `Name: ${user.fullName}`,
    `Email: ${user.email}`,
    `Phone: ${extras.phone || "—"}`,
    `Company: ${extras.company || "—"}`,
    `Role: ${extras.role || "—"}`,
    `User ID: ${user.id}`,
    `When: ${when}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0B0F14">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 8px">
        CINTEXA · Internal
      </p>
      <h2 style="margin:0 0 12px;font-size:20px">New account signup</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr><td style="padding:6px 8px;color:#666;width:120px">Name</td><td style="padding:6px 8px"><strong>${escapeHtml(user.fullName)}</strong></td></tr>
        <tr><td style="padding:6px 8px;color:#666">Email</td><td style="padding:6px 8px">${escapeHtml(user.email)}</td></tr>
        <tr><td style="padding:6px 8px;color:#666">Phone</td><td style="padding:6px 8px">${escapeHtml(extras.phone || "—")}</td></tr>
        <tr><td style="padding:6px 8px;color:#666">Company</td><td style="padding:6px 8px">${escapeHtml(extras.company || "—")}</td></tr>
        <tr><td style="padding:6px 8px;color:#666">Role</td><td style="padding:6px 8px">${escapeHtml(extras.role || "—")}</td></tr>
        <tr><td style="padding:6px 8px;color:#666">User ID</td><td style="padding:6px 8px;font-family:monospace;font-size:12px">${escapeHtml(user.id)}</td></tr>
        <tr><td style="padding:6px 8px;color:#666">When</td><td style="padding:6px 8px">${escapeHtml(when)}</td></tr>
      </table>
    </div>`;

  // Fire one email per recipient; never throw to the client path
  await Promise.all(
    [...recipients].map((to) =>
      sendEmail(env, {
        to,
        subject,
        html,
        text,
        replyTo: user.email,
        tags: [
          { name: "type", value: "signup_admin" },
          { name: "source", value: "auth_signup" },
        ],
      }).catch((err) => {
        console.error(
          JSON.stringify({
            msg: "signup_admin_notify_failed",
            to,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
        return { ok: false as const, error: "notify_failed" };
      }),
    ),
  );

  // Internal audit trail in KV (not user-facing)
  try {
    await env.KV.put(
      `signup:notify:${user.id}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        notifiedAt: new Date().toISOString(),
        recipients: [...recipients],
      }),
      { expirationTtl: 60 * 60 * 24 * 365 },
    );
  } catch {
    /* ignore audit failures */
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const body = (await context.request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      phone?: string;
      company?: string;
      role?: string;
    };

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const phone = (body.phone || "").trim().slice(0, 40);
    const company = (body.company || "").trim().slice(0, 160);
    const role = (body.role || "").trim().slice(0, 80);

    if (!fullName || fullName.length > 120 || !email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Valid full name and email are required." }, { status: 400, headers });
    }
    if (password.length < 8 || password.length > 128) {
      return Response.json({ error: "Password must be 8–128 characters." }, { status: 400, headers });
    }

    const existing = await context.env.KV.get(userKey(email));
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists. Log in instead." },
        { status: 409, headers },
      );
    }

    const { salt, hash } = await hashPassword(password);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email,
      fullName,
      phone: phone || undefined,
      company: company || undefined,
      role: role || undefined,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };

    await context.env.KV.put(userKey(email), JSON.stringify(user));

    const indexRaw = await context.env.KV.get("user:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("user:index", JSON.stringify(index.slice(0, 20_000)));
    }

    const token = await createSession(context.env.KV, user);

    // Silent admin notification — never surfaced in the response body
    const adminNotify = notifyAdminOfSignup(context.env, user, { phone, company, role });
    if (context.waitUntil) {
      context.waitUntil(adminNotify);
    } else {
      await adminNotify;
    }

    // Optional welcome to the user (account confirmation only — no mention of admin notify)
    const welcome = sendEmail(context.env, {
      to: email,
      subject: "Welcome to CINTEXA",
      html: `<p>Hi ${escapeHtml(fullName)},</p>
        <p>Your CINTEXA account is ready. Open your dashboard:
        <a href="https://cintexa.com/dashboard">cintexa.com/dashboard</a></p>
        <p>— CINTEXA</p>`,
      text: `Welcome to CINTEXA. Dashboard: https://cintexa.com/dashboard`,
    }).catch(() => ({ ok: false as const, error: "welcome_failed" }));
    if (context.waitUntil) context.waitUntil(welcome);

    // Response contains only session data — nothing about notifications
    return Response.json(
      {
        ok: true,
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName },
      },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("auth/signup", err);
    return Response.json({ error: "Signup failed." }, { status: 500, headers });
  }
};
