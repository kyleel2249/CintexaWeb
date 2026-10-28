# Web Design & Development page — SEO, sitemap and operations

**Canonical URL:** https://cintexa.com/solutions/website-development
(`/services/web-design-development` 301-redirects here via `artifacts/cintexa/public/_redirects`; it is deliberately NOT a second page, to avoid duplicate content.)

## Where things live
| What | File |
|---|---|
| All page copy, FAQs, dateUpdated | `artifacts/cintexa/src/data/web-design.json` |
| Types/helpers | `src/data/web-design.ts` |
| Title, description, Open Graph, JSON-LD | `src/data/web-design-seo.ts` |
| React page | `src/pages/WebsiteDev.tsx` |
| Static crawlable HTML (build step) | `scripts/prerender-services.mjs` → `dist/solutions/website-development/index.html` |
| Sitemap generator / validator | `scripts/generate-sitemap.mjs`, `scripts/validate-sitemap.mjs` |
| Daily refresh | `.github/workflows/daily-sitemap.yml` (02:17 UTC) |
| IndexNow (Bing etc.) | `scripts/indexnow.mjs` + key file `public/<key>.txt` |

Editing copy: change `web-design.json`, bump `dateUpdated` (only when content really changed — it becomes the sitemap `lastmod`), commit to `main`.

## Daily sitemap
1. Workflow regenerates `sitemap.xml` from route list + blog, jobs, campaigns, case studies, service page data.
2. `validate-sitemap.mjs` checks XML shape, HTTPS/canonical domain, duplicates, trailing slashes, private routes, `lastmod` format. On failure the job stops and the last valid sitemap stays committed.
3. If the file changed, it is committed and `deploy-pages.yml` is started explicitly (commits made with `GITHUB_TOKEN` do not trigger other workflows). Unchanged sitemap = no commit, no deploy.
4. Failures show as a failed run in GitHub → Actions (enable email notifications for failed workflows in your GitHub notification settings).
Required: Actions workflow permissions "Read and write" (Settings → Actions → General). No secrets needed.

## Search engines (manual — needs your accounts)
**Google Search Console:** add property `https://cintexa.com` (domain property via DNS TXT record is best) → Sitemaps → submit `sitemap.xml` → URL inspection → paste the page URL → Request indexing. Watch Pages, Performance (queries/impressions/clicks) and Core Web Vitals reports.
**Bing Webmaster Tools:** add the site (or import from Search Console) → submit `sitemap.xml`.
**IndexNow (Bing, Yandex, etc.; not Google):** after a deploy is live: `node artifacts/cintexa/scripts/indexnow.mjs /solutions/website-development /sitemap.xml`. Needs `https://cintexa.com/<key>.txt` to be reachable.
Nothing here has been submitted or verified yet; indexing and ranking are decided by the search engines.

## Cloudflare
- Add a redirect `www.cintexa.com/*` → `https://cintexa.com/$1` (301) so one host is canonical.
- Pages project `cintexa-growth-platform`; secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` already used by `deploy-pages.yml`.

## Verify after deploy
```
curl -sI https://cintexa.com/solutions/website-development | head -1          # 200
curl -sI https://cintexa.com/services/web-design-development | grep -i location # → /solutions/website-development (301)
curl -s https://cintexa.com/solutions/website-development | grep -c '<h1'      # static HTML has content
curl -s https://cintexa.com/sitemap.xml | grep website-development
curl -sI https://cintexa.com/images/og-web-design-development.png | head -1
```
Then test the JSON-LD with Google's Rich Results Test and the preview with a social debugger.

## Rollback
`git revert <commit>` and push to `main` (the deploy workflow republishes). The sitemap and redirect are in the same commit, so one revert restores the previous state. To drop only the alias: remove the two `/services/web-design-development` lines from `public/_redirects`.
