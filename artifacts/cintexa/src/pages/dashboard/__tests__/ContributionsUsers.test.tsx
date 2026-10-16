import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { CurrencyContext } from "@/lib/currency/context";
import { mergeContributionsForUser } from "@/data/contribution-seed";

let currentUser = "";

vi.mock("@/hooks/useApi", () => ({
  // Exactly what the real hook does with an API that has no rows: merge in the verified schedule.
  useMyContributions: () => ({
    data: { contributions: mergeContributionsForUser(currentUser, []) },
    isLoading: false,
    isError: false,
  }),
}));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ userId: currentUser, isSignedIn: true }) }));
vi.mock("../DashboardShell", () => ({ DashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/insights/InsightPanel", () => ({ InsightPanel: () => null }));

import { DashboardContributions } from "../Contributions";

function renderFor(userId: string) {
  currentUser = userId;
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 502 })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CurrencyContext.Provider
        value={{ currency: "GHS", country: "GH", region: "GH", source: "network", preference: "auto", setPreference: () => undefined, detecting: false }}
      >
        <DashboardContributions />
      </CurrencyContext.Provider>
    </QueryClientProvider>,
  );
}

const stat = (label: string) => screen.getByText(label).nextSibling?.textContent;

describe("Contributions dashboard for 31463b73… (February–October, GHS 180)", () => {
  beforeEach(() => localStorage.clear());

  it("shows the data with the breakdown and analysis", () => {
    renderFor("31463b73-eb4a-4a76-8358-07e7aaad145c");
    expect(stat("Total contributed")).toMatch(/180\.00/);
    expect(stat("Payments recorded")).toBe("9");
    expect(stat("Average payment")).toMatch(/20\.00/);
    expect(screen.getByRole("heading", { name: "9 of 12 months covered" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Contributions by quarter/ })).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText(/Every payment was .*20\.00/)).toBeInTheDocument();
    expect(screen.getByText("complete").previousSibling?.textContent).toBe("100%"); // progress to schedule
    expect(screen.getAllByText(/Feb(ruary)? 2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Oct(ober)? 2026/).length).toBeGreaterThan(0);
  });
});

describe("Contributions dashboard for 47c44d24… (February–April, GHS 60)", () => {
  beforeEach(() => localStorage.clear());

  it("shows the data with the breakdown and analysis", () => {
    renderFor("47c44d24-45eb-4c25-8382-49976ebd5a2c");
    expect(stat("Total contributed")).toMatch(/60\.00/);
    expect(stat("Payments recorded")).toBe("3");
    expect(screen.getByRole("heading", { name: "3 of 12 months covered" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Contributions by quarter/ })).toBeInTheDocument();
    expect(screen.getByText("3 months in a row")).toBeInTheDocument();
    expect(screen.getByText("complete").previousSibling?.textContent).toBe("100%");
    expect(screen.queryByText(/Oct(ober)? 2026/)).toBeNull();
  });
});

describe("Contributions dashboard for bc8f8c02… (February–June, GHS 100)", () => {
  beforeEach(() => localStorage.clear());

  it("shows the data with the breakdown and analysis", () => {
    renderFor("bc8f8c02-2ec7-48e3-a8ee-9ed33cf03c3f");
    expect(stat("Total contributed")).toMatch(/100\.00/);
    expect(stat("Payments recorded")).toBe("5");
    expect(stat("Average payment")).toMatch(/20\.00/);
    expect(screen.getByRole("heading", { name: "5 of 12 months covered" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Contributions by quarter/ })).toBeInTheDocument();
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("5 months in a row")).toBeInTheDocument();
    expect(screen.getByText("complete").previousSibling?.textContent).toBe("100%");
    expect(screen.getAllByText(/Feb(ruary)? 2026/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Jun(e)? 2026/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Jul(y)? 2026/)).toBeNull();
  });
});

describe("an account with no contributions", () => {
  it("shows no analysis section", () => {
    renderFor("nobody");
    expect(screen.queryByRole("img", { name: /Contributions by quarter/ })).toBeNull();
    expect(screen.queryByText("Milestones")).toBeNull();
  });
});
