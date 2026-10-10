import { COUNTRY_CURRENCY, TIMEZONE_COUNTRY } from "./countries";

/** Where the display currency came from, strongest signal first. */
export type CurrencySource = "preference" | "profile" | "network" | "locale" | "timezone" | "default";

export const BASE_CURRENCY = "GHS";

export type CurrencyResolution = { currency: string; country: string | null; source: CurrencySource };

const CODE_RE = /^[A-Z]{3}$/;
const COUNTRY_RE = /^[A-Z]{2}$/;

export function normalizeCountry(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  // "XX" = unknown, "T1" = Tor in Cloudflare's CF-IPCountry
  return COUNTRY_RE.test(v) && v !== "XX" && v !== "T1" ? v : null;
}

export function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  return CODE_RE.test(v) ? v : null;
}

export function currencyForCountry(country: unknown): string | null {
  const cc = normalizeCountry(country);
  return cc ? (COUNTRY_CURRENCY[cc] ?? null) : null;
}

/** "en-GH" → "GH"; "fr" → null. */
export function countryFromLocale(tag: string | undefined | null): string | null {
  if (!tag) return null;
  try {
    const region = new Intl.Locale(tag).maximize().region;
    // maximize() guesses a region for bare languages ("en" → US); only trust an explicit one.
    const explicit = new Intl.Locale(tag).region;
    return explicit ? normalizeCountry(region) : null;
  } catch {
    return null;
  }
}

export function countryFromTimeZone(tz: string | undefined | null): string | null {
  return tz ? (TIMEZONE_COUNTRY[tz] ?? null) : null;
}

/** Accepts ISO codes ("GH") or common country names stored on profiles ("Ghana"). */
export function countryFromProfile(value: unknown): string | null {
  const code = normalizeCountry(value);
  if (code) return code;
  if (typeof value !== "string" || !value.trim()) return null;
  const name = value.trim().toLowerCase();
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    for (const cc of Object.keys(COUNTRY_CURRENCY)) {
      if (dn.of(cc)?.toLowerCase() === name) return cc;
    }
  } catch {
    /* Intl.DisplayNames unavailable */
  }
  return null;
}

export type ResolveInput = {
  /** Explicit user choice: a currency code, or "auto"/undefined. */
  preference?: string | null;
  /** Country saved on the user's profile. */
  profileCountry?: string | null;
  /** Country detected from the request (Cloudflare) via /api/geo. */
  networkCountry?: string | null;
  locales?: readonly string[];
  timeZone?: string | null;
};

/**
 * Picks the currency to display. Order: explicit preference → profile country → network country →
 * browser locale region → time zone → GHS (the platform's base currency).
 */
export function resolveCurrency(input: ResolveInput): CurrencyResolution {
  const preferred = input.preference && input.preference !== "auto" ? normalizeCurrency(input.preference) : null;
  if (preferred) return { currency: preferred, country: null, source: "preference" };

  const tries: [CurrencySource, string | null][] = [
    ["profile", countryFromProfile(input.profileCountry)],
    ["network", normalizeCountry(input.networkCountry)],
    ["locale", (input.locales ?? []).map(countryFromLocale).find(Boolean) ?? null],
    ["timezone", countryFromTimeZone(input.timeZone)],
  ];
  for (const [source, country] of tries) {
    const currency = currencyForCountry(country);
    if (country && currency) return { currency, country, source };
  }
  return { currency: BASE_CURRENCY, country: null, source: "default" };
}
