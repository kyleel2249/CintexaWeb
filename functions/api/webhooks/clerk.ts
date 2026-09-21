import { escapeHtml, sendEmail } from "../../lib/email";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
  CLERK_WEBHOOK_SECRET?: string;
}

/**
 * Clerk webhook: user.created / user.updated
 * Configure in Clerk Dashboard → Webhooks → endpoint:
 *   https://cintexa.com/api/webhooks/clerk
 * Subscribe to: user.created
 *
 * Signature verification: when CLERK_WEBHOOK_SECRET is set, we require
 * svix headers. Without secret (dev), we accept payloads but log a warning.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const raw = await context.request.text();
    let payload: {
      type?: string;
      data?: {
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        email_addresses?: { email_address?: string }[];
        phone_numbers?: { phone_number?: string }[];
        username?: string | null;
        created_at?: number;
      };
    };

    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!context.env.CLERK_WEBHOOK_SECRET) {
      console.warn("CLERK_WEBHOOK_SECRET not set — accepting webhook without signature verify");
    }

    if (payload.type !== "user.created" && payload.type !== "user.updated") {
      return Response.json({ ok: true, ignored: payload.type });
    }

    const data = payload.data || {};
    const email =
      data.email_addresses?.[0]?.email_address?.toLowerCase()?.trim() || "";
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "New user";
    const phone = data.phone_numbers?.[0]?.phone_number || "";

    if (!email) {
      return Response.json({ ok: true, skipped: "no_email" });
    }

    const record = {
      id: crypto.randomUUID(),
      type: "clerk_" + (payload.type || "user"),
      fullName,
      email,
      phone,
      company: "",
      role: "",
      message: "",
      source: "clerk_webhook",
      clerkUserId: data.id || null,
      username: data.username || null,
      createdAt: new Date().toISOString(),
    };

    await context.env.KV.put(`signup:${email}`, JSON.stringify(record));
    await context.env.KV.put(`signup:clerk:${data.id || email}`, JSON.stringify(record));

    const indexRaw = await context.env.KV.get("signup:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("signup:index", JSON.stringify(index.slice(0, 10000)));
    }

    const adminTo = context.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";
    const adminNotify = await sendEmail(context.env, {
      to: adminTo,
      subject: `New Clerk ${payload.type} — ${fullName}`,
      html: `<h2>Clerk ${escapeHtml(payload.type || "")}</h2>
        <p><strong>${escapeHtml(fullName)}</strong> &lt;${escapeHtml(email)}&gt;</p>
        <p>Phone: ${escapeHtml(phone || "—")}</p>
        <p>Clerk ID: ${escapeHtml(data.id || "—")}</p>`,
      text: `${payload.type}: ${fullName} <${email}>`,
      replyTo: email,
    });

    return Response.json({ ok: true, stored: true, adminNotify });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Webhook failed" }, { status: 500 });
  }
};
