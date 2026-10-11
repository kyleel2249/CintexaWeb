/**
 * Date-of-birth rules and the KV "birthday index" used by the birthday-email job.
 *
 * dateOfBirth is stored as "YYYY-MM-DD". Because the daily job must not scan every user, each
 * user's e-mail is also listed under `bday:MM-DD`, so the job only reads the few days that could be
 * "today" somewhere in the world.
 */

export const MIN_AGE = 13;
export const MIN_YEAR = 1900;
/** Local hour (in the user's time zone) from which the wish may be sent. */
export const SEND_FROM_HOUR = 6;

const DOB_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DobResult = { ok: true; value: string } | { ok: false; error: string };

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** A real calendar date, from 1900, not in the future, and the person is at least MIN_AGE. */
export function validateDob(value: unknown, today: Date = new Date()): DobResult {
  if (typeof value !== "string" || !DOB_RE.test(value.trim())) {
    return { ok: false, error: "Enter your date of birth as a valid date." };
  }
  const v = value.trim();
  const [, ys, ms, ds] = DOB_RE.exec(v)!;
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return { ok: false, error: "That date doesn’t exist. Check the day and month." };
  }
  if (y < MIN_YEAR) return { ok: false, error: "Enter a valid year of birth." };

  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (dt.getTime() > t) return { ok: false, error: "Your date of birth can’t be in the future." };

  const cutoff = Date.UTC(today.getUTCFullYear() - MIN_AGE, today.getUTCMonth(), today.getUTCDate());
  if (dt.getTime() > cutoff) return { ok: false, error: `You must be at least ${MIN_AGE} years old to create an account.` };
  return { ok: true, value: v };
}

/** "MM-DD" of a stored date of birth. */
export function monthDay(dob: string): string {
  return dob.slice(5, 10);
}

/** The "MM-DD" on which to celebrate in `year` (29 Feb is celebrated on 28 Feb in non-leap years). */
export function effectiveMonthDay(dob: string, year: number): string {
  const md = monthDay(dob);
  return md === "02-29" && !isLeapYear(year) ? "02-28" : md;
}

export const birthdayIndexKey = (md: string) => `bday:${md}`;
export const birthdaySentKey = (userId: string, year: number) => `birthday:sent:${userId}:${year}`;

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export type LocalParts = { year: number; month: number; day: number; hour: number };

export function localParts(now: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24 };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Every "MM-DD" that could be "today" for someone on Earth right now (UTC−12 … UTC+14 spans three
 * calendar days), including 29 Feb whenever 28 Feb is among them in a non-leap year.
 */
export function candidateMonthDays(now: Date): string[] {
  const out = new Set<string>();
  for (const offset of [-1, 0, 1]) {
    const d = new Date(now.getTime() + offset * 86_400_000);
    out.add(`${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`);
    if (d.getUTCMonth() === 1 && d.getUTCDate() === 28 && !isLeapYear(d.getUTCFullYear())) out.add("02-29");
  }
  return [...out];
}

async function readList(kv: KVNamespace, md: string): Promise<string[]> {
  const raw = await kv.get(birthdayIndexKey(md));
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Keeps `bday:MM-DD` lists in step when a date of birth is added, changed or removed. */
export async function updateBirthdayIndex(
  kv: KVNamespace,
  email: string,
  previousDob: string | undefined | null,
  nextDob: string | undefined | null,
): Promise<void> {
  const from = previousDob ? monthDay(previousDob) : null;
  const to = nextDob ? monthDay(nextDob) : null;
  if (from === to) {
    if (to) {
      const list = await readList(kv, to);
      if (!list.includes(email)) await kv.put(birthdayIndexKey(to), JSON.stringify([...list, email]));
    }
    return;
  }
  if (from) {
    const list = (await readList(kv, from)).filter((e) => e !== email);
    if (list.length) await kv.put(birthdayIndexKey(from), JSON.stringify(list));
    else await kv.delete(birthdayIndexKey(from));
  }
  if (to) {
    const list = await readList(kv, to);
    if (!list.includes(email)) await kv.put(birthdayIndexKey(to), JSON.stringify([...list, email]));
  }
}

export async function emailsForMonthDays(kv: KVNamespace, monthDays: string[]): Promise<string[]> {
  const lists = await Promise.all(monthDays.map((md) => readList(kv, md)));
  return [...new Set(lists.flat())];
}
