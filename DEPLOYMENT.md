# Deploying CINTEXA (fix Cloudflare 404)

## If you're seeing "Couldn't save — try again" (or any dashboard/onboarding action silently failing)

**This means the API server isn't reachable from your live site — almost certainly because it hasn't
been deployed anywhere yet, or `VITE_API_BASE_URL` isn't set in Cloudflare Pages.**

Cloudflare Pages only serves the static frontend (`artifacts/cintexa/dist`). It does **not** run
`artifacts/api-server` — that's a separate Node/Express process that needs its own host (see "Backend"
below). Until it's deployed somewhere and `VITE_API_BASE_URL` points at it, every feature that talks to
the API — sign-up onboarding, the dashboard, contributions, the admin panel — will fail. Concretely, with
`VITE_API_BASE_URL` unset, the frontend defaults to calling `/api/...` on the Pages domain itself. Since
nothing is listening there, Cloudflare's own SPA fallback rule (`_redirects`) catches the request and
returns `index.html` with an HTTP 200 — which the frontend then fails to parse as JSON, surfacing as a
generic save error with no useful detail (this was recently improved to at least name the real cause).

**To fix:**
1. Deploy `artifacts/api-server` somewhere (Fly.io, Render, Railway, a VPS — see "Backend" below;
   `docker-compose.yml` covers local dev, not production hosting).
2. In Cloudflare Pages → Settings → Environment variables, set `VITE_API_BASE_URL` to that server's public
   URL + `/api` (e.g. `https://api.yourdomain.com/api`).
3. Redeploy the frontend (env var changes need a fresh build to take effect).
4. Also make sure the API server's `CORS_ORIGINS` env var includes your actual Pages domain — otherwise
   the browser will block the requests even once the URL is correct.

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

Without `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` set, the workflow still
builds the frontend (so build breakage is still caught) but skips the actual
publish step with a notice instead of failing — safe to leave this workflow
enabled even before you've decided whether to use it over Cloudflare's own
dashboard-based GitHub integration. Using both isn't harmful, just redundant.

## Local verify before trusting Cloudflare

```bash
npm ci
npm run build:pages
npx serve artifacts/cintexa/dist
```

If this fails locally, Cloudflare will also 404.

## Pinned React version — don't remove this without checking first

`package.json` (root `overrides`, plus `artifacts/cintexa/package.json`'s own
`react`/`react-dom` ranges) pins React to `>=19.0.0 <19.3.0`.

This isn't a stylistic choice — **React 19.3.0 shipped and broke
`@react-three/fiber`'s peer dependency range** (`@react-three/fiber@9.7.0`
requires `react: ">=19 <19.3"`). Without this pin, `npm install` fails
outright with an ERESOLVE error, which means the Cloudflare build fails too,
regardless of anything else in this repo. This actually happened once during
development.

Before removing or loosening this pin, confirm a version of
`@react-three/fiber` (or `@react-three/drei`) has actually shipped support
for React 19.3+:

```bash
npm view @react-three/fiber@latest peerDependencies
```

If `react` there still excludes `19.3`, leave the pin in place. If a newer
version supports it, update `@react-three/fiber`/`@react-three/drei` in
`artifacts/cintexa/package.json` and the pin together, then re-verify
`npm install` succeeds before removing the `overrides` entry.

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
