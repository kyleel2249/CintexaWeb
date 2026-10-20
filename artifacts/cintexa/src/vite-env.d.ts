/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Meta (Facebook/Instagram) Pixel ID — marketing consent. Leave empty to disable. */
  readonly VITE_META_PIXEL_ID?: string;
  /** LinkedIn Insight Tag partner ID — marketing consent. Leave empty to disable. */
  readonly VITE_LINKEDIN_PARTNER_ID?: string;
  /** Google tag ID: G-… (analytics consent) or AW-… (marketing consent). Leave empty to disable. */
  readonly VITE_GOOGLE_TAG_ID?: string;
}
