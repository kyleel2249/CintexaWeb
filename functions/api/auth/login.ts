import {
  corsHeaders,
  createSession,
  userKey,
  verifyPassword,
  type StoredUser,
} from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const body = (await context.request.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !EMAIL_RE.test(email) || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400, headers });
    }

    const raw = await context.env.KV.get(userKey(email));
    if (!raw) {
      return Response.json({ error: "Invalid email or password." }, { status: 401, headers });
    }

    const user = JSON.parse(raw) as StoredUser;
    const ok = await verifyPassword(password, user.salt, user.passwordHash);
    if (!ok) {
      return Response.json({ error: "Invalid email or password." }, { status: 401, headers });
    }

    const token = await createSession(context.env.KV, user);
    return Response.json(
      {
        ok: true,
        token,
        user: { id: user.id, email: user.email, fullName: user.fullName },
      },
      { headers },
    );
  } catch (err) {
    console.error("auth/login", err);
    return Response.json({ error: "Login failed." }, { status: 500, headers });
  }
};
