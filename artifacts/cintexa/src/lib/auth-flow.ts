/**
 * Pure helpers for the /get-started auth page (kept out of the component file so they
 * are unit-testable and keep React fast-refresh happy).
 */

export type AuthMode = "login" | "signup" | "forgot" | "reset";

const LAST_EMAIL_KEY = "cintexa_last_email";
const DEFAULT_NEXT = "/dashboard";
const AUTH_PATHS = ["/get-started", "/sign-in", "/sign-up"];

export function rememberEmail(email: string): void {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* private mode / storage disabled */
  }
}

export function readRememberedEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

/**
 * Which tab to open first.
 * Priority: explicit ?mode= → the URL itself (/sign-in, /sign-up) → remembered user → signup.
 */
export function initialAuthMode(pathname: string, search: string, rememberedEmail: string): AuthMode {
  const requested = new URLSearchParams(search).get("mode");
  if (requested === "login" || requested === "signin" || requested === "sign-in") return "login";
  if (requested === "signup" || requested === "sign-up") return "signup";
  if (pathname.startsWith("/sign-in")) return "login";
  if (pathname.startsWith("/sign-up")) return "signup";
  return rememberedEmail ? "login" : "signup";
}

/**
 * Post-auth destination from ?next=. Only same-origin absolute paths are accepted
 * (blocks open redirects such as //evil.com, /\evil.com, https://evil.com, javascript:),
 * and auth pages are rejected to avoid redirect loops.
 */
export function safeNextPath(search: string): string {
  const raw = new URLSearchParams(search).get("next");
  if (!raw) return DEFAULT_NEXT;
  if (raw.length > 300 || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return DEFAULT_NEXT;
  if ([...raw].some((ch) => ch.charCodeAt(0) < 32)) return DEFAULT_NEXT;
  const pathOnly = raw.split(/[?#]/)[0] ?? "";
  if (AUTH_PATHS.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`))) return DEFAULT_NEXT;
  return raw;
}

/** Loose international phone check: digits, spaces, + ( ) . - with 7–15 digits. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s().-]{7,25}$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}
