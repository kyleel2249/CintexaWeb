import { beforeEach, describe, expect, it, vi } from "vitest";
import { COUNTRY_CURRENCY } from "../countries";
import {
  countryFromLocale,
  countryFromProfile,
  countryFromTimeZone,
  currencyForCountry,
  normalizeCountry,
  resolveCurrency,
} from "../geo";
import { formatMoney } from "../format";
import { convertAmount, fetchRates, type RatesPayload } from "../fx";
import { planDisplay } from "@/lib/contributions";

describe("country → currency", () => {
  it("maps countries, including recent changes", () => {
    expect(currencyForCountry("GH")).toBe("GHS");
    expect(currencyForCountry("ng")).toBe("NGN");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("HR")).toBe("EUR");
    expect(currencyForCountry("BG")).toBe("EUR");
    expect(currencyForCountry("ZW")).toBe("ZWG");
    expect(currencyForCountry("ZZ")).toBeNull();
  });
  it("only contains well-formed pairs", () => {
    for (const [cc, cur] of Object.entries(COUNTRY_CURRENCY)) {
      expect(cc).toMatch(/^[A-Z]{2}$/);
      expect(cur).toMatch(/^[A-Z]{3}$/);
    }
    expect(Object.keys(COUNTRY_CURRENCY).length).toBeGreaterThan(230);
  });
  it("ignores unknown / Tor country codes", () => {
    expect(normalizeCountry("XX")).toBeNull();
    expect(normalizeCountry("T1")).toBeNull();
    expect(normalizeCountry("gh")).toBe("GH");
    expect(normalizeCountry(42)).toBeNull();
  });
  it("reads a country from locale, time zone and profile text", () => {
    expect(countryFromLocale("en-GH")).toBe("GH");
    expect(countryFromLocale("fr-CA")).toBe("CA");
    expect(countryFromLocale("en")).toBeNull(); // bare language: don't guess a region
    expect(countryFromTimeZone("Africa/Accra")).toBe("GH");
    expect(countryFromTimeZone("Mars/Base")).toBeNull();
    expect(countryFromProfile("GH")).toBe("GH");
    expect(countryFromProfile("Ghana")).toBe("GH");
    expect(countryFromProfile("")).toBeNull();
  });
});

describe("resolveCurrency precedence", () => {
  const all = {
    preference: "usd",
    profileCountry: "NG",
    networkCountry: "KE",
    locales: ["en-GB"],
    timeZone: "Africa/Accra",
  };
  it("explicit preference wins", () => {
    expect(resolveCurrency(all)).toEqual({ currency: "USD", country: null, source: "preference" });
  });
  it("then profile country, network, locale, time zone", () => {
    expect(resolveCurrency({ ...all, preference: "auto" })).toMatchObject({ currency: "NGN", source: "profile" });
    expect(resolveCurrency({ ...all, preference: "auto", profileCountry: null })).toMatchObject({
      currency: "KES",
      source: "network",
    });
    expect(resolveCurrency({ ...all, preference: "auto", profileCountry: null, networkCountry: null })).toMatchObject({
      currency: "GBP",
      source: "locale",
    });
    expect(
      resolveCurrency({ preference: "auto", locales: ["en"], timeZone: "Africa/Accra" }),
    ).toMatchObject({ currency: "GHS", country: "GH", source: "timezone" });
  });
  it("falls back to the platform base currency", () => {
    expect(resolveCurrency({ preference: "auto", locales: ["en"], timeZone: "UTC" })).toEqual({
      currency: "GHS",
      country: null,
      source: "default",
    });
  });
  it("rejects a malformed preference instead of using it", () => {
    expect(resolveCurrency({ preference: "dollars", networkCountry: "GH" }).currency).toBe("GHS");
  });
});

describe("formatMoney", () => {
  it("formats with the currency's own digits and survives unknown codes", () => {
    expect(formatMoney(1234.5, "USD", "en-US")).toBe("$1,234.50");
    expect(formatMoney(1500, "JPY", "en-US")).toBe("¥1,500");
    expect(formatMoney(20, "GHS", "en-GH")).toContain("20.00");
    expect(formatMoney(5, "ZZZ", "en-US")).toContain("5.00");
    expect(formatMoney(Number.NaN, "USD", "en-US")).toBe("$0.00");
  });
});

const rates: RatesPayload = { base: "GHS", rates: { GHS: 1, USD: 0.08, NGN: 120 }, updatedAt: "2026-10-10T00:00:00.000Z" };

describe("convertAmount", () => {
  it("converts with quoted rates and is exact for the same currency", () => {
    expect(convertAmount(100, "GHS", "USD", rates)).toBeCloseTo(8);
    expect(convertAmount(100, "GHS", "GHS", undefined)).toBe(100);
  });
  it("returns null instead of guessing when no usable rate exists", () => {
    expect(convertAmount(100, "GHS", "USD", undefined)).toBeNull();
    expect(convertAmount(100, "GHS", "EUR", rates)).toBeNull();
    expect(convertAmount(100, "USD", "NGN", rates)).toBeNull(); // rates are quoted against GHS
    expect(convertAmount(100, "bad", "USD", rates)).toBeNull();
  });
});

describe("planDisplay", () => {
  const rows = [
    { id: "a", amount: "20.00", currency: "GHS" },
    { id: "b", amount: "30.00", currency: "GHS" },
  ];
  it("converts everything into the target currency when rates exist", () => {
    const plan = planDisplay(rows, "USD", { GHS: rates });
    expect(plan.currency).toBe("USD");
    expect(plan.usedConversion).toBe(true);
    expect(plan.fellBack).toBe(false);
    expect(plan.items.reduce((s, i) => s + i.amount, 0)).toBeCloseTo(4);
    expect(plan.items[0]!.original).toEqual({ amount: 20, currency: "GHS" });
  });
  it("is exact and unconverted for users already in the recorded currency", () => {
    const plan = planDisplay(rows, "GHS", {});
    expect(plan).toMatchObject({ currency: "GHS", usedConversion: false, fellBack: false });
    expect(plan.items.map((i) => i.amount)).toEqual([20, 30]);
  });
  it("falls back to the recorded currency when no rate is available", () => {
    const plan = planDisplay(rows, "USD", {});
    expect(plan).toMatchObject({ currency: "GHS", fellBack: true, usedConversion: false });
    expect(plan.items.map((i) => i.amount)).toEqual([20, 30]);
  });
  it("never sums an unconvertible currency into the total", () => {
    const mixed = [...rows, { id: "c", amount: "5", currency: "EUR" }];
    const plan = planDisplay(mixed, "USD", { GHS: rates });
    expect(plan.currency).toBe("GHS");
    expect(plan.excluded.map((r) => r.id)).toEqual(["c"]);
    expect(plan.items).toHaveLength(2);
  });
  it("handles an empty list", () => {
    expect(planDisplay([], "USD", {})).toMatchObject({ currency: "USD", items: [], excluded: [] });
  });
});

describe("fetchRates (cache + failure handling)", () => {
  beforeEach(() => localStorage.clear());
  const ok = () => new Response(JSON.stringify(rates), { status: 200, headers: { "content-type": "application/json" } });

  it("fetches, validates and caches", async () => {
    const f = vi.fn(async () => ok());
    expect(await fetchRates("GHS", f as unknown as typeof fetch)).toEqual(rates);
    expect(await fetchRates("GHS", f as unknown as typeof fetch)).toEqual(rates); // served from cache
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("uses an older cache when the network fails, but throws with none", async () => {
    const bad = vi.fn(async () => new Response("{}", { status: 502 }));
    await expect(fetchRates("GHS", bad as unknown as typeof fetch)).rejects.toThrow();
    await fetchRates("GHS", (async () => ok()) as unknown as typeof fetch);
    const later = Date.now() + 24 * 60 * 60 * 1000; // cache is stale but < 7 days
    expect(await fetchRates("GHS", bad as unknown as typeof fetch, later)).toEqual(rates);
    const muchLater = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await expect(fetchRates("GHS", bad as unknown as typeof fetch, muchLater)).rejects.toThrow();
  });
  it("rejects a payload for the wrong base", async () => {
    const wrong = vi.fn(async () => new Response(JSON.stringify({ ...rates, base: "USD" }), { status: 200 }));
    await expect(fetchRates("GHS", wrong as unknown as typeof fetch)).rejects.toThrow();
  });
});
