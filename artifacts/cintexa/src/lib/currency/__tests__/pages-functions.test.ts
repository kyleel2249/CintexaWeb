import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// Loaded by absolute path so the app's tsconfig does not type-check Workers-only code.
const FN = path.resolve(__dirname, "../../../../../../functions/api");
type Handler = (ctx: { request: Request }) => Promise<Response>;
const load = async (name: string) => (await import(/* @vite-ignore */ path.join(FN, name))) as Record<string, unknown>;

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/geo", () => {
  it("returns the Cloudflare country", async () => {
    const mod = await load("geo.ts");
    const request = Object.assign(new Request("https://cintexa.com/api/geo"), { cf: { country: "gh" } });
    const res = await (mod.onRequestGet as Handler)({ request });
    expect(await res.json()).toEqual({ country: "GH" });
    expect(res.headers.get("Cache-Control")).toContain("private");
  });
  it("falls back to the CF-IPCountry header and ignores unknown/Tor", async () => {
    const mod = await load("geo.ts");
    const country = mod.countryFromRequest as (r: Request) => string | null;
    expect(country(new Request("https://x", { headers: { "CF-IPCountry": "NG" } }))).toBe("NG");
    expect(country(new Request("https://x", { headers: { "CF-IPCountry": "XX" } }))).toBeNull();
    expect(country(new Request("https://x", { headers: { "CF-IPCountry": "T1" } }))).toBeNull();
    expect(country(new Request("https://x"))).toBeNull();
  });
});

describe("GET /api/fx", () => {
  const upstream = {
    result: "success",
    base_code: "GHS",
    time_last_update_utc: "Sat, 10 Oct 2026 00:00:01 +0000",
    rates: { GHS: 1, USD: 0.09, NGN: 130, BAD: -1, XYZ: "x" },
  };

  it("returns validated rates and drops junk entries", async () => {
    const mod = await load("fx.ts");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(upstream), { status: 200 })));
    const res = await (mod.onRequestGet as Handler)({ request: new Request("https://cintexa.com/api/fx?base=ghs") });
    const body = (await res.json()) as { base: string; rates: Record<string, number>; updatedAt: string };
    expect(res.status).toBe(200);
    expect(body.base).toBe("GHS");
    expect(body.rates).toEqual({ GHS: 1, USD: 0.09, NGN: 130 });
    expect(body.updatedAt).toBe("2026-10-10T00:00:01.000Z");
    expect(res.headers.get("Cache-Control")).toContain("max-age");
  });

  it("rejects a malformed base without calling upstream", async () => {
    const mod = await load("fx.ts");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const res = await (mod.onRequestGet as Handler)({ request: new Request("https://cintexa.com/api/fx?base=../x") });
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it("answers 502 (never a made-up rate) when upstream fails or is invalid", async () => {
    const mod = await load("fx.ts");
    for (const impl of [
      async () => new Response("nope", { status: 500 }),
      async () => new Response(JSON.stringify({ result: "error" }), { status: 200 }),
      async () => {
        throw new Error("network");
      },
    ]) {
      vi.stubGlobal("fetch", vi.fn(impl));
      const res = await (mod.onRequestGet as Handler)({ request: new Request("https://cintexa.com/api/fx?base=GHS") });
      expect(res.status).toBe(502);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
  });
});
