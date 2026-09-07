import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, loyaltyLedgerTable, customerProfilesTable } from "@cintexa/db";

export const leaderboardRouter = Router();

/**
 * Public — only customers who opted in via `leaderboardVisible` appear, and
 * only their display name and score are exposed (never userId or contact info).
 */
leaderboardRouter.get("/", async (_req, res) => {
  const rows = await db
    .select({
      displayName: customerProfilesTable.displayName,
      score: sql<number>`coalesce(sum(${loyaltyLedgerTable.delta}), 0)::int`,
    })
    .from(customerProfilesTable)
    .innerJoin(loyaltyLedgerTable, eq(loyaltyLedgerTable.userId, customerProfilesTable.userId))
    .where(eq(customerProfilesTable.leaderboardVisible, true))
    .groupBy(customerProfilesTable.userId, customerProfilesTable.displayName)
    .orderBy(desc(sql`coalesce(sum(${loyaltyLedgerTable.delta}), 0)`))
    .limit(20);

  res.json({
    leaderboard: rows.map((r, i) => ({ rank: i + 1, name: r.displayName ?? "Anonymous", score: r.score })),
  });
});
