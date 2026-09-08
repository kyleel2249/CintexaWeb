ALTER TABLE "public"."customer_profiles" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."customer_role";--> statement-breakpoint
CREATE TYPE "public"."customer_role" AS ENUM('creator', 'seller', 'buyer', 'affiliate');--> statement-breakpoint
ALTER TABLE "public"."customer_profiles" ALTER COLUMN "role" SET DATA TYPE "public"."customer_role" USING "role"::"public"."customer_role";