import { index, pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

/** Specialist enable flags — admin controlled, server authoritative. */
export const insightSpecialistFlagsTable = pgTable(
  "insight_specialist_flags",
  {
    specialistId: text("specialist_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(true),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by"),
  },
);

/** Server-side insight runs — authoritative report store per account. */
export const insightRunsTable = pgTable(
  "insight_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    specialistId: text("specialist_id").notNull(),
    tab: text("tab").notNull(),
    status: text("status").notNull().default("ready"),
    confidence: text("confidence").notNull().default("not_assessed"),
    summary: text("summary").notNull(),
    report: jsonb("report").notNull(),
    dataAsOf: timestamp("data_as_of", { withTimezone: true }),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    version: text("version").notNull().default("1.0.0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("insight_runs_user_id_idx").on(table.userId),
    index("insight_runs_specialist_idx").on(table.specialistId),
    index("insight_runs_created_at_idx").on(table.createdAt),
  ],
);

/** Cross-tab signals — lightweight events other specialists may consume. */
export const insightSignalsTable = pgTable(
  "insight_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    sourceSpecialistId: text("source_specialist_id").notNull(),
    signalType: text("signal_type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    severity: text("severity").notNull().default("info"),
    consumed: boolean("consumed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("insight_signals_user_id_idx").on(table.userId),
    index("insight_signals_created_at_idx").on(table.createdAt),
  ],
);

/** In-app insight notifications. */
export const insightNotificationsTable = pgTable(
  "insight_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    specialistId: text("specialist_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    href: text("href"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("insight_notifications_user_id_idx").on(table.userId),
    index("insight_notifications_read_idx").on(table.read),
  ],
);

/** Customer feedback on insight quality. */
export const insightFeedbackTable = pgTable(
  "insight_feedback",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    runId: uuid("run_id"),
    specialistId: text("specialist_id").notNull(),
    useful: boolean("useful").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("insight_feedback_specialist_idx").on(table.specialistId)],
);

export type InsightRun = typeof insightRunsTable.$inferSelect;
export type InsightSignal = typeof insightSignalsTable.$inferSelect;
export type InsightNotification = typeof insightNotificationsTable.$inferSelect;
