import { useMemo, useState, useEffect } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyActivity, useMyLoyalty, useMySubscription } from "@/hooks/useApi";
import { BADGE_TIERS, badgeMeta, checkInStreak, type BadgeId } from "@/lib/streak-badges";

export function DashboardProgress() {
  const activity = useMyActivity();
  const loyalty = useMyLoyalty();
  const subscription = useMySubscription();

  const [streakDays, setStreakDays] = useState(0);
  const [badgeId, setBadgeId] = useState<BadgeId>(null);

  useEffect(() => {
    const s = checkInStreak();
    setStreakDays(s.consecutiveDays);
    setBadgeId(s.badgeId);
  }, []);

  const badge = badgeMeta(badgeId);
  const currentIdx = useMemo(
    () => (badgeId ? BADGE_TIERS.findIndex((t) => t.id === badgeId) : -1),
    [badgeId],
  );

  const hasActivity = (activity.data?.activity.length ?? 0) > 0;
  const hasContribution =
    activity.data?.activity.some((a) => a.eventType.startsWith("contribution")) ?? false;
  const plan = subscription.data?.subscription?.plan;
  const balance = loyalty.data?.balance ?? 0;

  const milestones = [
    { title: "Account created", done: true },
    { title: "First activity recorded", done: hasActivity },
    { title: "First contribution", done: hasContribution },
    { title: "On the Growth plan", done: plan === "growth" || plan === "enterprise" },
    { title: "1,000 loyalty points", done: balance >= 1000 },
  ];

  const loading = activity.isLoading || loyalty.isLoading || subscription.isLoading;
  const completed = milestones.filter((m) => m.done).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <DashboardShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="cx-card">
          <div className="flex items-center justify-between">
            <p className="cx-eyebrow">Growth journey</p>
            <span className="text-sm text-[hsl(var(--fg-muted))]">{loading ? "..." : `${pct}%`}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]">
            <div
              className="h-full rounded-full bg-[hsl(var(--accent))] transition-[width]"
              style={{ width: loading ? "0%" : `${pct}%` }}
            />
          </div>
          <ul className="mt-6 flex flex-col gap-3">
            {milestones.map((m) => (
              <li key={m.title} className="flex items-center gap-3 text-sm">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
                  style={{
                    background: m.done ? "hsl(var(--accent))" : "hsl(var(--bg-inset))",
                    color: m.done ? "hsl(var(--accent-ink))" : "hsl(var(--fg-muted))",
                  }}
                >
                  {m.done ? "OK" : ""}
                </span>
                <span className={m.done ? "" : "text-[hsl(var(--fg-muted))]"}>{m.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="cx-card">
          <p className="cx-eyebrow">Daily streak badges</p>
          <h2 className="cx-display mt-2 text-xl">
            {badge ? (
              <>
                Current: <span style={{ color: badge.color }}>{badge.label}</span>
              </>
            ) : (
              "No badge yet - check in daily"
            )}
          </h2>
          <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
            <strong>{streakDays}</strong> consecutive day{streakDays === 1 ? "" : "s"}. Miss a day and you
            drop to the previous badge (or zero). Check in by visiting the dashboard each day.
          </p>

          <ol className="mt-6 flex flex-col gap-3">
            {BADGE_TIERS.map((t, i) => {
              const earned = currentIdx >= i;
              const isCurrent = badgeId === t.id;
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: isCurrent ? t.color : "hsl(var(--border))",
                    background: earned
                      ? `color-mix(in srgb, ${t.color} 12%, transparent)`
                      : "transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: earned ? t.color : "hsl(var(--fg-muted))" }}
                    />
                    <span
                      style={{
                        color: earned ? t.color : undefined,
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                  <span className="text-xs text-[hsl(var(--fg-muted))]">{t.minDays}+ days</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </DashboardShell>
  );
}
