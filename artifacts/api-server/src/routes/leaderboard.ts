import { Router } from "express";
import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db, loyaltyLedgerTable, customerProfilesTable, activityEventsTable, ADMIN_USERNAME } from "@cintexa/db";

export const leaderboardRouter = Router();

const displayName = (t: typeof customerProfilesTable) =>
  sql<string>`coalesce(${t.username}, ${t.displayName}, 'Anonymous')`;

/**
 * Public — three real, database-backed rankings. Only customers who opted in
 * via `leaderboardVisible` appear, only usernames/display names are exposed
 * (never userId, email, or other contact info), and the admin account
 * (ADMIN_USERNAME) is always excluded, never just filtered client-side.
 */
leaderboardRouter.get("/", async (_req, res) => {
  const referee = alias(customerProfilesTable, "referee");

  const [mostReferrerRows, mostCreatorRows, mostUserRows] = await Promise.all([
    // Most referrer: how many other accounts each visible, non-admin
    // customer has brought in (referred_by_user_id points at the referrer).
    db
      .select({
        name: displayName(customerProfilesTable),
        score: sql<number>`count(${referee.userId})::int`,
      })
      .from(customerProfilesTable)
      .innerJoin(referee, eq(referee.referredByUserId, customerProfilesTable.userId))
      .where(
        and(
          eq(customerProfilesTable.leaderboardVisible, true),
          ne(customerProfilesTable.username, ADMIN_USERNAME),
        ),
      )
      .groupBy(customerProfilesTable.userId, customerProfilesTable.username, customerProfilesTable.displayName)
      .orderBy(desc(sql`count(${referee.userId})`))
      .limit(10),

    // Most creator: creators ranked by their loyalty point balance.
    db
      .select({
        name: displayName(customerProfilesTable),
        score: sql<number>`coalesce(sum(${loyaltyLedgerTable.delta}), 0)::int`,
      })
      .from(customerProfilesTable)
      .leftJoin(loyaltyLedgerTable, eq(loyaltyLedgerTable.userId, customerProfilesTable.userId))
      .where(and(eq(customerProfilesTable.role, "creator"), eq(customerProfilesTable.leaderboardVisible, true)))
      .groupBy(customerProfilesTable.userId, customerProfilesTable.username, customerProfilesTable.displayName)
      .orderBy(desc(sql`coalesce(sum(${loyaltyLedgerTable.delta}), 0)`))
      .limit(10),

    // Most user of the platform: ranked by total activity events recorded.
    db
      .select({
        name: displayName(customerProfilesTable),
        score: sql<number>`count(${activityEventsTable.id})::int`,
      })
      .from(customerProfilesTable)
      .leftJoin(activityEventsTable, eq(activityEventsTable.userId, customerProfilesTable.userId))
      .where(eq(customerProfilesTable.leaderboardVisible, true))
      .groupBy(customerProfilesTable.userId, customerProfilesTable.username, customerProfilesTable.displayName)
      .orderBy(desc(sql`count(${activityEventsTable.id})`))
      .limit(10),
  ]);

  const rank = (rows: { name: string; score: number }[]) =>
    rows.map((r, i) => ({ rank: i + 1, name: r.name, score: r.score }));

  res.json({
    mostReferrer: rank(mostReferrerRows),
    mostCreator: rank(mostCreatorRows),
    mostUser: rank(mostUserRows),
  });
});
