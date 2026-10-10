/**
 * GET /api/geo — the visitor's country as seen by Cloudflare (no third-party lookup, no cookies).
 * Used to choose the display currency. Returns { country: "GH" | null }.
 */
import { corsHeaders } from "../lib/cintexa-auth";

const COUNTRY_RE = /^[A-Z]{2}$/;

export function countryFromRequest(request: Request): string | null {
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const raw = (cf?.country ?? request.headers.get("CF-IPCountry") ?? "").toUpperCase();
  // XX = unknown, T1 = Tor
  return COUNTRY_RE.test(raw) && raw !== "XX" && raw !== "T1" ? raw : null;
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestGet: PagesFunction = async ({ request }) =>
  Response.json(
    { country: countryFromRequest(request) },
    { headers: corsHeaders({ "Content-Type": "application/json", "Cache-Control": "private, max-age=3600" }) },
  );
