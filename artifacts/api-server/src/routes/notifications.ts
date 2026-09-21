import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendEmail } from "../lib/email.js";

export const notificationsRouter = Router();

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many signup attempts. Try again later." },
});

const careerAlertSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  education: z.string().trim().max(120).optional().default(""),
  interests: z.array(z.string().max(80)).max(20).optional().default([]),
  message: z.string().trim().max(2000).optional().default(""),
  source: z.string().trim().max(64).optional().default("careers_page"),
});

/**
 * Public endpoint: career / scholarship alert signup.
 * Sends confirmation to the subscriber and a copy to NOTIFY_ADMIN_EMAIL / info@.
 * Persistence of subscribers at scale should use the KV-backed Pages Function
 * or a future email_subscriptions table migration.
 */
notificationsRouter.post("/career-alert", signupLimiter, async (req, res) => {
  const parsed = careerAlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const data = {
    ...parsed.data,
    email: parsed.data.email.toLowerCase(),
  };

  const adminTo = process.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";

  const confirmation = await sendEmail({
    to: data.email,
    subject: "You're subscribed to CINTEXA job & scholarship alerts",
    html: `<p>Hi ${escapeHtml(data.fullName)},</p>
      <p>Thanks for signing up. We'll email you when new jobs and scholarships are posted.</p>
      <p>— CINTEXA</p>`,
    text: `Hi ${data.fullName}, thanks for signing up for CINTEXA job and scholarship alerts.`,
  });

  const adminNotify = await sendEmail({
    to: adminTo,
    subject: `New career alert signup — ${data.fullName}`,
    html: `<h2>New career / scholarship alert signup</h2>
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`,
    text: `New signup: ${data.fullName} <${data.email}>`,
    replyTo: data.email,
  });

  res.json({
    ok: true,
    confirmation,
    adminNotify,
  });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
