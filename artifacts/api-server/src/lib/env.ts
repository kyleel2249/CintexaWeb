import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, "CLERK_PUBLISHABLE_KEY is required"),
  ADMIN_API_KEY: z.string().min(16, "ADMIN_API_KEY must be a long random string"),
  WEBHOOK_SECRET: z.string().min(16, "WEBHOOK_SECRET must be a long random string"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  /** Resend API key — optional; without it emails run in dry-run mode */
  RESEND_API_KEY: z.string().optional(),
  /** e.g. "CINTEXA <alerts@cintexa.com>" — must be a verified domain in Resend */
  EMAIL_FROM: z.string().optional(),
  /** Where admin copies of career alerts and system notices go */
  NOTIFY_ADMIN_EMAIL: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
});

/** Validated environment — throws with a clear message at boot if anything required is missing. */
export const env = envSchema.parse(process.env);
