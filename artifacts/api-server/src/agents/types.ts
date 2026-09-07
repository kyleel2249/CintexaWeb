import type { AgentTask } from "@cintexa/db";

export type AgentRole = AgentTask["role"];

export interface AgentContext {
  requestedByUserId?: string;
}

/**
 * Every agent role is a pure, deterministic function: same input always
 * produces the same output, no network calls, no side effects. This is a
 * foundation for wiring a real LLM provider in later (see MarketingAgentInput
 * etc.) — swap the function body for a provider call without touching the
 * orchestrator or the API surface around it.
 */
export type AgentHandler<Input, Output> = (input: Input, ctx: AgentContext) => Output;
