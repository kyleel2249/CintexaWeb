# CINTEXA Insight Workforce

Customer-facing specialists are named **[Tab] Insight** only. Never "AI", "AI Agent", or "AI Employee".

## Overview page

- Clean account command center with verified metrics only.
- No "AI Insight Foundation" or equivalent placeholder.
- Optional deep analysis: **View account analysis** → Overview Insight (on demand only).

## Specialists

| Tab | Display name |
|-----|----------------|
| Overview | Overview Insight |
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

## Principles

1. Evidence-first — every finding links to sources.
2. Zero fabrication — insufficient data is stated explicitly.
3. Deterministic arithmetic for financials and totals.
4. Minimum necessary data access per specialist.
5. Structured reports: summary, metrics, findings, trends, opportunities, recommendations, evidence, limitations, confidence.

## Server-side runs

- `POST /api/insights/runs` — generate + persist (Clerk auth)
- `GET /api/insights/runs` — history
- `GET /api/insights/flags` — enabled map
- `GET /api/insights/signals` — cross-tab signals
- `GET /api/insights/notifications` — notifications
- `POST /api/insights/feedback` — quality feedback

Admin (`x-admin-key`):

- `GET/PUT /api/admin/insights/flags`
- `GET /api/admin/insights/feedback`
- `GET /api/admin/insights/runs`

## Database

Migration: `lib/db/drizzle/0004_insight_workforce.sql`

Tables: `insight_specialist_flags`, `insight_runs`, `insight_signals`, `insight_notifications`, `insight_feedback`

## 3D visuals

`InsightVisual` uses motion profile (`allow3D` / `prefers-reduced-motion`). Fallback is CSS orbital metrics. Decorative only — report text is authoritative.

## Architecture

- `src/lib/insights/types.ts` — report schema
- `src/lib/insights/registry.ts` — specialist registry
- `src/lib/insights/engine.ts` — client deterministic runners
- `src/lib/insights/server-api.ts` — API client
- `src/components/insights/InsightPanel.tsx` — shared UI
- `src/components/insights/InsightVisual.tsx` — motion-aware visual
- `artifacts/api-server/src/routes/insights.ts` — server runs

Generate reports via **Generate Insight** on each dashboard tab. Client engine is the offline fallback.
