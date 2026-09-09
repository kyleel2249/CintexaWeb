import { describe, expect, it } from "vitest";
import { getSortedFaq } from "../faq";

describe("getSortedFaq", () => {
  it("puts role+interest matches first", () => {
    const sorted = getSortedFaq("affiliate", ["Commission tracking"]);
    expect(sorted[0].question).toMatch(/commission/i);
  });

  it("still returns every entry regardless of role", () => {
    const sorted = getSortedFaq("creator", []);
    const withoutFilter = getSortedFaq(null, []);
    expect(sorted.length).toBe(withoutFilter.length);
  });

  it("handles no role/interests without throwing", () => {
    expect(() => getSortedFaq(null, [])).not.toThrow();
  });
});
