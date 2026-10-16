import { describe, expect, it } from "vitest";
import { analyzeContributions } from "../contribution-analytics";
import { getSeededContributions } from "@/data/contribution-seed";

const NOW = new Date("2026-10-11T12:00:00Z");
const rowsFor = (id: string) => getSeededContributions(id).map((c) => ({ date: c.createdAt, amount: Number(c.amount) }));
const A = analyzeContributions(rowsFor("31463b73-eb4a-4a76-8358-07e7aaad145c"), NOW);
const B = analyzeContributions(rowsFor("47c44d24-45eb-4c25-8382-49976ebd5a2c"), NOW);
const C = analyzeContributions(rowsFor("bc8f8c02-2ec7-48e3-a8ee-9ed33cf03c3f"), NOW);

describe("user 31463b73… — February to October, GHS 180", () => {
  it("headline numbers", () => {
    expect(A).toMatchObject({ year: 2026, total: 180, count: 9, average: 20, median: 20, min: 20, max: 20, uniform: true });
    expect(A.first).toEqual({ label: "Feb 2026", amount: 20 });
    expect(A.last).toEqual({ label: "Oct 2026", amount: 20 });
  });
  it("covers 9 of 12 months with an unbroken, still-active streak", () => {
    expect(A.monthsPaid).toBe(9);
    expect(A.longestStreak).toBe(9);
    expect(A.streakActive).toBe(true); // October is the current month
    expect(A.gaps).toBe(0);
  });
  it("year strip: January unpaid, Feb–Oct paid, November and December still ahead", () => {
    const state = (m: (typeof A.months)[number]) => (m.paid ? "paid" : m.upcoming ? "upcoming" : "none");
    expect(A.months.map(state)).toEqual([
      "none", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "paid", "upcoming", "upcoming",
    ]);
    expect(A.months[9]!.current).toBe(true);
  });
  it("quarterly split adds up to the total", () => {
    expect(A.quarters.map((q) => q.amount)).toEqual([40, 60, 60, 20]);
    expect(A.quarters.map((q) => q.count)).toEqual([2, 3, 3, 1]);
    expect(A.quarters.reduce((s, q) => s + q.share, 0)).toBeCloseTo(1);
    expect(A.quarters[0]!.share).toBeCloseTo(40 / 180);
    expect(A.quarters[1]!.share).toBeCloseTo(1 / 3);
  });
  it("milestones by the month the running total crossed 25/50/75/100%", () => {
    expect(A.milestones.map((m) => [m.pct, m.reachedOn, m.amountAtReach])).toEqual([
      [25, "Apr 2026", 60],
      [50, "Jun 2026", 100],
      [75, "Aug 2026", 140],
      [100, "Oct 2026", 180],
    ]);
  });
});

describe("user 47c44d24… — February to April, GHS 60", () => {
  it("headline numbers", () => {
    expect(B).toMatchObject({ year: 2026, total: 60, count: 3, average: 20, uniform: true, monthsPaid: 3, longestStreak: 3, gaps: 0 });
    expect(B.first).toEqual({ label: "Feb 2026", amount: 20 });
    expect(B.last).toEqual({ label: "Apr 2026", amount: 20 });
  });
  it("the streak is not shown as active in October", () => {
    expect(B.streakActive).toBe(false);
  });
  it("quarters: Feb–Mar in Q1, April in Q2", () => {
    expect(B.quarters.map((q) => q.amount)).toEqual([40, 20, 0, 0]);
    expect(B.quarters[0]!.share).toBeCloseTo(2 / 3);
    expect(B.quarters[1]!.share).toBeCloseTo(1 / 3);
    expect(B.quarters[2]!.share).toBe(0);
  });
  it("milestones", () => {
    expect(B.milestones.map((m) => [m.pct, m.reachedOn])).toEqual([
      [25, "Feb 2026"],
      [50, "Mar 2026"],
      [75, "Apr 2026"],
      [100, "Apr 2026"],
    ]);
  });
  it("tiles: Jan and May–Sep are past with no payment, Oct current, Nov–Dec ahead", () => {
    expect(B.months.filter((m) => m.upcoming).map((m) => m.label)).toEqual(["Nov", "Dec"]);
    expect(B.months.filter((m) => m.paid).map((m) => m.label)).toEqual(["Feb", "Mar", "Apr"]);
    expect(B.months.find((m) => m.current)?.label).toBe("Oct");
  });
});

describe("user bc8f8c02… — February to June, GHS 100", () => {
  it("headline numbers", () => {
    expect(C).toMatchObject({ year: 2026, total: 100, count: 5, average: 20, median: 20, uniform: true, monthsPaid: 5, longestStreak: 5, gaps: 0 });
    expect(C.first).toEqual({ label: "Feb 2026", amount: 20 });
    expect(C.last).toEqual({ label: "Jun 2026", amount: 20 });
    expect(C.streakActive).toBe(false); // last payment was June; it is October
  });
  it("quarters: Feb–Mar in Q1, Apr–Jun in Q2", () => {
    expect(C.quarters.map((q) => q.amount)).toEqual([40, 60, 0, 0]);
    expect(C.quarters.map((q) => q.count)).toEqual([2, 3, 0, 0]);
    expect(C.quarters[0]!.share).toBeCloseTo(0.4);
    expect(C.quarters[1]!.share).toBeCloseTo(0.6);
  });
  it("milestones", () => {
    expect(C.milestones.map((m) => [m.pct, m.reachedOn, m.amountAtReach])).toEqual([
      [25, "Mar 2026", 40],
      [50, "Apr 2026", 60],
      [75, "May 2026", 80],
      [100, "Jun 2026", 100],
    ]);
  });
  it("tiles: Feb–Jun paid, the rest of the past unpaid, October current, Nov–Dec ahead", () => {
    expect(C.months.filter((m) => m.paid).map((m) => m.label)).toEqual(["Feb", "Mar", "Apr", "May", "Jun"]);
    expect(C.months.filter((m) => m.upcoming).map((m) => m.label)).toEqual(["Nov", "Dec"]);
    expect(C.months.find((m) => m.current)?.label).toBe("Oct");
  });
});

describe("other shapes of data", () => {
  it("handles no data", () => {
    const e = analyzeContributions([], NOW);
    expect(e).toMatchObject({ year: null, total: 0, count: 0, longestStreak: 0, monthsPaid: 0, topMonth: null });
    expect(e.milestones.every((m) => !m.reached)).toBe(true);
  });
  it("finds gaps, varied amounts, median and the largest month", () => {
    const r = analyzeContributions(
      [
        { date: "2026-01-05T10:00:00Z", amount: 10 },
        { date: "2026-02-05T10:00:00Z", amount: 30 },
        { date: "2026-05-05T10:00:00Z", amount: 20 },
      ],
      NOW,
    );
    expect(r).toMatchObject({ total: 60, uniform: false, median: 20, min: 10, max: 30, gaps: 2, longestStreak: 2 });
    expect(r.topMonth).toMatchObject({ label: "Feb", amount: 30 });
    expect(r.topMonth!.share).toBeCloseTo(0.5);
  });
  it("sums several payments in one month and ignores bad rows", () => {
    const r = analyzeContributions(
      [
        { date: "2026-03-01T10:00:00Z", amount: 10 },
        { date: "2026-03-20T10:00:00Z", amount: 15 },
        { date: "not a date", amount: 99 },
      ],
      NOW,
    );
    expect(r.count).toBe(2);
    expect(r.months[2]).toMatchObject({ amount: 25, count: 2, paid: true });
  });
  it("analyses the latest year when data spans years", () => {
    const r = analyzeContributions(
      [
        { date: "2025-12-01T10:00:00Z", amount: 20 },
        { date: "2026-01-01T10:00:00Z", amount: 20 },
      ],
      NOW,
    );
    expect(r.year).toBe(2026);
    expect(r.spansMultipleYears).toBe(true);
    expect(r.longestStreak).toBe(2); // Dec → Jan counts as consecutive
    expect(r.monthsPaid).toBe(1);
  });
});
