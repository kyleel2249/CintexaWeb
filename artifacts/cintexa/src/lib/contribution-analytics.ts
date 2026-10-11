/**
 * Pure analytics over a user's settled contributions. Amounts must already be in the display
 * currency (see lib/contributions.planDisplay). Everything returned is derived from the data —
 * nothing is estimated or invented.
 */

export type AnalyticsRow = { date: Date | string; amount: number };

export type MonthTile = {
  month: number; // 1–12
  label: string; // "Jan"
  amount: number;
  count: number;
  paid: boolean;
  /** after the current month, in the analysed year */
  upcoming: boolean;
  current: boolean;
};

export type QuarterSlice = {
  quarter: 1 | 2 | 3 | 4;
  label: string; // "Q1"
  range: string; // "Jan–Mar"
  amount: number;
  count: number;
  share: number; // 0–1 of the analysed year's total
};

export type Milestone = {
  pct: 25 | 50 | 75 | 100;
  reached: boolean;
  /** "Jun 2026" */
  reachedOn: string | null;
  /** running total on that day */
  amountAtReach: number | null;
};

export type ContributionAnalytics = {
  year: number | null;
  spansMultipleYears: boolean;
  total: number;
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  /** every payment was the same amount */
  uniform: boolean;
  first: { label: string; amount: number } | null;
  last: { label: string; amount: number } | null;
  months: MonthTile[];
  monthsPaid: number;
  /** longest run of consecutive paid months (across all years) */
  longestStreak: number;
  /** the latest paid month is this month or last month */
  streakActive: boolean;
  /** missing months between the first and last payment */
  gaps: number;
  quarters: QuarterSlice[];
  topMonth: { label: string; amount: number; share: number } | null;
  milestones: Milestone[];
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTER_RANGE = ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"];

const ym = (y: number, m: number) => y * 12 + (m - 1);
const money = (n: number) => Math.round(n * 100) / 100;

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

export function analyzeContributions(rows: AnalyticsRow[], now: Date = new Date()): ContributionAnalytics {
  const items = rows
    .map((r) => ({ d: new Date(r.date), amount: Number(r.amount) || 0 }))
    .filter((r) => !Number.isNaN(r.d.getTime()))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  const total = money(items.reduce((s, i) => s + i.amount, 0));
  const amounts = items.map((i) => i.amount);
  const label = (d: Date) => `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  const year = items.length ? (items[items.length - 1] as (typeof items)[number]).d.getUTCFullYear() : null;
  const spansMultipleYears = items.some((i) => i.d.getUTCFullYear() !== year);
  const nowYm = ym(now.getUTCFullYear(), now.getUTCMonth() + 1);

  // 12-month year view for the latest year with data
  const months: MonthTile[] = MONTH_SHORT.map((l, i) => {
    const inMonth = year === null ? [] : items.filter((it) => it.d.getUTCFullYear() === year && it.d.getUTCMonth() === i);
    const key = year === null ? -1 : ym(year, i + 1);
    return {
      month: i + 1,
      label: l,
      amount: money(inMonth.reduce((s, it) => s + it.amount, 0)),
      count: inMonth.length,
      paid: inMonth.length > 0,
      upcoming: key > nowYm,
      current: key === nowYm,
    };
  });

  // Streaks over distinct paid months, across all years
  const paidKeys = [...new Set(items.map((i) => ym(i.d.getUTCFullYear(), i.d.getUTCMonth() + 1)))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  paidKeys.forEach((k, idx) => {
    run = idx > 0 && k === (paidKeys[idx - 1] as number) + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const lastKey = paidKeys.length ? (paidKeys[paidKeys.length - 1] as number) : null;
  const gaps = paidKeys.length ? (lastKey as number) - (paidKeys[0] as number) + 1 - paidKeys.length : 0;

  // Quarters of the analysed year
  const yearTotal = months.reduce((s, m) => s + m.amount, 0);
  const quarters: QuarterSlice[] = ([1, 2, 3, 4] as const).map((q) => {
    const slice = months.slice((q - 1) * 3, q * 3);
    const amount = money(slice.reduce((s, m) => s + m.amount, 0));
    return {
      quarter: q,
      label: `Q${q}`,
      range: QUARTER_RANGE[q - 1] as string,
      amount,
      count: slice.reduce((s, m) => s + m.count, 0),
      share: yearTotal > 0 ? amount / yearTotal : 0,
    };
  });

  const top = [...months].filter((m) => m.paid).sort((a, b) => b.amount - a.amount)[0];

  // Milestones on the running total across all payments
  const milestones: Milestone[] = ([25, 50, 75, 100] as const).map((pct) => {
    if (total <= 0) return { pct, reached: false, reachedOn: null, amountAtReach: null };
    let running = 0;
    for (const it of items) {
      running += it.amount;
      if (running + 1e-9 >= (total * pct) / 100) {
        return { pct, reached: true, reachedOn: label(it.d), amountAtReach: money(running) };
      }
    }
    return { pct, reached: false, reachedOn: null, amountAtReach: null };
  });

  const first = items[0];
  const last = items[items.length - 1];
  return {
    year,
    spansMultipleYears,
    total,
    count: items.length,
    average: items.length ? money(total / items.length) : 0,
    median: money(median(amounts)),
    min: amounts.length ? Math.min(...amounts) : 0,
    max: amounts.length ? Math.max(...amounts) : 0,
    uniform: amounts.length > 0 && amounts.every((a) => Math.abs(a - (amounts[0] as number)) < 0.005),
    first: first ? { label: label(first.d), amount: money(first.amount) } : null,
    last: last ? { label: label(last.d), amount: money(last.amount) } : null,
    months,
    monthsPaid: months.filter((m) => m.paid).length,
    longestStreak: longest,
    streakActive: lastKey !== null && nowYm - lastKey <= 1,
    gaps,
    quarters,
    topMonth: top ? { label: top.label, amount: top.amount, share: yearTotal > 0 ? top.amount / yearTotal : 0 } : null,
    milestones,
  };
}
