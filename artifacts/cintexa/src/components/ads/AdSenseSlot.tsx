import { useEffect, useState } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = "ca-pub-2604547500089196";
const CONSENT_KEY = "cintexa.cookie.consent";
const CONSENT_EVENT = "cintexa:consent-updated";

type AdSenseSlotProps = {
  slot?: string;
  placement?: "in-article" | "in-feed" | "display" | "anchor-reserve";
  className?: string;
};

function hasMarketingConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw).marketing === true : false;
  } catch {
    return false;
  }
}

/** Advertising scripts and ad slots remain inactive until marketing consent is granted. */
export function AdSenseSlot({ slot, placement = "display", className = "" }: AdSenseSlotProps) {
  const [location] = useLocation();
  const [enabled, setEnabled] = useState(false);

  const hide =
    location.startsWith("/dashboard") ||
    location.startsWith("/admin") ||
    location.startsWith("/sign-in") ||
    location.startsWith("/sign-up");

  useEffect(() => {
    const sync = () => setEnabled(hasMarketingConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!enabled || hide) {
      if (!enabled) {
        document.querySelectorAll('script[data-cx-adsense="true"]').forEach((script) => script.remove());
        delete window.adsbygoogle;
      }
      return;
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-cx-adsense="true"]');
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.cxAdsense = "true";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The provider may not be ready or may be blocked by the browser.
    }
  }, [enabled, hide, location]);

  if (hide || !enabled) return null;

  return (
    <div className={`cx-ad-slot cx-ad-slot--${placement} ${className}`.trim()} data-ad-placement={placement}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function AdSenseFooterBanner() {
  return <div className="cx-ad-region cx-ad-region--footer"><div className="cx-container"><AdSenseSlot placement="display" /></div></div>;
}

export function AdSenseInContent() {
  return <div className="cx-ad-region cx-ad-region--in-content"><div className="cx-container"><AdSenseSlot placement="in-article" /></div></div>;
}
