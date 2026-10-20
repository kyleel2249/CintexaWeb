import { useEffect } from "react";
import { useLocation } from "wouter";
import { CONSENT_EVENT, readConsent } from "@/components/CookieConsent";
import { applyConsent, trackPageView } from "@/lib/tracking";

/**
 * Renders nothing. Starts the configured measurement tags only after the visitor opts in through the cookie
 * banner, stops them when consent is withdrawn, and reports route changes in this single-page app.
 */
export function TrackingManager() {
  const [location] = useLocation();

  useEffect(() => {
    // Returning visitor who already opted in: start the tags (the page view below covers this page).
    applyConsent(readConsent());
    const onChange = () => {
      // A choice made just now: also report the page the visitor is already on.
      if (applyConsent(readConsent())) trackPageView(window.location.pathname);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return null;
}
