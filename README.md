# CINTEXA Growth Platform (`CintexaWeb`)

Technology · Commerce · Motion · Intelligence — a scalable growth platform (not a static marketing site).

## Stack

- **Web:** Vite 7, React 19, Tailwind 4, Framer Motion, React Three Fiber, GSAP, Clerk, TanStack Query, Wouter  
- **API:** Express 5, Drizzle ORM, PostgreSQL, Zod, OpenAPI → Orval  
- **Workspaces:** npm / pnpm monorepo (`artifacts/cintexa`, `artifacts/api-server`, `lib/*`)

## Quick start (Windows / macOS / Linux)

```bash
npm install
cp .env.example .env   # add Clerk + DATABASE_URL
npm run dev:api        # API on :8080
npm run dev:web        # Web on Vite default port
```

See `artifacts/cintexa` and root `package.json` scripts for details.

## Features

- Lead generation, solutions marketing, capability pages  
- Customer accounts (Clerk), dashboard, contributions, progress, leaderboard  
- Foundations for subscriptions, loyalty, modules, CRM, AI, BI  
- Interactive 3D business ecosystem hero + CSS fallback for non-WebGL  
- Design system, motion profile, scroll progress, premium navigation  

## Docs

- `DESIGN_SYSTEM.md` — brand, type, components  
- `MOTION.md` — 3D / animation performance rules  
- `PLATFORM.md` — extensibility  
- `SECURITY.md` — auth, rate limits, secrets  

## Repository

https://github.com/kyleel2249/CintexaWeb
