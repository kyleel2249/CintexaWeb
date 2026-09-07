import { z } from "zod";
import type { AgentHandler } from "../types.js";

export const salesInputSchema = z.object({
  leadStage: z.enum(["visitor", "lead", "opportunity", "customer"]),
  pageViews: z.number().int().nonnegative().default(0),
  emailOpens: z.number().int().nonnegative().default(0),
  pricingPageVisited: z.boolean().default(false),
});
export type SalesInput = z.infer<typeof salesInputSchema>;

export interface SalesOutput {
  score: number;
  priority: "low" | "medium" | "high";
  nextBestAction: string;
}

const STAGE_BASE_SCORE: Record<SalesInput["leadStage"], number> = {
  visitor: 5,
  lead: 20,
  opportunity: 45,
  customer: 80,
};

const NEXT_ACTION: Record<SalesInput["leadStage"], string> = {
  visitor: "Serve a lead magnet or newsletter signup",
  lead: "Send an introductory email sequence",
  opportunity: "Book a discovery call",
  customer: "Check in for an upsell or referral opportunity",
};

/** Simple, explainable lead-scoring model — deterministic, no ML model or external calls. */
export const runSalesAgent: AgentHandler<SalesInput, SalesOutput> = (input) => {
  let score = STAGE_BASE_SCORE[input.leadStage];
  score += Math.min(input.pageViews, 20) * 1;
  score += Math.min(input.emailOpens, 10) * 2;
  score += input.pricingPageVisited ? 15 : 0;
  score = Math.min(score, 100);

  const priority: SalesOutput["priority"] = score >= 70 ? "high" : score >= 35 ? "medium" : "low";

  return { score, priority, nextBestAction: NEXT_ACTION[input.leadStage] };
};
