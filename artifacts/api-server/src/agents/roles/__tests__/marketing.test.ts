import { describe, expect, it } from "vitest";
import { runMarketingAgent } from "../marketing.js";

describe("runMarketingAgent", () => {
  it("returns channel-specific actions and cadence", () => {
    const result = runMarketingAgent({ channel: "email", goal: "grow list" }, {});
    expect(result.channel).toBe("email");
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.suggestedCadence).toBe("2x per week");
  });

  it("classifies reach tier from audience size", () => {
    expect(runMarketingAgent({ channel: "social", goal: "x", audienceSize: 50 }, {}).estimatedReachTier).toBe("low");
    expect(runMarketingAgent({ channel: "social", goal: "x", audienceSize: 5000 }, {}).estimatedReachTier).toBe("medium");
    expect(runMarketingAgent({ channel: "social", goal: "x", audienceSize: 50000 }, {}).estimatedReachTier).toBe("high");
  });

  it("is deterministic — same input, same output", () => {
    const a = runMarketingAgent({ channel: "content", goal: "x" }, {});
    const b = runMarketingAgent({ channel: "content", goal: "x" }, {});
    expect(a).toEqual(b);
  });
});
