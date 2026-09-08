import { index, uniqueIndex, numeric, pgTable, text, timestamp, uuid, boolean, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const customerRoleEnum = pgEnum("customer_role", ["creator", "seller", "buyer", "affiliate"]);

export const customerProfilesTable = pgTable(
  "customer_profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    businessName: text("business_name"),
    country: text("country"),
    leaderboardVisible: boolean("leaderboard_visible").notNull().default(false),
    // Onboarding — captured once at signup/first sign-in to tailor the dashboard.
    role: customerRoleEnum("role"),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    usageFrequency: text("usage_frequency"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_profiles_updated_at_idx").on(table.updatedAt)],
);

export const contributionsTable = pgTable(
  "contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    reference: text("reference").notNull(),
    type: text("type").notNull().default("contribution"),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("GHS"),
    status: text("status").notNull().default("pending"),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("contributions_user_id_idx").on(table.userId),
    index("contributions_created_at_idx").on(table.createdAt),
    uniqueIndex("contributions_reference_uidx").on(table.reference),
  ],
);

export const activityEventsTable = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    eventType: text("event_type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_events_user_id_idx").on(table.userId),
    index("activity_events_created_at_idx").on(table.createdAt),
  ],
);

export type CustomerProfile = typeof customerProfilesTable.$inferSelect;
export type CustomerRole = (typeof customerRoleEnum.enumValues)[number];

/** Interest options offered during onboarding, per role — shared by the API's
 * validation schema and the frontend's question UI, so they can never drift. */
export const ROLE_INTEREST_OPTIONS: Record<CustomerRole, string[]> = {
  creator: ["Content & media", "Software & tools", "Courses & education", "Art & design", "Music & audio"],
  seller: ["Physical products", "Digital products", "Services", "Subscriptions"],
  buyer: ["Marketing tools", "E-commerce tools", "Ad campaigns", "Analytics & BI"],
  affiliate: ["Product promotion", "Affiliate links & referrals", "Commission tracking", "Partner programs"],
};

export const USAGE_FREQUENCY_OPTIONS = ["Daily", "A few times a week", "Occasionally"] as const;
export type UsageFrequency = (typeof USAGE_FREQUENCY_OPTIONS)[number];

export type Contribution = typeof contributionsTable.$inferSelect;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;

/* ============ Subscriptions & entitlements ============ */

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["starter", "growth", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled"]);

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    plan: subscriptionPlanEnum("plan").notNull().default("starter"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("subscriptions_user_id_uidx").on(table.userId),
    index("subscriptions_status_idx").on(table.status),
  ],
);

/** Plan entitlements — which modules/limits a plan unlocks. Read-only reference data. */
export const PLAN_ENTITLEMENTS = {
  starter: { adsBoost: false, ecommerce: false, loyaltyLedger: true, maxWorkspaces: 1 },
  growth: { adsBoost: true, ecommerce: true, loyaltyLedger: true, maxWorkspaces: 10 },
  enterprise: { adsBoost: true, ecommerce: true, loyaltyLedger: true, maxWorkspaces: null },
} as const;

export type SubscriptionPlan = keyof typeof PLAN_ENTITLEMENTS;

/* ============ Loyalty ledger ============ */

/**
 * Event-sourced points ledger — never update a row, only append. Balance is
 * derived by summing `delta`, so history and audit trail are never lost.
 */
export const loyaltyLedgerTable = pgTable(
  "loyalty_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("loyalty_ledger_user_id_idx").on(table.userId),
    index("loyalty_ledger_created_at_idx").on(table.createdAt),
  ],
);

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type LoyaltyLedgerEntry = typeof loyaltyLedgerTable.$inferSelect;

/* ============ AI agent orchestration ============ */

export const agentRoleEnum = pgEnum("agent_role", [
  "marketing",
  "sales",
  "consumer_simulation",
  "engagement",
  "content_idea",
]);
export const agentTaskStatusEnum = pgEnum("agent_task_status", ["queued", "completed", "failed"]);

/**
 * A single unit of work handed to an AI agent. `input`/`output` are JSONB so
 * each agent role can define its own shape without a schema migration per role.
 */
export const agentTasksTable = pgTable(
  "agent_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    role: agentRoleEnum("role").notNull(),
    status: agentTaskStatusEnum("status").notNull().default("queued"),
    input: jsonb("input").notNull(),
    output: jsonb("output"),
    requestedByUserId: text("requested_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("agent_tasks_role_idx").on(table.role),
    index("agent_tasks_created_at_idx").on(table.createdAt),
  ],
);

export type AgentTask = typeof agentTasksTable.$inferSelect;
