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
