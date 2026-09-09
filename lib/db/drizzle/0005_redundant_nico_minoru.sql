ALTER TABLE "customer_profiles" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "avatar_id" text;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_username_uidx" ON "customer_profiles" USING btree ("username");