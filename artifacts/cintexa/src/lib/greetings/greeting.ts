import { holidaysOn, isChristmasCountry, type CalendarDate } from "./holidays";

export type Period = "morning" | "afternoon" | "evening" | "night";
export type Occasion = "holiday" | "signup" | "new-year" | "festive" | "new-month" | "time";
export type GreetingKind = "signin" | "signup" | "visit";

export type GreetingInput = {
  /** First name (or whatever we call the user). Omitted → the greeting simply has no name. */
  name?: string | null;
  now?: Date;
  /** IANA time zone; defaults to the browser's. */
  timeZone?: string;
  /** ISO country used for holidays and local-language greetings. */
  country?: string | null;
  /** Same seed → same wording; change it (e.g. per sign-in) to vary the greeting. */
  seed?: string;
  kind?: GreetingKind;
  /** Current daily-streak length, if known. */
  streakDays?: number;
};

export type Greeting = {
  headline: string;
  message: string;
  period: Period;
  occasion: Occasion;
  emoji?: string;
  holidayId?: string;
};

export type LocalParts = CalendarDate & { hour: number; weekday: number };

export function localParts(now: Date, timeZone?: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    weekday,
  };
}

export function periodForHour(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** FNV-1a: tiny, stable string hash so the same seed always picks the same wording. */
export function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pick<T>(pool: readonly T[], seed: string): T {
  return pool[hash(seed) % pool.length] as T;
}

/** Fills {name}; with no name the placeholder (and its comma/space) disappears cleanly. */
export function fill(template: string, name?: string | null): string {
  if (name?.trim()) return template.split("{name}").join(name.trim());
  return template
    .replace(/,\s*\{name\}/g, "")
    .replace(/\s*\{name\}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([?!.,])/g, "$1");
}

// ---------- wording ----------

const PLAIN: Record<Period, readonly string[]> = {
  morning: ["Good morning, {name}", "Morning, {name}", "Rise and shine, {name}", "Hello {name}, good morning", "Good morning, {name} — great to see you"],
  afternoon: ["Good afternoon, {name}", "Afternoon, {name}", "Hello {name}, good afternoon", "Good to see you this afternoon, {name}", "Hope your day is going well, {name}"],
  evening: ["Good evening, {name}", "Evening, {name}", "Hello {name}, good evening", "Good to see you this evening, {name}", "Hope you’ve had a good day, {name}"],
  night: ["Working late, {name}?", "Burning the midnight oil, {name}?", "Hello {name} — it’s late, glad you’re here", "Still up, {name}?"],
};

const WELCOME_BACK: Record<Period, readonly string[]> = {
  morning: ["Welcome back, {name} — good morning", "Good morning, {name}. Welcome back!", "Rise and shine, {name} — welcome back"],
  afternoon: ["Welcome back, {name} — good afternoon", "Good afternoon, {name}. Welcome back!", "Great to see you again, {name}"],
  evening: ["Welcome back, {name} — good evening", "Good evening, {name}. Welcome back!", "Great to see you again this evening, {name}"],
  night: ["Welcome back, {name} — working late?", "Welcome back, {name}. Burning the midnight oil?", "Good to see you, {name}, even this late"],
};

const SIGNUP = [
  "Welcome to CINTEXA, {name}!",
  "Great to have you, {name} — welcome to CINTEXA!",
  "You’re in, {name} — welcome to CINTEXA!",
];

const SIGNUP_MESSAGE = [
  "Your account is ready — let’s get you set up.",
  "We’re glad you’re here. Let’s set up your account.",
  "Everything starts here. Let’s get you going.",
];

const TIME_MESSAGE: Record<Period, readonly string[]> = {
  morning: ["Wishing you a productive day.", "Here’s a look at your account today.", "A good day starts here."],
  afternoon: ["Hope the day is treating you well.", "Here’s where your account stands this afternoon.", "Wishing you a smooth rest of the day."],
  evening: ["Hope you had a good day.", "Here’s your account at a glance.", "Wishing you a relaxing evening."],
  night: ["Your account is here whenever you need it.", "Don’t forget to rest — we’ll be here.", "Wishing you a calm night."],
};

const WEEKDAY_MESSAGE: Partial<Record<number, readonly string[]>> = {
  1: ["A fresh week — let’s make it count.", "Happy Monday — here’s to a great week."],
  5: ["Happy Friday — finish the week strong.", "It’s Friday — nearly there."],
  6: ["Enjoy your weekend.", "Happy Saturday — enjoy the weekend."],
  0: ["Enjoy your Sunday.", "Happy Sunday — wishing you a restful day."],
};

/** Everyday greetings in a user's own language — always paired with English so nobody is lost. */
const LOCAL: Record<string, { morning: string; afternoon: string; evening: string; welcome: string }> = {
  GH: { morning: "Maakye", afternoon: "Maaha", evening: "Maadwo", welcome: "Akwaaba" },
  KE: { morning: "Habari za asubuhi", afternoon: "Habari za mchana", evening: "Habari za jioni", welcome: "Karibu" },
  TZ: { morning: "Habari za asubuhi", afternoon: "Habari za mchana", evening: "Habari za jioni", welcome: "Karibu" },
  ZA: { morning: "Sawubona", afternoon: "Sawubona", evening: "Sawubona", welcome: "Sawubona" },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function buildGreeting(input: GreetingInput = {}): Greeting {
  const now = input.now ?? new Date();
  const kind: GreetingKind = input.kind ?? "visit";
  const country = input.country?.toUpperCase() ?? null;
  const p = localParts(now, input.timeZone);
  const period = periodForHour(p.hour);
  const seed = `${input.seed ?? "cintexa"}|${p.year}-${p.month}-${p.day}`;
  const name = input.name;

  const periodWord = { morning: "morning", afternoon: "afternoon", evening: "evening", night: "evening" }[period];
  const streak = input.streakDays ?? 0;

  // 1. A holiday for the user's country beats everything else.
  const holiday = holidaysOn(country, p)[0];
  if (holiday) {
    const base = `${holiday.greeting}, {name}!`;
    const extra =
      kind === "signup"
        ? "Welcome to CINTEXA — your account is ready."
        : kind === "signin"
          ? `Great to see you this ${periodWord}.`
          : "Wishing you a wonderful day.";
    return {
      headline: fill(base, name),
      message: [holiday.note, extra].filter(Boolean).join(" "),
      period,
      occasion: "holiday",
      emoji: holiday.emoji,
      holidayId: holiday.id,
    };
  }

  // 2. First sign-up.
  if (kind === "signup") {
    const local = country ? LOCAL[country] : undefined;
    const useLocal = local && hash(`${seed}|l`) % 2 === 0;
    return {
      headline: fill(useLocal ? `${local.welcome}, {name}! Welcome to CINTEXA` : pick(SIGNUP, `${seed}|s`), name),
      message: pick(SIGNUP_MESSAGE, `${seed}|sm`),
      period,
      occasion: "signup",
      emoji: "👋",
    };
  }

  // Wording shared by the remaining occasions.
  const pool = kind === "signin" ? WELCOME_BACK[period] : PLAIN[period];
  let headline = fill(pick(pool, `${seed}|h`), name);
  let extraMessage: string | undefined;
  let occasion: Occasion = "time";
  let emoji: string | undefined;

  const local = country ? LOCAL[country] : undefined;
  if (local && period !== "night" && hash(`${seed}|loc`) % 3 === 0) {
    const word = local[period];
    headline = fill(`${word}, {name} — ${kind === "signin" ? "welcome back" : `good ${period}`}`, name);
  }

  if (p.month === 1 && p.day >= 2 && p.day <= 7) {
    occasion = "new-year";
    emoji = "🎆";
    extraMessage = `Happy New Year — wishing you a great ${p.year}.`;
  } else if (p.month === 12 && p.day >= 18 && p.day <= 30 && isChristmasCountry(country)) {
    occasion = "festive";
    emoji = "🎄";
    extraMessage = "Wishing you a joyful festive season.";
  } else if (p.day === 1 && p.month !== 1) {
    occasion = "new-month";
    emoji = "🗓️";
    headline = fill("Happy New Month, {name}!", name);
    extraMessage = `Welcome to ${MONTHS[p.month - 1]} — wishing you a month of steady progress.`;
  }

  // 3. The supporting line: occasion > streak > weekday > time of day.
  const weekdayPool = WEEKDAY_MESSAGE[p.weekday];
  let message: string;
  if (extraMessage) message = extraMessage;
  else if (streak >= 2 && hash(`${seed}|st`) % 2 === 0) message = `You’re on a ${streak}-day streak — keep it going.`;
  else if (weekdayPool && hash(`${seed}|wd`) % 2 === 0) message = pick(weekdayPool, `${seed}|wm`);
  else message = pick(TIME_MESSAGE[period], `${seed}|m`);

  return { headline, message, period, occasion, emoji, holidayId: undefined };
}
