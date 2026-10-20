# Security

- Clerk authentication (Express middleware + React)
- Helmet, CORS allowlist, rate limiting
- Admin API key for privileged routes (`/api/admin/*` — customer listing, loyalty adjustments)
- Webhook signature secret for contribution events
- Never commit real `.env` secrets — use `.env.example`

## Rate limiting

- **Pages Functions:** `functions/api/_middleware.ts` limits every `/api/*` request per client IP using the budgets in
  `functions/lib/rate-policy.ts` (e.g. login 10 / 15 min, forgot-password 6 / h, contact 6 / h, default 120 / min). New
  endpoints are covered automatically. Counters live in the `KV` namespace; if KV is unavailable the limiter fails open and logs.
  Workers KV writes are metered — on the free plan consider Cloudflare's Rate Limiting rules instead/as well.
- **Express API:** global 300 / min ceiling (all paths), `/api` 120 / min, `/api/admin` 60 / min, `/api/notifications` 30 / h,
  `/webhooks` 300 / min, `/health` 600 / min. Set `TRUST_PROXY` to the number of proxy hops in front of the API.

## Password reset

Reset requests (customer and admin) always return `If this accounts exists a password reset link has been sent.` for any
well-formed request, so the endpoints cannot be used to learn which accounts exist.
