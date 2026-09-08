import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { desc, eq, sql } from "drizzle-orm";
import { db, contributionsTable } from "@cintexa/db";
import { parsePageParams, buildPaginationMeta } from "../lib/pagination.js";

export const contributionsRouter = Router();

contributionsRouter.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const page = parsePageParams(req);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(contributionsTable)
      .where(eq(contributionsTable.userId, userId!))
      .orderBy(desc(contributionsTable.createdAt))
      .limit(page.limit)
      .offset(page.offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contributionsTable)
      .where(eq(contributionsTable.userId, userId!)),
  ]);

  res.json({ contributions: rows, pagination: buildPaginationMeta(page, rows.length, count) });
});
