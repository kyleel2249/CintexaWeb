import { bearerToken, corsHeaders, deleteSession } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  await deleteSession(context.env.KV, bearerToken(context.request));
  return Response.json({ ok: true }, { headers });
};
