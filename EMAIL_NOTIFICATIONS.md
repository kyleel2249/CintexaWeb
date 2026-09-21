# CINTEXA email notification system

## What it does

1. **Career & scholarship alerts** — visitors submit the form on `/careers`.
2. **Confirmation email** to the subscriber.
3. **Admin copy** to `NOTIFY_ADMIN_EMAIL` (default `info@cintexa.com`).
4. **Subscriber storage** in Cloudflare KV (`career_alert:{email}` + index).
5. **Broadcast** new jobs/scholarships to all subscribers (admin only).

## Endpoints (Cloudflare Pages Functions)

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/api/notifications/career-alert` | Public (rate-limit via platform) |
| `POST` | `/api/notifications/broadcast` | Header `X-Admin-Key: $ADMIN_API_KEY` |

### Career alert body

```json
{
  "fullName": "Ama Mensah",
  "email": "ama@example.com",
  "phone": "+233…",
  "location": "Accra",
  "education": "Undergraduate",
  "interests": ["Full-time roles", "Scholarships"],
  "message": "Optional note",
  "source": "careers_page"
}
```

### Broadcast body

```json
{
  "title": "Frontend Engineer",
  "kind": "Job",
  "summary": "React role for the growth platform.",
  "href": "https://cintexa.com/careers",
  "dryRun": false
}
```

## Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | For real send | Resend API key |
| `EMAIL_FROM` | Recommended | e.g. `CINTEXA <alerts@cintexa.com>` (verified domain) |
| `NOTIFY_ADMIN_EMAIL` | Optional | Admin inbox (default info@cintexa.com) |
| `ADMIN_API_KEY` | For broadcast | Must match header on broadcast calls |

KV binding `KV` is already declared in `wrangler.jsonc` (`id: 1d9e41a13fd642ec8fb6f2e7ec3a11ce`).

## API server (Node)

Parallel route: `POST /api/notifications/career-alert` in `artifacts/api-server`.

Uses the same Resend env vars. Without `RESEND_API_KEY`, sends are **dry-run** (logged, success returned).

## Frontend

`submitCareerAlert()` in `src/lib/email-notifications.ts` posts to same-origin `/api/notifications/career-alert`. On failure it falls back to `mailto:info@cintexa.com`.

## Setup checklist

1. Create a [Resend](https://resend.com) account and verify `cintexa.com`.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` in Cloudflare Pages.
3. Redeploy.
4. Test signup on `/careers`.
5. Optional: call broadcast with `X-Admin-Key` when posting a new role.
