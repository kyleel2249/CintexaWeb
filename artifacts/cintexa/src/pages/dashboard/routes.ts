/**
 * Single list behind both the dashboard tab bar and the router (App.tsx). A tab can only exist if
 * it has a route — a test enforces it — so a tab can never lead to the 404 page again.
 */
export const DASHBOARD_TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Email", href: "/dashboard/email" },
  { label: "FAQ", href: "/dashboard/faq" },
  { label: "Progress", href: "/dashboard/progress" },
  { label: "Contributions", href: "/dashboard/contributions" },
  { label: "Leaderboard", href: "/dashboard/leaderboard" },
  { label: "Social", href: "/dashboard/social" },
  { label: "Careers", href: "/dashboard/careers" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

export type DashboardPath = (typeof DASHBOARD_TABS)[number]["href"];

export const DASHBOARD_PATHS: readonly DashboardPath[] = DASHBOARD_TABS.map((t) => t.href);
