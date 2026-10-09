import { describe, expect, it } from "vitest";
import { initialAuthMode, isValidPhone, safeNextPath } from "../auth-flow";

describe("initialAuthMode", () => {
  it("honours the URL path", () => {
    expect(initialAuthMode("/sign-in", "", "")).toBe("login");
    expect(initialAuthMode("/sign-up", "", "a@b.co")).toBe("signup");
  });
  it("honours ?mode= over the path", () => {
    expect(initialAuthMode("/get-started", "?mode=login", "")).toBe("login");
    expect(initialAuthMode("/sign-in", "?mode=signup", "")).toBe("signup");
  });
  it("falls back to remembered email, else signup", () => {
    expect(initialAuthMode("/get-started", "", "a@b.co")).toBe("login");
    expect(initialAuthMode("/get-started", "", "")).toBe("signup");
  });
});

describe("safeNextPath", () => {
  it("defaults to the dashboard", () => {
    expect(safeNextPath("")).toBe("/dashboard");
  });
  it("accepts same-origin paths", () => {
    expect(safeNextPath("?next=/dashboard/settings")).toBe("/dashboard/settings");
    expect(safeNextPath("?next=/careers/cleaner%3Fx%3D1")).toBe("/careers/cleaner?x=1");
  });
  it("blocks open redirects and loops", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "/get-started", "/sign-in?x=1"]) {
      expect(safeNextPath(`?next=${encodeURIComponent(bad)}`)).toBe("/dashboard");
    }
  });
});

describe("isValidPhone", () => {
  it("accepts common formats", () => {
    expect(isValidPhone("+233 24 000 0000")).toBe(true);
    expect(isValidPhone("(555) 123-4567")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("+1234567890123456789")).toBe(false);
  });
});
