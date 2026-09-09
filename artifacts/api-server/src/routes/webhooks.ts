import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireWebhookSignature } from "../middleware/webhookAuth.js";
import { db, contributionsTable, activityEventsTable } from "@cintexa/db";
import { calculatePlatformFee } from "../lib/fees.js";

export const webhooksRouter = Router();

/**
 * Receives contribution/payment events from an external provider. The signature
 * is verified by `requireWebhookSignature` before this handler runs.
 */
webhooksRouter.post("/contributions", requireWebhookSignature, async (req, res) => {
  const { userId, reference, amount, currency, description, promoCode } = req.body ?? {};

  if (!userId || !reference || !amount || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const grossAmount = Number(amount);
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }

  // Platform retains 7% of every sale/payment by default, 5% with the
  // FREE2026 promo code — computed once here, at the point the payment is
  // recorded, so it's never recalculated differently later even if rates
  // change going forward.
  const { platformFeeAmount, netAmount, rate, promoApplied } = calculatePlatformFee(grossAmount, promoCode);

  await db
    .insert(contributionsTable)
    .values({
      userId,
      reference,
      amount: String(grossAmount),
      platformFeeAmount: String(platformFeeAmount),
      netAmount: String(netAmount),
      currency: currency ?? "GHS",
      description,
      status: "paid",
    })
    .onConflictDoNothing({ target: contributionsTable.reference });

  await db.insert(activityEventsTable).values({
    id: randomUUID(),
    userId,
    eventType: "contribution.paid",
    title: "Contribution received",
    description,
  });

  res.json({ received: true, platformFeeAmount, netAmount, rate, promoApplied });
});
