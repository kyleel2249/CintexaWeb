-- Insight Workforce tables
CREATE TABLE IF NOT EXISTS "insight_specialist_flags" (
  "specialist_id" text PRIMARY KEY NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_by" text
);

CREATE TABLE IF NOT EXISTS "insight_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "specialist_id" text NOT NULL,
  "tab" text NOT NULL,
  "status" text DEFAULT 'ready' NOT NULL,
  "confidence" text DEFAULT 'not_assessed' NOT NULL,
  "summary" text NOT NULL,
  "report" jsonb NOT NULL,
  "data_as_of" timestamp with time zone,
  "period_start" timestamp with time zone,
  "period_end" timestamp with time zone,
  "version" text DEFAULT '1.0.0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "insight_runs_user_id_idx" ON "insight_runs" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_runs_specialist_idx" ON "insight_runs" ("specialist_id");
CREATE INDEX IF NOT EXISTS "insight_runs_created_at_idx" ON "insight_runs" ("created_at");

CREATE TABLE IF NOT EXISTS "insight_signals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "source_specialist_id" text NOT NULL,
  "signal_type" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "severity" text DEFAULT 'info' NOT NULL,
  "consumed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "insight_signals_user_id_idx" ON "insight_signals" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_signals_created_at_idx" ON "insight_signals" ("created_at");

CREATE TABLE IF NOT EXISTS "insight_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "specialist_id" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "insight_notifications_user_id_idx" ON "insight_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_notifications_read_idx" ON "insight_notifications" ("read");

CREATE TABLE IF NOT EXISTS "insight_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "run_id" uuid,
  "specialist_id" text NOT NULL,
  "useful" boolean NOT NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "insight_feedback_specialist_idx" ON "insight_feedback" ("specialist_id");
