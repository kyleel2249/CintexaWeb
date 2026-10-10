import { normalizeCurrency } from "./geo";

const KEY = "cintexa_display_currency";

/** "auto" (detect from location) or an ISO 4217 code the user picked in Settings. */
export function readCurrencyPreference(): string {
  try {
    return normalizeCurrency(localStorage.getItem(KEY)) ?? "auto";
  } catch {
    return "auto";
  }
}

export function writeCurrencyPreference(value: string): string {
  const next = value === "auto" ? "auto" : (normalizeCurrency(value) ?? "auto");
  try {
    if (next === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* storage unavailable — preference lasts for this session only */
  }
  return next;
}
