# SEO, AEO & GEO — how CINTEXA's search infrastructure works

## Single sources of truth (`artifacts/cintexa/src/data/`)
| File | Owns |
|---|---|
| `site-entity.ts` | Brand facts (name, definition, email, phone, WhatsApp, sameAs, areaServed), the 6 services, URL helpers. Change a fact here and it changes everywhere. |
| `seo-schema.ts` | Reusable JSON-LD builders: Organization, WebSite, WebPage, Service, BreadcrumbList, FAQPage, ItemList, BlogPosting; `graph()` dedupes by `@id`. |
| `seo-pages.ts` | Registry of 15 static pages (title, description, h1, breadcrumbs, schema type) → `staticPageSeo(path)`. |
| `seo-blog.ts`, `blog-posts.ts` | Article data and article SEO/BlogPosting schema. |
| `page-content.ts` | Answer-first blocks, FAQs, audiences, problems, related links for the solution pages, home and `/platform`. |

The React pages render this data; `scripts/prerender-pages.mjs` renders the **same data** to static HTML, so HTML, JSON-LD, `llms.txt` and the visible page cannot disagree.

## Build pipeline
`tsc -b → generate-sitemap → vite build → prerender-careers → prerender-case-studies → prerender-services → prerender-pages → check-seo`
- `prerender-pages` must run last of the prerenders (it consumes the pristine `dist/index.html` shell, then overwrites it with the prerendered home page; the original shell is the basis for `dist/app-shell/index.html`).
- `check-seo` fails the build on: missing title/description/canonical/OG, ≠1 `<h1>`, canonical not matching URL, invalid JSON-LD, Review/AggregateRating/Offer in JSON-LD, `<img>` without alt, broken internal links, duplicate titles/descriptions, sitemap URLs without files or that redirect, missing robots sitemap line / llms.txt / 404.html.

## Status codes (Cloudflare Pages)
`_redirects` maps only client-only routes (`/sign-in`, `/sign-up`, `/dashboard/*`, `/admin/*`) to the noindex app shell. Anything else that is not a file returns `404.html` with a real 404. **Confirm on a preview deploy** (curl -I a nonsense URL → 404; /dashboard → 200).

## Entity & GEO
One Organization node (`https://cintexa.com/#organization`) is referenced by every page. No LocalBusiness / address / rating is published because none is verified. `llms.txt` and `llms-full.txt` are generated at build; they are a convention, not a ranking signal. AI-crawler policy lives in `public/robots.txt` (all major AI crawlers currently allowed on public pages — owner decision, see below).

## Keyword / intent clusters (guide for content, not for stuffing)
- **Software development** — "custom software development Ghana", "business management software for SMEs" (informational/commercial) → `/solutions/software-development`
- **Websites** — "website development Accra", "how much does a business website cost" (answer: depends on scope; no public price list) → `/solutions/website-development`
- **Business automation** — "how to automate small business processes" → `/platform`, article *business-automation-for-small-businesses*
- **E-commerce** — "start an online store in Ghana", "mobile money checkout" → `/solutions/ecommerce`
- **Marketing / SEO / Ads** — "technical SEO checklist", "marketing metrics to track" → `/solutions/marketing`, `/solutions/ads-boost`
- **Sales / CRM** — "CRM data quality", "lead follow-up" → `/solutions/sales`
- **Brand/entity** — "what is CINTEXA" → home, `/about`
Add a page only when a cluster has a real search need and original content; never mass-produce thin pages.

## Owner actions (cannot be done from code)
1. Redirect `www.cintexa.com` → `https://cintexa.com` in Cloudflare (Redirect Rules).
2. Verify the site in Google Search Console and Bing Webmaster Tools; submit `/sitemap.xml`. Nothing is claimed as connected until you do.
3. Review copy in Ads Boost / Sales / Marketing pages and the FAQs in `page-content.ts` for accuracy.
4. Decide AI-crawler policy (e.g. block `Bytespider`, `CCBot` if undesired) in `robots.txt`.
5. Add a verified street address / more official profiles to `site-entity.ts` only when real; then LocalBusiness schema can be considered.
6. Self-host remaining Unsplash images (blog/careers) for speed and reliability.
7. Run Lighthouse / PageSpeed Insights on the preview deploy; this was not possible in the build sandbox.
