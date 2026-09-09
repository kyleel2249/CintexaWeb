import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db, supportTicketsTable } from "@cintexa/db";
import { parsePageParams, buildPaginationMeta } from "../lib/pagination.js";

export const supportRouter = Router();

const createTicketSchema = z.object({
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(4000),
});

supportRouter.get("/tickets", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const page = parsePageParams(req);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.userId, userId!))
      .orderBy(desc(supportTicketsTable.createdAt))
      .limit(page.limit)
      .offset(page.offset),
    db.select({ count: sql<number>`count(*)::int` }).from(supportTicketsTable).where(eq(supportTicketsTable.userId, userId!)),
  ]);

  res.json({ tickets: rows, pagination: buildPaginationMeta(page, rows.length, count) });
});

supportRouter.post("/tickets", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const parsed = createTicketSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [ticket] = await db
    .insert(supportTicketsTable)
    .values({ userId: userId!, ...parsed.data })
    .returning();

  res.json({ ticket });
});
