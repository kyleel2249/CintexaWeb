import { convertAmount, type RatesPayload } from "@/lib/currency/fx";
import { BASE_CURRENCY, normalizeCurrency } from "@/lib/currency/geo";

type StatusLike = { status?: string | null };

const SETTLED = new Set(["paid", "completed", "succeeded", "success", "settled"]);
const OPEN = new Set(["pending", "processing", "initiated", "authorized"]);

/** A contribution counts toward totals when it is settled (or the record carries no status). */
export function isSettled(c: StatusLike): boolean {
  const s = c.status?.toString().trim().toLowerCase();
  return !s || SETTLED.has(s);
}

export type StatusTone = "success" | "warning" | "danger";

export function statusTone(status?: string | null): StatusTone {
  const s = status?.toString().trim().toLowerCase();
  if (!s || SETTLED.has(s)) return "success";
  if (OPEN.has(s)) return "warning";
  return "danger";
}

export function statusLabel(status?: string | null): string {
  const s = status?.toString().trim();
  return s ? s : "recorded";
}

export type MoneyRow = { amount?: number | string | null; currency?: string | null };

export type DisplayItem<T> = {
  row: T;
  /** Amount in `plan.currency`. */
  amount: number;
  original: { amount: number; currency: string };
  converted: boolean;
};

export type DisplayPlan<T> = {
  /** Currency every `items[].amount` is expressed in. */
  currency: string;
  items: DisplayItem<T>[];
  /** Rows that could not be shown in `currency` (no exchange rate) — never silently summed. */
  excluded: T[];
  /** True when at least one amount was converted from another currency. */
  usedConversion: boolean;
  /** True when we wanted `target` but had to fall back to the rows' own currency. */
  fellBack: boolean;
};

/**
 * Decides how to show a list of money rows in the user's currency.
 * - Everything convertible → all amounts in `target` (exact when already in `target`).
 * - Otherwise → fall back to the rows' own (most common) currency; rows in other currencies are
 *   listed in `excluded` rather than being added into a total with a made-up rate.
 */
export function planDisplay<T extends MoneyRow>(
  rows: T[],
  target: string,
  ratesByBase: Record<string, RatesPayload | undefined>,
): DisplayPlan<T> {
  const tgt = normalizeCurrency(target) ?? BASE_CURRENCY;
  const parsed = rows.map((row) => ({
    row,
    cur: normalizeCurrency(row.currency) ?? BASE_CURRENCY,
    amt: Number(row.amount) || 0,
  }));

  const converted = parsed.map((p) => ({ ...p, value: convertAmount(p.amt, p.cur, tgt, ratesByBase[p.cur]) }));
  if (converted.every((c) => c.value !== null)) {
    return {
      currency: tgt,
      items: converted.map((c) => ({
        row: c.row,
        amount: c.value as number,
        original: { amount: c.amt, currency: c.cur },
        converted: c.cur !== tgt,
      })),
      excluded: [],
      usedConversion: converted.some((c) => c.cur !== tgt),
      fellBack: false,
    };
  }

  const counts = new Map<string, number>();
  for (const p of parsed) counts.set(p.cur, (counts.get(p.cur) ?? 0) + 1);
  const native = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? BASE_CURRENCY;
  return {
    currency: native,
    items: parsed
      .filter((p) => p.cur === native)
      .map((p) => ({ row: p.row, amount: p.amt, original: { amount: p.amt, currency: p.cur }, converted: false })),
    excluded: parsed.filter((p) => p.cur !== native).map((p) => p.row),
    usedConversion: false,
    fellBack: native !== tgt,
  };
}
