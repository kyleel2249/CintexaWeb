import { index, uniqueIndex, numeric, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const customerProfilesTable = pgTable(
  "customer_profiles",
  {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    businessName: text("business_name"),
    country: text("country"),
    leaderboardVisible: boolean("leaderboard_visible").notNull().default(false),
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
export type Contribution = typeof contributionsTable.$inferSelect;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;
