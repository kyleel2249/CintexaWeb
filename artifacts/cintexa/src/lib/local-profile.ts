/** Local profile store — lets onboarding and settings work when the API is offline. */

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
  const next: LocalProfile = {
    ...prev,
    ...patch,
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

/** Platform fee retained on sales / payouts. */
export const PLATFORM_FEE_RATE = 0.05;

export function applyPlatformFee(gross: number) {
  const fee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
  const net = Math.round((gross - fee) * 100) / 100;
  return { gross, fee, net, rate: PLATFORM_FEE_RATE };
}

export const AVATAR_OPTIONS = [
  { id: "orbit", label: "Orbit", color: "#F5C518" },
  { id: "signal", label: "Signal", color: "#6BB3FF" },
  { id: "growth", label: "Growth", color: "#7DD3C7" },
  { id: "pulse", label: "Pulse", color: "#C4B5FD" },
  { id: "forge", label: "Forge", color: "#F97316" },
  { id: "nova", label: "Nova", color: "#F43F5E" },
] as const;
