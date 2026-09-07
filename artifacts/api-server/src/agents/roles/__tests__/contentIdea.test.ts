import { describe, expect, it } from "vitest";
import { runContentIdeaAgent } from "../contentIdea.js";

describe("runContentIdeaAgent", () => {
  it("returns the requested number of ideas", () => {
    const result = runContentIdeaAgent({ topic: "onboarding", format: "blog", count: 3 }, {});
    expect(result.ideas).toHaveLength(3);
  });

  it("substitutes the topic into every idea", () => {
    const result = runContentIdeaAgent({ topic: "loyalty programs", format: "social", count: 5 }, {});
    for (const idea of result.ideas) {
      expect(idea).toContain("loyalty programs");
    }
  });

  it("defaults to 5 ideas when count is omitted", () => {
    const result = runContentIdeaAgent({ topic: "x", format: "email", count: 5 }, {});
    expect(result.ideas).toHaveLength(5);
  });
});
