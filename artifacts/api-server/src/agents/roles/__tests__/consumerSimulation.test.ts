import { describe, expect, it } from "vitest";
import { runConsumerSimulationAgent } from "../consumerSimulation.js";

describe("runConsumerSimulationAgent", () => {
  it("predicts a quick purchase for impulse personas", () => {
    const result = runConsumerSimulationAgent({ productId: "p1", persona: "impulse", touchpointCount: 1 }, {});
    expect(result.likelyAction).toBe("purchase");
  });

  it("predicts browsing for budget personas with few touchpoints", () => {
    const result = runConsumerSimulationAgent({ productId: "p1", persona: "budget", touchpointCount: 1 }, {});
    expect(result.likelyAction).toBe("browse_more");
  });

  it("predicts abandon for low engagement", () => {
    const result = runConsumerSimulationAgent({ productId: "p1", persona: "premium", touchpointCount: 0 }, {});
    expect(result.likelyAction).toBe("abandon");
  });

  it("always returns a confidence between 0 and 1", () => {
    const result = runConsumerSimulationAgent({ productId: "p1", persona: "budget", touchpointCount: 5 }, {});
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
