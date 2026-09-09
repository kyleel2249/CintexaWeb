import { Link, useRoute } from "wouter";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useEffect, useState, type ReactNode } from "react";
import { useMyProfile } from "@/hooks/useApi";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { AVATAR_OPTIONS } from "@/lib/local-profile";
import { badgeMeta, checkInStreak, type BadgeId } from "@/lib/streak-badges";
import { ensureAdminReferrer } from "@/lib/social-hub";
import { ADMIN_USERNAME } from "@/lib/platform-economics";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Social", href: "/dashboard/social" },
  { label: "Templates", href: "/dashboard/templates" },
  { label: "Affiliate", href: "/dashboard/affiliate" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Pixels", href: "/dashboard/pixels" },
  { label: "Email", href: "/dashboard/email" },
  { label: "Payback", href: "/dashboard/payback" },
  { label: "FAQ", href: "/dashboard/faq" },
  { label: "Contributions", href: "/dashboard/contributions" },
  { label: "Progress", href: "/dashboard/progress" },
  { label: "Leaderboard", href: "/dashboard/leaderboard" },
  { label: "FAQ", href: "/dashboard/faq" },
  { label: "Settings", href: "/dashboard/settings" },
];

function SignedOutPrompt() {
  return (
    <div className="cx-section">
      <div className="cx-container flex flex-col items-center text-center">
        <p className="cx-eyebrow">Customer portal</p>
        <h1 className="cx-display mt-3 text-3xl">Sign in to see your dashboard.</h1>
        <p className="mt-3 max-w-sm text-[hsl(var(--fg-muted))]">
          Social scheduling, boosts, templates, affiliate tools, and personalized FAQ live here after sign-in.
        </p>
        <SignInButton mode="modal">
          <button type="button" className="cx-btn cx-btn-primary mt-6">
            Sign in
          </button>
        </SignInButton>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [, params] = useRoute("/dashboard/:tab?");
  const activeHref = params?.tab ? `/dashboard/${params.tab}` : "/dashboard";
  const { user } = useUser();
  const profile = useMyProfile();
  const avatar = AVATAR_OPTIONS.find((a) => a.id === (profile.data?.profile as { avatarId?: string } | null)?.avatarId);
  const username = (profile.data?.profile as { username?: string } | null)?.username;
  const [streakDays, setStreakDays] = useState(0);
  const [badgeId, setBadgeId] = useState<BadgeId>(null);

  useEffect(() => {
    ensureAdminReferrer();
    const s = checkInStreak();
    setStreakDays(s.consecutiveDays);
    setBadgeId(s.badgeId);
  }, []);

  const badge = badgeMeta(badgeId);

  return (
    <>
      <SignedOut>
        <SignedOutPrompt />
      </SignedOut>
      <SignedIn>
        {profile.isLoading ? (
          <div className="cx-section flex justify-center !pt-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[hsl(var(--accent))] border-t-transparent" />
          </div>
        ) : profile.data?.profile?.onboardingCompleted ? (
          <div className="cx-section !pt-10">
            <div className="cx-container">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-[hsl(var(--bg))]"
                    style={{ background: avatar?.color ?? "hsl(var(--accent))" }}
                    aria-hidden
                  >
                    {(username ?? user?.firstName ?? "C").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="cx-eyebrow">Customer portal · ref @{ADMIN_USERNAME}</p>
                    <h1 className="cx-display mt-1 text-2xl sm:text-3xl">
                      {username ? `@${username}` : `Welcome back${user?.firstName ? `, ${user.firstName}` : ""}`}
                    </h1>
                    <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
                      Daily streak: <strong>{streakDays}</strong> day{streakDays === 1 ? "" : "s"}
                      {badge ? (
                        <>
                          {" "}
                          · Badge{" "}
                          <span style={{ color: badge.color }}>{badge.label}</span>
                        </>
                      ) : (
                        " · Check in daily to earn badges"
                      )}
                      {" "}
                      · Miss a day and you drop to the previous badge (or zero).
                    </p>
                  </div>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>

              <nav
                className="mt-8 flex flex-wrap gap-1 border-b border-[hsl(var(--border))] pb-1"
                aria-label="Dashboard sections"
              >
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
        ) : (
          <OnboardingFlow />
        )}
      </SignedIn>
    </>
  );
}
