import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, customerProfilesTable } from "@cintexa/db";

export const customerRouter = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  businessName: z.string().min(1).max(160).optional(),
  country: z.string().min(2).max(80).optional(),
  leaderboardVisible: z.boolean().optional(),
});

customerRouter.get("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const [profile] = await db
    .select()
    .from(customerProfilesTable)
    .where(eq(customerProfilesTable.userId, userId!));

  res.json({ profile: profile ?? null });
});

customerRouter.patch("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const [profile] = await db
    .insert(customerProfilesTable)
    .values({ userId: userId!, ...parsed.data })
    .onConflictDoUpdate({
      target: customerProfilesTable.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    })
    .returning();

  res.json({ profile });
});
