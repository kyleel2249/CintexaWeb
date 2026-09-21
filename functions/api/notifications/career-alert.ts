import { careerAlertAdminHtml, careerAlertSubscriberHtml, sendEmail } from "../../lib/email";

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
  location?: string;
  education?: string;
  interests?: string[];
  message?: string;
  source?: string;
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
    const interests = Array.isArray(body.interests)
      ? body.interests.map(String).slice(0, 20)
      : [];

    if (!fullName || fullName.length > 120 || !email || !EMAIL_RE.test(email)) {
      return Response.json(
        { error: "Valid fullName and email are required." },
        { status: 400, headers: cors },
      );
    }

    const record = {
      id: crypto.randomUUID(),
      fullName,
      email,
      phone: (body.phone || "").trim().slice(0, 40),
      location: (body.location || "").trim().slice(0, 120),
      education: (body.education || "").trim().slice(0, 120),
      interests,
      message: (body.message || "").trim().slice(0, 2000),
      source: (body.source || "careers_page").slice(0, 64),
      createdAt: new Date().toISOString(),
    };

    // Store subscriber keyed by email (latest wins) + append to index
    const kvKey = `career_alert:${email}`;
    await context.env.KV.put(kvKey, JSON.stringify(record));
    const indexRaw = await context.env.KV.get("career_alert:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("career_alert:index", JSON.stringify(index.slice(0, 5000)));
    }

    const adminTo = context.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";

    const [toUser, toAdmin] = await Promise.all([
      sendEmail(context.env, {
        to: email,
        subject: "You're subscribed to CINTEXA job & scholarship alerts",
        html: careerAlertSubscriberHtml(fullName),
        text: `Hi ${fullName}, thanks for signing up for CINTEXA job and scholarship alerts.`,
        tags: [{ name: "category", value: "career_alert_confirm" }],
      }),
      sendEmail(context.env, {
        to: adminTo,
        subject: `New career alert signup — ${fullName}`,
        html: careerAlertAdminHtml(record as unknown as Record<string, unknown>),
        text: `New signup: ${fullName} <${email}>`,
        replyTo: email,
        tags: [{ name: "category", value: "career_alert_admin" }],
      }),
    ]);

    return Response.json(
      {
        ok: true,
        id: record.id,
        confirmation: toUser,
        adminNotify: toAdmin,
      },
      { headers: cors },
    );
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Unable to save alert signup." },
      { status: 500, headers: cors },
    );
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
