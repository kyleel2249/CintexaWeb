import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { desc, eq, sql } from "drizzle-orm";
import { db, loyaltyLedgerTable } from "@cintexa/db";

export const loyaltyRouter = Router();

loyaltyRouter.get("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);

  const [{ balance }] = await db
    .select({ balance: sql<number>`coalesce(sum(${loyaltyLedgerTable.delta}), 0)::int` })
    .from(loyaltyLedgerTable)
    .where(eq(loyaltyLedgerTable.userId, userId!));

  const entries = await db
    .select()
    .from(loyaltyLedgerTable)
    .where(eq(loyaltyLedgerTable.userId, userId!))
    .orderBy(desc(loyaltyLedgerTable.createdAt))
    .limit(50);

  res.json({ balance, entries });
});
