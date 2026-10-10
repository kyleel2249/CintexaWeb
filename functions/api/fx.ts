/**
 * GET /api/fx?base=GHS — live exchange rates (units of each currency per 1 `base`).
 * Proxies open.er-api.com (ExchangeRate-API open endpoint; attribution shown in the dashboard) and
 * lets Cloudflare cache the upstream response, so the browser never calls a third party directly.
 * Never invents a rate: on any upstream problem it answers 502 and the UI shows the original currency.
 */
import { corsHeaders } from "../lib/cintexa-auth";

const CODE_RE = /^[A-Z]{3}$/;
const UPSTREAM = "https://open.er-api.com/v6/latest/";
const CACHE_SECONDS = 6 * 60 * 60;

type Upstream = {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, unknown>;
};

export function parseUpstream(base: string, body: Upstream) {
  if (body.result !== "success" || body.base_code !== base || !body.rates) return null;
  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(body.rates)) {
    if (CODE_RE.test(code) && typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = value;
  }
  if (rates[base] === undefined) return null;
  const updated = body.time_last_update_utc ? new Date(body.time_last_update_utc) : null;
  return {
    base,
    rates,
    updatedAt: updated && !Number.isNaN(updated.getTime()) ? updated.toISOString() : null,
    source: "open.er-api.com",
  };
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  const base = (new URL(request.url).searchParams.get("base") ?? "GHS").toUpperCase();
  if (!CODE_RE.test(base)) {
    return Response.json({ error: "Invalid base currency." }, { status: 400, headers });
  }
  try {
    const upstream = await fetch(`${UPSTREAM}${base}`, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    } as RequestInit);
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const data = parseUpstream(base, (await upstream.json()) as Upstream);
    if (!data) throw new Error("upstream payload invalid");
    return Response.json(data, { headers: { ...headers, "Cache-Control": `public, max-age=${CACHE_SECONDS}` } });
  } catch {
    return Response.json(
      { error: "Exchange rates are temporarily unavailable." },
      { status: 502, headers: { ...headers, "Cache-Control": "no-store" } },
    );
  }
};
