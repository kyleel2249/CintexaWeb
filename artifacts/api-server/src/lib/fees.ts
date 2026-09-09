import { PLATFORM_FEE_RATE_DEFAULT, PLATFORM_FEE_RATE_PROMO, PROMO_CODE } from "@cintexa/db";

export interface FeeBreakdown {
  platformFeeAmount: number;
  netAmount: number;
  rate: number;
  promoApplied: boolean;
}

/**
 * Splits a gross sale/payment amount into the platform's cut and the
 * customer's net. Rounds to cents so the two always sum back to the
 * original gross amount exactly (no floating-point drift on repeated runs).
 * Rate is 7% by default, 5% when the FREE2026 promo code is supplied and
 * matches exactly (case-insensitive).
 */
export function calculatePlatformFee(grossAmount: number, promoCode?: string | null): FeeBreakdown {
  const promoApplied = (promoCode ?? "").trim().toUpperCase() === PROMO_CODE;
  const rate = promoApplied ? PLATFORM_FEE_RATE_PROMO : PLATFORM_FEE_RATE_DEFAULT;
  const platformFeeAmount = Math.round(grossAmount * rate * 100) / 100;
  const netAmount = Math.round((grossAmount - platformFeeAmount) * 100) / 100;
  return { platformFeeAmount, netAmount, rate, promoApplied };
}
