# Platform foundations

CINTEXA is a scalable growth platform with:
- Subscriptions & entitlements — `subscriptions` table, `/api/subscriptions`, wired to the Pricing page
- Loyalty ledger — event-sourced `loyalty_ledger` table, `/api/loyalty`, dashboard Overview + Progress
- Public leaderboard — `/api/leaderboard`, opted-in customers only, computed from real loyalty totals
- Admin surface — `/api/admin/customers` and `/api/admin/loyalty/adjust`, gated by `ADMIN_API_KEY`
- Platform modules (e-commerce, ads, CRM, AI, BI, portals)
- Customer contributions / payments tracking
- Progress, leaderboard, activity history — all live-queried from the API, not sample data

See `lib/db` schema and `artifacts/api-server` routes for implementation.
