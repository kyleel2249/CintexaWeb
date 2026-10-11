import { isBirthdayToday } from "@/lib/birthday";
import { localParts } from "@/lib/greetings/greeting";

const key = (userId: string, year: number) => `cintexa_bday_seen_${userId}_${year}`;

function stores(): Storage[] {
  const out: Storage[] = [];
  try {
    out.push(localStorage);
  } catch {
    /* blocked */
  }
  try {
    out.push(sessionStorage);
  } catch {
    /* blocked */
  }
  return out;
}

/** True when it's the user's birthday today and the splash hasn't been shown yet this year. */
export function shouldShowBirthdaySplash(
  userId: string | null | undefined,
  dob: string | null | undefined,
  now: Date = new Date(),
  timeZone?: string,
): boolean {
  if (!userId || !isBirthdayToday(dob, now, timeZone)) return false;
  const k = key(userId, localParts(now, timeZone).year);
  return !stores().some((s) => {
    try {
      return s.getItem(k) === "1";
    } catch {
      return false;
    }
  });
}

/** Remember it was shown (once per birthday, per browser). */
export function markBirthdaySplashSeen(userId: string, now: Date = new Date(), timeZone?: string): void {
  const k = key(userId, localParts(now, timeZone).year);
  for (const s of stores()) {
    try {
      s.setItem(k, "1");
    } catch {
      /* ignore */
    }
  }
}
