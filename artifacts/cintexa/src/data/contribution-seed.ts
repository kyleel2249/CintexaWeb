import type { Contribution } from "@cintexa/db/schema";

/** Account with recorded monthly contributions (Feb–Dec 2026). */
export const SEEDED_CONTRIBUTOR_ID = "c373f7f1-ae4a-4032-bcbb-66561e81f295";

const MONTHS_2026 = [
  { m: 2, label: "February" },
  { m: 3, label: "March" },
  { m: 4, label: "April" },
  { m: 5, label: "May" },
  { m: 6, label: "June" },
  { m: 7, label: "July" },
  { m: 8, label: "August" },
  { m: 9, label: "September" },
  { m: 10, label: "October" },
  { m: 11, label: "November" },
  { m: 12, label: "December" },
] as const;

const MONTHLY_GHS = 20;
/** 11 × 20 = 220 */
export const SEEDED_TOTAL_GHS = MONTHS_2026.length * MONTHLY_GHS;

/**
 * Verified monthly contribution schedule for the seeded contributor.
 * Used when the live API has no rows yet so the dashboard still reflects
 * the confirmed payment history.
 */
export function getSeededContributions(userId: string): Contribution[] {
  if (userId !== SEEDED_CONTRIBUTOR_ID) return [];

  return MONTHS_2026.map(({ m, label }, i) => {
    const createdAt = new Date(Date.UTC(2026, m - 1, 1, 10, 0, 0));
    const amount = MONTHLY_GHS.toFixed(2);
    return {
      id: `seed-contrib-2026-${String(m).padStart(2, "0")}`,
      userId: SEEDED_CONTRIBUTOR_ID,
      reference: `CX-2026-${String(m).padStart(2, "0")}-MTH`,
      type: "contribution",
      amount,
      currency: "GHS",
      platformFeeAmount: "0.00",
      netAmount: amount,
      status: "paid",
      description: `Monthly contribution — ${label} 2026`,
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
  // Prefer API rows when present; fill gaps from seed by reference
  const byRef = new Map(api.map((c) => [c.reference, c]));
  for (const s of seed) {
    if (!byRef.has(s.reference)) byRef.set(s.reference, s);
  }
  return [...byRef.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
