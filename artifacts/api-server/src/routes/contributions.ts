import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { db, contributionsTable } from "@cintexa/db";

export const contributionsRouter = Router();

contributionsRouter.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const rows = await db
    .select()
    .from(contributionsTable)
    .where(eq(contributionsTable.userId, userId!))
    .orderBy(desc(contributionsTable.createdAt))
    .limit(50);

  res.json({ contributions: rows });
});
