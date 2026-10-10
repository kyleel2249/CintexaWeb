import { describe, expect, it } from "vitest";
import { easterSunday, hijriMonthDay, holidaysOn, lastWeekday, nthWeekday } from "../holidays";

const on = (country: string | null, year: number, month: number, day: number) =>
  holidaysOn(country, { year, month, day }).map((h) => h.id);

describe("date helpers", () => {
  it("computes Western Easter", () => {
    expect(easterSunday(2025)).toEqual([4, 20]);
    expect(easterSunday(2026)).toEqual([4, 5]);
    expect(easterSunday(2027)).toEqual([3, 28]);
  });
  it("finds nth / last weekdays", () => {
    expect(nthWeekday(2026, 11, 4, 4)).toBe(26); // 4th Thursday of Nov 2026
    expect(nthWeekday(2026, 5, 0, 2)).toBe(10); // 2nd Sunday of May 2026
    expect(lastWeekday(2026, 5, 1)).toBe(25); // last Monday of May 2026
  });
  it("reads the Islamic calendar", () => {
    expect(hijriMonthDay(2026, 3, 20)).toEqual({ month: 10, day: 1 });
  });
});

describe("holidays by country", () => {
  it("Ghana: national days with anniversary note", () => {
    expect(on("GH", 2026, 3, 6)).toContain("gh-independence");
    const h = holidaysOn("GH", { year: 2026, month: 3, day: 6 }).find((x) => x.id === "gh-independence");
    expect(h?.note).toBe("Ghana turns 69 today.");
    expect(on("GH", 2026, 7, 1)).toContain("gh-republic");
    expect(on("GH", 2026, 8, 4)).toContain("gh-founders");
    expect(on("GH", 2026, 9, 21)).toContain("gh-nkrumah");
  });
  it("Ghana: Farmers' Day is the first Friday of December", () => {
    expect(on("GH", 2026, 12, 4)).toContain("gh-farmers");
    expect(on("GH", 2026, 12, 11)).not.toContain("gh-farmers");
  });
  it("Easter weekend follows the computed date", () => {
    expect(on("GH", 2026, 4, 3)).toContain("good-friday");
    expect(on("GH", 2026, 4, 5)).toContain("easter-sunday");
    expect(on("GH", 2026, 4, 6)).toContain("easter-monday");
    expect(on("SA", 2026, 4, 5)).not.toContain("easter-sunday");
  });
  it("Eid and Ramadan come from the Umm al-Qura calendar, only where they are public holidays", () => {
    expect(on("GH", 2026, 3, 20)).toContain("eid-al-fitr");
    expect(on("GH", 2026, 3, 21)).toContain("eid-al-fitr"); // second day covers moon-sighting differences
    expect(on("NG", 2026, 5, 27)).toContain("eid-al-adha");
    expect(on("GH", 2026, 2, 18)).toContain("ramadan");
    expect(on("US", 2026, 3, 20)).not.toContain("eid-al-fitr");
  });
  it("US rules", () => {
    expect(on("US", 2026, 11, 26)).toContain("us-thanksgiving");
    expect(on("US", 2026, 1, 19)).toContain("us-mlk");
    expect(on("US", 2026, 5, 25)).toContain("us-memorial");
    expect(on("US", 2026, 9, 7)).toContain("us-labor");
    expect(on("US", 2026, 5, 10)).toContain("mothers-day");
    expect(on("US", 2026, 6, 21)).toContain("fathers-day");
    expect(holidaysOn("US", { year: 2026, month: 7, day: 4 })[0]?.note).toContain("250th");
    expect(on("GH", 2026, 11, 26)).not.toContain("us-thanksgiving");
  });
  it("Canada Thanksgiving is the 2nd Monday of October", () => {
    expect(on("CA", 2026, 10, 12)).toContain("ca-thanksgiving");
  });
  it("other national days", () => {
    expect(on("NG", 2026, 10, 1)).toContain("ng-independence");
    expect(on("KE", 2026, 12, 12)).toContain("ke-jamhuri");
    expect(on("ZA", 2026, 4, 27)).toContain("za-freedom");
    expect(on("IN", 2026, 8, 15)).toContain("in-independence");
  });
  it("only greets Christmas where it is widely celebrated", () => {
    expect(on("GH", 2026, 12, 25)).toContain("christmas");
    expect(on("SA", 2026, 12, 25)).not.toContain("christmas");
    expect(on(null, 2026, 12, 25)).not.toContain("christmas");
  });
  it("unknown country still gets universal days", () => {
    expect(on(null, 2026, 1, 1)).toContain("new-year");
    expect(on(null, 2026, 3, 8)).toContain("womens-day");
    expect(on(null, 2026, 6, 10)).toEqual([]);
  });
  it("orders by priority", () => {
    const list = holidaysOn("GH", { year: 2026, month: 5, day: 1 });
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.priority).toBeGreaterThanOrEqual(list[i]!.priority);
  });
});
