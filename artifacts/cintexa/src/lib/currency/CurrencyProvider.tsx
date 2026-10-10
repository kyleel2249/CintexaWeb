import { useCallback, useMemo, useState, type ReactNode } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { CurrencyContext } from "./context";
import { resolveCurrency, normalizeCountry } from "./geo";
import { readCurrencyPreference, writeCurrencyPreference } from "./preference";
import { readLocalProfile } from "@/lib/local-profile";

async function fetchGeo(): Promise<string | null> {
  const res = await fetch("/api/geo", { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { country?: unknown };
  return normalizeCountry(data.country);
}

/**
 * Works out the user's display currency from (in order) their Settings choice, the country on their
 * profile, the country Cloudflare sees for the request, their browser locale and time zone.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState(() => readCurrencyPreference());

  const geo = useQuery({
    queryKey: ["geo"],
    queryFn: fetchGeo,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 0,
  });

  // Subscribe to the profile query without triggering a fetch (the dashboard owns that request).
  const profileCache = useQuery<{ profile?: { country?: string | null } | null }>({
    queryKey: ["customer", "me"],
    queryFn: skipToken,
  });
  const profileCountry = profileCache.data?.profile?.country ?? readLocalProfile()?.country ?? null;

  const setPreference = useCallback((value: string) => setPreferenceState(writeCurrencyPreference(value)), []);

  const value = useMemo(() => {
    const resolved = resolveCurrency({
      preference,
      profileCountry,
      networkCountry: geo.data ?? null,
      locales: typeof navigator === "undefined" ? [] : (navigator.languages ?? [navigator.language]),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return {
      ...resolved,
      preference,
      setPreference,
      detecting: preference === "auto" && geo.isPending,
    };
  }, [preference, profileCountry, geo.data, geo.isPending, setPreference]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
