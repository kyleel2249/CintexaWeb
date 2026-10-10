import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrencyProvider } from "../CurrencyProvider";
import { useCurrency } from "../context";

function Probe() {
  const c = useCurrency();
  return (
    <div>
      <span data-testid="cur">{c.currency}</span>
      <span data-testid="src">{c.source}</span>
      <button onClick={() => c.setPreference("EUR")}>eur</button>
      <button onClick={() => c.setPreference("auto")}>auto</button>
    </div>
  );
}

function setup(country: string | null, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ country }), { status: 200 })),
  );
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <CurrencyProvider>
          <Probe />
        </CurrencyProvider>
      </QueryClientProvider>,
    ),
  };
}

describe("CurrencyProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("uses the country Cloudflare reports", async () => {
    setup("NG");
    await waitFor(() => expect(screen.getByTestId("cur").textContent).toBe("NGN"));
    expect(screen.getByTestId("src").textContent).toBe("network");
  });

  it("lets the profile country beat the network country", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(["customer", "me"], { profile: { country: "GH" } });
    setup("US", client);
    await waitFor(() => expect(screen.getByTestId("src").textContent).toBe("profile"));
    expect(screen.getByTestId("cur").textContent).toBe("GHS");
  });

  it("applies and persists a manual choice, and 'auto' restores detection", async () => {
    setup("NG");
    await waitFor(() => expect(screen.getByTestId("cur").textContent).toBe("NGN"));
    act(() => screen.getByText("eur").click());
    expect(screen.getByTestId("cur").textContent).toBe("EUR");
    expect(localStorage.getItem("cintexa_display_currency")).toBe("EUR");
    act(() => screen.getByText("auto").click());
    expect(screen.getByTestId("cur").textContent).toBe("NGN");
    expect(localStorage.getItem("cintexa_display_currency")).toBeNull();
  });

  it("keeps working (locale/time zone fallback) when the geo lookup fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <CurrencyProvider>
          <Probe />
        </CurrencyProvider>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("cur").textContent).toMatch(/^[A-Z]{3}$/));
  });
});
