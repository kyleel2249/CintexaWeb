/** Re-exports so Modules / Payback keep working after fee rule change. */
export {
  ADMIN_USERNAME,
  PROMO_CODE,
  PLATFORM_FEE_RATE_DEFAULT as PLATFORM_FEE_RATE,
  applyPlatformFee,
  applyPromoCode,
  currentPlatformFeeRate,
  hasActivePromo,
  readPromoCode,
} from "./platform-economics";
export { ensureAdminReferrer as ensureReferrerBootstrap } from "./social-hub";
