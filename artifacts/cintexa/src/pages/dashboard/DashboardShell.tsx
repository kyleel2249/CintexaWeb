import { Link, useRoute } from "wouter";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import type { ReactNode } from "react";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Contributions", href: "/dashboard/contributions" },
  { label: "Progress", href: "/dashboard/progress" },
  { label: "Leaderboard", href: "/dashboard/leaderboard" },
  { label: "Settings", href: "/dashboard/settings" },
];

function SignedOutPrompt() {
  return (
    <div className="cx-section">
      <div className="cx-container flex flex-col items-center text-center">
        <p className="cx-eyebrow">Customer portal</p>
        <h1 className="cx-display mt-3 text-3xl">Sign in to see your dashboard.</h1>
        <p className="mt-3 max-w-sm text-[hsl(var(--fg-muted))]">
          Your contributions, progress, and leaderboard standing live here once you're signed in.
        </p>
        <SignInButton mode="modal">
          <button className="cx-btn cx-btn-primary mt-6">Sign in</button>
        </SignInButton>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [, params] = useRoute("/dashboard/:tab?");
  const activeHref = params?.tab ? `/dashboard/${params.tab}` : "/dashboard";
  const { user } = useUser();

  return (
    <>
      <SignedOut>
        <SignedOutPrompt />
      </SignedOut>
      <SignedIn>
        <div className="cx-section !pt-10">
          <div className="cx-container">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="cx-eyebrow">Customer portal</p>
                <h1 className="cx-display mt-2 text-2xl sm:text-3xl">
                  Welcome back{user?.firstName ? `, ${user.firstName}` : ""}.
                </h1>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>

            <nav className="mt-8 flex flex-wrap gap-1 border-b border-[hsl(var(--border))] pb-1" aria-label="Dashboard sections">
              {TABS.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="cx-nav-link"
                  aria-current={activeHref === t.href ? "page" : undefined}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}
