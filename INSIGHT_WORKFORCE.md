# CINTEXA Insight Workforce

Customer-facing specialists are named **`[Tab] Insight`** (never "AI Employee" / "AI Agent").

## Specialists (enabled)

| Tab | Specialist |
|-----|------------|
| Social | Social Insight |
| Templates | Template Insight |
| Affiliate | Affiliate Insight |
| Analytics | Analytics Insight |
| Pixels | Pixels Insight |
| Email | Email Insight |
| Payback | Payback Insight |
| FAQ | FAQ Insight |
| Contributions | Contribution Insight |
| Progress | Progress Insight |
| Leaderboard | Leaderboard Insight |
| Settings | Settings Insight |

## Architecture (client foundation)

- `src/lib/insights/types.ts` — structured `InsightResult` schema
- `src/lib/insights/registry.ts` — extensible specialist registry
- `src/lib/insights/engine.ts` — deterministic runners (evidence-first, zero fabrication)
- `src/components/insights/InsightPanel.tsx` — shared UI on every dashboard tab

## Principles

1. **Evidence first** — only authorized account data; missing sources are disclosed.
2. **Deterministic metrics** — totals, percentages, ranks, fees computed in code.
3. **No silent actions** — recommendations may require approval; Insights never move money or change security settings.
4. **Account isolation** — each report is scoped to the signed-in account / local workspace data.

## Data sources (current deployment)

| Source | Status |
|--------|--------|
| Social connections / posts | Workspace local (ready for OAuth) |
| Contributions, activity, loyalty, subscription | API when available |
| Daily streak / badges | Local streak store |
| Pixels | Local config IDs |
| Affiliate commissions, email campaigns, payback ledger, live analytics | **Not connected** — reported as insufficient/partial |

## UI

Each tab includes **Generate Insight**, metrics, findings, recommendations, evidence, limitations, confidence, and on-device insight history.

## Extending

1. Add config to `INSIGHT_SPECIALISTS` in `registry.ts`.
2. Implement a runner in `engine.ts`.
3. Mount `<InsightPanel tab="…" />` on the tab page.
4. Prefer server-side orchestration when the API + DB insight tables are deployed.
