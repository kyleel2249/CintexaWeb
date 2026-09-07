import { z } from "zod";
import type { AgentHandler } from "../types.js";

export const consumerSimulationInputSchema = z.object({
  productId: z.string().min(1),
  persona: z.enum(["budget", "premium", "impulse"]),
  touchpointCount: z.number().int().nonnegative(),
});
export type ConsumerSimulationInput = z.infer<typeof consumerSimulationInputSchema>;

export interface ConsumerSimulationOutput {
  likelyAction: "purchase" | "abandon" | "browse_more";
  confidence: number;
  reasoning: string;
}

/**
 * A simple rule-based model of how a persona archetype tends to respond to
 * repeated touchpoints. This estimates a *likely* outcome for planning
 * purposes only — it never acts on a real account or real users.
 */
export const runConsumerSimulationAgent: AgentHandler<ConsumerSimulationInput, ConsumerSimulationOutput> = (input) => {
  const { persona, touchpointCount } = input;

  if (persona === "impulse" && touchpointCount >= 1) {
    return { likelyAction: "purchase", confidence: 0.7, reasoning: "Impulse personas convert quickly, often on first meaningful touchpoint." };
  }
  if (persona === "budget" && touchpointCount < 3) {
    return { likelyAction: "browse_more", confidence: 0.6, reasoning: "Budget personas typically compare options before committing." };
  }
  if (persona === "budget" && touchpointCount >= 3) {
    return { likelyAction: "purchase", confidence: 0.55, reasoning: "Repeated touchpoints suggest price comparison is complete." };
  }
  if (persona === "premium" && touchpointCount >= 2) {
    return { likelyAction: "purchase", confidence: 0.65, reasoning: "Premium personas convert after a couple of trust-building touchpoints." };
  }
  return { likelyAction: "abandon", confidence: 0.5, reasoning: "Not enough engagement signal to predict a purchase." };
};
