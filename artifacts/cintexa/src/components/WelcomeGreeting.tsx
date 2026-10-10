import { useEffect, useMemo, useState } from "react";
import { buildGreeting } from "@/lib/greetings/greeting";
import { dismissWelcome, takeWelcome, type Welcome } from "@/lib/greetings/welcome";

/**
 * One-time welcome shown right after sign-in or sign-up: greets the user by name, with wording that
 * depends on the time of day, weekday, their country's holidays and their streak, and that changes
 * from one sign-in to the next. Closes itself after a few seconds (or on dismiss).
 */
export function WelcomeGreeting({
  name,
  userId,
  country,
  streakDays,
}: {
  name?: string | null;
  userId?: string | null;
  country?: string | null;
  streakDays?: number;
}) {
  const [welcome, setWelcome] = useState<Welcome | null>(() => takeWelcome());
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (!welcome) return;
    const timer = setTimeout(() => {
      dismissWelcome();
      setWelcome(null);
    }, Math.max(welcome.expiresAt - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [welcome]);

  const greeting = useMemo(
    () =>
      welcome
        ? buildGreeting({
            name,
            now,
            country,
            kind: welcome.kind,
            seed: `${userId ?? ""}|${welcome.nonce}`,
            streakDays,
          })
        : null,
    [welcome, name, now, country, userId, streakDays],
  );

  if (!welcome || !greeting) return null;

  return (
    <div
      className="cx-card mb-6 flex items-start gap-4 border-l-4"
      style={{ borderLeftColor: "hsl(var(--accent))" }}
      role="status"
      aria-live="polite"
      data-testid="welcome-greeting"
    >
      {greeting.emoji && (
        <span className="text-3xl leading-none" aria-hidden>
          {greeting.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="cx-display text-xl sm:text-2xl">{greeting.headline}</h2>
        <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">{greeting.message}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--fg))]"
        aria-label="Dismiss welcome message"
        onClick={() => {
          dismissWelcome();
          setWelcome(null);
        }}
      >
        ×
      </button>
    </div>
  );
}
