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
    // Onboarding fields — submitted together the first time to tailor the dashboard.
    role: z.enum(customerRoleEnum.enumValues).optional(),
    interests: z.array(z.enum(ALL_INTERESTS as [string, ...string[]])).max(10).optional(),
    usageFrequency: z.enum(USAGE_FREQUENCY_OPTIONS).optional(),
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

  // Submitting a role is what completes onboarding — the dashboard gates on
  // this flag, not on role being merely present, so it's set explicitly here.
  const patch = { ...parsed.data, ...(parsed.data.role ? { onboardingCompleted: true } : {}) };

  const [profile] = await db
    .insert(customerProfilesTable)
    .values({ userId: userId!, ...patch })
    .onConflictDoUpdate({
      target: customerProfilesTable.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();

  res.json({ profile });
});
