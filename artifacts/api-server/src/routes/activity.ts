import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { desc, eq, sql } from "drizzle-orm";
import { db, activityEventsTable } from "@cintexa/db";
import { parsePageParams, buildPaginationMeta } from "../lib/pagination.js";

export const activityRouter = Router();

activityRouter.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const page = parsePageParams(req);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(activityEventsTable)
      .where(eq(activityEventsTable.userId, userId!))
      .orderBy(desc(activityEventsTable.createdAt))
      .limit(page.limit)
      .offset(page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(activityEventsTable)
      .where(eq(activityEventsTable.userId, userId!)),
  ]);

  res.json({ activity: rows, pagination: buildPaginationMeta(page, rows.length, count) });
});
