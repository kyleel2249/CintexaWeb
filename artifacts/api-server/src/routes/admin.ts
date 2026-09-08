import { Router } from "express";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdminKey } from "../middleware/adminAuth.js";
import { parsePageParams, buildPaginationMeta } from "../lib/pagination.js";
import {
  db,
  customerProfilesTable,
  subscriptionsTable,
  loyaltyLedgerTable,
  activityEventsTable,
} from "@cintexa/db";

export const adminRouter = Router();
adminRouter.use(requireAdminKey);

/** List customers with their subscription plan and loyalty balance, most recently updated first. */
adminRouter.get("/customers", async (req, res) => {
  const page = parsePageParams(req);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        userId: customerProfilesTable.userId,
        displayName: customerProfilesTable.displayName,
        businessName: customerProfilesTable.businessName,
        plan: subscriptionsTable.plan,
        status: subscriptionsTable.status,
        balance: sql<number>`coalesce(sum(${loyaltyLedgerTable.delta}), 0)::int`,
        updatedAt: customerProfilesTable.updatedAt,
      })
      .from(customerProfilesTable)
      .leftJoin(subscriptionsTable, eq(subscriptionsTable.userId, customerProfilesTable.userId))
      .leftJoin(loyaltyLedgerTable, eq(loyaltyLedgerTable.userId, customerProfilesTable.userId))
      .groupBy(
        customerProfilesTable.userId,
        customerProfilesTable.displayName,
        customerProfilesTable.businessName,
        subscriptionsTable.plan,
        subscriptionsTable.status,
        customerProfilesTable.updatedAt,
      )
      .orderBy(desc(customerProfilesTable.updatedAt))
      .limit(page.limit)
      .offset(page.offset),
    // userId is customer_profiles' primary key, so a plain row count here
    // equals the group count of the joined query above.
    db.select({ count: sql<number>`count(*)::int` }).from(customerProfilesTable),
  ]);

  res.json({ customers: rows, pagination: buildPaginationMeta(page, rows.length, count) });
});

const adjustSchema = z.object({
  userId: z.string().min(1),
  delta: z.number().int().refine((n) => n !== 0, "delta must not be zero"),
  reason: z.string().min(1).max(200),
});

/** Appends a loyalty ledger entry for a customer — the only way points ever change. */
adminRouter.post("/loyalty/adjust", async (req, res) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { userId, delta, reason } = parsed.data;

  const [entry] = await db.insert(loyaltyLedgerTable).values({ userId, delta, reason }).returning();

  await db.insert(activityEventsTable).values({
    userId,
    eventType: "loyalty.adjusted",
    title: delta > 0 ? "Points awarded" : "Points deducted",
    description: reason,
  });

  res.json({ entry });
});
