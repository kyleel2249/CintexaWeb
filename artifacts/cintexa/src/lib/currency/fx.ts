import { BASE_CURRENCY, normalizeCurrency } from "./geo";

export type RatesPayload = {
  base: string;
  /** units of each currency per 1 unit of `base` */
  rates: Record<string, number>;
  updatedAt: string | null;
};

const CACHE_PREFIX = "cintexa_fx_";
const FRESH_MS = 12 * 60 * 60 * 1000;
const STALE_OK_MS = 7 * 24 * 60 * 60 * 1000;

function readCache(base: string): { at: number; data: RatesPayload } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + base);
    return raw ? (JSON.parse(raw) as { at: number; data: RatesPayload }) : null;
  } catch {
    return null;
  }
}

function writeCache(base: string, data: RatesPayload) {
  try {
    localStorage.setItem(CACHE_PREFIX + base, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage unavailable */
  }
}

function isValid(p: unknown, base: string): p is RatesPayload {
  const r = p as RatesPayload | null;
  return Boolean(r && r.base === base && r.rates && typeof r.rates === "object" && r.rates[base] !== undefined);
}

/**
 * Real exchange rates only (served by /api/fx). Uses a fresh local cache when available and, if the
 * network fails, a cache up to 7 days old. Throws when there is no trustworthy rate — callers then
 * show the original currency instead of guessing.
 */
export async function fetchRates(baseInput: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<RatesPayload> {
  const base = normalizeCurrency(baseInput) ?? BASE_CURRENCY;
  const cached = readCache(base);
  if (cached && isValid(cached.data, base) && now - cached.at < FRESH_MS) return cached.data;
  try {
    const res = await fetchImpl(`/api/fx?base=${base}`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`fx ${res.status}`);
    const data = (await res.json()) as unknown;
    if (!isValid(data, base)) throw new Error("fx payload invalid");
    writeCache(base, data);
    return data;
  } catch (err) {
    if (cached && isValid(cached.data, base) && now - cached.at < STALE_OK_MS) return cached.data;
    throw err;
  }
}

/** Converts `amount` from → to using rates quoted against `from`. Null when no rate is available. */
export function convertAmount(amount: number, from: string, to: string, rates: RatesPayload | undefined): number | null {
  const f = normalizeCurrency(from);
  const t = normalizeCurrency(to);
  if (!f || !t || !Number.isFinite(amount)) return null;
  if (f === t) return amount;
  if (!rates || rates.base !== f) return null;
  const rate = rates.rates[t];
  return typeof rate === "number" && rate > 0 ? amount * rate : null;
}
