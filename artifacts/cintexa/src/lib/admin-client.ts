/**
 * Client for the admin API (/api/admin/*). The session token lives in sessionStorage only — it is gone
 * when the tab closes and is never written to localStorage or cookies.
 */
const KEY = "cintexa_admin_token";
let memoryToken: string | null = null;

export const ADMIN_SIGNED_OUT_EVENT = "cintexa:admin-signed-out";

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setAdminToken(token: string) {
  memoryToken = token;
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    /* kept in memory for this tab */
  }
}

export function clearAdminToken() {
  memoryToken = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

type Opts = { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string | number | undefined | null>; auth?: boolean };

function url(path: string, query?: Opts["query"]) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return `/api/admin/${path}${s ? `?${s}` : ""}`;
}

/** Calls the admin API. A 401 on an authenticated call signs the UI out. */
export async function adminRequest<T>(path: string, opts: Opts = {}): Promise<T> {
  const token = getAdminToken();
  let res: Response;
  try {
    res = await fetch(url(path, opts.query), {
      method: opts.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token && opts.auth !== false ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new AdminApiError(0, "Couldn’t reach the server. Check your connection.");
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401 && token && opts.auth !== false) {
      clearAdminToken();
      window.dispatchEvent(new Event(ADMIN_SIGNED_OUT_EVENT));
    }
    throw new AdminApiError(res.status, (data.error as string) || `Request failed (${res.status})`, data);
  }
  return data as T;
}

/** Downloads a file (e.g. the CSV export) with the admin token attached. */
export async function adminDownload(path: string, fallbackName: string): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(url(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    if (res.status === 401) {
      clearAdminToken();
      window.dispatchEvent(new Event(ADMIN_SIGNED_OUT_EVENT));
    }
    throw new AdminApiError(res.status, "Download failed.");
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

// ---------- response shapes ----------

export type AdminEvent = {
  id: string;
  type: string;
  at: string;
  userId?: string;
  email?: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  userAgent?: string;
  language?: string;
  detail?: string;
};

export type AdminUser = {
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
  signup: { at: string; ip?: string; country?: string; region?: string; city?: string; userAgent?: string; language?: string } | null;
};

export type AdminOverview = {
  totals: {
    users: number;
    newUsers7d: number;
    newUsers30d: number;
    logins7d: number;
    failedLogins7d: number;
    applications: number;
    alertSubscribers: number;
  };
  trends: { dates: string[]; signup: number[]; login_success: number[]; login_failed: number[]; application: number[]; alert_signup: number[] };
  profile: { scanned: number; sampled: boolean; withDateOfBirth: number; withPhone: number; withCompany: number; activeLast7d: number; neverSignedInAgain: number };
  countries: { country: string; users: number }[];
  recent: AdminEvent[];
};

export type AuditRow = { id: string; at: string; admin: string; action: string; detail?: string; ip?: string };
