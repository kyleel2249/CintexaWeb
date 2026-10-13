import type { StoredUser } from "./cintexa-auth";

/** What an admin may see about a user. The password hash and salt are never included. */
export type AdminUserView = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  company: string | null;
  role: string | null;
  dateOfBirth: string | null;
  timeZone: string | null;
  birthdayEmail: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  lastLoginCountry: string | null;
  lastLoginCity: string | null;
  loginCount: number;
  signup: StoredUser["signup"] | null;
};

export function adminUserView(u: StoredUser): AdminUserView {
  const x = u as StoredUser & { createdAt?: string; phone?: string; company?: string };
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: x.phone ?? null,
    company: x.company ?? null,
    role: u.role ?? null,
    dateOfBirth: u.dateOfBirth ?? null,
    timeZone: u.timeZone ?? null,
    birthdayEmail: u.birthdayEmail !== false,
    createdAt: x.createdAt ?? u.signup?.at ?? null,
    lastLoginAt: u.lastLoginAt ?? null,
    lastLoginIp: u.lastLoginIp ?? null,
    lastLoginCountry: u.lastLoginCountry ?? null,
    lastLoginCity: u.lastLoginCity ?? null,
    loginCount: u.loginCount ?? 0,
    signup: u.signup ?? null,
  };
}

/** Newest-first list of user e-mails (maintained by sign-up). */
export async function readUserIndex(kv: KVNamespace): Promise<string[]> {
  try {
    const list = JSON.parse((await kv.get("user:index")) ?? "[]") as unknown;
    return Array.isArray(list) ? list.filter((e): e is string => typeof e === "string") : [];
  } catch {
    return [];
  }
}

export async function getUser(kv: KVNamespace, email: string): Promise<StoredUser | null> {
  const raw = await kv.get(`user:${email.toLowerCase()}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

/** Reads users in parallel batches (kept small: one request may only make so many KV calls). */
export async function getUsers(kv: KVNamespace, emails: string[], batch = 50): Promise<StoredUser[]> {
  const out: StoredUser[] = [];
  for (let i = 0; i < emails.length; i += batch) {
    const chunk = await Promise.all(emails.slice(i, i + batch).map((e) => getUser(kv, e)));
    for (const u of chunk) if (u) out.push(u);
  }
  return out;
}

/** Most users one admin request will read (KV allows ~1000 operations per request). */
export const SCAN_CAP = 600;

export async function scanUsers(kv: KVNamespace, cap = SCAN_CAP) {
  const index = await readUserIndex(kv);
  const slice = index.slice(0, cap);
  const users = await getUsers(kv, slice);
  return { users, total: index.length, scanned: slice.length, truncated: index.length > slice.length };
}

/** Counts keys under a prefix (bounded), optionally skipping some. */
export async function countKeys(kv: KVNamespace, prefix: string, skip?: (name: string) => boolean, maxPages = 5) {
  let cursor: string | undefined;
  let n = 0;
  for (let i = 0; i < maxPages; i++) {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    n += page.keys.filter((k) => !skip?.(k.name)).length;
    if (page.list_complete) return { count: n, exact: true };
    cursor = (page as { cursor?: string }).cursor;
  }
  return { count: n, exact: false };
}

// ---------- CSV ----------

/** Quotes a cell and defuses spreadsheet formulas (=, +, -, @) so exported data can't run code in Excel. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (header: string[], rows: unknown[][]) =>
  [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
