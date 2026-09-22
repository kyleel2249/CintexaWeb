# Career postings — SEO prerender

## Why
Crawlers and AI indexers need job titles, descriptions, and JobPosting JSON-LD in the **first HTML response**. Client-only React does not provide that.

## Approach
Post-Vite **static prerender** (not full React SSR of Clerk/Three):

1. `vite build` → `dist/index.html` + assets  
2. `node scripts/prerender-careers.mjs` writes:
   - `dist/careers/index.html`
   - `dist/careers/<slug>/index.html`
3. Each file injects title, description, OG tags, JSON-LD, and visible job HTML into `#root`.

## Source of truth
`src/data/jobs.ts` (React) and the JOBS array in `scripts/prerender-careers.mjs` (build). Keep them aligned when adding roles.

## Routes
| URL | Purpose |
|-----|---------|
| `/careers` | List + alerts form |
| `/careers/cleaner` | Cleaner detail (prerendered) |

## Cloudflare
- Static files under `dist/careers/**` are served first.
- `_routes.json` limits Functions to `/api/*` so career HTML is not swallowed by Workers.
- SPA `_redirects` fallback still applies when no static file exists.
