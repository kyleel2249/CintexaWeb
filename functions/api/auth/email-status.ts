import { resolveResendConfigAsync } from "../../lib/email";
import { corsHeaders } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  RESEND_KEY?: string;
  RESEND_TOKEN?: string;
  EMAIL_FROM?: string;
  RESEND_FROM?: string;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

/** Public health check — does not expose secrets. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  const resolved = await resolveResendConfigAsync(
    context.env,
  );
  const envKeys = Object.keys(context.env || {}).filter((k) =>
    /resend|email|from|kv/i.test(k),
  );
  return Response.json(
    {
      emailConfigured: resolved.configured,
      source: resolved.source,
      matchedKey: resolved.matchedKey,
      fromDomain: resolved.from.includes("@")
        ? resolved.from.split("@").pop()?.replace(">", "")
        : null,
      visibleEnvKeyNames: envKeys,
    },
    { status: 200, headers },
  );
};
