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

## Round 6
- Structured logging: console.log/console.error replaced everywhere with pino (JSON in production, pretty
  in dev, silent in tests), pino-http request logging with trimmed serializers and health-check spam
  filtered out
- Pagination added to all four previously-hard-capped-at-50 list endpoints (contributions, activity,
  admin/customers, admin/agents/tasks) via a shared parsePageParams/buildPaginationMeta helper — each now
  returns `pagination: {limit, offset, total, hasMore}` alongside the existing array key
- **Role-based onboarding**: new customers pick Creator/Seller/Buyer/Affiliate, then answer role-specific
  interest questions and a usage-frequency question, in a 3-step wizard (`OnboardingFlow`). This actually
  reshapes the dashboard — Overview now shows a "Tailored for you" panel with concrete page recommendations
  computed from the person's selected interests (e.g. a seller who picked "Physical products" gets pointed
  at the E-commerce solution page), not just a cosmetic role label
  - Schema: `customer_profiles` gained `role`, `interests` (jsonb), `usageFrequency`, `onboardingCompleted`
  - `PATCH /api/customer/me` extended to accept these fields, with server-side cross-field validation
    (interests must belong to the selected role's option list) — 6 new unit tests for this validation
  - `DashboardShell` gates on `onboardingCompleted`, showing the wizard instead of dashboard tabs until done
  - 3 new frontend tests for the wizard's step logic (role selection -> filtered interests -> frequency)
- **Caught and fixed a real bundling bug before it reached production**: `lib/roles.ts` imported runtime
  constants from `@cintexa/db`'s main barrel, which also exports the live Postgres client — Vite tried to
  bundle the `postgres` npm package for the browser and the production build failed outright. Fixed by
  giving `@cintexa/db` a `./schema` subpath export (pure constants/types, no Postgres) and moving every
  frontend import to it. This would have broken the live Cloudflare deploy if it had shipped — caught
  because the actual `build:pages` command was run before pushing, not just typecheck
- Also fixed: `AnimatePresence mode="wait"` in the onboarding wizard could hang indefinitely under limited
  animation environments (confirmed failing under jsdom) since it waits for an exit animation to resolve
  before mounting the next step — removed `mode="wait"`, steps now cross-fade instead of blocking
- Verified against a real local Postgres: migration generated and applied (customer_profiles grew from 7 to
  11 columns), onboarding fields confirmed to read/write correctly
- Re-verified: 52 tests passing (39 backend + 13 frontend) from a clean install, typecheck clean, both
  build:pages and api-server builds clean, OpenAPI spec updated and re-validated (13 paths, 7 schemas)

## Round 7 — merged parallel work, made the fee/referral/leaderboard system real end-to-end
- Merged 15 commits pushed directly by Kyle/another session while this work was in progress: Templates,
  Affiliate, Analytics, Pixels, Email, Payback, Social (connect/post/schedule/boost/share/follow) dashboard
  tabs, streak badges, and Clerk-branding cleanup — all kept as-is (more complete than this session's own
  in-progress equivalents). Found and fixed 3 real bugs surfaced by the merge: a syntax error in
  Progress.tsx (broken build), a wrong Clerk API call in Settings.tsx, and a reintroduced
  `AnimatePresence mode="wait"` hang (the same bug fixed earlier this session)
- Completed what the other session had scaffolded but explicitly marked as not-yet-persisted: username,
  avatarId, and twoFactorEnabled now have real `customer_profiles` columns (15 -> 18, unique index on
  username) instead of only ever living in browser localStorage. Verified live: set + duplicate-rejected
  against real Postgres
- **Platform fee reconciled to the confirmed scheme (7% default, 5% with promo code FREE2026)** — the
  webhook was previously a flat, non-promo-aware 5%; `calculatePlatformFee` now takes an optional promo
  code and the webhook accepts one in its payload. Verified live: a ₵100 payment with no code returns
  exactly ₵7 fee, the same payment with `promoCode: "FREE2026"` returns exactly ₵5 fee
- **Admin (FREE2026) referrer linking is now real and server-side**, not just a localStorage default:
  `PATCH /api/customer/me` sets `referredByUserId` to FREE2026 on every brand-new profile unless a real
  `?ref=` capture is supplied, and never touches it again on existing profiles. Extracted into a pure,
  tested `resolveReferrer()` function
- **Leaderboard rebuilt from three hardcoded demo arrays into three real Postgres queries** — most
  referrer (self-join counting real referrals, admin always excluded), most creator (creators ranked by
  loyalty balance), most user of the platform (ranked by activity event count). Verified end-to-end: seeded
  a real two-person referral chain via direct DB inserts, confirmed the API returns exactly that referrer
  ranked with a score of 2
- **Fixed an urgent, unrelated production-breaking bug found during verification**: React 19.3.0 shipped
  during this session and broke `@react-three/fiber`'s peer dependency range, making `npm install` fail
  outright — this would have broken Cloudflare's build the moment it ran. Pinned `react`/`react-dom` to
  `>=19.0.0 <19.3.0` (resolves to 19.2.8)
- Flagged, not silently resolved: the other session's client-side fee/referral state (localStorage) and
  this session's server-side state (real Postgres) are architecturally different sources of truth — this
  round makes the server side fully correct and real, but the two layers still don't sync with each other
- Re-verified: 68 tests passing (51 backend + 17 frontend, including a new real end-to-end referral-chain
  leaderboard test) from a clean install, typecheck clean, both build:pages and api-server builds clean,
  OpenAPI spec updated and re-validated (13 paths, 8 schemas)

## Round 8 — harden the React 19.3 fix
- The earlier fix (pinning `react`/`react-dom` to `>=19.0.0 <19.3.0` in `artifacts/cintexa/package.json`)
  only constrained that one workspace's own dependency resolution. Added a root-level `overrides` field so
  the pin is enforced across the entire dependency tree regardless of what any single package declares —
  stronger guarantee against the exact failure mode that broke `npm install` once already
- No permanent upstream fix exists yet: confirmed `@react-three/fiber@9.7.0` (latest stable, no newer
  non-canary release exists) still requires `react: ">=19 <19.3"`. The range pin remains the correct fix,
  not a temporary workaround with a known expiry
- Documented this clearly in `DEPLOYMENT.md` with the exact command to check before ever removing the pin,
  so a future change doesn't silently reintroduce the same production-breaking failure
- Fixed an unrelated duplicate `## API` heading in `DEPLOYMENT.md` found while editing nearby
- Re-verified from a fully clean install (confirmed React still resolves to 19.2.8): 72 tests passing
  (51 backend + 21 frontend), typecheck clean, both build:pages and api-server builds clean
