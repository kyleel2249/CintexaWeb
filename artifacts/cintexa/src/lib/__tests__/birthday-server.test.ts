// @vitest-environment node
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateDob as clientValidate, effectiveMonthDay as clientEffective } from "../birthday";

const FN = path.resolve(__dirname, "../../../../../functions");
// Workers modules are loaded by path (the app tsconfig can't type them), so describe the pieces we use.
type Handler = (ctx: unknown) => Promise<Response>;
type DobResult = { ok: true; value: string } | { ok: false; error: string };
type BirthdayLib = {
  validateDob(value: unknown, today?: Date): DobResult;
  effectiveMonthDay(dob: string, year: number): string;
  updateBirthdayIndex(kv: unknown, email: string, prev: string | null | undefined, next: string | null | undefined): Promise<void>;
  emailsForMonthDays(kv: unknown, monthDays: string[]): Promise<string[]>;
  candidateMonthDays(now: Date): string[];
};
type EmailLib = {
  birthdayEmailContent(user: { id: string; fullName: string }, year: number): { subject: string; html: string; text: string };
};
const load = async (p: string) => (await import(/* @vite-ignore */ path.join(FN, p))) as Record<string, unknown>;
const birthdayLib = async () => (await load("lib/birthday.ts")) as unknown as BirthdayLib;
const emailLib = async () => (await load("lib/birthday-email.ts")) as unknown as EmailLib;

class FakeKV {
  store = new Map<string, string>();
  async get(k: string) {
    return this.store.get(k) ?? null;
  }
  async put(k: string, v: string) {
    this.store.set(k, v);
  }
  async delete(k: string) {
    this.store.delete(k);
  }
}
// Workers-only type (KVNamespace) isn't available to the app's tsconfig; the fake is structurally enough.
const kvOf = (kv: FakeKV) => kv as never;

let emails: { to: string; subject: string }[];
beforeEach(() => {
  emails = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { to: string[]; subject: string };
      emails.push({ to: body.to[0]!, subject: body.subject });
      return new Response(JSON.stringify({ id: "e1" }), { status: 200 });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const TODAY = new Date("2026-10-10T12:00:00Z");

type BirthdayRun = {
  sent: number;
  wouldSend: string[];
  skipped: { notYet: number; notToday: number; optedOut: number; alreadySent: number; noDob: number };
  failed: { email: string; error: string }[];
};

describe("date-of-birth rules (server) match the client", () => {
  const cases = ["1990-10-10", "2000-02-29", "2001-02-29", "1899-12-31", "2026-10-11", "2020-01-01", "2013-10-10", "2013-10-11", "abc", "", "1990-13-01", "1990-00-10"];
  it("accepts/rejects the same dates with the same messages", async () => {
    const { validateDob } = await birthdayLib();
    for (const c of cases) expect(validateDob(c, TODAY), c).toEqual(clientValidate(c, TODAY));
  });
  it("age 13 boundary", async () => {
    const { validateDob } = await birthdayLib();
    expect(validateDob("2013-10-10", TODAY).ok).toBe(true);
    expect(validateDob("2013-10-11", TODAY).ok).toBe(false);
  });
  it("29 Feb is celebrated on 28 Feb in non-leap years only", async () => {
    const { effectiveMonthDay } = await birthdayLib();
    for (const [dob, y] of [["1992-02-29", 2027], ["1992-02-29", 2028], ["1990-05-05", 2027]] as const) {
      expect(effectiveMonthDay(dob, y)).toBe(clientEffective(dob, y));
    }
    expect(effectiveMonthDay("1992-02-29", 2027)).toBe("02-28");
    expect(effectiveMonthDay("1992-02-29", 2028)).toBe("02-29");
  });
});

describe("birthday index", () => {
  it("adds, moves, de-duplicates and removes users", async () => {
    const { updateBirthdayIndex, emailsForMonthDays } = await birthdayLib();
    const kv = new FakeKV();
    const K = kvOf(kv);
    await updateBirthdayIndex(K, "a@x.com", null, "1990-10-10");
    await updateBirthdayIndex(K, "a@x.com", "1990-10-10", "1990-10-10"); // idempotent
    await updateBirthdayIndex(K, "b@x.com", null, "1985-10-10");
    expect(await emailsForMonthDays(K, ["10-10"])).toEqual(["a@x.com", "b@x.com"]);
    await updateBirthdayIndex(K, "a@x.com", "1990-10-10", "1990-11-01"); // changed date
    expect(await emailsForMonthDays(K, ["10-10"])).toEqual(["b@x.com"]);
    expect(await emailsForMonthDays(K, ["11-01"])).toEqual(["a@x.com"]);
    await updateBirthdayIndex(K, "b@x.com", "1985-10-10", null); // removed
    expect(kv.store.has("bday:10-10")).toBe(false);
  });
  it("scans only the three days that can be 'today' somewhere (plus 29 Feb on 28 Feb)", async () => {
    const { candidateMonthDays } = await birthdayLib();
    expect(candidateMonthDays(new Date("2026-10-10T12:00:00Z")).sort()).toEqual(["10-09", "10-10", "10-11"]);
    expect(candidateMonthDays(new Date("2027-02-28T12:00:00Z"))).toContain("02-29");
    expect(candidateMonthDays(new Date("2028-02-28T12:00:00Z")).sort()).toEqual(["02-27", "02-28", "02-29"]);
  });
});

async function post(mod: Record<string, unknown>, body: unknown, headers: Record<string, string> = {}, env: Record<string, unknown> = {}) {
  const request = new Request("https://cintexa.com/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return (mod.onRequestPost as Handler)({ request, env, waitUntil: () => undefined });
}

describe("POST /api/auth/signup with a date of birth", () => {
  const base = { fullName: "Kyle Test", email: "kyle@example.com", password: "password123" };

  it("stores and indexes a valid date of birth and never leaks the password hash", async () => {
    const signup = await load("api/auth/signup.ts");
    const kv = new FakeKV();
    const res = await post(signup, { ...base, dateOfBirth: "1990-10-10", timeZone: "Africa/Accra" }, {}, { KV: kv });
    const data = (await res.json()) as { user: Record<string, unknown> };
    expect(res.status).toBe(201);
    expect(data.user).toMatchObject({ email: "kyle@example.com", dateOfBirth: "1990-10-10", birthdayEmail: true });
    expect(JSON.stringify(data)).not.toMatch(/passwordHash|salt/);
    const stored = JSON.parse(kv.store.get("user:kyle@example.com")!);
    expect(stored).toMatchObject({ dateOfBirth: "1990-10-10", timeZone: "Africa/Accra" });
    expect(JSON.parse(kv.store.get("bday:10-10")!)).toEqual(["kyle@example.com"]);
  });

  it("date of birth is optional", async () => {
    const signup = await load("api/auth/signup.ts");
    const kv = new FakeKV();
    const res = await post(signup, base, {}, { KV: kv });
    expect(res.status).toBe(201);
    expect(((await res.json()) as { user: { dateOfBirth: unknown } }).user.dateOfBirth).toBeNull();
    expect([...kv.store.keys()].some((k) => k.startsWith("bday:"))).toBe(false);
  });

  it("rejects impossible, future and under-13 dates without creating the account", async () => {
    const signup = await load("api/auth/signup.ts");
    for (const dob of ["1990-02-30", "2999-01-01", "2019-05-05", "nonsense"]) {
      const kv = new FakeKV();
      const res = await post(signup, { ...base, dateOfBirth: dob }, {}, { KV: kv });
      expect(res.status, dob).toBe(400);
      expect(kv.store.has("user:kyle@example.com"), dob).toBe(false);
    }
  });
});

describe("POST /api/auth/profile", () => {
  async function account(kv: FakeKV, dob?: string) {
    const signup = await load("api/auth/signup.ts");
    const res = await post(signup, { fullName: "Ama Mensah", email: "ama@example.com", password: "password123", dateOfBirth: dob }, {}, { KV: kv });
    return ((await res.json()) as { token: string }).token;
  }

  it("requires a signed-in user", async () => {
    const profile = await load("api/auth/profile.ts");
    expect((await post(profile, { dateOfBirth: "1990-10-10" }, {}, { KV: new FakeKV() })).status).toBe(401);
  });

  it("adds, changes and removes the date, keeping the index in step", async () => {
    const profile = await load("api/auth/profile.ts");
    const kv = new FakeKV();
    const token = await account(kv);
    const auth = { Authorization: `Bearer ${token}` };

    let res = await post(profile, { dateOfBirth: "1991-03-05" }, auth, { KV: kv });
    expect(((await res.json()) as { user: { dateOfBirth: string } }).user.dateOfBirth).toBe("1991-03-05");
    expect(JSON.parse(kv.store.get("bday:03-05")!)).toEqual(["ama@example.com"]);

    await post(profile, { dateOfBirth: "1991-04-06" }, auth, { KV: kv });
    expect(kv.store.has("bday:03-05")).toBe(false);
    expect(JSON.parse(kv.store.get("bday:04-06")!)).toEqual(["ama@example.com"]);

    res = await post(profile, { dateOfBirth: null }, auth, { KV: kv });
    expect(((await res.json()) as { user: { dateOfBirth: unknown } }).user.dateOfBirth).toBeNull();
    expect(kv.store.has("bday:04-06")).toBe(false);
  });

  it("validates, and saves the birthday-email preference and time zone", async () => {
    const profile = await load("api/auth/profile.ts");
    const kv = new FakeKV();
    const token = await account(kv, "1990-10-10");
    const auth = { Authorization: `Bearer ${token}` };
    expect((await post(profile, { dateOfBirth: "2025-01-01" }, auth, { KV: kv })).status).toBe(400);
    const res = await post(profile, { birthdayEmail: false, timeZone: "Asia/Tokyo" }, auth, { KV: kv });
    expect(((await res.json()) as { user: { birthdayEmail: boolean } }).user.birthdayEmail).toBe(false);
    expect(JSON.parse(kv.store.get("user:ama@example.com")!)).toMatchObject({ birthdayEmail: false, timeZone: "Asia/Tokyo", dateOfBirth: "1990-10-10" });
    await post(profile, { timeZone: "Not/AZone" }, auth, { KV: kv });
    expect(JSON.parse(kv.store.get("user:ama@example.com")!).timeZone).toBe("Asia/Tokyo");
  });

  it("login and /me return the date of birth", async () => {
    const login = await load("api/auth/login.ts");
    const me = await load("api/auth/me.ts");
    const kv = new FakeKV();
    await account(kv, "1990-10-10");
    const res = await post(login, { email: "ama@example.com", password: "password123", timeZone: "Africa/Lagos" }, {}, { KV: kv });
    const data = (await res.json()) as { token: string; user: { dateOfBirth: string } };
    expect(data.user.dateOfBirth).toBe("1990-10-10");
    expect(JSON.parse(kv.store.get("user:ama@example.com")!).timeZone).toBe("Africa/Lagos");
    const meRes = await (me.onRequestGet as (c: unknown) => Promise<Response>)({
      request: new Request("https://cintexa.com/api/auth/me", { headers: { Authorization: `Bearer ${data.token}` } }),
      env: { KV: kv },
    });
    expect(((await meRes.json()) as { user: { dateOfBirth: string } }).user.dateOfBirth).toBe("1990-10-10");
  });
});

describe("birthday e-mail job", () => {
  async function seed(kv: FakeKV, users: { email: string; dob: string; tz?: string; optOut?: boolean }[]) {
    const { updateBirthdayIndex } = await birthdayLib();
    for (const [i, u] of users.entries()) {
      kv.store.set(
        `user:${u.email}`,
        JSON.stringify({ id: `id${i}-${u.email}`, email: u.email, fullName: "Kyle Test", dateOfBirth: u.dob, timeZone: u.tz, birthdayEmail: u.optOut ? false : undefined }),
      );
      await updateBirthdayIndex(kvOf(kv), u.email, null, u.dob);
    }
  }
  const run = async (kv: FakeKV, now: string, opts: { dry?: boolean; key?: string } = {}) => {
    const { runBirthdays } = await load("api/cron/birthdays.ts");
    return (runBirthdays as unknown as (e: unknown, n: Date, d: boolean) => Promise<BirthdayRun>)(
      { KV: kv, RESEND_API_KEY: opts.key === undefined ? "k" : opts.key },
      new Date(now),
      Boolean(opts.dry),
    );
  };

  it("sends once, on the birthday, and never twice", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "a@x.com", dob: "1990-10-10", tz: "Africa/Accra" }]);
    const first = await run(kv, "2026-10-10T09:00:00Z");
    expect(first.sent).toBe(1);
    expect(emails).toEqual([{ to: "a@x.com", subject: expect.stringContaining("Happy Birthday, Kyle") }]);
    const second = await run(kv, "2026-10-10T10:00:00Z");
    expect(second.sent).toBe(0);
    expect(second.skipped.alreadySent).toBe(1);
    expect(emails).toHaveLength(1);
  });

  it("waits for 06:00 in the user's own time zone", async () => {
    const kv = new FakeKV();
    await seed(kv, [
      { email: "accra@x.com", dob: "1990-10-10", tz: "Africa/Accra" },
      { email: "tokyo@x.com", dob: "1990-10-10", tz: "Asia/Tokyo" },
      { email: "la@x.com", dob: "1990-10-10", tz: "America/Los_Angeles" },
    ]);
    let r = await run(kv, "2026-10-10T09:00:00Z"); // Accra 09:00, Tokyo 18:00, LA 02:00
    expect(r.sent).toBe(2);
    expect(r.skipped.notYet).toBe(1);
    r = await run(kv, "2026-10-10T14:00:00Z"); // LA 07:00
    expect(r.sent).toBe(1);
    expect(emails.map((e) => e.to).sort()).toEqual(["accra@x.com", "la@x.com", "tokyo@x.com"]);
  });

  it("reaches people whose birthday has already started far ahead of UTC", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "kiri@x.com", dob: "1990-10-11", tz: "Pacific/Kiritimati" }]);
    expect((await run(kv, "2026-10-10T09:00:00Z")).sent).toBe(0); // still 10 Oct there
    expect((await run(kv, "2026-10-10T16:00:00Z")).sent).toBe(1); // 11 Oct 06:00 there
  });

  it("respects opt-out and users without a date", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "no@x.com", dob: "1990-10-10", tz: "UTC", optOut: true }]);
    const r = await run(kv, "2026-10-10T09:00:00Z");
    expect(r.sent).toBe(0);
    expect(r.skipped.optedOut).toBe(1);
    expect(emails).toHaveLength(0);
  });

  it("celebrates 29 Feb on 28 Feb in non-leap years", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "leap@x.com", dob: "1992-02-29", tz: "UTC" }]);
    expect((await run(kv, "2027-02-28T10:00:00Z")).sent).toBe(1);
    const kv2 = new FakeKV();
    await seed(kv2, [{ email: "leap@x.com", dob: "1992-02-29", tz: "UTC" }]);
    expect((await run(kv2, "2028-02-28T10:00:00Z")).sent).toBe(0);
    expect((await run(kv2, "2028-02-29T10:00:00Z")).sent).toBe(1);
  });

  it("dry run lists recipients without sending or recording", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "a@x.com", dob: "1990-10-10", tz: "UTC" }]);
    const r = await run(kv, "2026-10-10T09:00:00Z", { dry: true });
    expect(r.wouldSend).toEqual(["a@x.com"]);
    expect(emails).toHaveLength(0);
    expect([...kv.store.keys()].some((k) => k.startsWith("birthday:sent:"))).toBe(false);
  });

  it("does NOT mark a wish as sent when email isn't configured, so it is retried", async () => {
    const kv = new FakeKV();
    await seed(kv, [{ email: "a@x.com", dob: "1990-10-10", tz: "UTC" }]);
    const r = await run(kv, "2026-10-10T09:00:00Z", { key: "" });
    expect(r.sent).toBe(0);
    expect(r.failed).toHaveLength(1);
    expect([...kv.store.keys()].some((k) => k.startsWith("birthday:sent:"))).toBe(false);
    expect((await run(kv, "2026-10-10T10:00:00Z")).sent).toBe(1); // configured later → retried
  });

  it("the endpoint is locked behind CRON_SECRET", async () => {
    const mod = await load("api/cron/birthdays.ts");
    const call = (env: Record<string, unknown>, auth?: string) =>
      (mod.onRequestPost as (c: unknown) => Promise<Response>)({
        request: new Request("https://cintexa.com/api/cron/birthdays", { method: "POST", headers: auth ? { Authorization: auth } : {} }),
        env,
      });
    expect((await call({ KV: new FakeKV() })).status).toBe(503);
    expect((await call({ KV: new FakeKV(), CRON_SECRET: "s3cret" })).status).toBe(401);
    expect((await call({ KV: new FakeKV(), CRON_SECRET: "s3cret" }, "Bearer wrong")).status).toBe(401);
    const ok = await call({ KV: new FakeKV(), CRON_SECRET: "s3cret" }, "Bearer s3cret");
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { ok: boolean }).ok).toBe(true);
  });

  it("the email is personal, escaped, and carries an opt-out", async () => {
    const { birthdayEmailContent } = await emailLib();
    const c = birthdayEmailContent({ id: "u1", fullName: "<b>Kyle</b> Test" }, 2026);
    expect(c.subject).toContain("Happy Birthday, <b>Kyle</b>");
    expect(c.html).not.toContain("<b>Kyle</b>");
    expect(c.html).toContain("&lt;b&gt;Kyle&lt;/b&gt;");
    expect(c.html).toContain("/dashboard/settings");
    expect(c.text).toContain("To stop these emails");
  });
});
