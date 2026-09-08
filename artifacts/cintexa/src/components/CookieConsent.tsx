import { useEffect, useState } from "react";

const KEY = "cintexa.cookie.consent";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt?: string;
};

export function readConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
  }, []);

  function save(next: Omit<ConsentState, "necessary" | "decidedAt">) {
    const value: ConsentState = {
      necessary: true,
      analytics: next.analytics,
      marketing: next.marketing,
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(value));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4 shadow-2xl sm:p-6"
      role="dialog"
      aria-label="Cookie and privacy preferences"
    >
      <div className="cx-container max-w-3xl">
        <h2 className="cx-display text-lg">Cookies &amp; data</h2>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
          We use necessary cookies to run CINTEXA. With your consent we also use analytics (to improve the product)
          and marketing cookies (including social / ad pixels where you enable them). You can change this later in
          Settings. See GDPR-style transparency: you control non-essential processing.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked disabled /> Necessary (always on)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analytics
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />{" "}
            Marketing / social pixels
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="cx-btn cx-btn-primary" onClick={() => save({ analytics: true, marketing: true })}>
            Accept all
          </button>
          <button type="button" className="cx-btn cx-btn-secondary" onClick={() => save({ analytics, marketing })}>
            Save choices
          </button>
          <button type="button" className="cx-btn cx-btn-ghost" onClick={() => save({ analytics: false, marketing: false })}>
            Necessary only
          </button>
        </div>
      </div>
    </div>
  );
}
