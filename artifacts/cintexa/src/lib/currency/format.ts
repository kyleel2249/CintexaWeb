import { normalizeCurrency } from "./geo";

export function browserLocale(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.languages?.[0] ?? navigator.language ?? undefined;
}

/** Locale-aware money string; falls back to "CODE 1,234.50" for codes Intl doesn't know. */
export function formatMoney(amount: number, currency: string, locale: string | undefined = browserLocale()): string {
  const code = normalizeCurrency(currency) ?? "GHS";
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(value);
  } catch {
    return `${code} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function currencyName(code: string, locale: string | undefined = "en"): string {
  try {
    return new Intl.DisplayNames(locale, { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function regionName(code: string, locale: string | undefined = "en"): string {
  try {
    return new Intl.DisplayNames(locale, { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
