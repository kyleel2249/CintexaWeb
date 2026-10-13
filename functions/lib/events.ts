/**
 * Account & security event log on Workers KV.
 *
 * Every sign-up, sign-in (successful or failed), sign-out, password reset, profile change, application
 * and admin action is recorded with where it came from (IP, approximate location, browser). Passwords —
 * entered or attempted — are NEVER recorded anywhere.
 *
 * Layout (newest-first listing is built into the key: the timestamp is inverted):
 *   event:{inverted-ms}:{type}:{id}      one record, expires after RETENTION_DAYS
 *   userlog:{userId}                     last USER_LOG_CAP events for one user
 *   stat:day:{YYYY-MM-DD}:{type}         daily counter (cheap analytics)
 */

export type EventType =
  | "signup"
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_reset_requested"
  | "password_reset"
  | "profile_update"
  | "application"
  | "alert_signup"
  | "admin_setup"
  | "admin_login"
  | "admin_login_failed"
  | "admin_reset";

export type EventRecord = {
  id: string;
  type: EventType;
  at: string;
  userId?: string;
  email?: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  userAgent?: string;
  language?: string;
  /** Short, non-sensitive context (e.g. "wrong password", "unknown account"). */
  detail?: string;
};

export type RequestMeta = Pick<EventRecord, "ip" | "country" | "region" | "city" | "userAgent" | "language">;

export const RETENTION_DAYS = 400;
const RETENTION_SEC = RETENTION_DAYS * 24 * 60 * 60;
const USER_LOG_CAP = 50;
const MAX_INVERTED = 9_999_999_999_999;

const clip = (v: string | null | undefined, max: number) => (v ? v.slice(0, max) : undefined);

/** Where a request came from, as far as Cloudflare can tell. */
export function requestMeta(request: Request): RequestMeta {
  const cf = (request as Request & { cf?: { country?: string; region?: string; city?: string } }).cf;
  const country = (cf?.country ?? request.headers.get("CF-IPCountry") ?? "").toUpperCase();
  return {
    ip: clip(request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim(), 64),
    country: /^[A-Z]{2}$/.test(country) && country !== "XX" && country !== "T1" ? country : undefined,
    region: clip(cf?.region, 80),
    city: clip(cf?.city, 80),
    userAgent: clip(request.headers.get("User-Agent"), 300),
    language: clip(request.headers.get("Accept-Language")?.split(",")[0]?.trim(), 20),
  };
}

export const eventKey = (at: Date, type: EventType, id: string) =>
  `event:${String(MAX_INVERTED - at.getTime()).padStart(13, "0")}:${type}:${id}`;

export const dayStamp = (d: Date) => d.toISOString().slice(0, 10);
export const dayKey = (day: string, type: EventType) => `stat:day:${day}:${type}`;

type Env = { KV: KVNamespace };
export type EventInput = Omit<EventRecord, "id" | "at"> & { at?: Date };

/** Records an event. Never throws: logging must not be able to break signing in. */
export async function recordEvent(env: Env, input: EventInput): Promise<EventRecord | null> {
  try {
    const at = input.at ?? new Date();
    const record: EventRecord = {
      id: crypto.randomUUID(),
      type: input.type,
      at: at.toISOString(),
      userId: input.userId,
      email: input.email?.toLowerCase().slice(0, 254),
      ip: input.ip,
      country: input.country,
      region: input.region,
      city: input.city,
      userAgent: input.userAgent,
      language: input.language,
      detail: clip(input.detail, 120),
    };
    // Drop undefined so stored JSON stays compact.
    const clean = JSON.parse(JSON.stringify(record)) as EventRecord;
    await env.KV.put(eventKey(at, record.type, record.id), JSON.stringify(clean), { expirationTtl: RETENTION_SEC });

    const day = dayKey(dayStamp(at), record.type);
    const current = Number((await env.KV.get(day)) ?? "0") || 0;
    await env.KV.put(day, String(current + 1), { expirationTtl: RETENTION_SEC });

    if (record.userId && record.type !== "admin_login" && record.type !== "admin_login_failed") {
      const logKey = `userlog:${record.userId}`;
      let log: EventRecord[] = [];
      try {
        log = JSON.parse((await env.KV.get(logKey)) ?? "[]") as EventRecord[];
      } catch {
        log = [];
      }
      await env.KV.put(logKey, JSON.stringify([clean, ...log].slice(0, USER_LOG_CAP)), { expirationTtl: RETENTION_SEC });
    }
    return clean;
  } catch (err) {
    console.error("recordEvent", err);
    return null;
  }
}

/** The account id for an e-mail, if that person has an account (so their activity joins their history). */
export async function userIdForEmail(kv: KVNamespace, email: string | undefined): Promise<string | undefined> {
  if (!email) return undefined;
  try {
    const raw = await kv.get(`user:${email.toLowerCase()}`);
    return raw ? (JSON.parse(raw) as { id?: string }).id : undefined;
  } catch {
    return undefined;
  }
}

export async function readUserLog(kv: KVNamespace, userId: string): Promise<EventRecord[]> {
  try {
    return JSON.parse((await kv.get(`userlog:${userId}`)) ?? "[]") as EventRecord[];
  } catch {
    return [];
  }
}

export type EventPage = { events: EventRecord[]; cursor: string | null };

/** Newest-first events, optionally one type. Reads at most a few list pages so a request stays cheap. */
export async function listEvents(
  kv: KVNamespace,
  opts: { type?: string; limit?: number; cursor?: string | null; prefix?: string } = {},
): Promise<EventPage> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const prefix = opts.prefix ?? "event:";
  const events: EventRecord[] = [];
  let cursor: string | undefined = opts.cursor ?? undefined;
  let complete = false;
  for (let page = 0; page < 5 && events.length < limit && !complete; page++) {
    const listed = await kv.list({ prefix, cursor, limit: 100 });
    const keys = listed.keys.filter((k) => !opts.type || k.name.split(":")[2] === opts.type);
    const values = await Promise.all(keys.map((k) => kv.get(k.name)));
    for (const v of values) {
      if (!v) continue;
      try {
        events.push(JSON.parse(v) as EventRecord);
      } catch {
        /* skip a corrupt record */
      }
    }
    complete = listed.list_complete;
    cursor = complete ? undefined : (listed as { cursor?: string }).cursor;
  }
  return { events: events.slice(0, limit), cursor: complete ? null : (cursor ?? null) };
}

/** Last `days` daily counts (oldest → newest) for each type. */
export async function dailyCounts(
  kv: KVNamespace,
  days: number,
  types: EventType[],
  now: Date = new Date(),
): Promise<{ dates: string[]; series: Record<string, number[]> }> {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) dates.push(dayStamp(new Date(now.getTime() - i * 86_400_000)));
  const series: Record<string, number[]> = {};
  await Promise.all(
    types.map(async (type) => {
      series[type] = await Promise.all(dates.map(async (d) => Number((await kv.get(dayKey(d, type))) ?? "0") || 0));
    }),
  );
  return { dates, series };
}
