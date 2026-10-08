import { bearerToken, corsHeaders, readSession } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  const session = await readSession(context.env.KV, bearerToken(context.request));
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  return Response.json(
    {
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
      },
    },
    { headers },
  );
};
