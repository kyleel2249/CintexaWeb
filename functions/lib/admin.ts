/**
 * Admin console auth on Workers KV.
 *  - Accounts: username + salted PBKDF2 hash (same hasher as users). No default credentials exist.
 *  - First admin is created through a one-time link e-mailed to the security inbox (or ADMIN_SETUP_TOKEN).
 *  - Sessions: random bearer token; only its SHA-256 is stored, so a leaked KV listing can't be replayed.
 *  - Brute force: per-IP and per-username limits with lockout and an e-mail alert.
 *  - Every admin action is written to an audit log.
 */
import { hashPassword, verifyPassword } from "./cintexa-auth";
import { constantTimeEquals } from "./auth";
import { sendEmail } from "./email";
import { adminLoginAlertEmail, adminNoticeEmail } from "./admin-email";
import { recordEvent, requestMeta, type EventType, type RequestMeta } from "./events";
import { rateLimit } from "./ratelimit";

export const SECURITY_EMAIL_DEFAULT = "info@cintexa.com";
export const SESSION_TTL_SEC = 8 * 60 * 60;
export const TOKEN_TTL_MIN = 30;
export const MIN_PASSWORD = 12;
export const MAX_FAILS = 5;
export const LOCK_WINDOW_SEC = 15 * 60;

export type AdminEnv = {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_SECURITY_EMAIL?: string;
  ADMIN_SETUP_TOKEN?: string;
};

export type AdminRecord = {
  username: string;
  salt: string;
  passwordHash: string;
  /** Bumped on password reset; sessions carrying an older value stop working. */
  sessionVersion: number;
  createdAt: string;
  lastLoginAt?: string;
};

export const securityEmail = (env: AdminEnv) => env.ADMIN_SECURITY_EMAIL || SECURITY_EMAIL_DEFAULT;

// ---------- small helpers ----------

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{2,31}$/.test(u) ? u : null;
}

const WEAK = new Set(["password1234", "123456789012", "administrator", "qwertyuiop12", "cintexa12345", "letmein12345"]);

export function passwordProblem(password: unknown, username: string): string | null {
  if (typeof password !== "string") return "Enter a password.";
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password.length > 128) return "That password is too long.";
  const lower = password.toLowerCase();
  if (lower.includes(username) || WEAK.has(lower)) return "Choose a password that is harder to guess.";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) return "Mix upper-case, lower-case, numbers or symbols (at least three kinds).";
  return null;
}

// ---------- accounts ----------

const adminKey = (u: string) => `admin:${u}`;
const ADMIN_INDEX = "admin:index";

export async function adminExists(kv: KVNamespace): Promise<boolean> {
  try {
    const list = JSON.parse((await kv.get(ADMIN_INDEX)) ?? "[]") as unknown;
    return Array.isArray(list) && list.length > 0;
  } catch {
    return false;
  }
}

export async function getAdmin(kv: KVNamespace, username: string): Promise<AdminRecord | null> {
  const raw = await kv.get(adminKey(username));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminRecord;
  } catch {
    return null;
  }
}

export async function createAdmin(kv: KVNamespace, username: string, password: string): Promise<AdminRecord> {
  const { salt, hash } = await hashPassword(password);
  const record: AdminRecord = { username, salt, passwordHash: hash, sessionVersion: 1, createdAt: new Date().toISOString() };
  await kv.put(adminKey(username), JSON.stringify(record));
  const list = JSON.parse((await kv.get(ADMIN_INDEX)) ?? "[]") as string[];
  if (!list.includes(username)) await kv.put(ADMIN_INDEX, JSON.stringify([...list, username]));
  return record;
}

export async function setAdminPassword(kv: KVNamespace, record: AdminRecord, password: string): Promise<void> {
  const { salt, hash } = await hashPassword(password);
  await kv.put(
    adminKey(record.username),
    JSON.stringify({ ...record, salt, passwordHash: hash, sessionVersion: record.sessionVersion + 1 }),
  );
}

/** Verifies a password. For unknown usernames it still does the same work, so timing doesn't reveal them. */
export async function checkAdminPassword(admin: AdminRecord | null, password: string): Promise<boolean> {
  if (!admin) {
    await verifyPassword(password, "AAAAAAAAAAAAAAAAAAAAAA==", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
    return false;
  }
  return verifyPassword(password, admin.salt, admin.passwordHash);
}

// ---------- sessions ----------

type SessionRow = { username: string; version: number; createdAt: string; expiresAt: string };
const sessionKeyFor = async (token: string) => `admin_session:${await sha256Hex(token)}`;

export async function createAdminSession(kv: KVNamespace, admin: AdminRecord) {
  const token = randomToken();
  const now = Date.now();
  const row: SessionRow = {
    username: admin.username,
    version: admin.sessionVersion,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_SEC * 1000).toISOString(),
  };
  await kv.put(await sessionKeyFor(token), JSON.stringify(row), { expirationTtl: SESSION_TTL_SEC });
  return { token, expiresAt: row.expiresAt };
}

export function bearer(request: Request): string | null {
  const h = request.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
}

export async function readAdminSession(kv: KVNamespace, token: string | null): Promise<{ username: string } | null> {
  if (!token || token.length < 32) return null;
  const raw = await kv.get(await sessionKeyFor(token));
  if (!raw) return null;
  try {
    const row = JSON.parse(raw) as SessionRow;
    if (Date.parse(row.expiresAt) < Date.now()) return null;
    const admin = await getAdmin(kv, row.username);
    if (!admin || admin.sessionVersion !== row.version) return null;
    return { username: admin.username };
  } catch {
    return null;
  }
}

export async function deleteAdminSession(kv: KVNamespace, token: string | null): Promise<void> {
  if (token) await kv.delete(await sessionKeyFor(token));
}

// ---------- one-time tokens (setup / reset) ----------

type OneTime = { type: "setup" | "reset"; username?: string };
const tokenKeyFor = async (token: string) => `admin_token:${await sha256Hex(token)}`;

export async function issueOneTimeToken(kv: KVNamespace, data: OneTime): Promise<string> {
  const token = randomToken();
  await kv.put(await tokenKeyFor(token), JSON.stringify(data), { expirationTtl: TOKEN_TTL_MIN * 60 });
  return token;
}

/** Returns the token's data and burns it (single use), or null. With `keep`, only looks — nothing is burned. */
export async function consumeOneTimeToken(
  kv: KVNamespace,
  token: unknown,
  type: OneTime["type"],
  keep = false,
): Promise<OneTime | null> {
  if (typeof token !== "string" || token.length < 32) return null;
  const key = await tokenKeyFor(token);
  const raw = await kv.get(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as OneTime;
    if (data.type !== type) return null;
    if (!keep) await kv.delete(key);
    return data;
  } catch {
    return null;
  }
}

export function setupTokenMatchesEnv(env: AdminEnv, token: unknown): boolean {
  return Boolean(env.ADMIN_SETUP_TOKEN && typeof token === "string" && constantTimeEquals(token, env.ADMIN_SETUP_TOKEN));
}

// ---------- responses, guard, audit ----------

export function adminJson(data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra } });
}

export async function requireAdmin(
  request: Request,
  env: AdminEnv,
): Promise<{ admin: { username: string } } | { response: Response }> {
  const admin = await readAdminSession(env.KV, bearer(request));
  if (!admin) return { response: adminJson({ error: "Unauthorized" }, 401) };
  return { admin };
}

export type AuditRow = { id: string; at: string; admin: string; action: string; detail?: string; ip?: string };

export async function audit(env: AdminEnv, admin: string, action: string, request: Request, detail?: string): Promise<void> {
  try {
    const at = new Date();
    const id = crypto.randomUUID();
    const row: AuditRow = { id, at: at.toISOString(), admin, action, detail: detail?.slice(0, 200), ip: requestMeta(request).ip };
    const inverted = String(9_999_999_999_999 - at.getTime()).padStart(13, "0");
    await env.KV.put(`audit:${inverted}:${id}`, JSON.stringify(row), { expirationTtl: 400 * 24 * 60 * 60 });
  } catch (err) {
    console.error("audit", err);
  }
}

// ---------- notifications ----------

/** Best-effort security notice to the CINTEXA inbox. Never includes a password. */
export async function notifySecurity(env: AdminEnv, mail: { subject: string; html: string; text: string }): Promise<void> {
  try {
    await sendEmail(env, { to: securityEmail(env), ...mail, tags: [{ name: "category", value: "admin_security" }] });
  } catch (err) {
    console.error("notifySecurity", err);
  }
}

export const loginAlert = (env: AdminEnv, username: string, meta: RequestMeta) =>
  notifySecurity(env, adminLoginAlertEmail(username, meta, new Date()));
export const securityNotice = (env: AdminEnv, title: string, username: string, meta: RequestMeta) =>
  notifySecurity(env, adminNoticeEmail(title, username, meta, new Date()));

// ---------- login throttling ----------

const failKey = (u: string) => `admin:fail:${u}`;

export async function isLockedOut(kv: KVNamespace, username: string): Promise<boolean> {
  return (Number((await kv.get(failKey(username))) ?? "0") || 0) >= MAX_FAILS;
}

/** Returns the new failure count. */
export async function recordAdminFailure(kv: KVNamespace, username: string): Promise<number> {
  const n = (Number((await kv.get(failKey(username))) ?? "0") || 0) + 1;
  await kv.put(failKey(username), String(n), { expirationTtl: LOCK_WINDOW_SEC });
  return n;
}

export const clearAdminFailures = (kv: KVNamespace, username: string) => kv.delete(failKey(username));

export { rateLimit, recordEvent, requestMeta };
export type { EventType };
