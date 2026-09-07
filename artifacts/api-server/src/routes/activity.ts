import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { desc, eq } from "drizzle-orm";
import { db, activityEventsTable } from "@cintexa/db";

export const activityRouter = Router();

activityRouter.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const rows = await db
    .select()
    .from(activityEventsTable)
    .where(eq(activityEventsTable.userId, userId!))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(50);

  res.json({ activity: rows });
});
