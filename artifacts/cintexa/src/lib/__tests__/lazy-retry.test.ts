import { afterEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadOnce } from "../lazy-retry";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("stale-chunk recovery", () => {
  it("recognises the errors browsers throw for missing chunks", () => {
    for (const m of [
      "Failed to fetch dynamically imported module: https://cintexa.com/assets/CareersRoute-abc.js",
      "error loading dynamically imported module",
      "Importing a module script failed.",
      "Loading chunk 12 failed.",
      "Unexpected token '<'",
    ]) {
      expect(isChunkLoadError(new TypeError(m)), m).toBe(true);
    }
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("reloads at most once per minute (no reload loop)", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    expect(reloadOnce()).toBe(true);
    expect(reloadOnce()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
