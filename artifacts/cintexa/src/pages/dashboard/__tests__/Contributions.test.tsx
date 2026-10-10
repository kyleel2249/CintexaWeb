import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CurrencyContext } from "@/lib/currency/context";

const rows = [
  { id: "1", reference: "R1", amount: "20.00", currency: "GHS", status: "paid", description: "Jan", createdAt: new Date("2026-01-01T10:00:00Z") },
  { id: "2", reference: "R2", amount: "20.00", currency: "GHS", status: "pending", description: "Feb", createdAt: new Date("2026-02-01T10:00:00Z") },
];

vi.mock("@/hooks/useApi", () => ({
  useMyContributions: () => ({ data: { contributions: rows }, isLoading: false, isError: false }),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ userId: "u-not-seeded", isSignedIn: true }) }));
vi.mock("../DashboardShell", () => ({ DashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/insights/InsightPanel", () => ({ InsightPanel: () => null }));

import { DashboardContributions } from "../Contributions";

function renderWith(currency: string, fetchImpl: typeof fetch) {
  vi.stubGlobal("fetch", fetchImpl);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrencyContext.Provider
        value={{ currency, country: null, region: null, source: "preference", preference: currency, setPreference: () => undefined, detecting: false }}
      >
        <DashboardContributions />
      </CurrencyContext.Provider>
    </QueryClientProvider>,
  );
}

describe("Contributions page currency", () => {
  beforeEach(() => localStorage.clear());

  it("shows recorded GHS untouched for a Ghana user and excludes the pending row from totals", () => {
    renderWith("GHS", vi.fn() as unknown as typeof fetch);
    expect(screen.getAllByText(/20\.00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/≈/)).toBeNull();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Payments recorded").nextSibling?.textContent).toBe("1");
  });

  it("converts to the user's currency using live rates", async () => {
    const body = { base: "GHS", rates: { GHS: 1, USD: 0.1 }, updatedAt: "2026-10-10T00:00:00.000Z" };
    renderWith("USD", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch);
    expect(await screen.findAllByText(/\$2\.00/)).not.toHaveLength(0);
    expect(screen.getByText(/converted from the currency they were recorded in/i)).toBeInTheDocument();
  });

  it("falls back honestly to GHS when no exchange rate is available", async () => {
    renderWith("USD", vi.fn(async () => new Response("{}", { status: 502 })) as unknown as typeof fetch);
    expect(await screen.findByText(/Live exchange rate unavailable/i)).toBeInTheDocument();
    expect(screen.getAllByText(/20\.00/).length).toBeGreaterThan(0);
  });
});
