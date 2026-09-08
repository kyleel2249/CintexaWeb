/** Local profile store — lets onboarding and settings work when the API is offline. */

import { applyPlatformFee as feeCalc, ensureReferrerBootstrap } from "./platform-bridge";

export type LocalProfile = {
  userId?: string;
  username?: string;
  avatarId?: string;
  displayName?: string | null;
  businessName?: string | null;
  country?: string | null;
  leaderboardVisible?: boolean;
  role?: "creator" | "seller" | "buyer" | "affiliate" | null;
  interests?: string[];
  usageFrequency?: string | null;
  onboardingCompleted?: boolean;
  twoFactorEnabled?: boolean;
  referrer?: string;
  updatedAt?: string;
};

const KEY = "cintexa.customer.profile";

export function readLocalProfile(): LocalProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export function writeLocalProfile(patch: LocalProfile): LocalProfile {
  const prev = readLocalProfile() ?? {};
  const referrer = patch.referrer ?? prev.referrer ?? ensureReferrerBootstrap();
  const next: LocalProfile = {
    ...prev,
    ...patch,
    referrer,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearLocalProfile() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("cintexa.customer.export");
}

export function exportLocalData(): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    profile: readLocalProfile(),
    note: "CINTEXA data export (local + any synced profile fields).",
  };
  return JSON.stringify(payload, null, 2);
}

/** @deprecated use platform-economics — kept for older imports */
export const PLATFORM_FEE_RATE = 0.07;

export function applyPlatformFee(gross: number) {
  return feeCalc(gross);
}

export const AVATAR_OPTIONS = [
  { id: "orbit", label: "Orbit", color: "#F5C518" },
  { id: "signal", label: "Signal", color: "#6BB3FF" },
  { id: "growth", label: "Growth", color: "#7DD3C7" },
  { id: "pulse", label: "Pulse", color: "#C4B5FD" },
  { id: "forge", label: "Forge", color: "#F97316" },
  { id: "nova", label: "Nova", color: "#F43F5E" },
] as const;
