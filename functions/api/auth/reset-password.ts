import { corsHeaders, hashPassword, userKey, type StoredUser } from "../../lib/cintexa-auth";

export interface Env {
  KV: KVNamespace;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTEMPTS = 5;

function resetKey(email: string) {
  return `reset:${email.trim().toLowerCase()}`;
}

async function hashCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

/**
 * POST { email, code, newPassword } → verify recovery code and update password hash in KV.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const body = (await context.request.json()) as {
      email?: string;
      code?: string;
      newPassword?: string;
    };
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim().replace(/\s/g, "");
    const newPassword = body.newPassword || "";

    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400, headers });
    }
    if (!/^\d{6}$/.test(code)) {
      return Response.json({ error: "Enter the 6-digit recovery code." }, { status: 400, headers });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return Response.json({ error: "Password must be 8–128 characters." }, { status: 400, headers });
    }

    const resetRaw = await context.env.KV.get(resetKey(email));
    if (!resetRaw) {
      return Response.json(
        { error: "Code expired or not found. Request a new recovery code." },
        { status: 400, headers },
      );
    }

    const reset = JSON.parse(resetRaw) as {
      codeHash: string;
      userId: string;
      email: string;
      attempts: number;
    };

    if (reset.attempts >= MAX_ATTEMPTS) {
      await context.env.KV.delete(resetKey(email));
      return Response.json(
        { error: "Too many incorrect attempts. Request a new recovery code." },
        { status: 429, headers },
      );
    }

    const attemptHash = await hashCode(code);
    if (attemptHash !== reset.codeHash) {
      reset.attempts += 1;
      await context.env.KV.put(resetKey(email), JSON.stringify(reset), { expirationTtl: 15 * 60 });
      return Response.json(
        { error: "Incorrect code. Check email or SMS and try again." },
        { status: 400, headers },
      );
    }

    const userRaw = await context.env.KV.get(userKey(email));
    if (!userRaw) {
      await context.env.KV.delete(resetKey(email));
      return Response.json({ error: "Account not found." }, { status: 404, headers });
    }

    const user = JSON.parse(userRaw) as StoredUser;
    const { salt, hash } = await hashPassword(newPassword);
    user.salt = salt;
    user.passwordHash = hash;
    await context.env.KV.put(userKey(email), JSON.stringify(user));
    await context.env.KV.delete(resetKey(email));

    return Response.json(
      { ok: true, message: "Password updated. You can log in with your new password." },
      { status: 200, headers },
    );
  } catch (err) {
    console.error("auth/reset-password", err);
    return Response.json({ error: "Could not reset password. Try again." }, { status: 500, headers });
  }
};
