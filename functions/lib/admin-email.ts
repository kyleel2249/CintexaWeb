import { escapeHtml } from "./email";
import type { RequestMeta } from "./events";

/**
 * Security e-mails to the CINTEXA inbox. They carry the admin USERNAME and what happened, never a password:
 * e-mail is stored in inboxes and backups indefinitely, so credentials must not travel through it.
 */

const where = (m: RequestMeta) =>
  [m.city, m.region, m.country].filter(Boolean).join(", ") || "unknown location";

const shell = (title: string, body: string) => `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;color:#0B0F14;line-height:1.55">
    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 10px">CINTEXA · Admin security</p>
    <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#777">This message never contains a password. If you did not expect it, sign in to
    the admin console and review the Audit tab.</p>
  </div>`;

const row = (k: string, v: string) =>
  `<tr><td style="padding:4px 14px 4px 0;color:#666">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`;

export function adminSetupLinkEmail(link: string, minutes: number) {
  return {
    subject: "Set up CINTEXA admin access",
    html: shell(
      "Set up admin access",
      `<p>Someone asked to create the first administrator for the CINTEXA admin console. If that was you, choose your
       username and password on the page below. The link works once and expires in ${minutes} minutes.</p>
       <p style="margin:20px 0"><a href="${escapeHtml(link)}" style="background:#0B0F14;color:#F7F4EE;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">Create admin account</a></p>
       <p style="font-size:13px;color:#555;word-break:break-all">${escapeHtml(link)}</p>`,
    ),
    text: `Set up CINTEXA admin access\n\nChoose your username and password here (one-time link, expires in ${minutes} minutes):\n${link}\n\nThis message never contains a password.`,
  };
}

export function adminResetLinkEmail(username: string, link: string, minutes: number) {
  return {
    subject: `Reset the CINTEXA admin password for ${username}`,
    html: shell(
      "Reset admin password",
      `<p>A password reset was requested for the admin account <strong>${escapeHtml(username)}</strong>. If that was you, choose a
       new password on the page below. The link works once and expires in ${minutes} minutes. If it wasn't you, ignore this email.</p>
       <p style="margin:20px 0"><a href="${escapeHtml(link)}" style="background:#0B0F14;color:#F7F4EE;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">Choose a new password</a></p>
       <p style="font-size:13px;color:#555;word-break:break-all">${escapeHtml(link)}</p>`,
    ),
    text: `A password reset was requested for admin "${username}".\nChoose a new password (one-time link, expires in ${minutes} minutes):\n${link}\n\nIf it wasn't you, ignore this email. This message never contains a password.`,
  };
}

export function adminLoginAlertEmail(username: string, meta: RequestMeta, at: Date) {
  return {
    subject: `Admin sign-in: ${username}`,
    html: shell(
      "Admin sign-in",
      `<table style="border-collapse:collapse;font-size:14px">${row("Admin username", username)}${row("When", at.toUTCString())}${row("IP address", meta.ip ?? "unknown")}${row("Location", where(meta))}${row("Browser", meta.userAgent ?? "unknown")}</table>`,
    ),
    text: `Admin sign-in\nUsername: ${username}\nWhen: ${at.toUTCString()}\nIP: ${meta.ip ?? "unknown"}\nLocation: ${where(meta)}\nBrowser: ${meta.userAgent ?? "unknown"}`,
  };
}

export function adminNoticeEmail(title: string, username: string, meta: RequestMeta, at: Date) {
  return {
    subject: `${title}: ${username}`,
    html: shell(
      title,
      `<table style="border-collapse:collapse;font-size:14px">${row("Admin username", username)}${row("When", at.toUTCString())}${row("IP address", meta.ip ?? "unknown")}${row("Location", where(meta))}</table>`,
    ),
    text: `${title}\nUsername: ${username}\nWhen: ${at.toUTCString()}\nIP: ${meta.ip ?? "unknown"}\nLocation: ${where(meta)}`,
  };
}
