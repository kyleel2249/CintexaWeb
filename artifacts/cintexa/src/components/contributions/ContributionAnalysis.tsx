import { motion, useReducedMotion } from "framer-motion";
import type { ContributionAnalytics } from "@/lib/contribution-analytics";
import { browserLocale } from "@/lib/currency/format";

const QUARTER_COLORS = ["hsl(var(--accent))", "hsl(142 45% 63%)", "hsl(38 92% 60%)", "hsl(280 70% 72%)"] as const;

/** Whole numbers without decimals ("GH₵20"), otherwise two decimals — for tight spaces. */
function compactMoney(n: number, currency: string, fallback: (n: number) => string): string {
  try {
    const whole = Math.abs(n - Math.round(n)) < 0.005;
    return new Intl.NumberFormat(browserLocale(), {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(n);
  } catch {
    return fallback(n);
  }
}

const pct = (share: number) => `${Math.round(share * 100)}%`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

type Props = {
  analytics: ContributionAnalytics;
  /** Full money formatter in the display currency. */
  fmt: (n: number) => string;
  currency: string;
};

/** All 12 months of the year at a glance: paid, no payment, or still ahead. */
export function ContributionYearStrip({ analytics, fmt, currency }: Props) {
  if (analytics.year === null) return null;
  const coverage = analytics.monthsPaid / 12;
  return (
    <section className="cx-card mb-6" aria-labelledby="year-glance-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="cx-eyebrow">{analytics.year} at a glance</p>
          <h2 id="year-glance-title" className="cx-display mt-1 text-xl">
            {analytics.monthsPaid} of 12 months covered
          </h2>
        </div>
        <p className="text-sm tabular-nums text-[hsl(var(--fg-muted))]">{fmt(analytics.total)} total</p>
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12" aria-label={`Months of ${analytics.year}`}>
        {analytics.months.map((m) => {
          const state = m.paid ? "paid" : m.upcoming ? "upcoming" : "none";
          return (
            <li
              key={m.month}
              data-state={state}
              className="relative flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center"
              style={
                state === "paid"
                  ? { background: "hsl(var(--accent) / 0.14)", borderColor: "hsl(var(--accent) / 0.55)" }
                  : state === "upcoming"
                    ? { borderStyle: "dashed", borderColor: "hsl(var(--border))" }
                    : { borderColor: "hsl(var(--border))", background: "hsl(var(--bg-inset) / 0.4)" }
              }
              aria-current={m.current ? "date" : undefined}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--fg-muted))]">{m.label}</span>
              <span className={`mt-1 text-sm font-semibold tabular-nums ${state === "paid" ? "" : "text-[hsl(var(--fg-muted))]"}`}>
                {state === "paid" ? compactMoney(m.amount, currency, fmt) : "—"}
              </span>
              <span className="sr-only">
                {state === "paid" ? "paid" : state === "upcoming" ? "upcoming" : "no payment"}
              </span>
              {m.current && (
                <span
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: "hsl(var(--accent))" }}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]" role="presentation">
          <div
            className="h-full rounded-full"
            style={{ width: `${coverage * 100}%`, background: "hsl(var(--accent))" }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[hsl(var(--fg-muted))]">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(var(--accent) / 0.6)" }} /> Paid
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-[hsl(var(--fg-muted))]" /> Still ahead
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm border border-[hsl(var(--border))]" /> No payment
          </span>
        </div>
      </div>
    </section>
  );
}

function QuarterDonut({ analytics, fmt }: Props) {
  const reduce = useReducedMotion();
  const R = 44;
  const C = 2 * Math.PI * R;
  const slices = analytics.quarters.filter((q) => q.share > 0);
  const arcs = slices.map((q, i) => ({
    q,
    len: q.share * C,
    start: slices.slice(0, i).reduce((sum, x) => sum + x.share * C, 0),
  }));
  const summary = analytics.quarters
    .filter((q) => q.amount > 0)
    .map((q) => `${q.label} ${fmt(q.amount)} (${pct(q.share)})`)
    .join(", ");

  return (
    <div className="cx-card">
      <p className="cx-eyebrow">Quarterly breakdown</p>
      <div className="mt-4 flex justify-center">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`Contributions by quarter: ${summary}`}>
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" style={{ stroke: "hsl(var(--bg-inset))" }} />
            {arcs.map(({ q, len, start }) => {
              const gap = arcs.length > 1 ? Math.min(2, len * 0.2) : 0;
              const dash = Math.max(len - gap, 0);
              return (
                <motion.circle
                  key={q.quarter}
                  cx="60"
                  cy="60"
                  r={R}
                  fill="none"
                  strokeWidth="14"
                  strokeLinecap="butt"
                  style={{ stroke: QUARTER_COLORS[q.quarter - 1] }}
                  strokeDashoffset={-start}
                  initial={reduce ? false : { strokeDasharray: `0 ${C}` }}
                  animate={{ strokeDasharray: `${dash} ${C - dash}` }}
                  transition={{ duration: 0.9, delay: 0.1 * q.quarter, ease: "easeOut" }}
                >
                  <title>{`${q.label} ${q.range}: ${fmt(q.amount)} (${pct(q.share)})`}</title>
                </motion.circle>
              );
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--fg-muted))]">{analytics.year}</span>
            <span className="cx-display text-base tabular-nums">{fmt(analytics.quarters.reduce((s, q) => s + q.amount, 0))}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function MilestoneRail({ analytics, fmt }: Props) {
  return (
    <div className="cx-card">
      <p className="cx-eyebrow">Milestones</p>
      <ol className="relative mt-5 grid grid-cols-4 gap-1 text-center">
        <span
          className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 bg-[hsl(var(--border))]"
          aria-hidden
        />
        {analytics.milestones.map((m) => {
          const done = m.reached;
          return (
            <li key={m.pct} className="relative z-[1] flex flex-col items-center">
              <span
                className="grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold"
                style={
                  done
                    ? { background: "hsl(var(--accent))", borderColor: "hsl(var(--accent))", color: "hsl(var(--bg))" }
                    : { background: "hsl(var(--bg-elevated))", borderColor: "hsl(var(--border))", color: "hsl(var(--fg-muted))" }
                }
              >
                {done ? "✓" : ""}
              </span>
              <span className="mt-2 text-sm font-semibold tabular-nums">{m.pct}%</span>
              <span className="text-[11px] leading-tight text-[hsl(var(--fg-muted))]">
                {m.reached ? m.reachedOn : "Not yet"}
              </span>
              {m.amountAtReach !== null && (
                <span className="text-[11px] tabular-nums text-[hsl(var(--fg-muted))]">{fmt(m.amountAtReach)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Insights({ analytics, fmt }: Props) {
  const a = analytics;
  const items: { icon: string; title: string; detail: string }[] = [];

  items.push({
    icon: "◎",
    title: a.uniform ? `Every payment was ${fmt(a.max)}` : `Payments from ${fmt(a.min)} to ${fmt(a.max)}`,
    detail: a.uniform
      ? `${plural(a.count, "payment")} totalling ${fmt(a.total)}.`
      : `Average ${fmt(a.average)} · median ${fmt(a.median)} across ${plural(a.count, "payment")}.`,
  });
  items.push({
    icon: "↗",
    title: `${plural(a.longestStreak, "month")} in a row`,
    detail: a.streakActive ? "Longest streak — and it’s still running." : "Longest unbroken run of monthly payments.",
  });
  if (a.year !== null) {
    items.push({
      icon: "▦",
      title: `${a.monthsPaid} of 12 months covered in ${a.year}`,
      detail:
        a.gaps === 0
          ? a.count > 1
            ? "No gaps between the first and latest payment."
            : "First payment recorded."
          : `${plural(a.gaps, "month")} without a payment between the first and latest.`,
    });
  }
  if (a.topMonth && !a.uniform) {
    items.push({
      icon: "★",
      title: `Largest month: ${a.topMonth.label}`,
      detail: `${fmt(a.topMonth.amount)} — ${pct(a.topMonth.share)} of the year.`,
    });
  }
  if (a.first && a.last) {
    items.push({
      icon: "⏱",
      title: `${a.first.label} → ${a.last.label}`,
      detail: a.first.label === a.last.label ? "Single payment so far." : "From first to most recent payment.",
    });
  }

  return (
    <div className="cx-card lg:col-span-2">
      <p className="cx-eyebrow">Analysis</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.title} className="flex gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-inset)/0.4)] p-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base"
              style={{ background: "hsl(var(--accent) / 0.14)", color: "hsl(var(--accent))" }}
              aria-hidden
            >
              {it.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{it.title}</p>
              <p className="mt-0.5 text-xs text-[hsl(var(--fg-muted))]">{it.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Donut, milestones and computed insights. */
export function ContributionBreakdown(props: Props) {
  if (props.analytics.count === 0) return null;
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <QuarterDonut {...props} />
      <MilestoneRail {...props} />
      <Insights {...props} />
    </div>
  );
}
