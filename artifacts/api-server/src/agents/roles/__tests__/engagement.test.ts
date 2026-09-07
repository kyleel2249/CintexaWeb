import { describe, expect, it } from "vitest";
import { runEngagementAgent } from "../engagement.js";

describe("runEngagementAgent", () => {
  it("plans actions with increasing delays and never executes anything", () => {
    const result = runEngagementAgent({ contentType: "post", topic: "launch", actions: ["like", "comment", "share"] }, {});
    expect(result.plannedActions).toHaveLength(3);
    expect(result.plannedActions[0].suggestedDelaySeconds).toBeLessThan(result.plannedActions[1].suggestedDelaySeconds);
    expect(result.note).toMatch(/no action is executed automatically/i);
  });
});
