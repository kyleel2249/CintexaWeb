import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, subscriptionsTable, activityEventsTable, subscriptionPlanEnum } from "@cintexa/db";

export const subscriptionsRouter = Router();

const planSchema = z.enum(subscriptionPlanEnum.enumValues);

subscriptionsRouter.get("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const [subscription] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId!));

  res.json({ subscription: subscription ?? null });
});

/**
 * Sets the signed-in customer's plan. This is a foundation endpoint: it
 * records the subscription directly rather than round-tripping a payment
 * provider, so a real checkout (Stripe, Paystack, etc.) can be dropped in
 * here later without changing the shape of this route's response.
 */
subscriptionsRouter.post("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const parsed = planSchema.safeParse(req.body?.plan);

  if (!parsed.success) {
    res.status(400).json({ error: "plan must be one of: " + subscriptionPlanEnum.enumValues.join(", ") });
    return;
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [subscription] = await db
    .insert(subscriptionsTable)
    .values({ userId: userId!, plan: parsed.data, status: "active", currentPeriodEnd: periodEnd })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: { plan: parsed.data, status: "active", currentPeriodEnd: periodEnd, updatedAt: new Date() },
    })
    .returning();

  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    userId: userId!,
    eventType: "subscription.updated",
    title: "Plan updated",
    description: `Switched to the ${parsed.data} plan`,
  });

  res.json({ subscription });
});
