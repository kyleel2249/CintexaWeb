import { resolveResendConfig } from "../../lib/email";
import { corsHeaders } from "../../lib/cintexa-auth";

export interface Env {
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
  const { configured, from } = resolveResendConfig(context.env as Record<string, unknown>);
  return Response.json(
    {
      emailConfigured: configured,
      fromDomain: from.includes("@") ? from.split("@").pop()?.replace(">", "") : null,
    },
    { status: 200, headers },
  );
};
