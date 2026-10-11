import { bearerToken, corsHeaders, publicUser, readSession, userKey, type StoredUser } from "../../lib/cintexa-auth";

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
  const raw = await context.env.KV.get(userKey(session.email));
  if (raw) {
    try {
      return Response.json({ user: publicUser(JSON.parse(raw) as StoredUser) }, { headers });
    } catch {
      /* fall through to the session snapshot */
    }
  }
  return Response.json(
    { user: { id: session.userId, email: session.email, fullName: session.fullName, dateOfBirth: null, birthdayEmail: true } },
    { headers },
  );
};
