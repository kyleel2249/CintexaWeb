import { describe, expect, it } from "vitest";
import { runSalesAgent } from "../sales.js";

describe("runSalesAgent", () => {
  it("gives a low score to a cold visitor", () => {
    const result = runSalesAgent({ leadStage: "visitor", pageViews: 0, emailOpens: 0, pricingPageVisited: false }, {});
    expect(result.priority).toBe("low");
    expect(result.score).toBeLessThan(35);
  });

  it("gives a high score to an engaged opportunity", () => {
    const result = runSalesAgent(
      { leadStage: "opportunity", pageViews: 20, emailOpens: 10, pricingPageVisited: true },
      {},
    );
    expect(result.priority).toBe("high");
    expect(result.score).toBe(100);
  });

  it("caps the score at 100", () => {
    const result = runSalesAgent(
      { leadStage: "customer", pageViews: 999, emailOpens: 999, pricingPageVisited: true },
      {},
    );
    expect(result.score).toBe(100);
  });
});
