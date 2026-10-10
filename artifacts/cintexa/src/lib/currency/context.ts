import { createContext, useContext } from "react";
import { BASE_CURRENCY, type CurrencySource } from "./geo";

export type CurrencyContextValue = {
  /** Currency amounts should be shown in. */
  currency: string;
  country: string | null;
  source: CurrencySource;
  /** "auto" or the explicit code chosen in Settings. */
  preference: string;
  setPreference: (value: string) => void;
  /** True until the location lookup has finished (the currency may still change). */
  detecting: boolean;
};

export const CurrencyContext = createContext<CurrencyContextValue>({
  currency: BASE_CURRENCY,
  country: null,
  source: "default",
  preference: "auto",
  setPreference: () => undefined,
  detecting: false,
});

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
