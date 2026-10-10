import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardShell } from "./DashboardShell";
import { useMyContributions } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { getSeededSchedule, getSeededTotalGhs } from "@/data/contribution-seed";
import { useMoney } from "@/lib/currency/useMoney";
import { browserLocale, formatMoney, regionName } from "@/lib/currency/format";
import { isSettled, statusLabel, statusTone } from "@/lib/contributions";

function monthLabel(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString(browserLocale(), { month: "short", year: "numeric", timeZone: "UTC" });
}

export function DashboardContributions() {
  const reduce = useReducedMotion();
  const { userId } = useAuth();
  const { data, isLoading, isError } = useMyContributions();
  const contributions = useMemo(() => data?.contributions ?? [], [data]);

  const currencies = useMemo(() => [...new Set(contributions.map((c) => c.currency || "GHS"))], [contributions]);
  const money = useMoney(currencies.length ? currencies : ["GHS"]);

  // Same rule everywhere: settled rows count toward totals; every amount is shown in the user's
  // own currency (converted with live rates) or, if no rate is available, in its recorded currency.
  const paidRows = useMemo(() => contributions.filter(isSettled), [contributions]);
  const paidPlan = useMemo(() => money.plan(paidRows), [money, paidRows]);
  const allPlan = useMemo(() => money.plan(contributions), [money, contributions]);
  const currency = paidPlan.currency;
  const fmt = (n: number) => formatMoney(n, currency);

  const sortedPaid = [...paidPlan.items].sort(
    (a, b) => new Date(a.row.createdAt).getTime() - new Date(b.row.createdAt).getTime(),
  );
  const series = sortedPaid.map((it, index) => ({
    id: it.row.id,
    label: monthLabel(it.row.createdAt),
    amount: it.amount,
    cumulative: sortedPaid.slice(0, index + 1).reduce((sum, i) => sum + i.amount, 0),
    reference: it.row.reference,
    description: it.row.description,
    status: it.row.status,
  }));
  const totalPaid = sortedPaid.reduce((sum, i) => sum + i.amount, 0);
  const monthly = series.length ? totalPaid / series.length : 0;

  const maxBar = Math.max(...series.map((s) => s.amount), 1);
  const seededTotal = userId ? getSeededTotalGhs(userId) : null;
  const schedule = userId ? getSeededSchedule(userId) : undefined;
  // Progress is measured in recorded GHS so it never depends on the exchange rate.
  const paidGhs = paidPlan.items
    .filter((i) => i.original.currency === "GHS")
    .reduce((sum, i) => sum + i.original.amount, 0);
  const hasSchedule = Boolean(schedule && seededTotal);
  const progressPct = hasSchedule ? Math.min(100, (paidGhs / (seededTotal as number)) * 100) : 0;
  const scheduleMonthly = schedule ? money.format(schedule.monthlyGhs, "GHS", { approx: false }).text : "";
  const scheduleTarget = seededTotal ? money.format(seededTotal, "GHS", { approx: false }).text : "";
  const rowItem = new Map(allPlan.items.map((i) => [i.row, i]));
  const showFxNote = paidPlan.usedConversion || paidPlan.fellBack || paidPlan.excluded.length > 0;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06 },
    },
  };
  const item = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <DashboardShell>
      <motion.div initial="hidden" animate="show" variants={container}>
        <motion.div variants={item} className="mb-6">
          <p className="cx-eyebrow">Account activity</p>
          <h2 className="cx-display mt-1 text-2xl sm:text-3xl">Contributions</h2>
          <p className="mt-2 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
            Live view of verified contribution activity — amounts, cadence, and cumulative growth.
          </p>
        </motion.div>

        {/* Hero metrics */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total contributed", value: isLoading ? "—" : fmt(totalPaid), accent: true },
            { label: "Average payment", value: isLoading ? "—" : fmt(monthly), accent: false },
            { label: "Payments recorded", value: isLoading ? "—" : String(paidRows.length), accent: false },
            {
              label: "Currency",
              value: isLoading ? "—" : currency + (money.country && !paidPlan.fellBack ? ` · ${regionName(money.country)}` : ""),
              accent: false,
            },
          ].map((m) => (
            <motion.div
              key={m.label}
              variants={item}
              className="cx-card relative overflow-hidden"
              style={
                m.accent
                  ? {
                      borderColor: "hsl(var(--accent) / 0.45)",
                      boxShadow: "0 0 40px -12px hsl(var(--accent) / 0.35)",
                    }
                  : undefined
              }
            >
              {m.accent && (
                <motion.div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full"
                  style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.25), transparent 70%)" }}
                  animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <p className="text-xs text-[hsl(var(--fg-muted))]">{m.label}</p>
              <p className="cx-display mt-1 text-2xl tabular-nums">{m.value}</p>
            </motion.div>
          ))}
        </div>


        {showFxNote && !isLoading && (
          <motion.p variants={item} className="mb-6 text-xs text-[hsl(var(--fg-muted))]" role="note">
            {paidPlan.fellBack
              ? `Live exchange rate unavailable — amounts are shown in ${currency}, the currency they were recorded in.`
              : paidPlan.usedConversion
                ? `Amounts are converted from the currency they were recorded in (${[
                    ...new Set(paidPlan.items.map((i) => i.original.currency)),
                  ].join(", ")}) to your currency, ${money.currency}, at today’s exchange rate${
                    money.updatedAt ? ` (rates updated ${new Date(money.updatedAt).toLocaleDateString(browserLocale())})` : ""
                  }. Exchange rates by ExchangeRate-API (open.er-api.com).`
                : ""}
            {paidPlan.excluded.length > 0 &&
              ` ${paidPlan.excluded.length} payment${paidPlan.excluded.length === 1 ? "" : "s"} in another currency couldn’t be converted and ${paidPlan.excluded.length === 1 ? "is" : "are"} not included in the totals.`}
          </motion.p>
        )}

        {/* Monthly contribution summary */}
        {series.length > 0 && (
          <motion.div variants={item} className="cx-card mb-6 overflow-hidden !p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] px-5 py-4">
              <div>
                <p className="cx-eyebrow">Monthly contribution summary</p>
                <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
                  {schedule
                    ? `${scheduleMonthly} per month · ${series.length} months recorded`
                    : `${series.length} month${series.length === 1 ? "" : "s"} with verified payments`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[hsl(var(--fg-muted))]">Period total</p>
                <p className="cx-display text-xl tabular-nums text-[hsl(var(--accent))]">
                  {fmt(totalPaid)}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--fg-muted))]">
                    <th className="px-5 py-2.5 font-medium">#</th>
                    <th className="px-5 py-2.5 font-medium">Month</th>
                    <th className="px-5 py-2.5 font-medium">Amount</th>
                    <th className="px-5 py-2.5 font-medium">Cumulative</th>
                    <th className="px-5 py-2.5 font-medium">Share of total</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s, i) => {
                    const share = totalPaid > 0 ? (s.amount / totalPaid) * 100 : 0;
                    return (
                      <motion.tr
                        key={s.id}
                        className="border-b border-[hsl(var(--border))] last:border-0"
                        initial={reduce ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: reduce ? 0 : 0.03 * i }}
                      >
                        <td className="px-5 py-2.5 text-[hsl(var(--fg-muted))]">{String(i + 1).padStart(2, "0")}</td>
                        <td className="px-5 py-2.5 font-medium">{s.label}</td>
                        <td className="px-5 py-2.5 tabular-nums">{fmt(s.amount)}</td>
                        <td className="px-5 py-2.5 tabular-nums text-[hsl(var(--fg-muted))]">
                          {fmt(s.cumulative)}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex min-w-[7rem] items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]">
                              <motion.div
                                className="h-full rounded-full bg-[hsl(var(--accent))]"
                                initial={{ width: 0 }}
                                animate={{ width: `${share}%` }}
                                transition={{ delay: reduce ? 0 : 0.05 * i, duration: 0.5 }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-[hsl(var(--fg-muted))]">
                              {share.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`cx-badge cx-badge-${statusTone(s.status)}`}>{statusLabel(s.status)}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[hsl(var(--border))] bg-[hsl(var(--bg-inset)/0.4)]">
                    <td className="px-5 py-3 font-medium" colSpan={2}>
                      Total
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums">{fmt(totalPaid)}</td>
                    <td className="px-5 py-3 tabular-nums text-[hsl(var(--fg-muted))]">{fmt(totalPaid)}</td>
                    <td className="px-5 py-3 text-xs text-[hsl(var(--fg-muted))]">100%</td>
                    <td className="px-5 py-3 text-xs text-[hsl(var(--fg-muted))]">
                      {series.length} payment{series.length === 1 ? "" : "s"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {/* Progress ring + cumulative path */}
        <div className="mb-6 grid gap-4 lg:grid-cols-5">
          <motion.div variants={item} className="cx-card lg:col-span-2">
            <p className="cx-eyebrow">Progress to schedule</p>
            <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
              {schedule
                ? `${schedule.months.length} months · ${scheduleMonthly} / month · target ${scheduleTarget}`
                : "No payment schedule is set on this account, so there is no target to measure against."}
            </p>
            <div className="relative mx-auto mt-6 flex h-44 w-44 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 52 * (1 - progressPct / 100),
                  }}
                  transition={{ duration: reduce ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.p
                  className="cx-display text-3xl tabular-nums"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {hasSchedule ? `${Math.round(progressPct)}%` : "—"}
                </motion.p>
                <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--fg-muted))]">
                  {hasSchedule ? "complete" : "no target"}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="cx-card lg:col-span-3">
            <p className="cx-eyebrow">Monthly flow</p>
            <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">Each bar is one verified monthly contribution</p>
            <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2">
              {isLoading
                ? Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="flex-1 animate-pulse rounded-t bg-[hsl(var(--bg-inset))]" style={{ height: "40%" }} />
                  ))
                : series.map((s, i) => (
                    <div key={s.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <div className="flex w-full flex-1 items-end">
                      <motion.div
                        className="w-full rounded-t-md"
                        style={{
                          background:
                            "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.45) 100%)",
                          boxShadow: "0 0 16px -4px hsl(var(--accent) / 0.5)",
                        }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: `${(s.amount / maxBar) * 100}%`, opacity: 1 }}
                        transition={{
                          delay: reduce ? 0 : 0.08 * i,
                          duration: 0.55,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        title={`${s.label}: ${fmt(s.amount)}`}
                      />
                      </div>
                      <span className="max-w-full truncate text-[9px] text-[hsl(var(--fg-muted))] sm:text-[10px]">
                        {s.label.split(" ")[0]}
                      </span>
                    </div>
                  ))}
            </div>
            {!isLoading && series.length > 0 && (
              <div className="mt-4 h-16">
                <svg viewBox={`0 0 ${Math.max(series.length - 1, 1) * 40} 60`} className="h-full w-full" preserveAspectRatio="none">
                  <motion.polyline
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={series
                      .map((s, i) => {
                        const maxC = series[series.length - 1]?.cumulative || 1;
                        const x = i * 40;
                        const y = 56 - (s.cumulative / maxC) * 50;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: reduce ? 0 : 1.2, ease: "easeOut" }}
                    style={{ pathLength: 1 }}
                  />
                  {series.map((s, i) => {
                    const maxC = series[series.length - 1]?.cumulative || 1;
                    const x = i * 40;
                    const y = 56 - (s.cumulative / maxC) * 50;
                    return (
                      <motion.circle
                        key={s.id}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="hsl(var(--accent))"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: reduce ? 0 : 0.1 * i + 0.4 }}
                      />
                    );
                  })}
                </svg>
                <p className="text-center text-[10px] text-[hsl(var(--fg-muted))]">Cumulative total over time</p>
              </div>
            )}
          </motion.div>
        </div>

        {isError && contributions.length === 0 && (
          <div className="cx-card mb-4" style={{ borderColor: "hsl(var(--danger) / .5)" }}>
            <p className="text-sm" style={{ color: "hsl(var(--danger))" }}>
              Couldn&apos;t reach the contributions API. Showing any verified local schedule available for this account.
            </p>
          </div>
        )}

        {!isLoading && contributions.length === 0 && (
          <div className="cx-card text-center">
            <p className="text-sm text-[hsl(var(--fg-muted))]">
              No contributions yet. Completed payments will appear here with charts and totals.
            </p>
          </div>
        )}

        {/* Timeline cards */}
        {series.length > 0 && (
          <motion.div variants={item} className="mb-8">
            <p className="cx-eyebrow mb-3">Contribution timeline</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {series.map((s, i) => (
                <motion.div
                  key={s.id}
                  className="cx-card flex items-start gap-3 !py-3"
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.35 }}
                >
                  <motion.div
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold text-[hsl(var(--bg))]"
                    style={{ background: "hsl(var(--accent))" }}
                    animate={reduce ? undefined : { boxShadow: ["0 0 0 0 hsl(var(--accent) / 0.4)", "0 0 0 8px hsl(var(--accent) / 0)", "0 0 0 0 hsl(var(--accent) / 0.4)"] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.15 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{s.label}</p>
                      <p className="shrink-0 tabular-nums text-sm font-semibold text-[hsl(var(--accent))]">
                        {fmt(s.amount)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[hsl(var(--fg-muted))]">{s.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-[hsl(var(--fg-muted))]">
                      {s.reference} · running {fmt(s.cumulative)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detail table */}
        {(isLoading || contributions.length > 0) && (
          <motion.div variants={item} className="cx-card overflow-x-auto !p-0">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--fg-muted))]">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0">
                        <td className="px-5 py-3" colSpan={5}>
                          <span className="inline-block h-4 w-full animate-pulse rounded bg-[hsl(var(--bg-inset))]" />
                        </td>
                      </tr>
                    ))
                  : [...contributions]
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((c) => (
                        <tr key={c.id} className="border-b border-[hsl(var(--border))] last:border-0">
                          <td className="px-5 py-3 font-mono text-xs text-[hsl(var(--fg-muted))]">{c.reference}</td>
                          <td className="px-5 py-3">{monthLabel(c.createdAt)}</td>
                          <td className="px-5 py-3">{c.description}</td>
                          <td className="px-5 py-3 tabular-nums">
                            {(() => {
                              const it = rowItem.get(c);
                              const recorded = formatMoney(Number(c.amount) || 0, c.currency || "GHS");
                              return it ? (
                                <>
                                  {formatMoney(it.amount, allPlan.currency)}
                                  {it.converted && (
                                    <span className="block text-[11px] text-[hsl(var(--fg-muted))]">
                                      Recorded {recorded}
                                    </span>
                                  )}
                                </>
                              ) : (
                                recorded
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`cx-badge cx-badge-${statusTone(c.status)}`}>{statusLabel(c.status)}</span>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </motion.div>
        )}

        <motion.div variants={item} className="mt-8">
          <InsightPanel tab="contributions" />
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}
