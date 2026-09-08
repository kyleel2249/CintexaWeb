# Deploying CINTEXA

## Frontend — Cloudflare Pages

This is a monorepo. The deployable frontend lives in `artifacts/cintexa/`, not
the repo root — if Cloudflare Pages is left on its default settings, it tries
to build/serve from the repo root, finds nothing there, and nothing changes
when you push. This is almost certainly why the live site hasn't reflected
recent commits.

### One-time setup (Cloudflare dashboard)

Go to your Pages project → **Settings → Builds & deployments** and set:

| Setting | Value |
|---|---|
| Framework preset | `Vite` (or `None`) |
| Root directory | `/` (repo root — leave default) |
| Build command | `npm install && npm run build -w @cintexa/db && npm run build -w cintexa` |
| Build output directory | `artifacts/cintexa/dist` |
| Node version | `22` (add env var `NODE_VERSION=22` if the build picks an older default and fails) |

### Required environment variables (Pages → Settings → Environment variables)

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your real Clerk publishable key (`pk_live_...` in production) |
| `VITE_API_BASE_URL` | The deployed API server's URL + `/api`, e.g. `https://api.yourdomain.com/api` |

Without `VITE_CLERK_PUBLISHABLE_KEY` set, the site will still build and serve,
but sign-in and the customer dashboard won't work (Clerk will render with an
empty key).

### After changing these settings

Trigger a fresh deployment — either push a new commit, or use **Retry
deployment** / **Create deployment** in the Cloudflare dashboard. Changing
build settings alone does not retroactively rebuild a deployment that already
succeeded with the old (empty) settings.

### SPA routing

`artifacts/cintexa/public/_redirects` (copied into `dist/` on every build)
tells Cloudflare Pages to serve `index.html` for every path, so client-side
routes (`/dashboard/settings`, `/solutions/ads-boost`, etc.) work on a hard
refresh instead of 404ing. If you ever see 404s on a direct route visit but
not on in-app navigation, check this file made it into the deployed output.

### Local verification

Before trusting a Cloudflare config change, verify the exact same build
command works locally:

```bash
npm install
npm run build -w @cintexa/db
npm run build -w cintexa
npx serve artifacts/cintexa/dist   # or any static file server
```

If this doesn't produce a working site locally, changing Cloudflare settings
won't fix it either — the build itself is broken first.

## Backend — API server

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
