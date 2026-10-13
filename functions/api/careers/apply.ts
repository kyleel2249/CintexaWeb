/**
 * POST /api/careers/apply — an application for one open vacancy.
 * Protected by: server-side vacancy check, validation, honeypot, per-IP rate limit and a duplicate guard.
 */
import { corsHeaders } from "../../lib/cintexa-auth";
import { applicationAdminEmail, applicationConfirmationEmail } from "../../lib/application-email";
import { findOpenJob } from "../../lib/jobs";
import { clientIp, rateLimit } from "../../lib/ratelimit";
import { recordEvent, requestMeta, userIdForEmail } from "../../lib/events";
import { sendEmail } from "../../lib/email";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
}

type Body = {
  jobSlug?: unknown;
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  message?: unknown;
  website?: unknown;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function validPhone(v: string): boolean {
  const digits = v.replace(/\D/g, "").length;
  return /^\+?[\d\s().-]{7,25}$/.test(v) && digits >= 7 && digits <= 15;
}

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const headers = corsHeaders({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  try {
    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400, headers });
    }

    // Bots fill hidden fields. Pretend it worked, store nothing, send nothing.
    if (typeof body.website === "string" && body.website.trim()) {
      return Response.json({ ok: true, id: crypto.randomUUID() }, { headers });
    }

    const limit = await rateLimit(env.KV, `rl:apply:ip:${clientIp(request)}`, 8, 3600);
    if (!limit.ok) {
      return Response.json(
        { error: "Too many applications from this connection. Please try again later." },
        { status: 429, headers: { ...headers, "Retry-After": String(limit.retryAfter) } },
      );
    }

    const fullName = str(body.fullName, 120);
    const email = str(body.email, 254).toLowerCase();
    const phone = str(body.phone, 40);
    const location = str(body.location, 120);
    const message = str(body.message, 1500);

    const fieldErrors: Record<string, string> = {};
    if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
    if (email && !EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
    if (phone && !validPhone(phone)) fieldErrors.phone = "Enter a valid phone number.";
    if (!email && !phone) fieldErrors.email = fieldErrors.email ?? "Enter an email address or a phone number.";
    if (Object.keys(fieldErrors).length) {
      return Response.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400, headers });
    }

    const job = findOpenJob(body.jobSlug);
    if (!job) return Response.json({ error: "This vacancy is no longer open." }, { status: 404, headers });

    const contactKey = (email || phone.replace(/\D/g, "")).toLowerCase();
    const dedupeKey = `application:dedupe:${job.slug}:${contactKey}`;
    if (await env.KV.get(dedupeKey)) {
      return Response.json({ error: "You’ve already applied for this vacancy." }, { status: 409, headers });
    }

    const record = {
      id: crypto.randomUUID(),
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      location: location || undefined,
      message: message || undefined,
      jobSlug: job.slug,
      jobTitle: job.title,
      jobRole: job.role,
      employerName: job.employerName,
      createdAt: new Date().toISOString(),
    };

    await env.KV.put(`application:${record.id}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 180 });
    await env.KV.put(dedupeKey, record.id, { expirationTtl: 60 * 60 * 24 * 7 });

    await recordEvent(env, { type: "application", userId: await userIdForEmail(env.KV, email), email: email || undefined, ...requestMeta(request), detail: job.slug });

    // Emails are best-effort: the application is already safely stored.
    const adminTo = env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";
    const adminMail = applicationAdminEmail(record);
    const [admin, applicant] = await Promise.all([
      sendEmail(env, { to: adminTo, ...adminMail, replyTo: email || undefined, tags: [{ name: "category", value: "career_application_admin" }] }),
      email
        ? sendEmail(env, { to: email, ...applicationConfirmationEmail(record), tags: [{ name: "category", value: "career_application_confirm" }] })
        : Promise.resolve(null),
    ]);

    return Response.json(
      { ok: true, id: record.id, emailed: { admin: admin.ok, applicant: applicant ? applicant.ok : null } },
      { status: 201, headers },
    );
  } catch (err) {
    console.error("careers/apply", err);
    return Response.json({ error: "We couldn’t send your application. Please try again." }, { status: 500, headers });
  }
};
