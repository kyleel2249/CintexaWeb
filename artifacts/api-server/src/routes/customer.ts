import { Router } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { z } from "zod";
import { eq, ne, and } from "drizzle-orm";
import {
  db,
  customerProfilesTable,
  customerRoleEnum,
  ROLE_INTEREST_OPTIONS,
  USAGE_FREQUENCY_OPTIONS,
} from "@cintexa/db";
import { resolveReferrer } from "../lib/referrer.js";

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
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,24}$/, "3–24 characters: letters, numbers, underscore")
      .optional(),
    avatarId: z.string().max(32).optional(),
    twoFactorEnabled: z.boolean().optional(),
    onboardingCompleted: z.boolean().optional(),
    // A referral link (?ref=<username>) can set this explicitly; otherwise
    // every new account defaults to the admin (see below).
    referredByUserId: z.string().max(64).optional(),
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

  if (parsed.data.username) {
    const [taken] = await db
      .select({ userId: customerProfilesTable.userId })
      .from(customerProfilesTable)
      .where(and(eq(customerProfilesTable.username, parsed.data.username), ne(customerProfilesTable.userId, userId!)));
    if (taken) {
      res.status(400).json({ error: { fieldErrors: { username: ["That username is already taken"] } } });
      return;
    }
  }

  const [existing] = await db
    .select({ referredByUserId: customerProfilesTable.referredByUserId })
    .from(customerProfilesTable)
    .where(eq(customerProfilesTable.userId, userId!));

  const referredByUserId = resolveReferrer(Boolean(existing), parsed.data.referredByUserId);

  const patch = {
    ...parsed.data,
    ...(referredByUserId ? { referredByUserId } : {}),
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

  res.json({ profile });
});

customerRouter.delete("/me", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  await db.delete(customerProfilesTable).where(eq(customerProfilesTable.userId, userId!));
  res.status(204).end();
});
