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

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

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
      return Response.json({ error: "An account with this email already exists. Log in instead." }, { status: 409, headers });
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

    // Index for admin
    const indexRaw = await context.env.KV.get("user:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("user:index", JSON.stringify(index.slice(0, 20_000)));
    }

    const token = await createSession(context.env.KV, user);

    const adminTo = context.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";
    await sendEmail(context.env, {
      to: adminTo,
      subject: `New CINTEXA account — ${fullName}`,
      html: `<div style="font-family:system-ui,sans-serif">
        <h2>New account created</h2>
        <p><strong>${escapeHtml(fullName)}</strong> &lt;${escapeHtml(email)}&gt;</p>
        <p>Phone: ${escapeHtml(phone || "—")} · Company: ${escapeHtml(company || "—")}</p>
        <p>User ID: ${escapeHtml(user.id)}</p>
      </div>`,
      text: `New account: ${fullName} <${email}> id=${user.id}`,
      replyTo: email,
    }).catch(() => ({ ok: false }));

    await sendEmail(context.env, {
      to: email,
      subject: "Welcome to CINTEXA",
      html: `<p>Hi ${escapeHtml(fullName)},</p>
        <p>Your CINTEXA account is ready. Open your dashboard: <a href="https://cintexa.com/dashboard">cintexa.com/dashboard</a></p>
        <p>— CINTEXA</p>`,
      text: `Welcome to CINTEXA. Dashboard: https://cintexa.com/dashboard`,
    }).catch(() => ({ ok: false }));

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
