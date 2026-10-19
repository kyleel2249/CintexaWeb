# Case studies

## One source of truth
All case studies live in **`src/data/case-studies.json`**. The list (`/case-studies`), every case page
(`/case-studies/<slug>`), the prerendered HTML for crawlers and link-preview bots, the structured data and the
sitemap are all generated from it — there is no second copy to keep in sync.

## Honesty rules (enforced by tests)
- `status: "illustrative"` — describes a typical engagement. It must contain **no invented figures** (no %,
  currency, counts of clients/orders…), no client name and no evidence. It is labelled "Illustrative scenario"
  on the page, the preview image and the social title.
- `status: "verified"` — only with a named `client`, `permission: true` and a non-empty `evidence` list
  (`metric`, `before`, `after`, `period`, `source`). Evidence renders as a "Measured results" table.
Each case also has a **measurement plan** (what would be measured and how) — no numbers, so it stays true.

## Add or edit a case
1. Add/edit the object in `case-studies.json` (use a unique URL-safe `slug`; `serviceHref` must be a real
   `/solutions/…` page).
2. Regenerate the preview card: `npm i --no-save @resvg/resvg-js && npx tsx scripts/make-case-images.mjs`.
   The file name carries a hash of title + service + status, so after changing any of those the old card is
   rejected (tests and the build fail) until you regenerate; social networks also fetch the new picture.
3. Build. Pages, previews and the sitemap update themselves.

## Features
Search, service / industry / type filters and sorting (state kept in the URL) · a page and URL per case ·
"On this page" contents list that follows your scrolling · key facts · measurement plan · share (copy link, device
share sheet, WhatsApp, LinkedIn, X, Facebook, email) · print / save as PDF · "Planning something similar?" opens
**Contact** pre-filled with the case (`/contact?subject=…&message=…`) · related cases and previous / next ·
per-case preview image, Open Graph / Twitter tags and Article structured data (no invented reviews or ratings).
