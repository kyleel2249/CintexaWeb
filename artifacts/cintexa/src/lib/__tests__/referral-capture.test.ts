import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { captureReferralFromUrl, readPendingReferral, clearPendingReferral } from "../referral-capture";

function setUrl(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

describe("referral-capture", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("captures a valid ?ref= username from the URL", () => {
    setUrl("?ref=growthlab");
    captureReferralFromUrl();
    expect(readPendingReferral()).toBe("growthlab");
  });

  it("ignores a missing ref param", () => {
    setUrl("");
    captureReferralFromUrl();
    expect(readPendingReferral()).toBeNull();
  });

  it("ignores an invalid ref value (too short, bad characters)", () => {
    setUrl("?ref=a");
    captureReferralFromUrl();
    expect(readPendingReferral()).toBeNull();

    setUrl("?ref=not valid!");
    captureReferralFromUrl();
    expect(readPendingReferral()).toBeNull();
  });

  it("clearPendingReferral removes the stored value", () => {
    setUrl("?ref=growthlab");
    captureReferralFromUrl();
    expect(readPendingReferral()).toBe("growthlab");
    clearPendingReferral();
    expect(readPendingReferral()).toBeNull();
  });
});
