/** Progressive daily-streak badges. Miss a day → drop one tier (or to zero). */

export const BADGE_TIERS = [
  { id: "spark", label: "Spark", minDays: 1, color: "#F5C518" },
  { id: "ember", label: "Ember", minDays: 3, color: "#F97316" },
  { id: "flame", label: "Flame", minDays: 7, color: "#EF4444" },
  { id: "beacon", label: "Beacon", minDays: 14, color: "#6BB3FF" },
  { id: "orbit", label: "Orbit", minDays: 30, color: "#7DD3C7" },
  { id: "nova", label: "Nova", minDays: 60, color: "#C4B5FD" },
] as const;

export type BadgeId = (typeof BADGE_TIERS)[number]["id"] | null;

const KEY = "cintexa.streak";

type StreakState = {
  lastCheckIn: string | null; // YYYY-MM-DD local
  consecutiveDays: number;
  badgeId: BadgeId;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  const da = new Date(a + "T12:00:00");
  const db = new Date(b + "T12:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function badgeForDays(days: number): BadgeId {
  let id: BadgeId = null;
  for (const t of BADGE_TIERS) {
    if (days >= t.minDays) id = t.id;
  }
  return id;
}

export function readStreak(): StreakState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StreakState;
  } catch {
    /* ignore */
  }
  return { lastCheckIn: null, consecutiveDays: 0, badgeId: null };
}

/** Call on dashboard visit / intentional check-in. */
export function checkInStreak(): StreakState {
  const prev = readStreak();
  const today = todayKey();

  if (prev.lastCheckIn === today) return prev;

  let consecutiveDays = 1;
  if (prev.lastCheckIn) {
    const gap = daysBetween(prev.lastCheckIn, today);
    if (gap === 1) {
      consecutiveDays = prev.consecutiveDays + 1;
    } else if (gap > 1) {
      // Missed one or more days → drop one tier worth of progress (previous badge min - 1 day floor at 0)
      const currentIdx = BADGE_TIERS.findIndex((t) => t.id === prev.badgeId);
      if (currentIdx <= 0) {
        consecutiveDays = 0;
      } else {
        const prevTier = BADGE_TIERS[currentIdx - 1];
        consecutiveDays = Math.max(0, prevTier.minDays);
      }
      // If they check in after a miss, today still counts as a new day-1 toward climbing again
      if (consecutiveDays === 0) consecutiveDays = 1;
      else consecutiveDays = consecutiveDays; // stay at previous tier floor; today doesn't auto-advance past miss penalty same day
    }
  }

  const next: StreakState = {
    lastCheckIn: today,
    consecutiveDays,
    badgeId: badgeForDays(consecutiveDays),
  };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function badgeMeta(id: BadgeId) {
  return BADGE_TIERS.find((t) => t.id === id) ?? null;
}
