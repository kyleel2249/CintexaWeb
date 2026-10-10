/**
 * Holidays and observances used to colour the sign-in greeting.
 *
 * Only dates that can be computed reliably are included: fixed-date national days, "nth weekday"
 * rules, Western Easter (computed), and Eid / Ramadan from the built-in Umm al-Qura calendar.
 * Lunar festivals that depend on local moon sighting or a lunisolar calendar (Diwali, Lunar New
 * Year, Orthodox Easter …) are deliberately left out rather than guessed.
 */

export type CalendarDate = { year: number; month: number; day: number };

export type Holiday = {
  id: string;
  /** Short name, e.g. "Independence Day". */
  name: string;
  /** What we say, e.g. "Happy Independence Day". */
  greeting: string;
  /** Extra line shown under the greeting. */
  note?: string;
  emoji?: string;
  /** Higher wins when several fall on the same day. */
  priority: number;
};

type Rule = {
  id: string;
  name: string;
  greeting: string;
  note?: (year: number) => string | undefined;
  emoji?: string;
  priority: number;
  /** Omit for "everywhere". */
  countries?: readonly string[];
  /** Dates (month 1–12, day) the holiday falls on in `year`. */
  on: (year: number) => ReadonlyArray<readonly [number, number]>;
};

// ---------- date helpers (pure UTC maths, no time-zone surprises) ----------

const dayOfWeek = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

/** nth (1-based) given weekday (0 = Sunday) of a month. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = dayOfWeek(year, month, 1);
  return 1 + ((7 + weekday - first) % 7) + (n - 1) * 7;
}

export function lastWeekday(year: number, month: number, weekday: number): number {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDow = dayOfWeek(year, month, last);
  return last - ((7 + lastDow - weekday) % 7);
}

/** Western (Gregorian) Easter Sunday — Anonymous Gregorian algorithm. */
export function easterSunday(year: number): readonly [number, number] {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

function shift(year: number, month: number, day: number, delta: number): readonly [number, number] {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return [d.getUTCMonth() + 1, d.getUTCDate()];
}

/** Islamic (Umm al-Qura) month/day for a Gregorian date, or null where Intl lacks the calendar. */
export function hijriMonthDay(year: number, month: number, day: number): { month: number; day: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "UTC",
      day: "numeric",
      month: "numeric",
    }).formatToParts(new Date(Date.UTC(year, month - 1, day, 12)));
    const m = Number(parts.find((p) => p.type === "month")?.value);
    const d = Number(parts.find((p) => p.type === "day")?.value);
    return Number.isFinite(m) && Number.isFinite(d) ? { month: m, day: d } : null;
  } catch {
    return null;
  }
}

// ---------- country groups ----------

const WESTERN_EASTER = [
  "GH", "NG", "KE", "ZA", "UG", "TZ", "RW", "ZM", "ZW", "MW", "BW", "NA", "LS", "SZ", "CM", "CD", "AO", "MZ", "LR",
  "SL", "TG", "BJ", "CI", "US", "CA", "MX", "BR", "AR", "CO", "CL", "PE", "GB", "IE", "FR", "DE", "ES", "PT", "IT",
  "NL", "BE", "LU", "AT", "CH", "SE", "NO", "DK", "FI", "PL", "CZ", "SK", "HU", "HR", "SI", "AU", "NZ", "PH",
] as const;

/** Where Christmas is widely celebrated (positive list so we never mis-greet). */
const CHRISTMAS = [
  ...WESTERN_EASTER,
  "SS", "BI", "GA", "CG", "ET", "JM", "TT", "BB", "BS", "GY", "PR", "DO", "EC", "VE", "UA", "RO", "BG", "GR", "EE",
  "LV", "LT", "IS", "IN", "KR", "LK", "FJ", "PG", "WS",
] as const;

const EID = [
  "GH", "NG", "KE", "TZ", "UG", "SN", "ML", "NE", "GM", "GN", "SL", "BF", "TD", "SD", "SO", "DJ", "EG", "MA", "DZ",
  "TN", "LY", "MR", "SA", "AE", "QA", "KW", "BH", "OM", "JO", "LB", "SY", "IQ", "TR", "PK", "BD", "ID", "MY", "BN",
  "MV", "IN",
] as const;

const MOTHERS_DAY_MAY = ["GH", "NG", "KE", "ZA", "US", "CA", "IN", "AU", "NZ", "PH"] as const;
const FATHERS_DAY_JUNE = ["GH", "NG", "KE", "ZA", "US", "CA", "IN", "GB", "IE", "FR", "NL", "BE"] as const;
const LABOUR_DAY = [
  "GH", "NG", "KE", "ZA", "UG", "TZ", "RW", "ZM", "ZW", "GB", "IE", "FR", "DE", "ES", "PT", "IT", "NL", "BE", "IN",
  "BR", "MX", "AR", "PH", "AU",
] as const;
const HALLOWEEN = ["US", "CA", "GB", "IE", "AU", "NZ"] as const;

const anniversary = (since: number, what: string) => (year: number) =>
  year > since ? `${what} turns ${year - since} today.` : undefined;

// ---------- rules ----------

const fixed = (m: number, d: number) => (): ReadonlyArray<readonly [number, number]> => [[m, d]];

const RULES: Rule[] = [
  // Everywhere
  { id: "new-year", name: "New Year’s Day", greeting: "Happy New Year", emoji: "🎆", priority: 100, on: fixed(1, 1),
    note: (y) => `Here’s to a great ${y}.` },
  { id: "new-year-eve", name: "New Year’s Eve", greeting: "Happy New Year’s Eve", emoji: "🥂", priority: 70, on: fixed(12, 31) },
  { id: "womens-day", name: "International Women’s Day", greeting: "Happy International Women’s Day", emoji: "💜", priority: 60, on: fixed(3, 8) },
  { id: "valentines", name: "Valentine’s Day", greeting: "Happy Valentine’s Day", emoji: "💝", priority: 50, on: fixed(2, 14) },

  // Christian calendar
  { id: "christmas", name: "Christmas Day", greeting: "Merry Christmas", emoji: "🎄", priority: 100, countries: CHRISTMAS, on: fixed(12, 25) },
  { id: "christmas-eve", name: "Christmas Eve", greeting: "Merry Christmas Eve", emoji: "🎄", priority: 80, countries: CHRISTMAS, on: fixed(12, 24) },
  { id: "good-friday", name: "Good Friday", greeting: "Blessed Good Friday", priority: 100, countries: WESTERN_EASTER,
    on: (y) => { const [m, d] = easterSunday(y); return [shift(y, m, d, -2)]; } },
  { id: "easter-sunday", name: "Easter Sunday", greeting: "Happy Easter", emoji: "🐣", priority: 100, countries: WESTERN_EASTER,
    on: (y) => [easterSunday(y)] },
  { id: "easter-monday", name: "Easter Monday", greeting: "Happy Easter Monday", priority: 90, countries: WESTERN_EASTER,
    on: (y) => { const [m, d] = easterSunday(y); return [shift(y, m, d, 1)]; } },
  { id: "boxing-day", name: "Boxing Day", greeting: "Happy Boxing Day", priority: 90,
    countries: ["GH", "NG", "KE", "ZA", "GB", "IE", "CA", "AU", "NZ"], on: fixed(12, 26) },

  // Eid / Ramadan (Umm al-Qura calendar — can differ by a day from local moon sighting, so each is
  // greeted for two days and phrased for "all who celebrate")
  { id: "ramadan", name: "Ramadan", greeting: "Ramadan Mubarak", emoji: "🌙", priority: 90, countries: EID,
    note: () => "Wishing all who observe a blessed month.",
    on: (y) => hijriDays(y, 9, [1, 2]) },
  { id: "eid-al-fitr", name: "Eid al-Fitr", greeting: "Eid Mubarak", emoji: "🌙", priority: 100, countries: EID,
    note: () => "Wishing all who celebrate a joyful Eid al-Fitr.",
    on: (y) => hijriDays(y, 10, [1, 2]) },
  { id: "eid-al-adha", name: "Eid al-Adha", greeting: "Eid Mubarak", emoji: "🌙", priority: 100, countries: EID,
    note: () => "Wishing all who celebrate a joyful Eid al-Adha.",
    on: (y) => hijriDays(y, 12, [10, 11]) },

  // Ghana
  { id: "gh-independence", name: "Independence Day", greeting: "Happy Independence Day", emoji: "🇬🇭", priority: 100, countries: ["GH"],
    note: anniversary(1957, "Ghana"), on: fixed(3, 6) },
  { id: "gh-republic", name: "Republic Day", greeting: "Happy Republic Day", emoji: "🇬🇭", priority: 100, countries: ["GH"], on: fixed(7, 1) },
  { id: "gh-founders", name: "Founders’ Day", greeting: "Happy Founders’ Day", emoji: "🇬🇭", priority: 100, countries: ["GH"], on: fixed(8, 4) },
  { id: "gh-nkrumah", name: "Kwame Nkrumah Memorial Day", greeting: "Happy Kwame Nkrumah Memorial Day", emoji: "🇬🇭", priority: 100, countries: ["GH"], on: fixed(9, 21) },
  { id: "gh-farmers", name: "Farmers’ Day", greeting: "Happy Farmers’ Day", emoji: "🌾", priority: 100, countries: ["GH"],
    on: (y) => { const first = dayOfWeek(y, 12, 1); return [[12, 1 + ((7 + 5 - first) % 7)]]; } },

  // Nigeria
  { id: "ng-independence", name: "Independence Day", greeting: "Happy Independence Day", emoji: "🇳🇬", priority: 100, countries: ["NG"],
    note: anniversary(1960, "Nigeria"), on: fixed(10, 1) },
  { id: "ng-democracy", name: "Democracy Day", greeting: "Happy Democracy Day", emoji: "🇳🇬", priority: 100, countries: ["NG"], on: fixed(6, 12) },

  // Kenya
  { id: "ke-madaraka", name: "Madaraka Day", greeting: "Happy Madaraka Day", emoji: "🇰🇪", priority: 100, countries: ["KE"], on: fixed(6, 1) },
  { id: "ke-mashujaa", name: "Mashujaa Day", greeting: "Happy Mashujaa Day", emoji: "🇰🇪", priority: 100, countries: ["KE"], on: fixed(10, 20) },
  { id: "ke-jamhuri", name: "Jamhuri Day", greeting: "Happy Jamhuri Day", emoji: "🇰🇪", priority: 100, countries: ["KE"],
    note: anniversary(1963, "Kenya"), on: fixed(12, 12) },

  // South Africa
  { id: "za-human-rights", name: "Human Rights Day", greeting: "Happy Human Rights Day", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(3, 21) },
  { id: "za-freedom", name: "Freedom Day", greeting: "Happy Freedom Day", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(4, 27) },
  { id: "za-youth", name: "Youth Day", greeting: "Happy Youth Day", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(6, 16) },
  { id: "za-womens", name: "National Women’s Day", greeting: "Happy National Women’s Day", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(8, 9) },
  { id: "za-heritage", name: "Heritage Day", greeting: "Happy Heritage Day", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(9, 24) },
  { id: "za-reconciliation", name: "Day of Reconciliation", greeting: "Happy Day of Reconciliation", emoji: "🇿🇦", priority: 100, countries: ["ZA"], on: fixed(12, 16) },

  // United States
  { id: "us-mlk", name: "Martin Luther King Jr. Day", greeting: "Happy Martin Luther King Jr. Day", priority: 90, countries: ["US"],
    on: (y) => [[1, nthWeekday(y, 1, 1, 3)]] },
  { id: "us-memorial", name: "Memorial Day", greeting: "Happy Memorial Day", priority: 90, countries: ["US"],
    on: (y) => [[5, lastWeekday(y, 5, 1)]] },
  { id: "us-juneteenth", name: "Juneteenth", greeting: "Happy Juneteenth", priority: 90, countries: ["US"], on: fixed(6, 19) },
  { id: "us-independence", name: "Independence Day", greeting: "Happy Fourth of July", emoji: "🇺🇸", priority: 100, countries: ["US"],
    note: (y) => (y === 2026 ? "Happy 250th birthday, America." : undefined), on: fixed(7, 4) },
  { id: "us-labor", name: "Labor Day", greeting: "Happy Labor Day", priority: 90, countries: ["US"],
    on: (y) => [[9, nthWeekday(y, 9, 1, 1)]] },
  { id: "us-veterans", name: "Veterans Day", greeting: "Happy Veterans Day", priority: 90, countries: ["US"], on: fixed(11, 11) },
  { id: "us-thanksgiving", name: "Thanksgiving", greeting: "Happy Thanksgiving", emoji: "🦃", priority: 100, countries: ["US"],
    on: (y) => [[11, nthWeekday(y, 11, 4, 4)]] },

  // Canada
  { id: "ca-day", name: "Canada Day", greeting: "Happy Canada Day", emoji: "🇨🇦", priority: 100, countries: ["CA"], on: fixed(7, 1) },
  { id: "ca-thanksgiving", name: "Thanksgiving", greeting: "Happy Thanksgiving", priority: 100, countries: ["CA"],
    on: (y) => [[10, nthWeekday(y, 10, 1, 2)]] },
  { id: "ca-remembrance", name: "Remembrance Day", greeting: "Remembrance Day", priority: 80, countries: ["CA"], on: fixed(11, 11) },

  // India
  { id: "in-republic", name: "Republic Day", greeting: "Happy Republic Day", emoji: "🇮🇳", priority: 100, countries: ["IN"], on: fixed(1, 26) },
  { id: "in-independence", name: "Independence Day", greeting: "Happy Independence Day", emoji: "🇮🇳", priority: 100, countries: ["IN"],
    note: anniversary(1947, "India"), on: fixed(8, 15) },
  { id: "in-gandhi", name: "Gandhi Jayanti", greeting: "Gandhi Jayanti greetings", priority: 80, countries: ["IN"], on: fixed(10, 2) },

  // Shared observances
  { id: "labour-day", name: "Workers’ Day", greeting: "Happy Workers’ Day", emoji: "🛠️", priority: 90, countries: LABOUR_DAY, on: fixed(5, 1) },
  { id: "mothers-day", name: "Mother’s Day", greeting: "Happy Mother’s Day", emoji: "💐", priority: 70, countries: MOTHERS_DAY_MAY,
    on: (y) => [[5, nthWeekday(y, 5, 0, 2)]] },
  { id: "fathers-day", name: "Father’s Day", greeting: "Happy Father’s Day", emoji: "👔", priority: 70, countries: FATHERS_DAY_JUNE,
    on: (y) => [[6, nthWeekday(y, 6, 0, 3)]] },
  { id: "halloween", name: "Halloween", greeting: "Happy Halloween", emoji: "🎃", priority: 50, countries: HALLOWEEN, on: fixed(10, 31) },
];

function hijriDays(year: number, hijriMonth: number, hijriDaysWanted: number[]): ReadonlyArray<readonly [number, number]> {
  // Scan the Gregorian year once for the requested Islamic month/days (a Hijri date can occur twice
  // in one Gregorian year, so keep every match).
  const out: Array<readonly [number, number]> = [];
  const start = Date.UTC(year, 0, 1);
  for (let i = 0; i < 366; i++) {
    const dt = new Date(start + i * 86_400_000);
    if (dt.getUTCFullYear() !== year) break;
    const h = hijriMonthDay(year, dt.getUTCMonth() + 1, dt.getUTCDate());
    if (h && h.month === hijriMonth && hijriDaysWanted.includes(h.day)) out.push([dt.getUTCMonth() + 1, dt.getUTCDate()]);
  }
  return out;
}

const hijriCache = new Map<string, ReadonlyArray<readonly [number, number]>>();

/** Holidays on `date` for `country` (ISO 3166-1 alpha-2, or null for unknown), strongest first. */
export const isChristmasCountry = (cc: string | null | undefined) =>
  Boolean(cc && (CHRISTMAS as readonly string[]).includes(cc.toUpperCase()));

export function holidaysOn(country: string | null | undefined, date: CalendarDate): Holiday[] {
  const cc = country?.toUpperCase() ?? null;
  const out: Holiday[] = [];
  for (const rule of RULES) {
    if (rule.countries && (!cc || !(rule.countries as readonly string[]).includes(cc))) continue;
    // Hijri scans are comparatively expensive: cache per rule and year.
    const key = `${rule.id}:${date.year}`;
    let days = hijriCache.get(key);
    if (!days) {
      days = rule.on(date.year);
      if (rule.id === "ramadan" || rule.id.startsWith("eid-")) hijriCache.set(key, days);
    }
    if (days.some(([m, d]) => m === date.month && d === date.day)) {
      out.push({
        id: rule.id,
        name: rule.name,
        greeting: rule.greeting,
        note: rule.note?.(date.year),
        emoji: rule.emoji,
        priority: rule.priority,
      });
    }
  }
  return out.sort((a, b) => b.priority - a.priority);
}
