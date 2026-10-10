import { beforeEach, describe, expect, it } from "vitest";
import { dismissWelcome, markWelcome, resetWelcomeForTests, sessionNonce, takeWelcome } from "../welcome";

beforeEach(() => {
  sessionStorage.clear();
  resetWelcomeForTests();
});

describe("welcome hand-off", () => {
  it("is empty unless a sign-in just happened", () => {
    expect(takeWelcome()).toBeNull();
  });
  it("passes sign-in / sign-up through once per page load", () => {
    markWelcome("signin");
    const w = takeWelcome();
    expect(w?.kind).toBe("signin");
    expect(sessionStorage.getItem("cintexa_welcome")).toBeNull(); // consumed: a reload won't repeat it
    expect(takeWelcome()?.nonce).toBe(w?.nonce); // still there for tab-to-tab navigation
  });
  it("can be dismissed", () => {
    markWelcome("signup");
    expect(takeWelcome()?.kind).toBe("signup");
    dismissWelcome();
    expect(takeWelcome()).toBeNull();
  });
  it("expires after a short time", () => {
    markWelcome("signin");
    const now = Date.now();
    expect(takeWelcome(now)).not.toBeNull();
    expect(takeWelcome(now + 16_000)).toBeNull();
  });
  it("ignores a stale or corrupt flag", () => {
    sessionStorage.setItem("cintexa_welcome", JSON.stringify({ kind: "signin", nonce: "x", at: Date.now() - 3_600_000 }));
    expect(takeWelcome()).toBeNull();
    resetWelcomeForTests();
    sessionStorage.setItem("cintexa_welcome", "{not json");
    expect(takeWelcome()).toBeNull();
  });
  it("each sign-in gets a new nonce (so the wording changes) and the session nonce is stable", () => {
    markWelcome("signin");
    const first = sessionNonce();
    expect(sessionNonce()).toBe(first);
    markWelcome("signin");
    expect(sessionNonce()).not.toBe(first);
  });
});
