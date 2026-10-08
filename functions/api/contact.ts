import { escapeHtml, sendEmail } from "../lib/email";

export interface Env {
  RESEND_API_KEY?: string;
  RESEND_KEY?: string;
  RESEND_TOKEN?: string;
  RESEND_API_TOKEN?: string;
  EMAIL_FROM?: string;
  RESEND_FROM?: string;
  FROM_EMAIL?: string;
  KV?: KVNamespace;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 12_000;
const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 5;
type ContactPayload = { name?: unknown; email?: unknown; business?: unknown; subject?: unknown; message?: unknown; website?: unknown };

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function json(data: Record<string, unknown>, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const contentLength = Number(context.request.headers.get("content-length") || "0");
    if (contentLength > MAX_BODY) return json({ ok: false, message: "Your message is too large. Please shorten it and try again." }, 413);
    const payload = (await context.request.json()) as ContactPayload;
    if (clean(payload.website, 200)) return json({ ok: true, message: "Your enquiry has been sent successfully." });

    const name = clean(payload.name, 120);
    const email = clean(payload.email, 254).toLowerCase();
    const business = clean(payload.business, 160);
    const subject = clean(payload.subject, 180) || "CINTEXA project enquiry";
    const message = clean(payload.message, 5000);
    if (name.length < 2) return json({ ok: false, message: "Please enter your name." }, 400);
    if (!EMAIL_RE.test(email)) return json({ ok: false, message: "Please enter a valid email address." }, 400);
    if (message.length < 10) return json({ ok: false, message: "Please provide a little more detail so we can help." }, 400);

    if (context.env.KV) {
      const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `contact-rate:${ip.replace(/[^a-zA-Z0-9_.:-]/g, "_")}`;
      const count = Number((await context.env.KV.get(key)) || "0");
      if (count >= MAX_PER_WINDOW) return json({ ok: false, message: "Too many enquiries have been sent from this connection. Please wait a minute and try again." }, 429);
      await context.env.KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeBusiness = escapeHtml(business || "Not provided");
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
    const result = await sendEmail(context.env, {
      to: "info@cintexa.com",
      replyTo: email,
      subject: `CINTEXA website enquiry: ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#172033"><h1 style="font-size:22px">New website enquiry</h1><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;font-weight:700">Name</td><td style="padding:8px">${safeName}</td></tr><tr><td style="padding:8px;font-weight:700">Email</td><td style="padding:8px"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr><tr><td style="padding:8px;font-weight:700">Business</td><td style="padding:8px">${safeBusiness}</td></tr><tr><td style="padding:8px;font-weight:700">Subject</td><td style="padding:8px">${safeSubject}</td></tr></table><h2 style="font-size:17px;margin-top:24px">Message</h2><p style="line-height:1.7">${safeMessage}</p></div>`,
      text: `New CINTEXA website enquiry\n\nName: ${name}\nEmail: ${email}\nBusiness: ${business || "Not provided"}\nSubject: ${subject}\n\nMessage:\n${message}`,
      tags: [{ name: "type", value: "website_contact" }, { name: "category", value: "inbound_enquiry" }],
    }, { allowDryRun: false });
    if (!result.ok || result.dryRun) {
      console.error(JSON.stringify({ msg: "contact_email_delivery_failed", status: result.ok ? undefined : result.status, error: result.ok ? "dry_run_not_sent" : result.error }));
      return json({ ok: false, message: "We could not send your enquiry right now. Please try again in a moment." }, 502);
    }
    return json({ ok: true, message: "Your enquiry has been sent successfully." });
  } catch (error) {
    console.error("contact_submit_failed", error instanceof Error ? error.message : "unknown_error");
    return json({ ok: false, message: "We could not send your enquiry right now. Please try again in a moment." }, 500);
  }
};
