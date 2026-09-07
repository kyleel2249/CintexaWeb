CREATE TYPE "public"."agent_role" AS ENUM('marketing', 'sales', 'consumer_simulation', 'engagement', 'content_idea');--> statement-breakpoint
CREATE TYPE "public"."agent_task_status" AS ENUM('queued', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "agent_role" NOT NULL,
	"status" "agent_task_status" DEFAULT 'queued' NOT NULL,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"requested_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "agent_tasks_role_idx" ON "agent_tasks" USING btree ("role");--> statement-breakpoint
CREATE INDEX "agent_tasks_created_at_idx" ON "agent_tasks" USING btree ("created_at");