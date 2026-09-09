import { describe, expect, it } from "vitest";
import { calculatePlatformFee } from "../fees.js";

describe("calculatePlatformFee", () => {
  it("takes 7% by default (no promo code)", () => {
    expect(calculatePlatformFee(100)).toEqual({ platformFeeAmount: 7, netAmount: 93, rate: 0.07, promoApplied: false });
  });

  it("takes 5% when the FREE2026 promo code is supplied", () => {
    expect(calculatePlatformFee(100, "FREE2026")).toEqual({
      platformFeeAmount: 5,
      netAmount: 95,
      rate: 0.05,
      promoApplied: true,
    });
  });

  it("is case-insensitive and trims whitespace on the promo code", () => {
    expect(calculatePlatformFee(100, " free2026 ").promoApplied).toBe(true);
  });

  it("ignores an invalid or unrelated promo code and falls back to the default rate", () => {
    expect(calculatePlatformFee(100, "NOTAREALCODE").rate).toBe(0.07);
  });

  it("rounds to the nearest cent", () => {
    const { platformFeeAmount, netAmount } = calculatePlatformFee(33.33, "FREE2026");
    expect(platformFeeAmount).toBe(1.67);
    expect(netAmount).toBe(31.66);
  });

  it("always sums back to the original gross amount, with or without promo", () => {
    for (const gross of [10, 19.99, 100, 250.5, 999.01, 1.23]) {
      for (const promo of [undefined, "FREE2026"]) {
        const { platformFeeAmount, netAmount } = calculatePlatformFee(gross, promo);
        expect(Math.round((platformFeeAmount + netAmount) * 100) / 100).toBe(gross);
      }
    }
  });

  it("handles a very small amount without going negative", () => {
    const { platformFeeAmount, netAmount } = calculatePlatformFee(0.1);
    expect(platformFeeAmount).toBeGreaterThanOrEqual(0);
    expect(netAmount).toBeGreaterThanOrEqual(0);
  });
});
