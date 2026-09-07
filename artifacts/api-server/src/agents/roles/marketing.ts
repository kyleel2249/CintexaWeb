import { z } from "zod";
import type { AgentHandler } from "../types.js";

export const marketingInputSchema = z.object({
  channel: z.enum(["email", "social", "search", "content"]),
  goal: z.string().min(1).max(200),
  audienceSize: z.number().int().nonnegative().optional(),
});
export type MarketingInput = z.infer<typeof marketingInputSchema>;

export interface MarketingOutput {
  channel: MarketingInput["channel"];
  recommendedActions: string[];
  suggestedCadence: string;
  estimatedReachTier: "low" | "medium" | "high";
}

const CHANNEL_ACTIONS: Record<MarketingInput["channel"], string[]> = {
  email: ["Segment the list by engagement in the last 30 days", "A/B test the subject line", "Send a follow-up to opens without clicks"],
  social: ["Post at peak audience hours", "Repurpose top-performing content into a short video", "Reply to every comment within 2 hours"],
  search: ["Target long-tail keywords with low competition", "Refresh meta descriptions on top 10 landing pages", "Add FAQ schema to product pages"],
  content: ["Publish one cornerstone piece per month", "Interlink related articles", "Update the top 3 posts by traffic quarterly"],
};

const CADENCE_BY_CHANNEL: Record<MarketingInput["channel"], string> = {
  email: "2x per week",
  social: "1x per day",
  search: "Ongoing, reviewed monthly",
  content: "1x per week",
};

/** Deterministic marketing recommendations by channel — a foundation for a real LLM-backed agent later. */
export const runMarketingAgent: AgentHandler<MarketingInput, MarketingOutput> = (input) => {
  const reachTier: MarketingOutput["estimatedReachTier"] =
    (input.audienceSize ?? 0) > 10_000 ? "high" : (input.audienceSize ?? 0) > 1_000 ? "medium" : "low";

  return {
    channel: input.channel,
    recommendedActions: CHANNEL_ACTIONS[input.channel],
    suggestedCadence: CADENCE_BY_CHANNEL[input.channel],
    estimatedReachTier: reachTier,
  };
};
