# Security

- Clerk authentication (Express middleware + React)
- Helmet, CORS allowlist, rate limiting
- Admin API key for privileged routes (`/api/admin/*` — customer listing, loyalty adjustments)
- Webhook signature secret for contribution events
- Never commit real `.env` secrets — use `.env.example`
