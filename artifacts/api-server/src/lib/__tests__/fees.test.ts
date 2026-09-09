import { describe, expect, it } from "vitest";
import { calculatePlatformFee } from "../fees.js";

describe("calculatePlatformFee", () => {
  it("takes exactly 5% on a round number", () => {
    expect(calculatePlatformFee(100)).toEqual({ platformFeeAmount: 5, netAmount: 95 });
  });

  it("rounds to the nearest cent", () => {
    const { platformFeeAmount, netAmount } = calculatePlatformFee(33.33);
    expect(platformFeeAmount).toBe(1.67);
    expect(netAmount).toBe(31.66);
  });

  it("always sums back to the original gross amount", () => {
    for (const gross of [10, 19.99, 100, 250.5, 999.01, 1.23]) {
      const { platformFeeAmount, netAmount } = calculatePlatformFee(gross);
      expect(Math.round((platformFeeAmount + netAmount) * 100) / 100).toBe(gross);
    }
  });

  it("handles a very small amount without going negative", () => {
    const { platformFeeAmount, netAmount } = calculatePlatformFee(0.1);
    expect(platformFeeAmount).toBeGreaterThanOrEqual(0);
    expect(netAmount).toBeGreaterThanOrEqual(0);
  });
});
