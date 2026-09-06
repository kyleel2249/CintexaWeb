# Full source

This repository is seeded with the CINTEXA Growth Platform architecture, design system, motion system, and core modules.

The complete monorepo (web app, API server, shared libs, OpenAPI, UI kit) is maintained as the working tree used to build this project. Key paths:

```
artifacts/cintexa/          # Vite React frontend
artifacts/api-server/       # Express API
lib/db/                     # Drizzle schema
lib/api-spec/               # OpenAPI
DESIGN_SYSTEM.md
MOTION.md
PLATFORM.md
SECURITY.md
```

## Local development

```bash
git clone https://github.com/kyleel2249/CintexaWeb.git
cd CintexaWeb
npm install
cp .env.example .env
# Fill Clerk + DATABASE_URL
npm run dev:api
npm run dev:web
```

## CSS fallback for non-3D browsers

`EcosystemFallback` renders a pure CSS orbital business ecosystem when WebGL is unavailable, reduced-motion is preferred, or the device is low-power / slow-network (`useMotionProfile`).

## Advanced features included

- 3D interactive business ecosystem (R3F) + CSS fallback
- Premium sticky nav with animated dropdowns and mobile panel
- Scroll progress indicator
- Customer portal: dashboard, contributions, progress, leaderboard, settings
- AI insight foundation card on dashboard
- Platform foundations for subscriptions, loyalty, modules
