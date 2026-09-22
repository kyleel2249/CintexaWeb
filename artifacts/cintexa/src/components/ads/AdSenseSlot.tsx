import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = "ca-pub-2604547500089196";

type AdSenseSlotProps = {
  /** Optional AdSense ad unit slot ID from AdSense UI. Omit for auto-sized display. */
  slot?: string;
  /** Placement for analytics / layout */
  placement?: "in-article" | "in-feed" | "display" | "anchor-reserve";
  className?: string;
};

/**
 * Mobile-first responsive AdSense unit.
 * - full-width-responsive on small screens
 * - reserved min-height to limit CLS
 * - hidden on dashboard / admin / auth routes
 */
export function AdSenseSlot({ slot, placement = "display", className = "" }: AdSenseSlotProps) {
  const [location] = useLocation();
  const pushed = useRef(false);

  const hide =
    location.startsWith("/dashboard") ||
    location.startsWith("/admin") ||
    location.startsWith("/sign-in") ||
    location.startsWith("/sign-up");

  useEffect(() => {
    if (hide || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocker or script not ready — ignore
    }
  }, [hide, location]);

  if (hide) return null;

  return (
    <div
      className={`cx-ad-slot cx-ad-slot--${placement} ${className}`.trim()}
      data-ad-placement={placement}
      aria-hidden="true"
    >
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

/** Bottom-of-page display unit — safe on mobile between main and footer */
export function AdSenseFooterBanner() {
  return (
    <div className="cx-ad-region cx-ad-region--footer">
      <div className="cx-container">
        <AdSenseSlot placement="display" />
      </div>
    </div>
  );
}

/** Mid-content unit for long public pages (careers, solutions) */
export function AdSenseInContent() {
  return (
    <div className="cx-ad-region cx-ad-region--in-content">
      <div className="cx-container">
        <AdSenseSlot placement="in-article" />
      </div>
    </div>
  );
}
