// @vitest-environment node
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeKV } from "@/test/fake-kv";

const FN = path.resolve(__dirname, "../../../../../functions");
const load = async (p: string) => (await import(/* @vite-ignore */ path.join(FN, p))) as Record<string, unknown>;
type Handler = (ctx: unknown) => Promise<Response>;

type Sent = { to: string; subject: string; html: string; reply_to?: string };
let sent: Sent[];

beforeEach(() => {
  sent = [];
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-11T12:00:00Z"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body ?? "{}")) as { to: string[]; subject: string; html: string; reply_to?: string };
      sent.push({ to: b.to[0]!, subject: b.subject, html: b.html, reply_to: b.reply_to });
      return new Response(JSON.stringify({ id: "mail-1" }), { status: 200 });
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const ENV = (kv: FakeKV, extra: Record<string, unknown> = {}) => ({ KV: kv, RESEND_API_KEY: "k", ...extra });

async function call(file: string, body: unknown, env: unknown, headers: Record<string, string> = {}) {
  const mod = await load(file);
  const request = new Request("https://cintexa.com/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "1.2.3.4", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return (mod.onRequestPost as Handler)({ request, env });
}

const APPLY = "api/careers/apply.ts";
const good = { jobSlug: "cleaner", fullName: "Ama Mensah", email: "ama@example.com", phone: "", location: "Accra", message: "I am reliable." };

describe("POST /api/careers/apply", () => {
  it("accepts an application, stores it, and e-mails the team and the applicant", async () => {
    const kv = new FakeKV();
    const res = await call(APPLY, good, ENV(kv));
    const data = (await res.json()) as { ok: boolean; id: string };
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);

    const stored = JSON.parse(kv.store.get(`application:${data.id}`)!);
    expect(stored).toMatchObject({ jobSlug: "cleaner", fullName: "Ama Mensah", email: "ama@example.com", jobRole: "Cleaners" });
    expect(kv.ttl.get(`application:${data.id}`)).toBe(60 * 60 * 24 * 180); // data minimisation: auto-expires

    expect(sent.map((m) => m.to).sort()).toEqual(["ama@example.com", "info@cintexa.com"]);
    const admin = sent.find((m) => m.to === "info@cintexa.com")!;
    expect(admin.subject).toContain("Cleaners");
    expect(admin.reply_to).toBe("ama@example.com");
    expect(sent.find((m) => m.to === "ama@example.com")!.subject).toContain("received your application");
  });

  it("a phone-only application is fine, and the team is still told", async () => {
    const res = await call(APPLY, { ...good, email: "", phone: "+233 24 000 0000" }, ENV(new FakeKV()));
    expect(res.status).toBe(201);
    expect(sent.map((m) => m.to)).toEqual(["info@cintexa.com"]);
  });

  it("uses NOTIFY_ADMIN_EMAIL when set", async () => {
    await call(APPLY, good, ENV(new FakeKV(), { NOTIFY_ADMIN_EMAIL: "hr@cintexa.com" }));
    expect(sent.map((m) => m.to)).toContain("hr@cintexa.com");
  });

  it("validates input with per-field errors, and stores nothing", async () => {
    const kv = new FakeKV();
    for (const bad of [{ fullName: "A" }, { email: "nope" }, { email: "", phone: "" }, { email: "", phone: "abc" }]) {
      const res = await call(APPLY, { ...good, ...bad }, ENV(new FakeKV()));
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(Object.keys(((await res.json()) as { fieldErrors: object }).fieldErrors).length).toBeGreaterThan(0);
    }
    expect(kv.keys("application:")).toEqual([]);
    expect((await call(APPLY, "{not json", ENV(new FakeKV()))).status).toBe(400);
  });

  it("only accepts applications for vacancies that exist and are open", async () => {
    expect((await call(APPLY, { ...good, jobSlug: "no-such-job" }, ENV(new FakeKV()))).status).toBe(404);
    expect((await call(APPLY, { ...good, jobSlug: 42 }, ENV(new FakeKV()))).status).toBe(404);
    vi.setSystemTime(new Date("2027-01-02T12:00:00Z")); // Cleaners closed on 31 Dec 2026
    const res = await call(APPLY, good, ENV(new FakeKV()));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toMatch(/no longer open/);
    expect(sent).toHaveLength(0);
  });

  it("silently drops bots that fill the hidden field", async () => {
    const kv = new FakeKV();
    const res = await call(APPLY, { ...good, website: "http://spam.example" }, ENV(kv));
    expect(res.status).toBe(200);
    expect(kv.keys("application:")).toEqual([]);
    expect(sent).toHaveLength(0);
  });

  it("refuses a second application for the same vacancy from the same person", async () => {
    const kv = new FakeKV();
    expect((await call(APPLY, good, ENV(kv))).status).toBe(201);
    const again = await call(APPLY, good, ENV(kv));
    expect(again.status).toBe(409);
    expect(kv.keys("application:").filter((k) => !k.includes("dedupe"))).toHaveLength(1);
    // a different vacancy is fine
    expect((await call(APPLY, { ...good, jobSlug: "bybeth-boutique-sales-girl" }, ENV(kv))).status).toBe(201);
  });

  it("rate-limits one connection, but not others", async () => {
    const kv = new FakeKV();
    let last = 0;
    for (let i = 0; i < 9; i++) last = (await call(APPLY, { ...good, email: `p${i}@example.com` }, ENV(kv))).status;
    expect(last).toBe(429);
    const blocked = await call(APPLY, { ...good, email: "z@example.com" }, ENV(kv));
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await call(APPLY, { ...good, email: "y@example.com" }, ENV(kv), { "CF-Connecting-IP": "9.9.9.9" })).status).toBe(201);
  });

  it("escapes everything an applicant types before it goes into the team's e-mail", async () => {
    await call(APPLY, { ...good, fullName: "<script>alert(1)</script>", message: "<img src=x onerror=alert(1)>" }, ENV(new FakeKV()));
    const admin = sent.find((m) => m.to === "info@cintexa.com")!;
    expect(admin.html).not.toContain("<script>");
    expect(admin.html).not.toContain("<img src=x");
    expect(admin.html).toContain("&lt;script&gt;");
  });

  it("still records the application when e-mail is not configured", async () => {
    const kv = new FakeKV();
    const res = await call(APPLY, good, { KV: kv });
    expect(res.status).toBe(201);
    expect(kv.keys("application:").length).toBeGreaterThan(0);
  });
});

const ALERT = "api/notifications/career-alert.ts";
const signup = { fullName: "Ama Mensah", email: "ama@example.com", interests: ["Internships"] };

describe("POST /api/notifications/career-alert (hardened)", () => {
  it("still works for a normal signup", async () => {
    const kv = new FakeKV();
    const res = await call(ALERT, signup, ENV(kv));
    expect(res.status).toBe(200);
    expect(JSON.parse(kv.store.get("career_alert:ama@example.com")!)).toMatchObject({ fullName: "Ama Mensah", interests: ["Internships"] });
    expect(sent.map((m) => m.to).sort()).toEqual(["ama@example.com", "info@cintexa.com"]);
  });

  it("drops bots (honeypot) without storing or e-mailing anyone", async () => {
    const kv = new FakeKV();
    const res = await call(ALERT, { ...signup, website: "http://spam.example" }, ENV(kv));
    expect(res.status).toBe(200);
    expect(kv.keys("career_alert")).toEqual([]);
    expect(sent).toHaveLength(0);
  });

  it("can't be used to e-mail-bomb one address", async () => {
    const kv = new FakeKV();
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await call(ALERT, signup, ENV(kv), { "CF-Connecting-IP": `5.5.5.${i}` })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(sent.filter((m) => m.to === "ama@example.com")).toHaveLength(3);
  });

  it("limits signups per connection", async () => {
    const kv = new FakeKV();
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) statuses.push((await call(ALERT, { ...signup, email: `u${i}@example.com` }, ENV(kv))).status);
    expect(statuses.slice(0, 6).every((s) => s === 200)).toBe(true);
    expect(statuses.slice(6)).toEqual([429, 429]);
  });

  it("cleans the interests list and rejects bad input", async () => {
    const kv = new FakeKV();
    const long = "x".repeat(200);
    await call(ALERT, { ...signup, interests: [long, 42, "  ", "ok", { a: 1 }] }, ENV(kv));
    const rec = JSON.parse(kv.store.get("career_alert:ama@example.com")!);
    expect(rec.interests).toEqual(["x".repeat(80), "ok"]);
    expect((await call(ALERT, "{nope", ENV(new FakeKV()))).status).toBe(400);
    expect((await call(ALERT, { ...signup, email: "bad" }, ENV(new FakeKV()))).status).toBe(400);
  });
});

describe("rateLimit helper", () => {
  it("uses a fixed window that resets", async () => {
    const { rateLimit } = (await load("lib/ratelimit.ts")) as {
      rateLimit: (kv: unknown, key: string, limit: number, windowSec: number, now?: number) => Promise<{ ok: boolean; retryAfter: number }>;
    };
    const kv = new FakeKV();
    const t0 = 1_000_000;
    expect((await rateLimit(kv, "k", 2, 100, t0)).ok).toBe(true);
    expect((await rateLimit(kv, "k", 2, 100, t0 + 1000)).ok).toBe(true);
    const blocked = await rateLimit(kv, "k", 2, 100, t0 + 2000);
    expect(blocked).toEqual({ ok: false, retryAfter: 98 });
    expect((await rateLimit(kv, "k", 2, 100, t0 + 101_000)).ok).toBe(true); // new window
    expect(kv.ttl.get("k")).toBeGreaterThanOrEqual(60); // KV minimum TTL
  });
});
