import { Link, useLocation, useRoute } from "wouter";
import { useAuth, useUser } from "@/lib/auth";
import { useEffect, useState, type ReactNode } from "react";
import { useMyProfile } from "@/hooks/useApi";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { AVATAR_OPTIONS } from "@/lib/local-profile";
import { badgeMeta, checkInStreak, type BadgeId } from "@/lib/streak-badges";
import { ensureAdminReferrer } from "@/lib/social-hub";
import { DASHBOARD_TABS } from "./routes";
import { WelcomeGreeting } from "@/components/WelcomeGreeting";
import { useCurrency } from "@/lib/currency/context";
import { buildGreeting } from "@/lib/greetings/greeting";
import { sessionNonce } from "@/lib/greetings/welcome";

function SignedOutPrompt() {
  const [pathname] = useLocation();
  // Bring the visitor back to the exact dashboard page they asked for after they sign in.
  const next = pathname.startsWith("/dashboard") ? `?next=${encodeURIComponent(pathname)}` : "";
  return (
    <div className="cx-section">
      <div className="cx-container flex flex-col items-center text-center">
        <p className="cx-eyebrow">Customer portal</p>
        <h1 className="cx-display mt-3 text-3xl">Get started to access your dashboard.</h1>
        <p className="mt-3 max-w-sm text-[hsl(var(--fg-muted))]">
          Share your details on Get Started. Your metrics, progress, leaderboard, and tools will be available once your account is active.
        </p>
        <Link href={`/get-started${next}`} className="cx-btn cx-btn-primary mt-6">
          Get started
        </Link>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [, params] = useRoute("/dashboard/:tab?");
  const activeHref = params?.tab ? `/dashboard/${params.tab}` : "/dashboard";
  const { user } = useUser();
  const { isSignedIn, signOut } = useAuth();
  const profile = useMyProfile();

  const [streakDays, setStreakDays] = useState(0);
  const [badgeId, setBadgeId] = useState<BadgeId>(null);

  useEffect(() => {
    ensureAdminReferrer();
    const s = checkInStreak();
    setStreakDays(s.consecutiveDays);
    setBadgeId(s.badgeId);
  }, []);

  const badge = badgeMeta(badgeId);
  const username = (profile.data?.profile as { username?: string } | null)?.username;
  const avatarId = (profile.data?.profile as { avatarId?: string } | null)?.avatarId;
  const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);

  // Time-, weekday- and holiday-aware greeting by name (wording is stable for the whole session).
  const { region } = useCurrency();
  const greetName = user?.firstName ?? username ?? null;
  const [greetNow] = useState(() => new Date());
  const headerGreeting = buildGreeting({
    name: greetName,
    now: greetNow,
    country: region,
    kind: "visit",
    seed: `${user?.id ?? ""}|${sessionNonce()}`,
    streakDays,
  });

  return (
    <>
      {!isSignedIn ? (
        <SignedOutPrompt />
      ) : profile.isLoading ? (
          <div className="cx-section">
            <div className="cx-container">
              <p className="text-sm text-[hsl(var(--fg-muted))]">Loading your portal…</p>
            </div>
          </div>
        ) : profile.data?.profile?.onboardingCompleted ? (
          <div className="cx-section !pt-10">
            <div className="cx-container">
              <WelcomeGreeting name={greetName} userId={user?.id} country={region} streakDays={streakDays} />
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
                    <h1 className="cx-display text-2xl sm:text-3xl">
                      {headerGreeting.headline}
                    </h1>
                    <p className="mt-1 text-xs text-[hsl(var(--fg-muted))]">
                      {username ? <>@{username} · </> : null}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/" className="cx-btn cx-btn-secondary cx-btn-sm">
                    ← Back to site
                  </Link>
                  <button
                    type="button"
                    className="cx-btn cx-btn-secondary cx-btn-sm"
                    onClick={() => void signOut().then(() => { window.location.href = "/"; })}
                  >
                    Log out
                  </button>
                </div>
              </div>

              <nav
                className="mt-8 flex gap-1 overflow-x-auto border-b border-[hsl(var(--border))] pb-1"
                aria-label="Dashboard sections"
              >
                {DASHBOARD_TABS.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="cx-nav-link shrink-0 whitespace-nowrap"
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
          <>
            <div className="cx-container" style={{ paddingTop: "1.5rem" }}>
              <WelcomeGreeting name={greetName} userId={user?.id} country={region} streakDays={streakDays} />
            </div>
            <OnboardingFlow />
          </>
        )}
    </>
  );
}
