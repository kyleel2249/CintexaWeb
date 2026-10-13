/** Small dependency-free charts for the admin overview. */
export type Series = { label: string; color: string; values: number[] };

const W = 600;
const H = 170;
const PAD = { l: 34, r: 8, t: 10, b: 22 };

export function TrendChart({ dates, series, title }: { dates: string[]; series: Series[]; title: string }) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const n = Math.max(dates.length - 1, 1);
  const x = (i: number) => PAD.l + (i / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / niceMax) * (H - PAD.t - PAD.b);
  const totals = series.map((s) => `${s.label} ${s.values.reduce((a, b) => a + b, 0)}`).join(", ");
  const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" role="img" aria-label={`${title}. Totals over ${dates.length} days: ${totals}.`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(niceMax * f)} y2={y(niceMax * f)} stroke="hsl(var(--border))" strokeDasharray={f === 0 ? undefined : "3 4"} />
            <text x={PAD.l - 6} y={y(niceMax * f) + 3} textAnchor="end" fontSize="10" fill="hsl(var(--fg-muted))">
              {Math.round(niceMax * f)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.label}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
        {dates.length > 0 && (
          <>
            <text x={PAD.l} y={H - 6} fontSize="10" fill="hsl(var(--fg-muted))">
              {short(dates[0]!)}
            </text>
            <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize="10" fill="hsl(var(--fg-muted))">
              {short(dates[dates.length - 1]!)}
            </text>
          </>
        )}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[hsl(var(--fg-muted))]">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}: <strong className="text-[hsl(var(--fg))]">{s.values.reduce((a, b) => a + b, 0)}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function BarList({ items, empty = "No data yet." }: { items: { label: string; value: number; note?: string }[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-[hsl(var(--fg-muted))]">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{i.label}</span>
            <span className="shrink-0 tabular-nums text-[hsl(var(--fg-muted))]">
              {i.value}
              {i.note ? ` · ${i.note}` : ""}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[hsl(var(--bg-inset))]" role="presentation">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: "hsl(var(--accent))" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
