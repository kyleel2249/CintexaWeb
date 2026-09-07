import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { requireAdminKey } from "../middleware/adminAuth.js";
import { db, agentTasksTable, agentRoleEnum } from "@cintexa/db";
import { AGENT_ROLES, AgentValidationError, runAgentTask } from "../agents/orchestrator.js";

export const agentsRouter = Router();
agentsRouter.use(requireAdminKey);

const runSchema = z.object({
  role: z.enum(agentRoleEnum.enumValues),
  input: z.unknown(),
  requestedByUserId: z.string().optional(),
});

/** Runs one agent task synchronously and returns the persisted result. See lib/db AgentTask. */
agentsRouter.post("/run", async (req, res) => {
  const parsed = runSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const task = await runAgentTask(parsed.data.role, parsed.data.input, {
      requestedByUserId: parsed.data.requestedByUserId,
    });
    res.json({ task });
  } catch (err) {
    if (err instanceof AgentValidationError) {
      res.status(400).json({ error: "Invalid input for this agent role", issues: err.issues });
      return;
    }
    throw err;
  }
});

agentsRouter.get("/roles", (_req, res) => {
  res.json({ roles: AGENT_ROLES });
});

agentsRouter.get("/tasks", async (req, res) => {
  const roleFilter = agentRoleEnum.enumValues.includes(req.query.role as never)
    ? (req.query.role as (typeof agentRoleEnum.enumValues)[number])
    : undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const rows = await db
    .select()
    .from(agentTasksTable)
    .where(roleFilter ? eq(agentTasksTable.role, roleFilter) : undefined)
    .orderBy(desc(agentTasksTable.createdAt))
    .limit(limit);

  res.json({ tasks: rows });
});
