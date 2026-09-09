import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, paymentMethodsTable, paymentMethodTypeEnum } from "@cintexa/db";

export const paymentMethodsRouter = Router();

const createSchema = z.object({
  type: z.enum(paymentMethodTypeEnum.enumValues),
  label: z.string().min(1).max(120),
  provider: z.string().max(80).optional(),
  // Deliberately last4 only — see the schema comment in lib/db for why full
  // card/account numbers are never accepted here.
  last4: z
    .string()
    .regex(/^\d{4}$/, "last4 must be exactly 4 digits")
    .optional(),
  isDefault: z.boolean().optional(),
});

paymentMethodsRouter.get("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const rows = await db.select().from(paymentMethodsTable).where(eq(paymentMethodsTable.userId, userId!));
  res.json({ paymentMethods: rows });
});

paymentMethodsRouter.post("/", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (parsed.data.isDefault) {
    await db
      .update(paymentMethodsTable)
      .set({ isDefault: false })
      .where(eq(paymentMethodsTable.userId, userId!));
  }

  const [method] = await db
    .insert(paymentMethodsTable)
    .values({ userId: userId!, ...parsed.data })
    .returning();

  res.json({ paymentMethod: method });
});

paymentMethodsRouter.delete("/:id", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const id = String(req.params.id);
  await db.delete(paymentMethodsTable).where(and(eq(paymentMethodsTable.id, id), eq(paymentMethodsTable.userId, userId!)));
  res.json({ deleted: true });
});
