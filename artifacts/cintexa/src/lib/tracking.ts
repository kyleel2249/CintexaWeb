/**
 * Consent-gated measurement tags (Meta Pixel, LinkedIn Insight Tag, Google tag).
 *
 * Guarantees:
 *  - Nothing here loads, runs or contacts a third party until the visitor has opted in through the cookie
 *    banner (`analytics` and/or `marketing`). With no choice made, or "Necessary only", this module is inert.
 *  - Each tag is switched on only when its ID is configured (VITE_* env), so an unconfigured site loads nothing.
 *  - Only the path is ever reported — never query strings or fragments (they can hold reset tokens,
 *    referral codes or other personal data) — and /admin is never reported.
 *  - Withdrawing consent stops reporting immediately, removes the tag scripts and clears their cookies.
 */
import type { ConsentState } from "@/components/CookieConsent";

type Consent = Pick<ConsentState, "analytics" | "marketing">;
type Fn = (...args: unknown[]) => void;
type FbqStub = Fn & { callMethod?: Fn; queue: unknown[]; push: unknown; loaded: boolean; version: string };

type TrackingWindow = Window & {
  fbq?: FbqStub;
  _fbq?: FbqStub;
  dataLayer?: unknown[];
  gtag?: Fn;
  _linkedin_data_partner_ids?: string[];
  _linkedin_partner_id?: string;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

const SCRIPT_ATTR = "data-cx-tag";
const win = () => window as unknown as TrackingWindow;

let builtInAnalyticsId: string | undefined;
/** Called once at start-up with the measurement ID the app's own analytics service reports to (if any). */
export function registerBuiltInAnalyticsId(id: string | undefined): void {
  builtInAnalyticsId = id?.trim() || undefined;
}

type TagIds = { meta?: string; linkedin?: string; google?: string };

/** Read at call time (not import time) so deployments and tests can change the configuration. */
function configuredIds(): TagIds {
  const env = import.meta.env;
  const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const google = clean(env.VITE_GOOGLE_TAG_ID);
  // The built-in analytics service may already use this measurement ID — loading it twice would double-count.
  const alreadyCovered = google && google === builtInAnalyticsId;
  return {
    meta: clean(env.VITE_META_PIXEL_ID),
    linkedin: clean(env.VITE_LINKEDIN_PARTNER_ID),
    google: alreadyCovered ? undefined : google,
  };
}

/** G-… is analytics; AW-…, DC-… and others are advertising. */
const googleIsAnalytics = (id: string) => id.startsWith("G-");

const active = { meta: false, linkedin: false, google: false };

function injectScript(tag: string, src: string): void {
  if (document.querySelector(`script[${SCRIPT_ATTR}="${tag}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.setAttribute(SCRIPT_ATTR, tag);
  document.head.appendChild(s);
}

function removeScripts(tag: string): void {
  document.querySelectorAll(`script[${SCRIPT_ATTR}="${tag}"]`).forEach((n) => n.remove());
}

function expireCookies(names: RegExp): void {
  const host = window.location.hostname;
  const parts = host.split(".");
  const domains = new Set<string>([host, `.${host}`]);
  if (parts.length > 2) domains.add(`.${parts.slice(-2).join(".")}`);
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (!name || !names.test(name)) continue;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
  }
}

function loadMeta(id: string): void {
  const w = win();
  if (!w.fbq) {
    const stub = function (...args: unknown[]) {
      if (stub.callMethod) stub.callMethod(...args);
      else stub.queue.push(args);
    } as FbqStub;
    stub.push = stub;
    stub.loaded = true;
    stub.version = "2.0";
    stub.queue = [];
    w.fbq = stub;
    if (!w._fbq) w._fbq = stub;
  }
  injectScript("meta", "https://connect.facebook.net/en_US/fbevents.js");
  w.fbq?.("init", id);
  active.meta = true;
}

function loadLinkedIn(id: string): void {
  const w = win();
  w._linkedin_partner_id = id;
  w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
  if (!w._linkedin_data_partner_ids.includes(id)) w._linkedin_data_partner_ids.push(id);
  injectScript("linkedin", "https://snap.licdn.com/li.lt/insight.min.js");
  active.linkedin = true;
}

function googleSignals(c: Consent) {
  const ads = c.marketing ? "granted" : "denied";
  return {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  };
}

function loadGoogle(id: string, c: Consent): void {
  const w = win();
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    // gtag.js reads `arguments` objects from the dataLayer, so this must be a classic function.
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      (w.dataLayer as unknown[]).push(arguments);
    };
    w.gtag("consent", "default", googleSignals({ analytics: false, marketing: false }));
    w.gtag("js", new Date());
  }
  w.gtag("consent", "update", googleSignals(c));
  w[`ga-disable-${id}`] = false;
  w.gtag("config", id, { send_page_view: false });
  injectScript("google", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  active.google = true;
}

function revokeAll(ids: TagIds): void {
  const w = win();
  if (active.meta) {
    w.fbq?.("consent", "revoke");
    removeScripts("meta");
    expireCookies(/^_fb[pc]$/);
  }
  if (active.linkedin) {
    removeScripts("linkedin");
    expireCookies(/^(li_|lidc|bcookie|bscookie|UserMatchHistory|AnalyticsSyncHistory)/);
  }
  if (active.google && ids.google) {
    w[`ga-disable-${ids.google}`] = true;
    w.gtag?.("consent", "update", googleSignals({ analytics: false, marketing: false }));
    removeScripts("google");
    expireCookies(/^(_ga|_gid|_gat|_gcl_)/);
  }
  active.meta = active.linkedin = active.google = false;
}

/** Brings what's loaded in line with the visitor's choice. Returns true if something new started. */
export function applyConsent(consent: Consent | null): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const ids = configuredIds();
  const c: Consent = { analytics: consent?.analytics === true, marketing: consent?.marketing === true };
  let started = false;

  if (!c.marketing && (active.meta || active.linkedin)) {
    // Marketing withdrawn: drop the marketing tags (and Google too if nothing else keeps it alive).
    const keepGoogle = c.analytics && ids.google && googleIsAnalytics(ids.google);
    revokeAll({ ...ids, google: keepGoogle ? undefined : ids.google });
    if (keepGoogle) active.google = true;
  }
  if (!c.analytics && !c.marketing && active.google) revokeAll(ids);

  if (c.marketing && ids.meta && !active.meta) {
    loadMeta(ids.meta);
    started = true;
  }
  if (c.marketing && ids.linkedin && !active.linkedin) {
    loadLinkedIn(ids.linkedin);
    started = true;
  }
  if (ids.google) {
    const wanted = googleIsAnalytics(ids.google) ? c.analytics : c.marketing;
    if (wanted) {
      const was = active.google;
      loadGoogle(ids.google, c);
      started = started || !was;
    }
  }
  return started;
}

const reportable = (path: string) => !(path === "/admin" || path.startsWith("/admin/"));

/** Reports a page view to whichever tags are currently active. Query strings and fragments are dropped. */
export function trackPageView(rawPath: string): void {
  if (typeof window === "undefined") return;
  const path = rawPath.split(/[?#]/)[0] || "/";
  if (!reportable(path)) return;
  const w = win();
  if (active.meta) w.fbq?.("track", "PageView");
  if (active.google) {
    w.gtag?.("event", "page_view", {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  }
}

/** Test helper: forget what was loaded in a previous test. */
export function __resetTrackingForTests(): void {
  builtInAnalyticsId = undefined;
  active.meta = active.linkedin = active.google = false;
}
