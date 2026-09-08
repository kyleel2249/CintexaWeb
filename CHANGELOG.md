# Changelog

## Platform build
- Frontend shell: Vite/React 19/Tailwind 4 scaffold, design-system CSS tokens,
  `MotionProvider` (respects reduced motion, low-power devices, save-data),
  brand mark/wordmark, error boundary, sticky nav with animated dropdowns and
  mobile panel, footer
- Interactive 3D business ecosystem hero (`BusinessEcosystem3D`) gated by
  WebGL support + motion profile, with CSS `EcosystemFallback`
- Pages: Home, Platform, Pricing, and all four solution pages (Marketing,
  Sales, Ads Boost, E-commerce) wired to the existing `AnimatedAdsFunnel` and
  `Storefront3D` components
- Customer portal: Clerk-gated dashboard with Overview, Contributions,
  Progress, Leaderboard, and Settings tabs
- API server: Express 5 app with Helmet, CORS allowlist, rate limiting,
  Clerk auth (scoped to protected routes only, so `/health` never depends on
  a valid Clerk key), an HMAC-verified webhook endpoint, and REST routes for
  customer profile / contributions / activity, all backed by the existing
  Drizzle schema in `lib/db`
- `lib/db`: build pipeline, Postgres client, and Drizzle config added around
  the existing schema
- `lib/api-spec`: OpenAPI spec added, matching the implemented routes
- Verified: `npm install`, `npm run typecheck`, and `npm run build` all pass
  clean across all three workspaces; the built API server boots and its
  routes were smoke-tested

## Platform surfaces
- Sales technology page with animated funnel (Visitor → Loyal)
- Marketing technology with campaign channel visuals
- **Ads Boost** service page: campaign lifecycle, demo dashboard, programmatic strategies, Ad→Revenue funnel (sample data only)
- **E-commerce** platform: full commerce capability set, 3D storefront demo, sample catalog, predictive customer analytics foundation
- Solutions 3D ecosystem; hero business ecosystem + CSS fallbacks

## Notes
All performance figures on marketing/ads demos are clearly labeled sample data — not live platform metrics.

## Advanced features build
- Subscriptions & entitlements: `subscriptions` table (plan/status/period), `/api/subscriptions/me` (GET/POST),
  Pricing page wired to a real mutation with per-plan current-plan state
- Loyalty ledger: event-sourced `loyalty_ledger` table (append-only), `/api/loyalty/me`, balance shown on
  dashboard Overview and used to compute Progress milestones
- Public leaderboard: `/api/leaderboard` computes real rankings from opted-in customers' loyalty totals
  (never exposes userId or contact info)
- Admin routes: `/api/admin/customers` (aggregated plan + balance per customer), `/api/admin/loyalty/adjust`
  (the only way points change) — both gated by the previously-unused `requireAdminKey` middleware
- Dashboard fully live: Overview, Contributions, Progress, Leaderboard, and Settings all query the real API
  via TanStack Query hooks (`useApi.ts`) instead of hardcoded sample arrays, with loading/empty/error states
- Route-based code splitting: every page and dashboard tab is lazy-loaded; Three.js/Clerk/motion libraries
  split into their own vendor chunks. Main entry chunk dropped from 1.3MB to 47.8KB
- CI: GitHub Actions workflow runs typecheck + build on every push/PR
- Docker: `artifacts/api-server/Dockerfile` for the API server (multi-stage, not yet verified with a live
  Docker build — no Docker daemon in the build environment this was written in)
- End-to-end verified against a real local Postgres 16 instance: migrations generated and applied, loyalty
  adjustments, admin customer aggregation, and public leaderboard all smoke-tested against live data

## Round 4
- OpenAPI spec (`lib/api-spec/openapi.yaml`) rewritten to cover every implemented endpoint — was 5 paths,
  now 13 paths / 6 schemas, matching subscriptions, loyalty, leaderboard, admin, and agent routes
- `/health` now actually pings the database (`select 1`) instead of just confirming the process is alive —
  returns 503 "degraded" if the DB is unreachable. Verified both paths live (DB up -> 200 connected, DB
  down -> 503 unreachable after connection timeout)
- `docker-compose.yml` added: one-command Postgres + API server for local dev (frontend intentionally
  excluded — Vite's hot reload works better run directly on the host)
- Visual pass on the Home page per the original brief's "colourful, highly responsive" ask: new `GlowField`
  ambient background component (motion-aware, respects reduced-motion), a metrics band, and the four pillar
  cards now carry distinct accent colors (sky/teal/amber/violet) instead of being monochrome
- Re-verified: 35 tests passing (26 backend + 9 frontend), typecheck clean, full build clean, main JS chunk
  still 50.7KB after the Home page changes

## Round 5
- Closed a real doc-vs-code gap: MOTION.md named GSAP+ScrollTrigger, `ScrollReveal`, `PointerParallax`, and
  off-screen canvas pausing as part of the stack, but none of them existed. Built all four for real and
  wired them into actual pages rather than leaving them as unused dependencies:
  - `ScrollReveal` — fade/slide-in on scroll via IntersectionObserver, used on the Home page pillar cards
  - `PointerParallax` — subtle cursor-follow depth, wraps the hero's ecosystem visual
  - `GsapStagger` — the one place GSAP + ScrollTrigger is actually used, staggers the Platform page's
    module grid into view
  - `BusinessEcosystem3D` now pauses its R3F render loop entirely (`frameloop="never"`) when scrolled
    off-screen, verified via IntersectionObserver
- Fixed a related doc/reality mismatch on the Platform page: subscriptions, loyalty, and the AI module were
  still labeled "Foundation" even though they're fully implemented — relabeled to "Available"
- Merged in two commits pushed directly by Kyle while this work was in progress: a proper Cloudflare Pages
  404 fix (explicit build script, `_routes.json`, direct-deploy GitHub Action, DNS notes) and a boot-crash
  fix for when `VITE_CLERK_PUBLISHABLE_KEY` is missing. Resolved one merge conflict in DEPLOYMENT.md by
  combining both sets of content; re-verified full build/typecheck/test after merging
- `deploy-pages.yml` (from the merge) now skips its Cloudflare publish step gracefully with a clear notice
  when `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets aren't set, instead of failing the whole
  workflow on every push
- jsdom test setup gained an `IntersectionObserver` stub (same category as the earlier `matchMedia` stub)
  so the new motion components don't crash under test
- Re-verified: 36 tests passing (26 backend + 10 frontend), typecheck clean, full build clean
