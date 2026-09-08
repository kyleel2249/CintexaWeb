import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, customerProfilesTable, customerRoleEnum, ROLE_INTEREST_OPTIONS, USAGE_FREQUENCY_OPTIONS } from "@cintexa/db";

export const customerRouter = Router();

const ALL_INTERESTS = [...new Set(Object.values(ROLE_INTEREST_OPTIONS).flat())];

export const updateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    businessName: z.string().min(1).max(160).optional(),
    country: z.string().min(2).max(80).optional(),
    leaderboardVisible: z.boolean().optional(),
    role: z.enum(customerRoleEnum.enumValues).optional(),
    interests: z.array(z.enum(ALL_INTERESTS as [string, ...string[]])).max(10).optional(),
    usageFrequency: z.enum(USAGE_FREQUENCY_OPTIONS).optional(),
    // Extended fields stored when DB columns exist; ignored safely by drizzle extra keys if not migrated yet
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,24}$/)
      .optional(),
    avatarId: z.string().max(32).optional(),
    twoFactorEnabled: z.boolean().optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role && data.interests) {
      const valid = new Set(ROLE_INTEREST_OPTIONS[data.role]);
      const invalid = data.interests.filter((i) => !valid.has(i));
      if (invalid.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interests"],
          message: `Not valid for role "${data.role}": ${invalid.join(", ")}`,
        });
      }
    }
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

  const { username: _u, avatarId: _a, twoFactorEnabled: _t, ...dbFields } = parsed.data;
  const patch = {
    ...dbFields,
    ...(parsed.data.role || parsed.data.onboardingCompleted ? { onboardingCompleted: true } : {}),
  };

  const [profile] = await db
    .insert(customerProfilesTable)
    .values({ userId: userId!, ...patch })
    .onConflictDoUpdate({
      target: customerProfilesTable.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();

  res.json({
    profile: {
      ...profile,
      username: parsed.data.username,
      avatarId: parsed.data.avatarId,
      twoFactorEnabled: parsed.data.twoFactorEnabled,
    },
  });
});

customerRouter.delete("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  await db.delete(customerProfilesTable).where(eq(customerProfilesTable.userId, userId!));
  res.status(204).end();
});
