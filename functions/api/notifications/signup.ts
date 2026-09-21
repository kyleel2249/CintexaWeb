import { escapeHtml, sendEmail } from "../../lib/email";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
}

type Body = {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  message?: string;
  source?: string;
  clerkUserId?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = (await context.request.json()) as Body;
    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!fullName || fullName.length > 120 || !email || !EMAIL_RE.test(email)) {
      return Response.json(
        { error: "Valid fullName and email are required." },
        { status: 400, headers: cors },
      );
    }

    const record = {
      id: crypto.randomUUID(),
      type: "get_started_signup",
      fullName,
      email,
      phone: (body.phone || "").trim().slice(0, 40),
      company: (body.company || "").trim().slice(0, 160),
      role: (body.role || "").trim().slice(0, 80),
      message: (body.message || "").trim().slice(0, 2000),
      source: (body.source || "get_started").slice(0, 64),
      clerkUserId: (body.clerkUserId || "").trim().slice(0, 128) || null,
      createdAt: new Date().toISOString(),
    };

    // Cloudflare KV as the signup database
    await context.env.KV.put(`signup:${email}`, JSON.stringify(record));
    await context.env.KV.put(`signup:id:${record.id}`, JSON.stringify(record));

    const indexRaw = await context.env.KV.get("signup:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("signup:index", JSON.stringify(index.slice(0, 10000)));
    }

    const adminTo = context.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";

    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:640px">
        <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#B8860B">CINTEXA · Get Started</p>
        <h2>New account / signup interest</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px;color:#666">Name</td><td style="padding:6px">${escapeHtml(record.fullName)}</td></tr>
          <tr><td style="padding:6px;color:#666">Email</td><td style="padding:6px">${escapeHtml(record.email)}</td></tr>
          <tr><td style="padding:6px;color:#666">Phone</td><td style="padding:6px">${escapeHtml(record.phone || "—")}</td></tr>
          <tr><td style="padding:6px;color:#666">Company</td><td style="padding:6px">${escapeHtml(record.company || "—")}</td></tr>
          <tr><td style="padding:6px;color:#666">Role</td><td style="padding:6px">${escapeHtml(record.role || "—")}</td></tr>
          <tr><td style="padding:6px;color:#666">Source</td><td style="padding:6px">${escapeHtml(record.source)}</td></tr>
          <tr><td style="padding:6px;color:#666">Clerk ID</td><td style="padding:6px">${escapeHtml(record.clerkUserId || "—")}</td></tr>
          <tr><td style="padding:6px;color:#666">Message</td><td style="padding:6px">${escapeHtml(record.message || "—")}</td></tr>
          <tr><td style="padding:6px;color:#666">When</td><td style="padding:6px">${escapeHtml(record.createdAt)}</td></tr>
        </table>
      </div>`;

    const adminNotify = await sendEmail(context.env, {
      to: adminTo,
      subject: `New Get Started signup — ${record.fullName}`,
      html: adminHtml,
      text: `New signup: ${record.fullName} <${record.email}> phone=${record.phone} company=${record.company}`,
      replyTo: email,
    });

    const confirmation = await sendEmail(context.env, {
      to: email,
      subject: "Welcome to CINTEXA — we received your signup",
      html: `<p>Hi ${escapeHtml(fullName)},</p>
        <p>Thanks for getting started with CINTEXA. Our team has been notified and will follow up if needed.</p>
        <p>You can open your dashboard any time after signing in: <a href="https://cintexa.com/dashboard">cintexa.com/dashboard</a></p>
        <p>— CINTEXA</p>`,
      text: `Hi ${fullName}, thanks for signing up with CINTEXA.`,
    });

    return Response.json(
      {
        ok: true,
        id: record.id,
        stored: true,
        adminNotify,
        confirmation,
        adminEmail: adminTo,
      },
      { headers: cors },
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Unable to save signup." }, { status: 500, headers: cors });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
