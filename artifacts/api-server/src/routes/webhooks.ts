import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireWebhookSignature } from "../middleware/webhookAuth.js";
import { db, contributionsTable, activityEventsTable } from "@cintexa/db";

export const webhooksRouter = Router();

/**
 * Receives contribution/payment events from an external provider. The signature
 * is verified by `requireWebhookSignature` before this handler runs.
 */
webhooksRouter.post("/contributions", requireWebhookSignature, async (req, res) => {
  const { userId, reference, amount, currency, description } = req.body ?? {};

  if (!userId || !reference || !amount || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  await db
    .insert(contributionsTable)
    .values({ userId, reference, amount: String(amount), currency: currency ?? "GHS", description, status: "paid" })
    .onConflictDoNothing({ target: contributionsTable.reference });

  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    userId,
    eventType: "contribution.paid",
    title: "Contribution received",
    description,
  });

  res.json({ received: true });
});
