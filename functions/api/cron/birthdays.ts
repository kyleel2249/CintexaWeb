/**
 * POST /api/cron/birthdays — sends the birthday e-mail to everyone whose birthday it is *in their
 * own time zone* (from 06:00 local), at most once per year.
 *
 * Cloudflare Pages has no cron, so a GitHub Actions workflow (.github/workflows/birthday-wishes.yml)
 * calls this hourly with `Authorization: Bearer $CRON_SECRET`. Set CRON_SECRET as a Pages secret and
 * as a GitHub repository secret. Add `?dryRun=1` to see who would receive an e-mail without sending.
 */
import { corsHeaders, userKey, type StoredUser } from "../../lib/cintexa-auth";
import { birthdayEmailContent } from "../../lib/birthday-email";
import {
  SEND_FROM_HOUR,
  birthdaySentKey,
  candidateMonthDays,
  effectiveMonthDay,
  emailsForMonthDays,
  isValidTimeZone,
  localParts,
} from "../../lib/birthday";
import { sendEmail } from "../../lib/email";

export interface Env {
  KV: KVNamespace;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type BirthdayRunSummary = {
  checked: number;
  sent: number;
  wouldSend: string[];
  skipped: { notYet: number; notToday: number; optedOut: number; alreadySent: number; noDob: number };
  failed: { email: string; error: string }[];
};

export async function runBirthdays(env: Env, now: Date, dryRun: boolean): Promise<BirthdayRunSummary> {
  const summary: BirthdayRunSummary = {
    checked: 0,
    sent: 0,
    wouldSend: [],
    skipped: { notYet: 0, notToday: 0, optedOut: 0, alreadySent: 0, noDob: 0 },
    failed: [],
  };

  const emails = await emailsForMonthDays(env.KV, candidateMonthDays(now));
  for (const email of emails) {
    summary.checked++;
    const raw = await env.KV.get(userKey(email));
    if (!raw) continue;
    let user: StoredUser;
    try {
      user = JSON.parse(raw) as StoredUser;
    } catch {
      continue;
    }
    if (!user.dateOfBirth) {
      summary.skipped.noDob++;
      continue;
    }
    if (user.birthdayEmail === false) {
      summary.skipped.optedOut++;
      continue;
    }

    const tz = isValidTimeZone(user.timeZone) ? user.timeZone : "UTC";
    const local = localParts(now, tz);
    const todayMd = `${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
    if (todayMd !== effectiveMonthDay(user.dateOfBirth, local.year)) {
      summary.skipped.notToday++;
      continue;
    }
    if (local.hour < SEND_FROM_HOUR) {
      summary.skipped.notYet++;
      continue;
    }
    const sentKey = birthdaySentKey(user.id, local.year);
    if (await env.KV.get(sentKey)) {
      summary.skipped.alreadySent++;
      continue;
    }

    if (dryRun) {
      summary.wouldSend.push(email);
      continue;
    }

    const content = birthdayEmailContent(user, local.year);
    // allowDryRun:false → if e-mail isn't configured we must NOT record the wish as sent.
    const result = await sendEmail(
      env,
      { to: email, ...content, tags: [{ name: "type", value: "birthday" }] },
      { allowDryRun: false },
    );
    if (result.ok) {
      summary.sent++;
      await env.KV.put(sentKey, new Date().toISOString(), { expirationTtl: 60 * 60 * 24 * 400 });
    } else {
      summary.failed.push({ email, error: result.error });
    }
  }
  return summary;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const headers = corsHeaders({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  if (!env.CRON_SECRET) {
    return Response.json({ error: "CRON_SECRET is not configured." }, { status: 503, headers });
  }
  const auth = request.headers.get("Authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${env.CRON_SECRET}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  try {
    const summary = await runBirthdays(env, new Date(), dryRun);
    console.log(JSON.stringify({ msg: "birthday_run", dryRun, ...summary, wouldSend: summary.wouldSend.length }));
    return Response.json({ ok: true, dryRun, ...summary }, { headers });
  } catch (err) {
    console.error("cron/birthdays", err);
    return Response.json({ error: "Birthday run failed." }, { status: 500, headers });
  }
};
