# Currency & region

Contributions are recorded in **GHS** (the platform base currency, `lib/db` default). The dashboard
shows every amount in the visitor's **own currency**.

## How the currency is chosen (first match wins)
1. **Settings → Display currency** (stored in this browser; "Automatic" clears it)
2. **Country on the profile** (Settings → Country)
3. **Country Cloudflare sees for the request** — `GET /api/geo` (no third party, no cookies)
4. **Browser language region** (`en-GH` → Ghana)
5. **Time zone** (`Africa/Accra` → Ghana)
6. **GHS**

Country → currency lives in `src/lib/currency/countries.ts`; the pure resolver is `geo.ts`.

## Conversion
- Rates come from `GET /api/fx?base=GHS`, a Pages Function that proxies open.er-api.com and lets
  Cloudflare cache it for 6 hours. The browser never calls the third party directly.
- Rates are cached in `localStorage` (fresh 12 h; an older copy up to 7 days is used if the
  network fails).
- **Nothing is ever guessed.** If no real rate is available the page shows the recorded currency
  (GHS) with a note, and rows in a currency that can't be converted are excluded from totals and
  called out — never added with a made-up rate.
- Converted amounts are prefixed "≈" and hovering shows the recorded amount; the Contributions
  table lists both. Users already in GHS see exact, unconverted figures.
- Display only: stored payment records are never changed.

## Using it in code
- `useMoney(["GHS"])` → `format(amount, from)`, `plan(rows)`, `currency`, `source`.
- `<Money amount={20} currency="GHS" />` for a single amount.
- `planDisplay` (`lib/contributions.ts`) decides how a list of rows is shown (convert / fall back /
  exclude) and is what the Overview, Contributions page and Insights all share.

## Attribution
Exchange rates by ExchangeRate-API (open.er-api.com) — shown on the Contributions page whenever
conversion is used. Check their current terms before heavy production traffic.
