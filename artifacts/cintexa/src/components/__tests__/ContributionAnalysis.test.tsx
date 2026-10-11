import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ContributionBreakdown, ContributionYearStrip } from "../contributions/ContributionAnalysis";
import { analyzeContributions } from "@/lib/contribution-analytics";
import { getSeededContributions } from "@/data/contribution-seed";

const NOW = new Date("2026-10-11T12:00:00Z");
const fmt = (n: number) => `GHS ${n.toFixed(2)}`;
const analyticsFor = (id: string) =>
  analyzeContributions(getSeededContributions(id).map((c) => ({ date: c.createdAt, amount: Number(c.amount) })), NOW);

function renderAll(a: ReturnType<typeof analyticsFor>) {
  return render(
    <div>
      <ContributionYearStrip analytics={a} fmt={fmt} currency="GHS" />
      <ContributionBreakdown analytics={a} fmt={fmt} currency="GHS" />
    </div>,
  );
}

describe("analysis visuals — user 31463b73… (Feb–Oct, GHS 180)", () => {
  const a = analyticsFor("31463b73-eb4a-4a76-8358-07e7aaad145c");

  it("year at a glance: 9 of 12 months, with each month's state in text", () => {
    renderAll(a);
    expect(screen.getByRole("heading", { name: "9 of 12 months covered" })).toBeInTheDocument();
    const tiles = within(screen.getByRole("list", { name: "Months of 2026" })).getAllByRole("listitem");
    expect(tiles).toHaveLength(12);
    expect(tiles.map((t) => t.getAttribute("data-state"))).toEqual([
      "none", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "upcoming", "upcoming",
    ]);
    expect(within(tiles[1]!).getByText("paid")).toBeInTheDocument();
    expect(within(tiles[10]!).getByText("upcoming")).toBeInTheDocument();
    expect(within(tiles[0]!).getByText("no payment")).toBeInTheDocument();
  });

  it("quarterly donut has an accessible summary and a legend with amounts and shares", () => {
    renderAll(a);
    const svg = screen.getByRole("img", { name: /Contributions by quarter/ });
    expect(svg.getAttribute("aria-label")).toContain("Q1 GHS 40.00 (22%)");
    expect(svg.getAttribute("aria-label")).toContain("Q2 GHS 60.00 (33%)");
    expect(svg.getAttribute("aria-label")).toContain("Q4 GHS 20.00 (11%)");
    expect(screen.getByText("Jan–Mar")).toBeInTheDocument();
    expect(screen.getByText("Oct–Dec")).toBeInTheDocument();
  });

  it("milestones and insights are derived from the data", () => {
    renderAll(a);
    for (const label of ["Apr 2026", "Jun 2026", "Aug 2026", "Oct 2026"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("Every payment was GHS 20.00")).toBeInTheDocument();
    expect(screen.getByText("9 months in a row")).toBeInTheDocument();
    expect(screen.getByText(/still running/)).toBeInTheDocument();
    expect(screen.getByText("9 of 12 months covered in 2026")).toBeInTheDocument();
    expect(screen.getByText("No gaps between the first and latest payment.")).toBeInTheDocument();
  });
});

describe("analysis visuals — user 47c44d24… (Feb–Apr, GHS 60)", () => {
  const a = analyticsFor("47c44d24-45eb-4c25-8382-49976ebd5a2c");

  it("shows 3 of 12 months, two quarters, and a finished streak", () => {
    renderAll(a);
    expect(screen.getByRole("heading", { name: "3 of 12 months covered" })).toBeInTheDocument();
    const label = screen.getByRole("img", { name: /Contributions by quarter/ }).getAttribute("aria-label")!;
    expect(label).toContain("Q1 GHS 40.00 (67%)");
    expect(label).toContain("Q2 GHS 20.00 (33%)");
    expect(label).not.toContain("Q3");
    expect(screen.getByText("3 months in a row")).toBeInTheDocument();
    expect(screen.queryByText(/still running/)).toBeNull();
    expect(screen.getByText("Every payment was GHS 20.00")).toBeInTheDocument();
  });
});

describe("empty state", () => {
  it("renders nothing without contributions", () => {
    const { container } = renderAll(analyzeContributions([], NOW));
    expect(container.textContent).toBe("");
  });
});
