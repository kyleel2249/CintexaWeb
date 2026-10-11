import { describe, expect, it } from "vitest";
import { effectiveMonthDay, formatBirthdayLabel, isBirthdayToday, maxDob, validateDob } from "../birthday";
import { markBirthdaySplashSeen, shouldShowBirthdaySplash } from "../birthday-splash";

const TODAY = new Date("2026-10-10T12:00:00Z");

describe("validateDob", () => {
  it("accepts real dates of people 13 or older", () => {
    expect(validateDob("1990-10-10", TODAY)).toEqual({ ok: true, value: "1990-10-10" });
    expect(validateDob("2000-02-29", TODAY).ok).toBe(true);
    expect(validateDob("2013-10-10", TODAY).ok).toBe(true);
  });
  it("rejects impossible, future, ancient, under-age and malformed values with a clear message", () => {
    const bad = (v: string) => {
      const r = validateDob(v, TODAY);
      return r.ok ? null : r.error;
    };
    expect(bad("2001-02-29")).toMatch(/doesn’t exist/);
    expect(bad("1990-13-01")).toBeTruthy();
    expect(bad("2026-10-11")).toMatch(/future/);
    expect(bad("1899-12-31")).toMatch(/valid year/);
    expect(bad("2013-10-11")).toMatch(/at least 13/);
    expect(bad("")).toBeTruthy();
    expect(bad("10/10/1990")).toBeTruthy();
  });
  it("maxDob is exactly 13 years before today", () => {
    expect(maxDob(new Date(2026, 9, 10))).toBe("2013-10-10");
  });
});

describe("isBirthdayToday", () => {
  it("uses the user's own time zone", () => {
    const now = new Date("2026-10-10T23:30:00Z"); // 11 Oct 00:30 in Lagos (UTC+1), still 10 Oct in Accra
    expect(isBirthdayToday("1990-10-10", now, "Africa/Accra")).toBe(true);
    expect(isBirthdayToday("1990-10-10", now, "Africa/Lagos")).toBe(false);
    expect(isBirthdayToday("1990-10-11", now, "Africa/Lagos")).toBe(true);
  });
  it("ignores the birth year, and bad input", () => {
    expect(isBirthdayToday("1955-10-10", TODAY, "UTC")).toBe(true);
    expect(isBirthdayToday(null, TODAY, "UTC")).toBe(false);
    expect(isBirthdayToday("not-a-date", TODAY, "UTC")).toBe(false);
  });
  it("celebrates 29 Feb on 28 Feb in non-leap years", () => {
    expect(effectiveMonthDay("1992-02-29", 2027)).toBe("02-28");
    expect(isBirthdayToday("1992-02-29", new Date("2027-02-28T10:00:00Z"), "UTC")).toBe(true);
    expect(isBirthdayToday("1992-02-29", new Date("2028-02-28T10:00:00Z"), "UTC")).toBe(false);
    expect(isBirthdayToday("1992-02-29", new Date("2028-02-29T10:00:00Z"), "UTC")).toBe(true);
  });
  it("formats a friendly label without the year", () => {
    expect(formatBirthdayLabel("1990-03-05", "en-GB")).toBe("5 March");
    expect(formatBirthdayLabel("garbage")).toBe("");
  });
});

describe("show-once memory", () => {
  it("shows once per birthday per year, per user", () => {
    localStorage.clear();
    sessionStorage.clear();
    const now = new Date("2026-10-10T09:00:00Z");
    expect(shouldShowBirthdaySplash("u1", "1990-10-10", now, "UTC")).toBe(true);
    markBirthdaySplashSeen("u1", now, "UTC");
    expect(shouldShowBirthdaySplash("u1", "1990-10-10", now, "UTC")).toBe(false);
    expect(shouldShowBirthdaySplash("u2", "1990-10-10", now, "UTC")).toBe(true); // other user
    expect(shouldShowBirthdaySplash("u1", "1990-10-10", new Date("2027-10-10T09:00:00Z"), "UTC")).toBe(true); // next year
    expect(shouldShowBirthdaySplash("u1", "1990-10-11", now, "UTC")).toBe(false); // not their birthday
    expect(shouldShowBirthdaySplash(null, "1990-10-10", now, "UTC")).toBe(false);
  });
});
