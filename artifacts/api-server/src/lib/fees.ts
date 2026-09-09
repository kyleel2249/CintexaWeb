import { PLATFORM_FEE_RATE } from "@cintexa/db";

export interface FeeBreakdown {
  platformFeeAmount: number;
  netAmount: number;
}

/**
 * Splits a gross sale/payment amount into the platform's cut and the
 * customer's net. Rounds to cents so the two always sum back to the
 * original gross amount exactly (no floating-point drift on repeated runs).
 */
export function calculatePlatformFee(grossAmount: number): FeeBreakdown {
  const platformFeeAmount = Math.round(grossAmount * PLATFORM_FEE_RATE * 100) / 100;
  const netAmount = Math.round((grossAmount - platformFeeAmount) * 100) / 100;
  return { platformFeeAmount, netAmount };
}
