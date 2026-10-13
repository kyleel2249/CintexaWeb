import type { AdminEvent } from "@/lib/admin-client";

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** "Chrome on Windows" from a User-Agent string (best effort; falls back to the raw start). */
export function shortUserAgent(ua?: string | null): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : null;
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? ua.slice(0, 40);
}

export function where(e: Pick<AdminEvent, "city" | "region" | "country">): string {
  return [e.city, e.country].filter(Boolean).join(", ") || "—";
}

const LABELS: Record<string, string> = {
  signup: "Sign-up",
  login_success: "Sign-in",
  login_failed: "Failed sign-in",
  logout: "Sign-out",
  password_reset_requested: "Reset requested",
  password_reset: "Password reset",
  profile_update: "Profile update",
  application: "Job application",
  alert_signup: "Alert signup",
  admin_setup: "Admin created",
  admin_login: "Admin sign-in",
  admin_login_failed: "Admin failed sign-in",
  admin_reset: "Admin password reset",
};

export const eventLabel = (type: string) => LABELS[type] ?? type;
export const EVENT_TYPES = Object.keys(LABELS);

export function eventTone(type: string): "success" | "warning" | "danger" | "neutral" {
  if (type === "login_failed" || type === "admin_login_failed") return "danger";
  if (type === "password_reset" || type === "password_reset_requested" || type === "admin_reset" || type === "admin_setup") return "warning";
  if (type === "signup" || type === "login_success" || type === "admin_login" || type === "application") return "success";
  return "neutral";
}

export const toneClass = (t: ReturnType<typeof eventTone>) => (t === "neutral" ? "cx-badge" : `cx-badge cx-badge-${t}`);
