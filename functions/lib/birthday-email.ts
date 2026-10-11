import { escapeHtml } from "./email";

const MESSAGES = [
  "We hope your day is filled with good people, good food and plenty of reasons to smile.",
  "Wishing you a year of progress, health and happiness — and a day to enjoy it all.",
  "May the year ahead bring you new opportunities and everything you’re working towards.",
  "Today is all about you. Take a moment to celebrate how far you’ve come.",
];

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim() || "there";
}

/** A short, warm message; the wording varies per person and per year but never makes claims. */
export function birthdayEmailContent(user: { id: string; fullName: string }, year: number) {
  const name = firstName(user.fullName);
  const message = MESSAGES[hash(`${user.id}|${year}`) % MESSAGES.length]!;
  const subject = `Happy Birthday, ${name}! 🎂 — from all of us at CINTEXA`;
  const settingsUrl = "https://cintexa.com/dashboard/settings";

  const html = `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0B0F14;line-height:1.55">
    <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#B8860B;margin:0 0 12px">CINTEXA</p>
    <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">Happy Birthday, ${escapeHtml(name)}! 🎉🎂</h1>
    <p>${escapeHtml(message)}</p>
    <p>Thank you for being part of CINTEXA. It’s a pleasure to have you with us.</p>
    <p style="margin:24px 0">
      <a href="https://cintexa.com/dashboard" style="background:#0B0F14;color:#F7F4EE;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;display:inline-block">Open your dashboard</a>
    </p>
    <p style="margin-top:28px">With warm wishes,<br/><strong>The CINTEXA Team</strong></p>
    <p style="margin-top:32px;font-size:12px;color:#777">
      You’re receiving this because you added your date of birth to your CINTEXA account.
      To stop these emails, remove your date of birth in
      <a href="${settingsUrl}" style="color:#777">Settings</a>.
    </p>
  </div>`;

  const text = `Happy Birthday, ${name}! 🎂

${message}

Thank you for being part of CINTEXA. It’s a pleasure to have you with us.

Open your dashboard: https://cintexa.com/dashboard

With warm wishes,
The CINTEXA Team

You’re receiving this because you added your date of birth to your CINTEXA account.
To stop these emails, remove your date of birth in Settings: ${settingsUrl}`;

  return { subject, html, text };
}
