import { localParts } from "@/lib/greetings/greeting";

/**
 * Date-of-birth helpers (the server applies the same rules — functions/lib/birthday.ts — and a test
 * keeps the two in step). Dates are "YYYY-MM-DD" strings, never Date objects, so there are no
 * time-zone shifts.
 */
export const MIN_AGE = 13;
export const MIN_YEAR = 1900;

const DOB_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DobResult = { ok: true; value: string } | { ok: false; error: string };

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

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

const pad = (n: number) => String(n).padStart(2, "0");

/** Latest selectable date of birth for the <input type="date"> (today minus MIN_AGE years). */
export function maxDob(today: Date = new Date()): string {
  return `${today.getFullYear() - MIN_AGE}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}
export const MIN_DOB = `${MIN_YEAR}-01-01`;

/** 29 Feb is celebrated on 28 Feb in non-leap years. */
export function effectiveMonthDay(dob: string, year: number): string {
  const md = dob.slice(5, 10);
  return md === "02-29" && !isLeapYear(year) ? "02-28" : md;
}

/** True when it is the user's birthday in the user's own time zone. */
export function isBirthdayToday(dob: string | null | undefined, now: Date = new Date(), timeZone?: string): boolean {
  if (!dob || !DOB_RE.test(dob)) return false;
  const p = localParts(now, timeZone);
  return `${pad(p.month)}-${pad(p.day)}` === effectiveMonthDay(dob, p.year);
}

/** "5 March" style label for a stored date of birth, in the user's locale (no year). */
export function formatBirthdayLabel(dob: string, locale?: string): string {
  const [, , m, d] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob) ?? [];
  if (!m || !d) return "";
  return new Date(Date.UTC(2000, Number(m) - 1, Number(d))).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
