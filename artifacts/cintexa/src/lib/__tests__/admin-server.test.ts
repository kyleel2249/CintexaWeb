// @vitest-environment node
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeKV } from "@/test/fake-kv";

const FN = path.resolve(__dirname, "../../../../../functions");
const load = async (p: string) => (await import(/* @vite-ignore */ path.join(FN, p))) as Record<string, unknown>;
type Ctx = { request: Request; env: unknown; waitUntil: (p: Promise<unknown>) => void };
type Handler = (ctx: Ctx) => Promise<Response>;

type Mail = { to: string; subject: string; html: string; text: string };
let mail: Mail[];
let kv: FakeKV;
const SETUP_TOKEN = "setup-token-for-tests-0123456789abcdef0123456789";
const ADMIN_PW = "Adm1n!Strong-Pass-99";
const USER_PW = "Sup3r-Secret-pw!";

const env = (extra: Record<string, unknown> = {}) => ({ KV: kv, RESEND_API_KEY: "k", ADMIN_SETUP_TOKEN: SETUP_TOKEN, ...extra });

beforeEach(() => {
  mail = [];
  kv = new FakeKV();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T09:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body ?? "{}")) as { to: string[]; subject: string; html?: string; text?: string };
      mail.push({ to: b.to[0]!, subject: b.subject, html: b.html ?? "", text: b.text ?? "" });
      return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

type Opts = {
  body?: unknown;
  query?: string;
  token?: string;
  ip?: string;
  cf?: { country?: string; city?: string; region?: string };
  ua?: string;
  env?: Record<string, unknown>;
};

async function call(file: string, method: "GET" | "POST", o: Opts = {}) {
  const mod = await load(file);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "CF-Connecting-IP": o.ip ?? "203.0.113.7",
    "User-Agent": o.ua ?? "Mozilla/5.0 (TestBrowser)",
    "Accept-Language": "en-GH,en;q=0.9",
  };
  if (o.token) headers.Authorization = `Bearer ${o.token}`;
  const request = Object.assign(
    new Request(`https://cintexa.com/api/${file.replace(/^api\//, "").replace(/\.ts$/, "")}${o.query ?? ""}`, {
      method,
      headers,
      body: method === "POST" ? (typeof o.body === "string" ? o.body : JSON.stringify(o.body ?? {})) : undefined,
    }),
    { cf: o.cf ?? { country: "GH", city: "Accra", region: "Greater Accra" } },
  );
  const pending: Promise<unknown>[] = [];
  const handler = (method === "GET" ? mod.onRequestGet : mod.onRequestPost) as Handler;
  const res = await handler({ request, env: o.env ?? env(), waitUntil: (p) => void pending.push(p) });
  await Promise.all(pending);
  return res;
}
const json = async (r: Response) => (await r.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const tick = (ms = 1000) => vi.setSystemTime(new Date(Date.now() + ms));

async function signup(email: string, extra: Record<string, unknown> = {}, o: Opts = {}) {
  tick();
  const res = await call("api/auth/signup.ts", "POST", { ...o, body: { fullName: "Ama Mensah", email, password: USER_PW, timeZone: "Africa/Accra", ...extra } });
  return json(res);
}
async function adminSession() {
  const res = await call("api/admin/setup.ts", "POST", { body: { token: SETUP_TOKEN, username: "kyle.admin", password: ADMIN_PW } });
  expect(res.status).toBe(201);
  return (await json(res)).token as string;
}
const everythingStored = () => [...kv.store.entries()].flat().join("\n");
const everythingMailed = () => mail.map((m) => `${m.subject}\n${m.html}\n${m.text}`).join("\n");

describe("sign-up and sign-in capture", () => {
  it("records everything about a sign-up: the account details and where it came from", async () => {
    const res = await signup("ama@example.com", { phone: "+233 24 000 0000", company: "Acme", role: "Manager", dateOfBirth: "1990-10-10" });
    expect(res.user.email).toBe("ama@example.com");
    const stored = JSON.parse(kv.store.get("user:ama@example.com")!);
    expect(stored).toMatchObject({ fullName: "Ama Mensah", phone: "+233 24 000 0000", company: "Acme", role: "Manager", dateOfBirth: "1990-10-10", timeZone: "Africa/Accra", loginCount: 1 });
    expect(stored.signup).toMatchObject({ ip: "203.0.113.7", country: "GH", city: "Accra", region: "Greater Accra", userAgent: "Mozilla/5.0 (TestBrowser)", language: "en-GH" });
    expect(stored.lastLoginCountry).toBe("GH");

    const { listEvents } = (await load("lib/events.ts")) as { listEvents: (k: unknown) => Promise<{ events: any[] }> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const { events } = await listEvents(kv);
    expect(events[0]).toMatchObject({ type: "signup", email: "ama@example.com", userId: stored.id, ip: "203.0.113.7", country: "GH" });
    expect(kv.keys("userlog:")).toEqual([`userlog:${stored.id}`]);
  });

  it("records successful and failed sign-ins with their source, and updates the account", async () => {
    await signup("ama@example.com");
    tick(60_000);
    const bad = await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: "Wrong-attempt-1!" }, ip: "198.51.100.9", cf: { country: "NG", city: "Lagos" } });
    expect(bad.status).toBe(401);
    const unknown = await call("api/auth/login.ts", "POST", { body: { email: "nobody@example.com", password: "Wrong-attempt-2!" } });
    expect(unknown.status).toBe(401);
    tick(60_000);
    const ok = await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: USER_PW }, ip: "192.0.2.44", cf: { country: "GH", city: "Kumasi" } });
    expect(ok.status).toBe(200);

    const stored = JSON.parse(kv.store.get("user:ama@example.com")!);
    expect(stored).toMatchObject({ loginCount: 2, lastLoginIp: "192.0.2.44", lastLoginCity: "Kumasi" });

    const { readUserLog, listEvents } = (await load("lib/events.ts")) as { readUserLog: (k: unknown, id: string) => Promise<any[]>; listEvents: (k: unknown, o?: object) => Promise<{ events: any[] }> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const history = await readUserLog(kv, stored.id);
    expect(history.map((e) => e.type)).toEqual(["login_success", "login_failed", "signup"]); // newest first
    expect(history[1]).toMatchObject({ detail: "wrong password", ip: "198.51.100.9", country: "NG", city: "Lagos" });
    const failed = (await listEvents(kv, { type: "login_failed" })).events;
    expect(failed.map((e) => e.detail).sort()).toEqual(["unknown account", "wrong password"]);
    expect(failed.find((e) => e.detail === "unknown account")).toMatchObject({ email: "nobody@example.com" });
  });

  it("records sign-out, password reset requests, profile changes, applications and alert signups", async () => {
    const created = await signup("ama@example.com");
    tick();
    await call("api/auth/profile.ts", "POST", { token: created.token, body: { dateOfBirth: "1991-02-03" } });
    await call("api/auth/logout.ts", "POST", { token: created.token });
    await call("api/auth/forgot-password.ts", "POST", { body: { email: "ama@example.com" } });
    await call("api/careers/apply.ts", "POST", { body: { jobSlug: "cleaner", fullName: "Ama Mensah", email: "ama@example.com" } });
    await call("api/notifications/career-alert.ts", "POST", { body: { fullName: "Ama Mensah", email: "ama@example.com" } });
    const { listEvents } = (await load("lib/events.ts")) as { listEvents: (k: unknown, o?: object) => Promise<{ events: any[] }> }; // eslint-disable-line @typescript-eslint/no-explicit-any
    const types = (await listEvents(kv, { limit: 50 })).events.map((e) => e.type);
    for (const t of ["signup", "profile_update", "logout", "password_reset_requested", "application", "alert_signup"]) expect(types, t).toContain(t);
  });

  it("NEVER stores a password — entered, attempted or reset — in storage, events or e-mails", async () => {
    const created = await signup("ama@example.com");
    await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: "Wrong-attempt-1!" } });
    await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: USER_PW } });
    await call("api/auth/forgot-password.ts", "POST", { body: { email: "ama@example.com" } });
    await adminSession();
    await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: "Wrong-admin-attempt-1!" } });
    await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: ADMIN_PW } });
    expect(created.token).toBeTruthy();

    const stored = everythingStored();
    const mailed = everythingMailed();
    for (const secret of [USER_PW, "Wrong-attempt-1!", ADMIN_PW, "Wrong-admin-attempt-1!"]) {
      expect(stored, `storage leaks ${secret}`).not.toContain(secret);
      expect(mailed, `email leaks ${secret}`).not.toContain(secret);
    }
    // what IS stored is a salted hash
    const user = JSON.parse(kv.store.get("user:ama@example.com")!);
    expect(user.passwordHash).toMatch(/\S{20,}/);
    expect(user.salt).toMatch(/\S{10,}/);
  });
});

describe("admin setup — a one-time link to the CINTEXA inbox, never a password", () => {
  const linkFrom = (m: Mail, kind: "setup" | "reset") => new RegExp(`/admin\\?${kind}=([0-9a-f]{64})`).exec(m.html + m.text)?.[1];

  it("e-mails a one-time setup link to info@cintexa.com", async () => {
    const res = await call("api/admin/setup-request.ts", "POST", { env: env({ ADMIN_SETUP_TOKEN: undefined }) });
    expect(res.status).toBe(200);
    expect(mail).toHaveLength(1);
    expect(mail[0]!.to).toBe("info@cintexa.com");
    const token = linkFrom(mail[0]!, "setup");
    expect(token).toBeTruthy();
    // the raw link token is not what's stored — only its hash
    expect(everythingStored()).not.toContain(token!);

    const done = await call("api/admin/setup.ts", "POST", { body: { token, username: "Kyle.Admin", password: ADMIN_PW }, env: env({ ADMIN_SETUP_TOKEN: undefined }) });
    expect(done.status).toBe(201);
    expect(((await json(done)).username)).toBe("kyle.admin");
  });

  it("the link works once, and a weak password does not burn it", async () => {
    await call("api/admin/setup-request.ts", "POST");
    const token = linkFrom(mail[0]!, "setup")!;
    const weak = await call("api/admin/setup.ts", "POST", { body: { token, username: "kyle.admin", password: "short" } });
    expect(weak.status).toBe(400);
    const badName = await call("api/admin/setup.ts", "POST", { body: { token, username: "x", password: ADMIN_PW } });
    expect(badName.status).toBe(400);
    expect((await call("api/admin/setup.ts", "POST", { body: { token, username: "kyle.admin", password: ADMIN_PW }, env: env({ ADMIN_SETUP_TOKEN: undefined }) })).status).toBe(201);
    // second attempt: already set up
    expect((await call("api/admin/setup.ts", "POST", { body: { token, username: "other.admin", password: ADMIN_PW } })).status).toBe(409);
  });

  it("rejects wrong links, and refuses a new link once an admin exists", async () => {
    expect((await call("api/admin/setup.ts", "POST", { body: { token: "f".repeat(64), username: "kyle.admin", password: ADMIN_PW }, env: env({ ADMIN_SETUP_TOKEN: undefined }) })).status).toBe(403);
    await adminSession();
    expect((await call("api/admin/setup-request.ts", "POST")).status).toBe(409);
  });

  it("says so honestly when e-mail isn't configured", async () => {
    const res = await call("api/admin/setup-request.ts", "POST", { env: { KV: kv } });
    expect(res.status).toBe(503);
    expect((await json(res)).error).toMatch(/isn't configured/);
  });

  it("limits how often the link can be requested (protects the inbox)", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await call("api/admin/setup-request.ts", "POST")).status);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(mail).toHaveLength(3);
  });

  it("tells info@cintexa.com an admin was created — username only", async () => {
    await adminSession();
    const notice = mail.find((m) => m.subject.startsWith("Admin account created"))!;
    expect(notice.to).toBe("info@cintexa.com");
    expect(notice.html).toContain("kyle.admin");
    expect(everythingMailed()).not.toContain(ADMIN_PW);
  });
});

describe("admin sign-in", () => {
  it("signs in, issues a session whose raw token is never stored, and alerts info@cintexa.com", async () => {
    await adminSession();
    mail = [];
    const res = await call("api/admin/login.ts", "POST", { body: { username: "KYLE.admin", password: ADMIN_PW }, ip: "198.51.100.77", cf: { country: "GH", city: "Accra" } });
    const data = await json(res);
    expect(res.status).toBe(200);
    expect(data.token).toMatch(/^[0-9a-f]{64}$/);
    expect(kv.keys("admin_session:").every((k) => !k.includes(data.token))).toBe(true);
    expect(everythingStored()).not.toContain(data.token);

    const alert = mail.find((m) => m.subject === "Admin sign-in: kyle.admin")!;
    expect(alert.to).toBe("info@cintexa.com");
    expect(alert.html).toContain("198.51.100.77");
    expect(alert.html).toContain("Accra");
    expect(alert.html).not.toContain(ADMIN_PW);

    const me = await call("api/admin/session.ts", "GET", { token: data.token });
    expect(await json(me)).toEqual({ username: "kyle.admin" });
  });

  it("gives the same answer for a wrong password and an unknown admin", async () => {
    await adminSession();
    const wrong = await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: "nope-nope-nope-1A!" } });
    const unknown = await call("api/admin/login.ts", "POST", { body: { username: "ghost", password: "nope-nope-nope-1A!" } });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await json(wrong)).toEqual(await json(unknown));
  });

  it("locks the account after 5 failures (even for the right password) and alerts the inbox once", async () => {
    await adminSession();
    mail = [];
    for (let i = 0; i < 5; i++) {
      expect((await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: `wrong-${i}-Aa1!xyz` } })).status).toBe(401);
    }
    const locked = await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: ADMIN_PW } });
    expect(locked.status).toBe(429);
    expect(mail.filter((m) => m.subject.startsWith("Admin account locked"))).toHaveLength(1);
  });

  it("rate-limits one connection hammering many usernames", async () => {
    let last = 0;
    for (let i = 0; i < 22; i++) last = (await call("api/admin/login.ts", "POST", { body: { username: `user${i}x`, password: "x" } })).status;
    expect(last).toBe(429);
  });

  it("signing out ends the session", async () => {
    const token = await adminSession();
    expect((await call("api/admin/session.ts", "GET", { token })).status).toBe(200);
    await call("api/admin/logout.ts", "POST", { token });
    expect((await call("api/admin/session.ts", "GET", { token })).status).toBe(401);
  });

  it("sessions expire", async () => {
    const token = await adminSession();
    vi.setSystemTime(new Date(Date.now() + 9 * 3600 * 1000));
    expect((await call("api/admin/session.ts", "GET", { token })).status).toBe(401);
  });

  it("signed-out visitors learn whether first-time setup is needed", async () => {
    const before = await call("api/admin/session.ts", "GET");
    expect(before.status).toBe(401);
    expect((await json(before)).setupNeeded).toBe(true);
    await adminSession();
    expect((await json(await call("api/admin/session.ts", "GET"))).setupNeeded).toBe(false);
  });
});

describe("admin password reset", () => {
  const token = (m: Mail) => /\/admin\?reset=([0-9a-f]{64})/.exec(m.html)![1]!;

  it("e-mails a one-time link to the inbox, resets the password, ends old sessions, and works once", async () => {
    const oldSession = await adminSession();
    mail = [];
    const req = await call("api/admin/reset-request.ts", "POST", { body: { username: "kyle.admin" } });
    expect(req.status).toBe(200);
    expect(mail).toHaveLength(1);
    expect(mail[0]!.to).toBe("info@cintexa.com");
    const t = token(mail[0]!);

    const weak = await call("api/admin/reset.ts", "POST", { body: { token: t, password: "short" } });
    expect(weak.status).toBe(400); // link still valid
    const NEW_PW = "N3w!Different-Pass-77";
    expect((await call("api/admin/reset.ts", "POST", { body: { token: t, password: NEW_PW } })).status).toBe(200);
    expect((await call("api/admin/reset.ts", "POST", { body: { token: t, password: NEW_PW } })).status).toBe(403); // single use

    expect((await call("api/admin/session.ts", "GET", { token: oldSession })).status).toBe(401);
    expect((await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: ADMIN_PW } })).status).toBe(401);
    expect((await call("api/admin/login.ts", "POST", { body: { username: "kyle.admin", password: NEW_PW } })).status).toBe(200);
    for (const secret of [ADMIN_PW, NEW_PW]) {
      expect(everythingStored()).not.toContain(secret);
      expect(everythingMailed()).not.toContain(secret);
    }
    expect(mail.some((m) => m.subject.startsWith("Admin password was reset"))).toBe(true);
  });

  it("doesn't reveal whether an admin exists", async () => {
    await adminSession();
    mail = [];
    const known = await json(await call("api/admin/reset-request.ts", "POST", { body: { username: "kyle.admin" } }));
    const sentForKnown = mail.length;
    const unknown = await json(await call("api/admin/reset-request.ts", "POST", { body: { username: "ghost" } }));
    expect(unknown).toEqual(known);
    expect(sentForKnown).toBe(1);
    expect(mail).toHaveLength(1); // nothing sent for the unknown name
  });
});

describe("customer password reset answers", () => {
  const MSG = "If this accounts exists a password reset link has been sent.";

  it("gives the identical generic answer for a known account, an unknown one, and a throttled repeat", async () => {
    await signup("ama@example.com");
    mail = [];
    const known = await call("api/auth/forgot-password.ts", "POST", { body: { email: "ama@example.com" } });
    const unknown = await call("api/auth/forgot-password.ts", "POST", { body: { email: "ghost@example.com" } });
    const repeat = await call("api/auth/forgot-password.ts", "POST", { body: { email: "ama@example.com" } });
    for (const r of [known, unknown, repeat]) expect(r.status).toBe(200);
    const [a, b, c] = [await json(known), await json(unknown), await json(repeat)];
    expect(a).toEqual(b);
    expect(a).toEqual(c);
    expect(a.message).toBe(MSG);
    expect(Object.keys(a).sort()).toEqual(["expiresInSeconds", "message", "ok"]);
    expect(mail).toHaveLength(1); // only the real account got a code, and only once
    expect(mail[0]!.to).toBe("ama@example.com");
  });

  it("does not reveal an account when the mail provider fails", async () => {
    await signup("ama@example.com");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })));
    const known = await call("api/auth/forgot-password.ts", "POST", { body: { email: "ama@example.com" } });
    const unknown = await call("api/auth/forgot-password.ts", "POST", { body: { email: "ghost@example.com" } });
    expect(known.status).toBe(200);
    expect(await json(known)).toEqual(await json(unknown));
  });

  it("admin reset uses the same wording and no longer names the security inbox", async () => {
    await adminSession();
    const r = await json(await call("api/admin/reset-request.ts", "POST", { body: { username: "kyle.admin" } }));
    expect(r).toEqual({ ok: true, message: MSG });
  });
});

describe("the admin API is locked", () => {
  const endpoints: [string, "GET"][] = [
    ["api/admin/overview.ts", "GET"],
    ["api/admin/users.ts", "GET"],
    ["api/admin/activity.ts", "GET"],
    ["api/admin/applications.ts", "GET"],
    ["api/admin/alerts.ts", "GET"],
    ["api/admin/audit.ts", "GET"],
    ["api/admin/export.ts", "GET"],
  ];
  it.each(endpoints)("%s refuses anonymous, bogus and ordinary-user tokens", async (file, method) => {
    const user = await signup("ama@example.com");
    expect((await call(file, method)).status).toBe(401);
    expect((await call(file, method, { token: "f".repeat(64) })).status).toBe(401);
    expect((await call(file, method, { token: user.token })).status).toBe(401); // a customer session is not an admin session
  });
});

describe("admin data", () => {
  async function seed() {
    const a = await signup("ama@example.com", { phone: "+233 24 000 0000", dateOfBirth: "1990-10-10" }, { cf: { country: "GH", city: "Accra" } });
    await signup("kofi@example.com", { fullName: "Kofi Boateng", company: "Boateng Ltd" }, { cf: { country: "NG", city: "Lagos" } });
    await signup("zed@example.com", { fullName: '=HYPERLINK("http://evil.example")' }, { cf: { country: "GH" } });
    tick(60_000);
    await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: USER_PW } });
    await call("api/auth/login.ts", "POST", { body: { email: "ama@example.com", password: "Wrong-attempt-1!" } });
    await call("api/careers/apply.ts", "POST", { body: { jobSlug: "cleaner", fullName: "Ama Mensah", email: "ama@example.com", message: "Hello" } });
    await call("api/notifications/career-alert.ts", "POST", { body: { fullName: "Ama", email: "ama@example.com", interests: ["Internships"] } });
    return { a, token: await adminSession() };
  }

  it("overview: totals, 30-day trends, countries and profile completeness", async () => {
    const { token } = await seed();
    const o = await json(await call("api/admin/overview.ts", "GET", { token }));
    expect(o.totals).toMatchObject({ users: 3, newUsers7d: 3, newUsers30d: 3, logins7d: 1, failedLogins7d: 1, applications: 1, alertSubscribers: 1 });
    expect(o.trends.dates).toHaveLength(30);
    expect(o.trends.signup.at(-1)).toBe(3);
    expect(o.trends.login_success.at(-1)).toBe(1);
    expect(o.countries).toEqual([{ country: "GH", users: 2 }, { country: "NG", users: 1 }]);
    expect(o.profile).toMatchObject({ scanned: 3, sampled: false, withDateOfBirth: 1, withPhone: 1, withCompany: 1 });
    expect(o.recent.length).toBeGreaterThan(0);
  });

  it("users: newest first, paginated, searchable — and never any secrets", async () => {
    const { token } = await seed();
    const list = await call("api/admin/users.ts", "GET", { token });
    const raw = await list.text();
    expect(raw).not.toMatch(/passwordHash|"salt"/);
    const data = JSON.parse(raw) as { users: { email: string }[]; total: number };
    expect(data.total).toBe(3);
    expect(data.users.map((u) => u.email)).toEqual(["zed@example.com", "kofi@example.com", "ama@example.com"]);

    const page2 = await json(await call("api/admin/users.ts", "GET", { token, query: "?pageSize=5&page=2" }));
    expect(page2.users).toEqual([]);
    const byName = await json(await call("api/admin/users.ts", "GET", { token, query: "?q=boateng" }));
    expect(byName.users.map((u: { email: string }) => u.email)).toEqual(["kofi@example.com"]);
    const byCountry = await json(await call("api/admin/users.ts", "GET", { token, query: "?q=ng" }));
    expect(byCountry.users.length).toBeGreaterThan(0);
    const byPhone = await json(await call("api/admin/users.ts", "GET", { token, query: "?q=24%20000" }));
    expect(byPhone.users.map((u: { email: string }) => u.email)).toEqual(["ama@example.com"]);
  });

  it("one user in full, with their sign-in history", async () => {
    const { token } = await seed();
    const res = await call("api/admin/users.ts", "GET", { token, query: "?email=AMA@example.com" });
    const text = await res.text();
    expect(text).not.toMatch(/passwordHash|"salt"/);
    const d = JSON.parse(text) as { user: Record<string, any>; history: { type: string }[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(d.user).toMatchObject({ email: "ama@example.com", fullName: "Ama Mensah", phone: "+233 24 000 0000", dateOfBirth: "1990-10-10", loginCount: 2 });
    expect(d.user.signup).toMatchObject({ country: "GH", city: "Accra", ip: "203.0.113.7" });
    expect(d.history.map((e) => e.type)).toEqual(expect.arrayContaining(["signup", "login_success", "login_failed", "application"]));
    expect((await call("api/admin/users.ts", "GET", { token, query: "?email=nobody@example.com" })).status).toBe(404);
  });

  it("activity: newest first, filterable, validated", async () => {
    const { token } = await seed();
    const all = await json(await call("api/admin/activity.ts", "GET", { token }));
    const times = all.events.map((e: { at: string }) => e.at);
    expect(times).toEqual([...times].sort().reverse());
    const failed = await json(await call("api/admin/activity.ts", "GET", { token, query: "?type=login_failed" }));
    expect(failed.events.length).toBe(1);
    expect(failed.events[0]).toMatchObject({ type: "login_failed", email: "ama@example.com", detail: "wrong password" });
    expect((await call("api/admin/activity.ts", "GET", { token, query: "?type=../../etc" })).status).toBe(400);
    const limited = await json(await call("api/admin/activity.ts", "GET", { token, query: "?limit=2" }));
    expect(limited.events).toHaveLength(2);
  });

  it("applications and alert subscribers", async () => {
    const { token } = await seed();
    const apps = await json(await call("api/admin/applications.ts", "GET", { token }));
    expect(apps.applications).toHaveLength(1);
    expect(apps.applications[0]).toMatchObject({ jobSlug: "cleaner", fullName: "Ama Mensah", message: "Hello" });
    const alerts = await json(await call("api/admin/alerts.ts", "GET", { token }));
    expect(alerts.subscribers[0]).toMatchObject({ email: "ama@example.com", interests: ["Internships"] });
  });

  it("audit log records what the admin did", async () => {
    const { token } = await seed();
    await call("api/admin/overview.ts", "GET", { token });
    await call("api/admin/users.ts", "GET", { token, query: "?email=ama@example.com" });
    const audit = await json(await call("api/admin/audit.ts", "GET", { token }));
    const actions = audit.audit.map((r: { action: string }) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["admin_setup", "view_overview", "view_user"]));
    expect(audit.audit[0]).toMatchObject({ admin: "kyle.admin" });
  });

  it("CSV export: complete, formula-safe, secret-free and audited", async () => {
    const { token } = await seed();
    const res = await call("api/admin/export.ts", "GET", { token });
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("cintexa-users-2026-10-11.csv");
    const csv = await res.text();
    expect(csv).not.toMatch(/passwordHash|salt/i);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(4); // header + 3 users
    expect(lines[0]).toBe("id,email,full_name,phone,company,role,date_of_birth,time_zone,signup_country,signup_city,signup_ip,created_at,last_login_at,login_count,birthday_email");
    expect(csv).toContain("'=HYPERLINK"); // formula neutralised
    expect(csv).not.toMatch(/,=HYPERLINK/);
    const audit = await json(await call("api/admin/audit.ts", "GET", { token }));
    expect(audit.audit.some((r: { action: string; detail: string }) => r.action === "export_users" && r.detail === "3 of 3")).toBe(true);
  });
});
