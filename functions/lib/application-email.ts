import { escapeHtml } from "./email";

type Application = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  message?: string;
  jobTitle: string;
  jobRole: string;
  jobSlug: string;
  employerName?: string;
  createdAt: string;
};

const row = (k: string, v?: string) =>
  v ? `<tr><td style="padding:4px 12px 4px 0;color:#666">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>` : "";

/** Sent to the CINTEXA team for every new application. All applicant text is HTML-escaped. */
export function applicationAdminEmail(a: Application) {
  const url = `https://cintexa.com/careers/${a.jobSlug}`;
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0B0F14;line-height:1.5">
    <h2 style="margin:0 0 12px">New application — ${escapeHtml(a.jobRole)}</h2>
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Vacancy", a.jobTitle)}${row("Employer", a.employerName)}
      ${row("Name", a.fullName)}${row("Email", a.email)}${row("Phone", a.phone)}${row("Location", a.location)}
      ${row("Reference", a.id.slice(0, 8).toUpperCase())}${row("Received", a.createdAt)}
    </table>
    ${a.message ? `<p style="white-space:pre-wrap;margin-top:16px">${escapeHtml(a.message)}</p>` : ""}
    <p style="margin-top:20px"><a href="${url}">${url}</a></p>
  </div>`;
  const text = [
    `New application — ${a.jobRole}`,
    `Vacancy: ${a.jobTitle}`,
    a.employerName ? `Employer: ${a.employerName}` : "",
    `Name: ${a.fullName}`,
    a.email ? `Email: ${a.email}` : "",
    a.phone ? `Phone: ${a.phone}` : "",
    a.location ? `Location: ${a.location}` : "",
    `Reference: ${a.id.slice(0, 8).toUpperCase()}`,
    a.message ? `\n${a.message}` : "",
    `\n${url}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject: `New application — ${a.jobRole} (${a.fullName})`, html, text };
}

/** Sent to the applicant (when they gave an email). */
export function applicationConfirmationEmail(a: Application) {
  const first = a.fullName.trim().split(/\s+/)[0] || "there";
  const html = `
  <div style="font-family:system-ui,sans-serif;max-width:560px;color:#0B0F14;line-height:1.55">
    <h2 style="margin:0 0 12px">We’ve received your application</h2>
    <p>Hi ${escapeHtml(first)}, thank you for applying for <strong>${escapeHtml(a.jobRole)}</strong>.</p>
    <p>Your reference is <strong>${escapeHtml(a.id.slice(0, 8).toUpperCase())}</strong>.</p>
    <p style="margin-top:24px">The CINTEXA Team</p>
  </div>`;
  const text = `Hi ${first}, thank you for applying for ${a.jobRole}. Your reference is ${a.id.slice(0, 8).toUpperCase()}.\n\nThe CINTEXA Team`;
  return { subject: `We’ve received your application — ${a.jobRole}`, html, text };
}
