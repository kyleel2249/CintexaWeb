CREATE TYPE "public"."customer_role" AS ENUM('creator', 'seller', 'buyer', 'consumer');--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "role" "customer_role";--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "interests" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "usage_frequency" text;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;