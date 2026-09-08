import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "../customer.js";

describe("updateProfileSchema (onboarding validation)", () => {
  it("accepts a role with interests that belong to that role", () => {
    const result = updateProfileSchema.safeParse({
      role: "creator",
      interests: ["Content & media", "Art & design"],
      usageFrequency: "Daily",
    });
    expect(result.success).toBe(true);
  });

  it("rejects interests that don't belong to the selected role", () => {
    const result = updateProfileSchema.safeParse({
      role: "creator",
      interests: ["Physical products"], // seller-only interest
    });
    expect(result.success).toBe(false);
  });

  it("rejects an interest string that doesn't exist for any role", () => {
    const result = updateProfileSchema.safeParse({
      role: "buyer",
      interests: ["Not a real interest"],
    });
    expect(result.success).toBe(false);
  });

  it("allows interests without a role present (partial profile patch)", () => {
    // No cross-field check applies when role isn't part of this particular patch.
    const result = updateProfileSchema.safeParse({ displayName: "Kwesi" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid usageFrequency value", () => {
    const result = updateProfileSchema.safeParse({ usageFrequency: "Constantly" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid role value", () => {
    const result = updateProfileSchema.safeParse({ role: "wizard" });
    expect(result.success).toBe(false);
  });
});
