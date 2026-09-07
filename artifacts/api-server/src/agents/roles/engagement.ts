import { z } from "zod";
import type { AgentHandler } from "../types.js";

export const engagementInputSchema = z.object({
  contentType: z.enum(["post", "comment", "article"]),
  topic: z.string().min(1).max(200),
  actions: z.array(z.enum(["like", "comment", "share", "follow"])).min(1),
});
export type EngagementInput = z.infer<typeof engagementInputSchema>;

export interface EngagementOutput {
  plannedActions: { action: string; suggestedDelaySeconds: number }[];
  note: string;
}

/**
 * Produces a *plan* for engagement actions — spacing and suggested order —
 * for a human or a downstream system to review and execute deliberately.
 * This agent does not call any social platform, click any button, or take
 * any real action on the person's or anyone else's behalf. Automating fake
 * likes/comments/follows against real platforms is out of scope by design.
 */
export const runEngagementAgent: AgentHandler<EngagementInput, EngagementOutput> = (input) => {
  const plannedActions = input.actions.map((action, i) => ({
    action,
    suggestedDelaySeconds: (i + 1) * 45,
  }));

  return {
    plannedActions,
    note: "This is a scheduling plan only — no action is executed automatically. Route to a human reviewer before publishing or reacting.",
  };
};
