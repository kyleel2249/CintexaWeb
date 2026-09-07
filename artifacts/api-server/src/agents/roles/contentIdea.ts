import { z } from "zod";
import type { AgentHandler } from "../types.js";

export const contentIdeaInputSchema = z.object({
  topic: z.string().min(1).max(200),
  format: z.enum(["blog", "social", "email", "video"]),
  count: z.number().int().min(1).max(10).default(5),
});
export type ContentIdeaInput = z.infer<typeof contentIdeaInputSchema>;

export interface ContentIdeaOutput {
  ideas: string[];
}

const ANGLE_TEMPLATES = [
  "5 things nobody tells you about {topic}",
  "How {topic} changed in the last year",
  "A beginner's guide to {topic}",
  "The biggest mistakes teams make with {topic}",
  "{topic}: a before-and-after case study",
  "What we learned after a year of {topic}",
  "{topic} vs. the alternative — which wins?",
  "A checklist for getting {topic} right",
  "Behind the scenes: how we approach {topic}",
  "The future of {topic}, in three predictions",
];

/** Deterministic templated idea generation — swap for a real LLM call later without changing the interface. */
export const runContentIdeaAgent: AgentHandler<ContentIdeaInput, ContentIdeaOutput> = (input) => {
  const ideas = ANGLE_TEMPLATES.slice(0, input.count).map((t) => t.replace("{topic}", input.topic));
  return { ideas };
};
