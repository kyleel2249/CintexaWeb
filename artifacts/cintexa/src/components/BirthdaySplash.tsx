import { useEffect, useMemo, useRef, useState } from "react";
import { buildGreeting } from "@/lib/greetings/greeting";
import { markBirthdaySplashSeen, shouldShowBirthdaySplash } from "@/lib/birthday-splash";

const COLORS = ["#F5C518", "#35A7FF", "#FF6B8B", "#9AE6B4", "#C084FC", "#FFB454"];

/** Deterministic pieces so the confetti is stable between renders (no random() during render). */
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  delay: `${((i * 13) % 20) / 10}s`,
  duration: `${3 + ((i * 7) % 25) / 10}s`,
  color: COLORS[i % COLORS.length],
  rotate: `${(i * 47) % 360}deg`,
  width: `${6 + (i % 3) * 3}px`,
}));

/**
 * Full-screen birthday celebration, shown once per birthday (per browser) when the signed-in user's
 * birthday is today in their own time zone. Accessible dialog: focus moves into it, Esc / the button /
 * the backdrop close it, and focus returns afterwards. Motion is off for reduced-motion users.
 */
export function BirthdaySplash({
  userId,
  name,
  dateOfBirth,
  timeZone,
}: {
  userId?: string | null;
  name?: string | null;
  dateOfBirth?: string | null;
  /** IANA zone to judge "today" in; defaults to the browser's own. */
  timeZone?: string;
}) {
  const [now] = useState(() => new Date());
  const [open, setOpen] = useState(() => shouldShowBirthdaySplash(userId, dateOfBirth, now, timeZone));
  const buttonRef = useRef<HTMLButtonElement>(null);

  const greeting = useMemo(
    () => buildGreeting({ name, now, birthday: true, seed: `${userId ?? ""}|${now.getFullYear()}` }),
    [name, now, userId],
  );

  // Record it as seen the moment it appears, so a reload doesn't repeat it.
  useEffect(() => {
    if (open && userId) markBirthdaySplashSeen(userId, now, timeZone);
  }, [open, userId, now, timeZone]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="cx-bday-backdrop"
      data-testid="birthday-splash"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="cx-bday-confetti" aria-hidden>
        {PIECES.map((p, i) => (
          <span
            key={i}
            style={{
              left: p.left,
              width: p.width,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              transform: `rotate(${p.rotate})`,
            }}
          />
        ))}
      </div>
      <div className="cx-bday-card" role="dialog" aria-modal="true" aria-labelledby="bday-title" aria-describedby="bday-msg">
        <div className="cx-bday-cake" aria-hidden>
          🎂
        </div>
        <h2 id="bday-title" className="cx-display text-2xl sm:text-3xl">
          {greeting.headline}
        </h2>
        <p id="bday-msg" className="mt-3 text-[hsl(var(--fg-muted))]">
          {greeting.message}
        </p>
        <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">With warm wishes from everyone at CINTEXA 🎉</p>
        <button ref={buttonRef} type="button" className="cx-btn cx-btn-primary mt-6" onClick={() => setOpen(false)}>
          Thank you!
        </button>
      </div>
      <style>{`
        .cx-bday-backdrop {
          position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 1rem; background: hsl(0 0% 0% / 0.65); overflow: hidden;
        }
        .cx-bday-card {
          position: relative; z-index: 1; width: 100%; max-width: 26rem; text-align: center;
          padding: 2rem 1.5rem; border-radius: 1.25rem; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border)); box-shadow: 0 20px 60px hsl(0 0% 0% / 0.5);
          animation: cx-bday-pop 0.45s cubic-bezier(.2,1.2,.4,1) both;
        }
        .cx-bday-cake { font-size: 4rem; line-height: 1; animation: cx-bday-bounce 1.6s ease-in-out infinite; }
        .cx-bday-confetti { position: absolute; inset: 0; pointer-events: none; }
        .cx-bday-confetti span {
          position: absolute; top: -12px; height: 12px; border-radius: 2px; opacity: 0.9;
          animation-name: cx-bday-fall; animation-timing-function: linear; animation-iteration-count: infinite;
        }
        @keyframes cx-bday-fall { to { top: 105%; margin-left: 24px; } }
        @keyframes cx-bday-pop { from { opacity: 0; transform: scale(0.85) translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes cx-bday-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @media (prefers-reduced-motion: reduce) {
          .cx-bday-confetti { display: none; }
          .cx-bday-card, .cx-bday-cake { animation: none; }
        }
      `}</style>
    </div>
  );
}
