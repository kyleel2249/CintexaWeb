/**
 * Captures ?ref=<username> from the URL on first visit and remembers it
 * until onboarding completes, so a real referral link (from the Affiliate
 * tab) actually attributes the new signup to the person who shared it —
 * not just the FREE2026 admin default.
 */
const KEY = "cintexa.pendingReferral";

export function captureReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[a-zA-Z0-9_]{3,24}$/.test(ref)) {
      localStorage.setItem(KEY, ref);
    }
  } catch {
    /* ignore — storage unavailable, referral simply won't be captured */
  }
}

export function readPendingReferral(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
