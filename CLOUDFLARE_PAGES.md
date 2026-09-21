# Cloudflare Pages — triggers, env, signups

## Deploy triggers (Git integration)

In **Cloudflare Dashboard → Workers & Pages → cintexa (or your project) → Settings**:

### Builds & deployments
| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Root directory | `/` (empty / repo root) |
| Build command | `npm ci && npm run build -w @cintexa/db && npm run build -w cintexa` |
| Build output directory | `artifacts/cintexa/dist` |
| Deploy on push | **Enabled** for `main` |
| Preview deployments | **Enabled** for pull requests (optional) |

### Automatic triggers
1. **Production:** every push to `main` builds and deploys to cintexa.com.
2. **Preview:** every PR (if enabled) gets a `*.pages.dev` URL.
3. **Manual:** Deployments → Retry deployment.

There is no separate “cron” for Pages static + Functions; triggers are Git push / PR / Retry.

### Functions
Pages Functions live under `/functions` at the **repo root**.
They deploy automatically with each Pages build.

Ensure **KV** binding `KV` is attached (see `wrangler.jsonc`).

---

## Environment variables (Production + Preview)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_VERSION` | Recommended | `22` |
| `VITE_CLERK_PUBLISHABLE_KEY` | For Clerk UI | Frontend auth |
| `RESEND_API_KEY` | **Yes for real email** | Send mail via Resend |
| `EMAIL_FROM` | Yes with Resend | Verified sender, e.g. `CINTEXA <alerts@cintexa.com>` |
| `NOTIFY_ADMIN_EMAIL` | Recommended | `info@cintexa.com` |
| `ADMIN_API_KEY` | For broadcast | Admin email blasts |
| `CLERK_WEBHOOK_SECRET` | For webhook verify | Clerk → `/api/webhooks/clerk` |

Without `RESEND_API_KEY`, signups still **save to KV** but admin email is **dry-run** (logged only).

---

## Signup data path

1. User fills **Your details** on `/get-started` → `POST /api/notifications/signup`
2. Record stored in Cloudflare **KV**:
   - `signup:{email}`
   - `signup:id:{uuid}`
   - `signup:index` (list of emails)
3. Email to **info@cintexa.com** (or `NOTIFY_ADMIN_EMAIL`)
4. Confirmation email to the user
5. Optional: Clerk `user.created` webhook → same KV + admin email

### Clerk webhook setup
1. Clerk Dashboard → Webhooks → Add endpoint  
2. URL: `https://cintexa.com/api/webhooks/clerk`  
3. Events: `user.created`  
4. Copy signing secret → `CLERK_WEBHOOK_SECRET` in Pages env  

---

## Verify after deploy

```bash
curl -s -X POST https://cintexa.com/api/notifications/signup \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Test User","email":"you@example.com","phone":"+233...","company":"Test Co","source":"manual_test"}'
```

Expect `{ "ok": true, "stored": true, "adminNotify": { "ok": true, ... } }`.  
If `adminNotify.dryRun: true`, set `RESEND_API_KEY` and redeploy.
