/**
 * Per-endpoint rate-limit policy for every Pages Function under /api/*.
 * Applied centrally by functions/api/_middleware.ts, so a new endpoint is protected the moment it exists
 * (it falls into DEFAULT_POLICY) and sensitive ones get a tighter budget below. Individual endpoints may
 * still enforce their own, stricter per-account / global limits on top of this.
 */
export type RatePolicy = { name: string; limit: number; windowSec: number };

const MIN = 60;
const QUARTER_HOUR = 15 * MIN;
const HOUR = 60 * MIN;

export const DEFAULT_POLICY: RatePolicy = { name: "api", limit: 120, windowSec: MIN };

type Rule = { methods?: string[]; test: (path: string) => boolean; policy: RatePolicy };
const exact = (p: string) => (path: string) => path === p;
const under = (p: string) => (path: string) => path === p || path.startsWith(`${p}/`);

// First match wins — keep the specific rules above the broad ones.
const RULES: Rule[] = [
  // Credential endpoints: slow guessing / stuffing / mail-bombing.
  { methods: ["POST"], test: exact("/api/auth/login"), policy: { name: "auth-login", limit: 10, windowSec: QUARTER_HOUR } },
  { methods: ["POST"], test: exact("/api/auth/signup"), policy: { name: "auth-signup", limit: 10, windowSec: HOUR } },
  { methods: ["POST"], test: exact("/api/auth/forgot-password"), policy: { name: "auth-forgot", limit: 6, windowSec: HOUR } },
  { methods: ["POST"], test: exact("/api/auth/reset-password"), policy: { name: "auth-reset", limit: 10, windowSec: QUARTER_HOUR } },
  { test: under("/api/auth"), policy: { name: "auth", limit: 120, windowSec: MIN } },

  // Admin: sign-in and one-time-link endpoints are tight; the rest of the console is a normal API budget.
  { methods: ["POST"], test: exact("/api/admin/login"), policy: { name: "admin-login", limit: 30, windowSec: QUARTER_HOUR } },
  {
    methods: ["POST"],
    test: (p) => ["/api/admin/reset-request", "/api/admin/reset", "/api/admin/setup-request", "/api/admin/setup", "/api/admin/set-resend-key"].includes(p),
    policy: { name: "admin-links", limit: 20, windowSec: HOUR },
  },
  { test: under("/api/admin"), policy: { name: "admin", limit: 120, windowSec: MIN } },

  // Public forms that send mail.
  { methods: ["POST"], test: exact("/api/contact"), policy: { name: "contact", limit: 6, windowSec: HOUR } },
  { methods: ["POST"], test: exact("/api/careers/apply"), policy: { name: "apply", limit: 20, windowSec: HOUR } },
  { test: exact("/api/notifications/broadcast"), policy: { name: "broadcast", limit: 10, windowSec: HOUR } },
  { test: under("/api/notifications"), policy: { name: "notify", limit: 20, windowSec: HOUR } },

  // Scheduled jobs and cheap lookups.
  { test: under("/api/cron"), policy: { name: "cron", limit: 12, windowSec: MIN } },
  { test: (p) => p === "/api/fx" || p === "/api/geo", policy: { name: "lookup", limit: 60, windowSec: MIN } },
];

export function policyFor(method: string, pathname: string): RatePolicy {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const m = method.toUpperCase();
  for (const rule of RULES) {
    if (rule.methods && !rule.methods.includes(m)) continue;
    if (rule.test(path)) return rule.policy;
  }
  return DEFAULT_POLICY;
}
