import { describe, expect, it } from "vitest";
import { getSeededContributions, getSeededSchedule, getSeededTotalGhs, mergeContributionsForUser } from "../contribution-seed";

const USER_A = "31463b73-eb4a-4a76-8358-07e7aaad145c"; // February–October, GHS 180
const USER_B = "47c44d24-45eb-4c25-8382-49976ebd5a2c"; // February–April, GHS 60
const USER_C = "bc8f8c02-2ec7-48e3-a8ee-9ed33cf03c3f"; // February–June, GHS 100

const sum = (rows: { amount: string }[]) => rows.reduce((s, r) => s + Number(r.amount), 0);

describe.each([
  { name: "31463b73…", id: USER_A, months: [2, 3, 4, 5, 6, 7, 8, 9, 10], total: 180 },
  { name: "47c44d24…", id: USER_B, months: [2, 3, 4], total: 60 },
  { name: "bc8f8c02…", id: USER_C, months: [2, 3, 4, 5, 6], total: 100 },
])("seeded contributions for $name", ({ id, months, total }) => {
  const rows = getSeededContributions(id);

  it("has one paid GHS 20.00 contribution per month, February onward", () => {
    expect(rows).toHaveLength(months.length);
    expect(rows.map((r) => new Date(r.createdAt).getUTCMonth() + 1)).toEqual(months);
    for (const r of rows) {
      expect(new Date(r.createdAt).getUTCFullYear()).toBe(2026);
      expect(r.amount).toBe("20.00");
      expect(r.currency).toBe("GHS");
      expect(r.status).toBe("paid");
      expect(r.userId).toBe(id);
    }
  });
  it("totals exactly GHS " + total + ".00", () => {
    expect(sum(rows)).toBe(total);
    expect(getSeededTotalGhs(id)).toBe(total);
    expect(getSeededSchedule(id)).toMatchObject({ year: 2026, monthlyGhs: 20 });
  });
  it("has unique ids and references", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(new Set(rows.map((r) => r.reference)).size).toBe(rows.length);
  });
  it("shows up on the dashboard even when the API has nothing, and never duplicates API rows", () => {
    expect(mergeContributionsForUser(id, undefined)).toHaveLength(months.length);
    expect(mergeContributionsForUser(id, [])).toHaveLength(months.length);
    expect(mergeContributionsForUser(id, rows)).toHaveLength(months.length);
  });
});

describe("other accounts", () => {
  it("are untouched", () => {
    expect(getSeededContributions("someone-else")).toEqual([]);
    expect(getSeededTotalGhs("someone-else")).toBeNull();
    expect(mergeContributionsForUser("someone-else", undefined)).toEqual([]);
  });
  it("the two new users are distinct from the existing seeded accounts", () => {
    expect(getSeededTotalGhs("c373f7f1-ae4a-4032-bcbb-66561e81f295")).toBe(220);
    expect(getSeededTotalGhs("f4c7d09e-35b8-4dad-81d9-7ce873576ee8")).toBe(120);
  });
});
