import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetTrackingForTests, applyConsent, registerBuiltInAnalyticsId, trackPageView } from "../tracking";

const scripts = () => [...document.querySelectorAll("script[data-cx-tag]")].map((s) => s.getAttribute("data-cx-tag"));
const w = window as unknown as Record<string, unknown>;

beforeEach(() => {
  vi.stubEnv("VITE_META_PIXEL_ID", "1234567890");
  vi.stubEnv("VITE_LINKEDIN_PARTNER_ID", "777001");
  vi.stubEnv("VITE_GOOGLE_TAG_ID", "G-TEST123");
});
afterEach(() => {
  applyConsent({ analytics: false, marketing: false });
  __resetTrackingForTests();
  document.head.querySelectorAll("script[data-cx-tag]").forEach((n) => n.remove());
  for (const k of ["fbq", "_fbq", "gtag", "dataLayer", "_linkedin_data_partner_ids", "_linkedin_partner_id"]) delete w[k];
  vi.unstubAllEnvs();
});

describe("nothing loads without opt-in", () => {
  it("no choice yet", () => {
    expect(applyConsent(null)).toBe(false);
    expect(scripts()).toEqual([]);
    expect(w.fbq).toBeUndefined();
    expect(w.dataLayer).toBeUndefined();
  });
  it("necessary only", () => {
    expect(applyConsent({ analytics: false, marketing: false })).toBe(false);
    expect(scripts()).toEqual([]);
  });
  it("page views are no-ops while nothing is active", () => {
    trackPageView("/pricing");
    expect(w.fbq).toBeUndefined();
    expect(w.dataLayer).toBeUndefined();
  });
});

describe("categories are honoured", () => {
  it("marketing only: Meta + LinkedIn, but not the analytics (G-) tag", () => {
    expect(applyConsent({ analytics: false, marketing: true })).toBe(true);
    expect(scripts().sort()).toEqual(["linkedin", "meta"]);
  });
  it("analytics only: the G- tag, but no advertising pixels", () => {
    expect(applyConsent({ analytics: true, marketing: false })).toBe(true);
    expect(scripts()).toEqual(["google"]);
    expect(w.fbq).toBeUndefined();
  });
  it("accept all: everything configured", () => {
    applyConsent({ analytics: true, marketing: true });
    expect(scripts().sort()).toEqual(["google", "linkedin", "meta"]);
  });
  it("an unset ID loads nothing", () => {
    vi.stubEnv("VITE_META_PIXEL_ID", "");
    vi.stubEnv("VITE_LINKEDIN_PARTNER_ID", "");
    vi.stubEnv("VITE_GOOGLE_TAG_ID", "");
    expect(applyConsent({ analytics: true, marketing: true })).toBe(false);
    expect(scripts()).toEqual([]);
  });
  it("does not double-load the measurement ID the built-in analytics already uses", () => {
    registerBuiltInAnalyticsId("G-TEST123");
    applyConsent({ analytics: true, marketing: false });
    expect(scripts()).toEqual([]);
  });
  it("is idempotent", () => {
    applyConsent({ analytics: true, marketing: true });
    expect(applyConsent({ analytics: true, marketing: true })).toBe(false);
    expect(document.querySelectorAll("script[data-cx-tag]")).toHaveLength(3);
  });
});

describe("reporting", () => {
  it("sends only the path (no query or fragment) and never reports /admin", () => {
    applyConsent({ analytics: true, marketing: true });
    const fbq = vi.fn();
    (w.fbq as { callMethod?: unknown }).callMethod = fbq;
    trackPageView("/get-started?ref=abc&token=secret#frag");
    const events = (w.dataLayer as IArguments[]).map((a) => [...a]);
    const pv = events.find((e) => e[0] === "event" && e[1] === "page_view")!;
    expect(pv[2]).toMatchObject({ page_path: "/get-started" });
    expect(JSON.stringify(events)).not.toContain("secret");
    expect(fbq).toHaveBeenCalledWith("track", "PageView");

    const before = (w.dataLayer as unknown[]).length;
    trackPageView("/admin?reset=tok");
    trackPageView("/admin/users");
    expect((w.dataLayer as unknown[]).length).toBe(before);
    expect(fbq).toHaveBeenCalledTimes(1);
  });
});

describe("withdrawing consent", () => {
  it("removes the tags and stops reporting", () => {
    applyConsent({ analytics: true, marketing: true });
    applyConsent({ analytics: false, marketing: false });
    expect(scripts()).toEqual([]);
    expect(w["ga-disable-G-TEST123"]).toBe(true);
    const before = (w.dataLayer as unknown[]).length;
    trackPageView("/after");
    expect((w.dataLayer as unknown[]).length).toBe(before);
  });
  it("dropping only marketing keeps the analytics tag", () => {
    applyConsent({ analytics: true, marketing: true });
    applyConsent({ analytics: true, marketing: false });
    expect(scripts()).toEqual(["google"]);
  });
});
