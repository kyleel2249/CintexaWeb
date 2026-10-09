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

function welcomeEmailHtml(fullName: string): string {
  const name = escapeHtml(fullName);
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#0B0F14;line-height:1.55">
    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 12px">
      CINTEXA
    </p>
    <p>Hi ${name},</p>
    <p>Thank you for signing up with CINTEXA. We’re pleased to have you connected with us.</p>
    <p>CINTEXA provides technology and digital business solutions that help individuals, startups, and organizations build better systems, improve their operations, reach customers, and grow. Our work includes software development, website development, business automation, mobile applications, e-commerce solutions, digital marketing and advertising, SEO, customer relationship management, analytics, and other technology solutions tailored to business needs.</p>

    <h3 style="font-size:16px;margin:28px 0 8px;color:#0B0F14">Staying Connected</h3>
    <p>By signing up with CINTEXA, you agree to receive relevant information, announcements, opportunities, and updates from us as they become available.</p>
    <p>We’ll keep you informed when there is something new that may be relevant to you, including CINTEXA services, initiatives, opportunities, announcements, and other updates.</p>

    <h3 style="font-size:16px;margin:28px 0 8px;color:#0B0F14">Explore CINTEXA Career Opportunities</h3>
    <p>We also encourage you to check our careers page regularly if you’re interested in working with CINTEXA or would like to hear about future opportunities.</p>
    <p><a href="https://cintexa.com/careers" style="color:#B8860B;font-weight:600">CINTEXA Careers — https://cintexa.com/careers</a></p>
    <p>New opportunities can become available at different times, so we encourage you to check back periodically.</p>

    <p style="margin-top:28px">Thank you again for choosing to connect with CINTEXA. We look forward to keeping you informed and sharing what’s ahead.</p>
    <p><strong>Your CINTEXA account is ready.</strong> Open your dashboard:
      <a href="https://cintexa.com/dashboard" style="color:#B8860B;font-weight:600">cintexa.com/dashboard</a></p>

    <p style="margin-top:32px">Best regards,<br/>
    <strong>CINTEXA Team</strong><br/>
    <span style="font-size:13px;color:#555">Software · Systems · Automation · Digital Solutions</span><br/>
    <a href="https://cintexa.com" style="color:#B8860B">https://cintexa.com</a></p>
  </div>`;
}

function welcomeEmailText(fullName: string): string {
  return `Hi ${fullName},

Thank you for signing up with CINTEXA. We’re pleased to have you connected with us.

CINTEXA provides technology and digital business solutions that help individuals, startups, and organizations build better systems, improve their operations, reach customers, and grow. Our work includes software development, website development, business automation, mobile applications, e-commerce solutions, digital marketing and advertising, SEO, customer relationship management, analytics, and other technology solutions tailored to business needs.

Staying Connected
By signing up with CINTEXA, you agree to receive relevant information, announcements, opportunities, and updates from us as they become available.

We’ll keep you informed when there is something new that may be relevant to you, including CINTEXA services, initiatives, opportunities, announcements, and other updates.

Explore CINTEXA Career Opportunities
We also encourage you to check our careers page regularly if you’re interested in working with CINTEXA or would like to hear about future opportunities.

CINTEXA Careers — https://cintexa.com/careers

New opportunities can become available at different times, so we encourage you to check back periodically.

Thank you again for choosing to connect with CINTEXA. We look forward to keeping you informed and sharing what’s ahead.

Your CINTEXA account is ready. Open your dashboard: https://cintexa.com/dashboard

Best regards,
CINTEXA Team
Software · Systems · Automation · Digital Solutions
https://cintexa.com`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    let body: {
      fullName?: string;
      email?: string;
      password?: string;
      phone?: string;
      company?: string;
      role?: string;
    };
    try {
      body = (await context.request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400, headers });
    }

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const phone = (body.phone || "").trim().slice(0, 40);
    const company = (body.company || "").trim().slice(0, 160);
    const role = (body.role || "").trim().slice(0, 80);

    if (!fullName || fullName.length > 120 || !email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Valid full name and email are required." }, { status: 400, headers });
    }
    if (phone && !(/^\+?[\d\s().-]{7,25}$/.test(phone) && phone.replace(/\D/g, "").length >= 7 && phone.replace(/\D/g, "").length <= 15)) {
      return Response.json({ error: "Enter a valid phone number." }, { status: 400, headers });
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

    // Full welcome email to the new user
    const welcome = sendEmail(context.env, {
      to: email,
      subject: "Welcome to CINTEXA",
      html: welcomeEmailHtml(fullName),
      text: welcomeEmailText(fullName),
      tags: [
        { name: "type", value: "signup_welcome" },
        { name: "source", value: "auth_signup" },
      ],
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
