# CINTEXA Insight Workforce

Customer-facing specialists are named **[Tab] Insight** only. Never "AI", "AI Agent", or "AI Employee".

## Overview page

- Clean account command center with verified metrics only.
- No "AI Insight Foundation" or equivalent placeholder.
- Optional deep analysis: **View account analysis** → Overview Insight (on demand).

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

## Architecture

- `src/lib/insights/types.ts` — report schema
- `src/lib/insights/registry.ts` — specialist registry
- `src/lib/insights/engine.ts` — deterministic runners
- `src/components/insights/InsightPanel.tsx` — shared UI

Generate reports via **Generate Insight** on each dashboard tab. History is stored locally per browser.
