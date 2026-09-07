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
