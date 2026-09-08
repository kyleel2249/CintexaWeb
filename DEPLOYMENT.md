# Deploying CINTEXA (fix Cloudflare 404)

## Why you see HTTP 404 on cintexa.com

This is a **monorepo**. The Vite app lives in `artifacts/cintexa/`, not the repo root.

If Cloudflare Pages uses default settings (`Build output directory = dist` or `.`), the deploy has **no `index.html`** → **404**.

Also check:

| Symptom | Likely cause |
|--------|----------------|
| Apex `cintexa.com` 404 | Pages project empty / wrong output dir / domain not attached to the project that has a successful build |
| `www.cintexa.com` **522** | Cloudflare cannot reach origin (origin down, wrong DNS, or orange-cloud to a dead host) |
| Direct path 404 but home works | Missing SPA `_redirects` (`/* /index.html 200`) |

## Fix (Cloudflare dashboard) — do this once

**Pages → your project → Settings → Builds & deployments**

| Setting | Value |
|---------|--------|
| Framework preset | Vite or None |
| Root directory | `/` (repo root) |
| **Build command** | `npm ci && npm run build:pages` |
| **Build output directory** | `artifacts/cintexa/dist` |
| Node | **22** (`NODE_VERSION=22` env var) |

**Environment variables (Production):**

- `NODE_VERSION` = `22`
- `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk `pk_live_...` or test key
- `VITE_API_BASE_URL` = API base including `/api` if needed

Then **Retry deployment** or push a new commit. Changing settings alone does not rebuild an old failed deploy.

## Custom domain (cintexa.com)

1. Pages → **Custom domains** → add `cintexa.com` and `www.cintexa.com`.
2. DNS (Cloudflare DNS):
   - Prefer **CNAME** `www` → `your-project.pages.dev`
   - Apex: **CNAME flatten** to the same Pages target, or use Cloudflare’s “Pages” record UI.
3. Avoid pointing `www` at a dead origin (causes **522**).
4. Enable **Always Use HTTPS** and optional **www ↔ apex redirect** under Rules so both hostnames hit the same Pages deploy.

## GitHub Action deploy (optional)

Workflow: `.github/workflows/deploy-pages.yml`

Repo **Secrets**:

- `CLOUDFLARE_API_TOKEN` (Pages Edit permission)
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` (optional)

Project name in the workflow: `cintexa-growth-platform` (must match the Pages project name).

## Local verify before trusting Cloudflare

```bash
npm ci
npm run build:pages
npx serve artifacts/cintexa/dist
```

If this fails locally, Cloudflare will also 404.

## API

## API

The API server (`artifacts/api-server/`) is a standard Node/Express app and
is **not** served by Cloudflare Pages (Pages serves static output only).
Deploy it separately — a `Dockerfile` is provided at
`artifacts/api-server/Dockerfile` for any container host (Fly.io, Render,
Railway, a VPS, etc.). Point the frontend's `VITE_API_BASE_URL` at wherever
this ends up.

Required environment variables are listed in `.env.example` at the repo root.

## Local development

A `docker-compose.yml` at the repo root starts Postgres + the API server
together:

```bash
cp .env.example .env   # fill in real values
docker compose up -d
npm run migrate -w @cintexa/db   # first time only
npm run dev:web                  # in a separate terminal — Vite dev server
```

The frontend isn't containerized here on purpose — Vite's hot reload is
smoother run directly on the host. Compose only covers the two backend
dependencies (Postgres + API).
