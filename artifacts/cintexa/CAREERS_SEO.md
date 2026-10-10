# Career postings — data, SEO and link previews

## One source of truth
All vacancies live in **`src/data/jobs.json`**. Nothing about a job is written anywhere else:

| Surface | Derived from jobs.json via |
|---------|----------------------------|
| `/careers` list and `/careers/:slug` pages | `src/data/jobs.ts` + `JobCard` / `JobDetail` |
| `<title>`, description, canonical, robots | `src/data/careers-seo.ts` (`jobSeo`, `careersListSeo`) |
| Open Graph + Twitter card (image, title, description, size, type) | same builders |
| JobPosting / CollectionPage JSON-LD | same builders |
| Prerendered HTML for crawlers and link-preview bots | `scripts/prerender-careers.mjs` (run with `tsx`) |
| `sitemap.xml` entries and `lastmod` | `scripts/generate-sitemap.mjs` (plain `node`, reads the JSON) |

Because the React pages and the build-time prerender call the **same** functions, the preview a
bot sees in the static HTML and the head the browser sets after navigation can never disagree.

## Add or change a vacancy
1. Put the images in `public/careers/`. `image` is shown on the page; `socialImage` must be a
   **raster** (JPEG/PNG/WebP — never SVG) and is used for link previews and JSON-LD.
2. Add/edit the object in `src/data/jobs.json` (set `socialImageWidth/Height` to the real size).
3. Build. The build **fails** if a preview image is missing, is not a raster, or its declared
   size is wrong, so a broken preview cannot ship.

`/careers` always previews the **newest** open vacancy (by `datePosted`). A posting past its
`validThrough` date, or with `status: "closed"`, drops out of the list, sitemap and prerender on
the next build, and its page shows "Role not found" with `noindex`.

## Link previews (WhatsApp, Facebook, X, LinkedIn, Slack…)
These bots do not run JavaScript, so they read the prerendered file at
`dist/careers/<slug>/index.html`. Each file has exactly one `og:image`, canonical and JSON-LD.
Twitter card is `summary_large_image` for wide images and `summary` for square/portrait ones.

## Client-side navigation
`applyPageSeo()` (`src/lib/seo-dom.ts`) rewrites the whole head from the same data, removes stale
size/type tags and replaces (never duplicates) the page JSON-LD, which is removed on unmount.
`/careers*` is excluded from the generic `usePageSeo` so nothing overwrites it.

## Cloudflare
- Static files under `dist/careers/**` are served first.
- `_routes.json` limits Functions to `/api/*` so career HTML is not swallowed by Workers.
- SPA `_redirects` fallback still applies when no static file exists.
- Cloudflare's cache and social platforms cache previews: after changing an image, re-scrape with
  the Facebook Sharing Debugger / X Card validator, or the old image may show for a while.
