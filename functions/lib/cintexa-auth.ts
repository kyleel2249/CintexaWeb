/**
 * CINTEXA native auth — password hashing + KV sessions (no Clerk).
 */

export type StoredUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  company?: string;
  role?: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

export type SessionRecord = {
  userId: string;
  email: string;
  fullName: string;
  createdAt: string;
  expiresAt: string;
};

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string, saltB64?: string): Promise<{ salt: string; hash: string }> {
  const enc = new TextEncoder();
  const salt = saltB64 ? fromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return { salt: b64(salt), hash: b64(bits) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  let ok = 0;
  for (let i = 0; i < hash.length; i++) ok |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return ok === 0;
}

export function userKey(email: string): string {
  return `user:${email.trim().toLowerCase()}`;
}

export function sessionKey(token: string): string {
  return `session:${token}`;
}

export async function createSession(
  kv: KVNamespace,
  user: Pick<StoredUser, "id" | "email" | "fullName">,
): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const record: SessionRecord = {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  await kv.put(sessionKey(token), JSON.stringify(record), { expirationTtl: SESSION_TTL_SECONDS });
  return token;
}

export async function readSession(kv: KVNamespace, token: string | null | undefined): Promise<SessionRecord | null> {
  if (!token || token.length < 20) return null;
  const raw = await kv.get(sessionKey(token));
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SessionRecord;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await kv.delete(sessionKey(token));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function deleteSession(kv: KVNamespace, token: string | null | undefined): Promise<void> {
  if (!token) return;
  await kv.delete(sessionKey(token));
}

export function corsHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extra,
  };
}

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("Authorization") || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || null;
}
