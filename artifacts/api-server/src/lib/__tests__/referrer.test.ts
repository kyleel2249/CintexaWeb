import { describe, expect, it } from "vitest";
import { resolveReferrer } from "../referrer.js";

describe("resolveReferrer", () => {
  it("defaults a brand-new profile to the admin (FREE2026)", () => {
    expect(resolveReferrer(false)).toBe("FREE2026");
  });

  it("uses a real ?ref= capture over the admin default when both are new", () => {
    expect(resolveReferrer(false, "growthlab")).toBe("growthlab");
  });

  it("never changes the referrer on an existing profile, even if one is requested", () => {
    expect(resolveReferrer(true, "growthlab")).toBeUndefined();
    expect(resolveReferrer(true)).toBeUndefined();
  });
});
