import { z } from "zod";
import { db, agentTasksTable } from "@cintexa/db";
import type { AgentContext, AgentRole } from "./types.js";
import { runMarketingAgent, marketingInputSchema } from "./roles/marketing.js";
import { runSalesAgent, salesInputSchema } from "./roles/sales.js";
import { runConsumerSimulationAgent, consumerSimulationInputSchema } from "./roles/consumerSimulation.js";
import { runEngagementAgent, engagementInputSchema } from "./roles/engagement.js";
import { runContentIdeaAgent, contentIdeaInputSchema } from "./roles/contentIdea.js";

const REGISTRY: Record<AgentRole, { schema: z.ZodTypeAny; run: (input: unknown, ctx: AgentContext) => unknown }> = {
  marketing: { schema: marketingInputSchema, run: runMarketingAgent as (input: unknown, ctx: AgentContext) => unknown },
  sales: { schema: salesInputSchema, run: runSalesAgent as (input: unknown, ctx: AgentContext) => unknown },
  consumer_simulation: {
    schema: consumerSimulationInputSchema,
    run: runConsumerSimulationAgent as (input: unknown, ctx: AgentContext) => unknown,
  },
  engagement: { schema: engagementInputSchema, run: runEngagementAgent as (input: unknown, ctx: AgentContext) => unknown },
  content_idea: { schema: contentIdeaInputSchema, run: runContentIdeaAgent as (input: unknown, ctx: AgentContext) => unknown },
};

export const AGENT_ROLES = Object.keys(REGISTRY) as AgentRole[];

export class AgentValidationError extends Error {
  constructor(public issues: z.ZodIssue[]) {
    super("Invalid agent task input");
  }
}

/**
 * Validates input against the role's schema, runs the handler synchronously
 * (every role is a pure deterministic function — see agents/roles/*), and
 * persists the task + result to `agent_tasks` for later review.
 */
export async function runAgentTask(role: AgentRole, rawInput: unknown, ctx: AgentContext) {
  const entry = REGISTRY[role];
  const parsed = entry.schema.safeParse(rawInput);

  if (!parsed.success) {
    throw new AgentValidationError(parsed.error.issues);
  }

  try {
    const output = entry.run(parsed.data, ctx);
    const [task] = await db
      .insert(agentTasksTable)
      .values({
        role,
        status: "completed",
        input: parsed.data,
        output: output as Record<string, unknown>,
        requestedByUserId: ctx.requestedByUserId,
        completedAt: new Date(),
      })
      .returning();
    return task;
  } catch (err) {
    const [task] = await db
      .insert(agentTasksTable)
      .values({
        role,
        status: "failed",
        input: parsed.data,
        output: { error: err instanceof Error ? err.message : "Unknown error" },
        requestedByUserId: ctx.requestedByUserId,
        completedAt: new Date(),
      })
      .returning();
    return task;
  }
}
