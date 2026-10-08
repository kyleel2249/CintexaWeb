import type { Contribution } from "@cintexa/db/schema";

const MONTH_LABELS: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

type Schedule = {
  userId: string;
  /** Inclusive month numbers 1–12 within year */
  months: number[];
  year: number;
  monthlyGhs: number;
};

/**
 * Verified contribution schedules by account.
 * Dashboard merges these when the signed-in user matches.
 */
const SCHEDULES: Schedule[] = [
  {
    // Feb–Dec 2026 · GHS 20 × 11 = 220
    userId: "c373f7f1-ae4a-4032-bcbb-66561e81f295",
    year: 2026,
    months: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    monthlyGhs: 20,
  },
  {
    // Feb–Jul 2026 · GHS 20 × 6 = 120
    userId: "f4c7d09e-35b8-4dad-81d9-7ce873576ee8",
    year: 2026,
    months: [2, 3, 4, 5, 6, 7],
    monthlyGhs: 20,
  },
];

/** @deprecated Prefer getSeededSchedule — kept for older imports */
export const SEEDED_CONTRIBUTOR_ID = SCHEDULES[0]!.userId;
/** @deprecated Prefer getSeededTotalGhs */
export const SEEDED_TOTAL_GHS = SCHEDULES[0]!.months.length * SCHEDULES[0]!.monthlyGhs;

export function getSeededSchedule(userId: string): Schedule | undefined {
  return SCHEDULES.find((s) => s.userId === userId);
}

export function getSeededTotalGhs(userId: string): number | null {
  const s = getSeededSchedule(userId);
  if (!s) return null;
  return s.months.length * s.monthlyGhs;
}

export function getSeededContributions(userId: string): Contribution[] {
  const schedule = getSeededSchedule(userId);
  if (!schedule) return [];

  return schedule.months.map((m) => {
    const label = MONTH_LABELS[m] ?? `Month ${m}`;
    const createdAt = new Date(Date.UTC(schedule.year, m - 1, 1, 10, 0, 0));
    const amount = schedule.monthlyGhs.toFixed(2);
    const ym = `${schedule.year}-${String(m).padStart(2, "0")}`;
    return {
      id: `seed-${userId.slice(0, 8)}-${ym}`,
      userId,
      reference: `CX-${schedule.year}-${String(m).padStart(2, "0")}-MTH`,
      type: "contribution",
      amount,
      currency: "GHS",
      platformFeeAmount: "0.00",
      netAmount: amount,
      status: "paid",
      description: `Monthly contribution — ${label} ${schedule.year}`,
      createdAt,
    } satisfies Contribution;
  });
}

export function mergeContributionsForUser(
  userId: string | null | undefined,
  apiRows: Contribution[] | undefined,
): Contribution[] {
  const seed = userId ? getSeededContributions(userId) : [];
  if (!seed.length) return apiRows ?? [];
  const api = apiRows ?? [];
  const byRef = new Map(api.map((c) => [c.reference, c]));
  for (const s of seed) {
    if (!byRef.has(s.reference)) byRef.set(s.reference, s);
  }
  return [...byRef.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
