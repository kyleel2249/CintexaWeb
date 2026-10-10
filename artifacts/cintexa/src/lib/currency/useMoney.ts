import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "./context";
import { convertAmount, fetchRates, type RatesPayload } from "./fx";
import { formatMoney } from "./format";
import { BASE_CURRENCY, normalizeCurrency } from "./geo";
import { planDisplay, type MoneyRow } from "@/lib/contributions";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const DEFAULT_BASES: readonly string[] = [BASE_CURRENCY];
const NO_RATES: Record<string, RatesPayload | undefined> = {};

export type MoneyText = {
  /** What to show. Prefixed with "≈" when converted (unless approx=false). */
  text: string;
  converted: boolean;
  /** The amount in the currency it was recorded in, e.g. "GH₵20.00". */
  original: string;
};

/**
 * Money in the user's own currency. `bases` lists the currencies stored amounts may be in
 * (default GHS, the platform's base). Rates are real (server-proxied) and cached; when a rate is
 * unavailable the original currency is shown rather than a guess.
 */
export function useMoney(bases: readonly string[] = DEFAULT_BASES) {
  const { currency, country, source, detecting, preference, setPreference } = useCurrency();

  const basesKey = bases.map((b) => normalizeCurrency(b) ?? BASE_CURRENCY).join(",");
  const needed = useMemo(
    () => [...new Set(basesKey.split(","))].filter((b) => b !== currency),
    [basesKey, currency],
  );

  // One query for every base currency needed. Partial failures keep what loaded; if nothing loads
  // the query errors (so it is retried later) and callers fall back to the recorded currency.
  const rates = useQuery({
    queryKey: ["fx", needed.join(",")],
    enabled: needed.length > 0,
    staleTime: SIX_HOURS,
    retry: 1,
    queryFn: async () => {
      const entries = await Promise.all(
        needed.map(async (base) => [base, await fetchRates(base).catch(() => undefined)] as const),
      );
      if (entries.every(([, r]) => r === undefined)) throw new Error("Exchange rates unavailable");
      return Object.fromEntries(entries) as Record<string, RatesPayload | undefined>;
    },
  });

  const ratesByBase = rates.data ?? NO_RATES;
  const loadingRates = needed.length > 0 && rates.isPending;
  const ratesUnavailable = needed.length > 0 && !rates.isPending && needed.some((b) => !ratesByBase[b]);
  const updatedAt = needed.map((b) => ratesByBase[b]?.updatedAt).find(Boolean) ?? null;

  const format = useCallback(
    (amount: number | string | null | undefined, from: string = BASE_CURRENCY, opts: { approx?: boolean } = {}): MoneyText => {
      const value = Number(amount) || 0;
      const src = normalizeCurrency(from) ?? BASE_CURRENCY;
      const original = formatMoney(value, src);
      const converted = convertAmount(value, src, currency, ratesByBase[src]);
      if (converted === null) return { text: original, converted: false, original };
      const isConverted = src !== currency;
      const approx = isConverted && opts.approx !== false;
      return { text: `${approx ? "≈ " : ""}${formatMoney(converted, currency)}`, converted: isConverted, original };
    },
    [currency, ratesByBase],
  );

  const plan = useCallback(<T extends MoneyRow>(rows: T[]) => planDisplay(rows, currency, ratesByBase), [currency, ratesByBase]);

  return useMemo(
    () => ({
      currency,
      country,
      source,
      detecting,
      preference,
      setPreference,
      format,
      plan,
      loadingRates,
      ratesUnavailable,
      updatedAt,
    }),
    [currency, country, source, detecting, preference, setPreference, format, plan, loadingRates, ratesUnavailable, updatedAt],
  );
}
