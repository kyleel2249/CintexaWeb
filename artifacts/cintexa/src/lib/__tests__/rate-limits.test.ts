// @vitest-environment node
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { FakeKV } from "@/test/fake-kv";

const FN = path.resolve(__dirname, "../../../../../functions");
type Mw = (ctx: { request: Request; env: unknown; next: () => Promise<Response> }) => Promise<Response>;
type Policy = { name: string; limit: number; windowSec: number };
const loadMw = async () => ((await import(/* @vite-ignore */ path.join(FN, "api/_middleware.ts"))) as { onRequest: Mw }).onRequest;
const loadPolicy = async () => (await import(/* @vite-ignore */ path.join(FN, "lib/rate-policy.ts"))) as { policyFor: (m: string, p: string) => Policy; DEFAULT_POLICY: Policy };

let kv: FakeKV;
beforeEach(() => {
  kv = new FakeKV();
});

async function hit(method: string, p: string, ip = "198.51.100.1", env: unknown = { KV: kv }) {
  const mw = await loadMw();
  let reached = false;
  const res = await mw({
    request: new Request(`https://cintexa.com${p}`, { method, headers: { "CF-Connecting-IP": ip } }),
    env,
    next: async () => {
      reached = true;
      return new Response("ok");
    },
  });
  return { res, reached };
}

describe("policy table", () => {
  it("gives credential and mail-sending endpoints tight budgets and everything else a default", async () => {
    const { policyFor, DEFAULT_POLICY } = await loadPolicy();
    expect(policyFor("POST", "/api/auth/login")).toMatchObject({ limit: 10, windowSec: 900 });
    expect(policyFor("POST", "/api/auth/forgot-password")).toMatchObject({ limit: 6, windowSec: 3600 });
    expect(policyFor("POST", "/api/contact")).toMatchObject({ limit: 6 });
    expect(policyFor("POST", "/api/admin/login").name).toBe("admin-login");
    expect(policyFor("GET", "/api/admin/users").name).toBe("admin");
    expect(policyFor("GET", "/api/auth/me").name).toBe("auth");
    expect(policyFor("POST", "/api/notifications/signup").name).toBe("notify");
    expect(policyFor("GET", "/api/fx").name).toBe("lookup");
    expect(policyFor("GET", "/api/some-new-endpoint")).toEqual(DEFAULT_POLICY);
    expect(policyFor("POST", "/api/auth/login/")).toMatchObject({ name: "auth-login" });
  });
});

describe("middleware", () => {
  it("allows up to the limit, then answers 429 with Retry-After", async () => {
    for (let i = 0; i < 10; i++) expect((await hit("POST", "/api/auth/login")).reached).toBe(true);
    const blocked = await hit("POST", "/api/auth/login");
    expect(blocked.reached).toBe(false);
    expect(blocked.res.status).toBe(429);
    expect(Number(blocked.res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(blocked.res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await blocked.res.json()).toEqual({ error: "Too many requests. Please try again later." });
  });
  it("counts per client IP and per policy", async () => {
    for (let i = 0; i < 11; i++) await hit("POST", "/api/auth/login", "198.51.100.1");
    expect((await hit("POST", "/api/auth/login", "198.51.100.2")).reached).toBe(true);
    expect((await hit("GET", "/api/auth/me", "198.51.100.1")).reached).toBe(true);
  });
  it("covers endpoints that had no limiter of their own (e.g. /api/fx)", async () => {
    for (let i = 0; i < 60; i++) await hit("GET", "/api/fx");
    expect((await hit("GET", "/api/fx")).res.status).toBe(429);
  });
  it("never throttles CORS pre-flights", async () => {
    for (let i = 0; i < 200; i++) await hit("OPTIONS", "/api/auth/login");
    expect((await hit("OPTIONS", "/api/auth/login")).reached).toBe(true);
  });
  it("fails open (with a log) if KV is missing or broken", async () => {
    expect((await hit("POST", "/api/auth/login", "1.1.1.1", {})).reached).toBe(true);
    const broken = { KV: { get: async () => { throw new Error("kv down"); }, put: async () => undefined } };
    expect((await hit("POST", "/api/auth/login", "1.1.1.1", broken)).reached).toBe(true);
  });
});
