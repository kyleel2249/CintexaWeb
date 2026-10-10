import { describe, expect, it } from "vitest";
import { buildGreeting, fill, localParts, periodForHour } from "../greeting";

const at = (iso: string) => new Date(iso);

describe("periods and time zones", () => {
  it("maps hours to periods", () => {
    expect(periodForHour(4)).toBe("night");
    expect(periodForHour(5)).toBe("morning");
    expect(periodForHour(11)).toBe("morning");
    expect(periodForHour(12)).toBe("afternoon");
    expect(periodForHour(16)).toBe("afternoon");
    expect(periodForHour(17)).toBe("evening");
    expect(periodForHour(21)).toBe("evening");
    expect(periodForHour(22)).toBe("night");
  });
  it("uses the user's own local time, not the server's", () => {
    const now = at("2026-10-10T09:00:00Z");
    expect(buildGreeting({ now, timeZone: "Africa/Accra" }).period).toBe("morning");
    expect(buildGreeting({ now, timeZone: "Asia/Tokyo" }).period).toBe("evening"); // 18:00
    expect(buildGreeting({ now, timeZone: "America/Los_Angeles" }).period).toBe("night"); // 02:00
    expect(localParts(now, "Asia/Tokyo")).toMatchObject({ day: 10, hour: 18 });
  });
  it("uses the local calendar date for holidays (Tokyo is already on the next day)", () => {
    const now = at("2026-03-05T20:00:00Z"); // 6 March 05:00 in Tokyo, 5 March in Accra
    expect(buildGreeting({ now, timeZone: "Asia/Tokyo", country: "GH" }).occasion).toBe("holiday");
    expect(buildGreeting({ now, timeZone: "Africa/Accra", country: "GH" }).occasion).not.toBe("holiday");
  });
});

describe("names", () => {
  it("greets by name", () => {
    for (const kind of ["visit", "signin", "signup"] as const) {
      expect(buildGreeting({ name: "Kyle", kind, now: at("2026-10-10T09:00:00Z"), timeZone: "UTC" }).headline).toContain("Kyle");
    }
  });
  it("drops the placeholder cleanly when there is no name", () => {
    expect(fill("Good morning, {name}", null)).toBe("Good morning");
    expect(fill("Working late, {name}?", "")).toBe("Working late?");
    expect(fill("Hello {name} — still up?", undefined)).toBe("Hello — still up?");
    expect(fill("Welcome back, {name}. Good morning!", null)).toBe("Welcome back. Good morning!");
  });
});

describe("occasions", () => {
  it("a national holiday beats everything and mentions the holiday", () => {
    const g = buildGreeting({ name: "Kyle", now: at("2026-03-06T12:00:00Z"), timeZone: "Africa/Accra", country: "GH", kind: "signin" });
    expect(g.occasion).toBe("holiday");
    expect(g.holidayId).toBe("gh-independence");
    expect(g.headline).toBe("Happy Independence Day, Kyle!");
    expect(g.message).toContain("Ghana turns 69 today");
    expect(g.emoji).toBe("🇬🇭");
  });
  it("a new sign-up on a holiday still gets welcomed", () => {
    const g = buildGreeting({ name: "Ama", now: at("2026-12-25T10:00:00Z"), timeZone: "UTC", country: "GH", kind: "signup" });
    expect(g.headline).toBe("Merry Christmas, Ama!");
    expect(g.message).toContain("Welcome to CINTEXA");
  });
  it("a normal-day sign-up is welcomed to CINTEXA", () => {
    const g = buildGreeting({ name: "Ama", now: at("2026-10-10T10:00:00Z"), timeZone: "UTC", country: "US", kind: "signup", seed: "x" });
    expect(g.occasion).toBe("signup");
    expect(g.headline).toMatch(/welcome to CINTEXA/i);
  });
  it("greets a new month", () => {
    const g = buildGreeting({ name: "Kyle", now: at("2026-09-01T10:00:00Z"), timeZone: "UTC", country: "GH" });
    expect(g.occasion).toBe("new-month");
    expect(g.headline).toBe("Happy New Month, Kyle!");
    expect(g.message).toContain("September");
  });
  it("festive season only where Christmas is celebrated; New Year week for everyone", () => {
    expect(buildGreeting({ now: at("2026-12-20T10:00:00Z"), timeZone: "UTC", country: "GH" }).occasion).toBe("festive");
    expect(buildGreeting({ now: at("2026-12-20T10:00:00Z"), timeZone: "UTC", country: "SA" }).occasion).toBe("time");
    expect(buildGreeting({ now: at("2027-01-03T10:00:00Z"), timeZone: "UTC", country: "SA" }).occasion).toBe("new-year");
  });
  it("Easter weekend (computed) and Eid are greeted in the right countries", () => {
    expect(buildGreeting({ name: "K", now: at("2026-04-05T10:00:00Z"), timeZone: "UTC", country: "GH" }).headline).toBe("Happy Easter, K!");
    expect(buildGreeting({ name: "K", now: at("2026-03-20T10:00:00Z"), timeZone: "UTC", country: "NG" }).headline).toBe("Eid Mubarak, K!");
    expect(buildGreeting({ name: "K", now: at("2026-03-20T10:00:00Z"), timeZone: "UTC", country: "US" }).occasion).not.toBe("holiday");
  });
  it("mentions a streak for some seeds, and only when there is one", () => {
    const base = { name: "K", now: at("2026-10-14T10:00:00Z"), timeZone: "UTC", country: "US", kind: "signin" as const };
    const withStreak = Array.from({ length: 40 }, (_, i) => buildGreeting({ ...base, seed: `s${i}`, streakDays: 5 }).message);
    expect(withStreak.some((m) => m.includes("5-day streak"))).toBe(true);
    const none = Array.from({ length: 40 }, (_, i) => buildGreeting({ ...base, seed: `s${i}`, streakDays: 0 }).message);
    expect(none.some((m) => m.includes("streak"))).toBe(false);
  });
  it("adds weekday flavour (Monday, Friday)", () => {
    const monday = Array.from({ length: 40 }, (_, i) =>
      buildGreeting({ now: at("2026-10-12T10:00:00Z"), timeZone: "UTC", country: "US", seed: `m${i}` }).message,
    );
    expect(monday.some((m) => /Monday|week/i.test(m))).toBe(true);
    const friday = Array.from({ length: 40 }, (_, i) =>
      buildGreeting({ now: at("2026-10-16T10:00:00Z"), timeZone: "UTC", country: "US", seed: `f${i}` }).message,
    );
    expect(friday.some((m) => /Friday/i.test(m))).toBe(true);
  });
});

describe("variation", () => {
  const base = { name: "Kyle", now: at("2026-10-14T09:00:00Z"), timeZone: "UTC", country: "US", kind: "signin" as const };
  it("same seed → same greeting (no flicker between renders)", () => {
    expect(buildGreeting({ ...base, seed: "abc" })).toEqual(buildGreeting({ ...base, seed: "abc" }));
  });
  it("different sign-ins get different wording", () => {
    const headlines = new Set(Array.from({ length: 30 }, (_, i) => buildGreeting({ ...base, seed: `n${i}` }).headline));
    expect(headlines.size).toBeGreaterThan(1);
  });
  it("Ghana users sometimes get Akan greetings, always alongside English", () => {
    const gh = Array.from({ length: 60 }, (_, i) =>
      buildGreeting({ ...base, country: "GH", seed: `g${i}` }).headline,
    );
    const akan = gh.filter((h) => /Maakye/.test(h));
    expect(akan.length).toBeGreaterThan(0);
    for (const h of akan) expect(h.toLowerCase()).toContain("welcome back");
  });
});

describe("robustness", () => {
  it("never leaks placeholders or 'undefined', whatever the date, country or seed", () => {
    const countries = [null, "GH", "NG", "KE", "ZA", "US", "GB", "CA", "IN", "SA", "JP"];
    for (let i = 0; i < 400; i++) {
      const now = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000 + (i % 24) * 3_600_000);
      for (const kind of ["visit", "signin", "signup"] as const) {
        const g = buildGreeting({
          name: i % 5 === 0 ? null : "Kyle",
          now,
          timeZone: "UTC",
          country: countries[i % countries.length],
          kind,
          seed: `r${i}`,
          streakDays: i % 9,
        });
        const text = `${g.headline} ${g.message}`;
        expect(text, `${now.toISOString()} ${kind}`).not.toMatch(/undefined|\{name\}|null|NaN/);
        expect(g.headline.length).toBeGreaterThan(3);
        expect(g.message.length).toBeGreaterThan(3);
      }
    }
  });
});
