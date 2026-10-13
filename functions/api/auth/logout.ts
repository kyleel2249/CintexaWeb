import { bearerToken, corsHeaders, deleteSession, readSession } from "../../lib/cintexa-auth";
import { recordEvent, requestMeta } from "../../lib/events";

export interface Env {
  KV: KVNamespace;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  const token = bearerToken(context.request);
  const session = await readSession(context.env.KV, token);
  await deleteSession(context.env.KV, token);
  if (session) {
    await recordEvent(context.env, { type: "logout", userId: session.userId, email: session.email, ...requestMeta(context.request) });
  }
  return Response.json({ ok: true }, { headers });
};
