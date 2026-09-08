/** Platform fee & promo rules. */

export const ADMIN_USERNAME = "FREE2026";
export const PROMO_CODE = "FREE2026";

/** Default platform fee on sales / payouts. */
export const PLATFORM_FEE_RATE_DEFAULT = 0.07;

/** With valid promo FREE2026, platform fee is 5%. */
export const PLATFORM_FEE_RATE_PROMO = 0.05;

const PROMO_KEY = "cintexa.promo.code";

export function readPromoCode(): string | null {
  try {
    return localStorage.getItem(PROMO_KEY);
  } catch {
    return null;
  }
}

export function applyPromoCode(code: string): { ok: boolean; message: string } {
  const normalized = code.trim().toUpperCase();
  if (normalized === PROMO_CODE) {
    localStorage.setItem(PROMO_KEY, PROMO_CODE);
    return {
      ok: true,
      message: `Promo applied — platform fee set to ${(PLATFORM_FEE_RATE_PROMO * 100).toFixed(0)}% on sales. Starter remains free.`,
    };
  }
  return { ok: false, message: "Invalid promo code." };
}

export function clearPromoCode() {
  localStorage.removeItem(PROMO_KEY);
}

export function hasActivePromo(): boolean {
  return readPromoCode() === PROMO_CODE;
}

export function currentPlatformFeeRate(): number {
  return hasActivePromo() ? PLATFORM_FEE_RATE_PROMO : PLATFORM_FEE_RATE_DEFAULT;
}

export function applyPlatformFee(gross: number) {
  const rate = currentPlatformFeeRate();
  const fee = Math.round(gross * rate * 100) / 100;
  const net = Math.round((gross - fee) * 100) / 100;
  return { gross, fee, net, rate, promo: hasActivePromo() };
}
