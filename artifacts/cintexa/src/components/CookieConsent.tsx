import { useEffect, useState } from "react";
import { Link } from "wouter";

const KEY = "cintexa.cookie.consent";
const CONSENT_EVENT = "cintexa:consent-updated";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt?: string;
};

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return { necessary: true, analytics: parsed.analytics, marketing: parsed.marketing, decidedAt: parsed.decidedAt };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    if (saved) {
      setAnalytics(saved.analytics);
      setMarketing(saved.marketing);
    } else {
      setOpen(true);
    }
  }, []);

  function openPreferences() {
    const saved = readConsent();
    setAnalytics(saved?.analytics ?? false);
    setMarketing(saved?.marketing ?? false);
    setOpen(true);
  }

  function save(next: { analytics: boolean; marketing: boolean }) {
    const value: ConsentState = {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      // The current-page choice still applies; browser storage may be disabled.
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setAnalytics(value.analytics);
    setMarketing(value.marketing);
    setOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openPreferences}
          className="fixed bottom-3 left-3 z-[80] rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--bg))] px-3 py-2 text-xs font-semibold text-[hsl(var(--fg-muted))] shadow-lg hover:text-[hsl(var(--fg))]"
          aria-label="Open cookie preferences"
        >
          Cookie preferences
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <section
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-5 shadow-2xl sm:rounded-2xl sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cx-cookie-title"
            aria-describedby="cx-cookie-description"
          >
            <p className="cx-eyebrow">Privacy controls</p>
            <h2 id="cx-cookie-title" className="cx-display mt-2 text-2xl">Cookie &amp; data preferences</h2>
            <p id="cx-cookie-description" className="mt-3 text-sm leading-6 text-[hsl(var(--fg-muted))]">
              Choose how CINTEXA may use optional analytics and advertising technologies. Necessary storage is always active for security and core site functions. Optional categories start off until you choose them. Read our <Link className="underline" href="/privacy-policy">Privacy Policy</Link> and <Link className="underline" href="/cookie-policy">Cookie Policy</Link>.
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                <div><h3 className="font-semibold">Necessary</h3><p className="mt-1 text-sm leading-5 text-[hsl(var(--fg-muted))]">Supports security, account/session functions and saving your privacy choice.</p></div>
                <input aria-label="Necessary cookies always enabled" type="checkbox" checked disabled className="mt-1 h-4 w-4" />
              </div>
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                <span><span className="font-semibold">Analytics</span><span className="mt-1 block text-sm leading-5 text-[hsl(var(--fg-muted))]">Helps us understand site usage and improve reliability, where analytics is configured.</span></span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-1 h-4 w-4" />
              </label>
              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[hsl(var(--border))] p-4">
                <span><span className="font-semibold">Advertising &amp; marketing</span><span className="mt-1 block text-sm leading-5 text-[hsl(var(--fg-muted))]">Allows advertising tags and marketing pixels to run where configured, including technologies that may personalise or measure ads.</span></span>
                <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} className="mt-1 h-4 w-4" />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="cx-btn cx-btn-primary" onClick={() => save({ analytics: true, marketing: true })}>Accept all</button>
              <button type="button" className="cx-btn cx-btn-secondary" onClick={() => save({ analytics, marketing })}>Save my choices</button>
              <button type="button" className="cx-btn cx-btn-ghost" onClick={() => save({ analytics: false, marketing: false })}>Necessary only</button>
            </div>
            <p className="mt-4 text-xs leading-5 text-[hsl(var(--fg-muted))]">You can reopen these settings at any time using “Cookie preferences”. Choices are saved in this browser and may not transfer to another device or browser.</p>
          </section>
        </div>
      )}
    </>
  );
}
