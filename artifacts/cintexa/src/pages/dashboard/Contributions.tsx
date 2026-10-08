import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DashboardShell } from "./DashboardShell";
import { useMyContributions } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { SEEDED_CONTRIBUTOR_ID, SEEDED_TOTAL_GHS } from "@/data/contribution-seed";

function formatGhs(n: number) {
  return `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthLabel(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function DashboardContributions() {
  const reduce = useReducedMotion();
  const { userId } = useAuth();
  const { data, isLoading, isError } = useMyContributions();
  const contributions = data?.contributions ?? [];

  const paid = contributions.filter((c) => c.status === "paid" || c.status === "completed");
  const totalPaid = paid.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const currency = paid[0]?.currency || contributions[0]?.currency || "GHS";
  const monthly = paid.length ? totalPaid / paid.length : 0;

  const series = useMemo(() => {
    const sorted = [...paid].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let running = 0;
    return sorted.map((c) => {
      running += Number(c.amount) || 0;
      return {
        id: c.id,
        label: monthLabel(c.createdAt),
        amount: Number(c.amount) || 0,
        cumulative: running,
        reference: c.reference,
        description: c.description,
        status: c.status,
      };
    });
  }, [paid]);

  const maxBar = Math.max(...series.map((s) => s.amount), 1);
  const targetTotal = userId === SEEDED_CONTRIBUTOR_ID ? SEEDED_TOTAL_GHS : Math.max(totalPaid, 1);
  const progressPct = Math.min(100, (totalPaid / targetTotal) * 100);

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
            { label: "Total contributed", value: isLoading ? "—" : formatGhs(totalPaid), accent: true },
            { label: "Monthly cadence", value: isLoading ? "—" : formatGhs(monthly), accent: false },
            { label: "Payments recorded", value: isLoading ? "—" : String(paid.length), accent: false },
            {
              label: "Currency",
              value: currency,
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

        {/* Progress ring + cumulative path */}
        <div className="mb-6 grid gap-4 lg:grid-cols-5">
          <motion.div variants={item} className="cx-card lg:col-span-2">
            <p className="cx-eyebrow">Progress to schedule</p>
            <p className="mt-1 text-sm text-[hsl(var(--fg-muted))]">
              {userId === SEEDED_CONTRIBUTOR_ID
                ? "Feb–Dec 2026 · GHS 20.00 / month · target GHS 220.00"
                : "Based on recorded contributions on this account"}
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
                  {Math.round(progressPct)}%
                </motion.p>
                <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--fg-muted))]">complete</p>
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
                    <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
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
                        title={`${s.label}: ${formatGhs(s.amount)}`}
                      />
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
                        {formatGhs(s.amount)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[hsl(var(--fg-muted))]">{s.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-[hsl(var(--fg-muted))]">
                      {s.reference} · running {formatGhs(s.cumulative)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detail table */}
        {(isLoading || contributions.length > 0) && (
          <motion.div variants={item} className="cx-card overflow-hidden !p-0">
            <table className="w-full text-left text-sm">
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
                            {c.currency} {Number(c.amount).toFixed(2)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="cx-badge cx-badge-success">{c.status}</span>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </motion.div>
        )}

        <motion.div variants={item} className="mt-8">
          <InsightPanel specialistId="contributions" title="Contributions Insight" />
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}
