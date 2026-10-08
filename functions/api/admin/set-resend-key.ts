import { corsHeaders } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
  ADMIN_API_KEY?: string;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

/**
 * POST { apiKey, from? } with header x-admin-key: ADMIN_API_KEY
 * Stores Resend credentials in KV so Functions can send mail even when
 * Pages dashboard env vars are not injected at runtime.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  const adminKey = (context.env.ADMIN_API_KEY || "").trim();
  const provided = (context.request.headers.get("x-admin-key") || "").trim();
  if (!adminKey || !provided || !timingSafeEqual(adminKey, provided)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = (await context.request.json()) as { apiKey?: string; from?: string };
    const apiKey = (body.apiKey || "").trim();
    if (!apiKey.startsWith("re_")) {
      return Response.json({ error: "apiKey must be a Resend key (re_...)" }, { status: 400, headers });
    }
    await context.env.KV.put("secrets:RESEND_API_KEY", apiKey);
    if (body.from && body.from.trim()) {
      await context.env.KV.put("secrets:EMAIL_FROM", body.from.trim());
    }
    return Response.json({ ok: true, stored: true }, { status: 200, headers });
  } catch {
    return Response.json({ error: "Failed to store key" }, { status: 500, headers });
  }
};
