import { useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "ad", label: "Ad", width: 100, color: "hsl(45 98% 61%)" },
  { id: "impressions", label: "Impressions", width: 86, color: "hsl(200 70% 55%)" },
  { id: "clicks", label: "Clicks", width: 68, color: "hsl(181 50% 55%)" },
  { id: "leads", label: "Leads", width: 48, color: "hsl(160 45% 48%)" },
  { id: "sales", label: "Sales", width: 32, color: "hsl(25 90% 55%)" },
  { id: "revenue", label: "Revenue", width: 22, color: "hsl(6 72% 53%)" },
] as const;

/** Demo-only advertising funnel — labeled sample motion, not live performance data. */
export function AnimatedAdsFunnel({ className }: { className?: string }) {
  const { allowMotion } = useMotion();
  const [active, setActive] = useState(0);
  const [agents, setAgents] = useState<{ id: number; stage: number }[]>([]);
  const [id, setId] = useState(0);

  useEffect(() => {
    if (!allowMotion) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1400);
    return () => clearInterval(t);
  }, [allowMotion]);

  useEffect(() => {
    if (!allowMotion) return;
    const spawn = setInterval(() => {
      setId((n) => n + 1);
      setAgents((prev) => [...prev.slice(-10), { id: id + 1, stage: 0 }]);
    }, 800);
    return () => clearInterval(spawn);
  }, [allowMotion, id]);

  useEffect(() => {
    if (!allowMotion) return;
    const adv = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => ({ ...a, stage: a.stage + 1 })).filter((a) => a.stage < STAGES.length),
      );
    }, 1000);
    return () => clearInterval(adv);
  }, [allowMotion]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--foreground))] p-6 text-[hsl(var(--background))] sm:p-8",
        className,
      )}
      data-testid="animated-ads-funnel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[hsl(var(--accent))]">
            Ads Boost · sample model
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-[-.04em]">Ad → Revenue path</h3>
        </div>
        <span className="rounded-full border border-[hsl(var(--accent)/.5)] px-3 py-1 font-mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--accent))]">
          Sample data only
        </span>
      </div>
      <div className="mt-8 space-y-2.5">
        {STAGES.map((s, i) => (
          <div key={s.id} className="relative flex items-center gap-3">
            <span className={cn("w-24 shrink-0 text-right font-mono text-[9px] uppercase tracking-[.12em] sm:w-28 sm:text-[10px]", active === i ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--background)/.4)]")}>{s.label}</span>
            <div className="relative min-h-[36px] flex-1">
              <div className="mx-auto h-9 rounded-xl transition-all duration-500" style={{ width: `${s.width}%`, background: s.color, opacity: active === i ? 1 : 0.7, boxShadow: active === i ? `0 0 20px ${s.color}55` : "none" }} />
            </div>
            {i < STAGES.length - 1 && <span className="absolute -bottom-1.5 left-[5.5rem] text-[hsl(var(--accent)/.6)] sm:left-[7rem]">↓</span>}
          </div>
        ))}
      </div>
      <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[.16em] text-[hsl(var(--background)/.4)]">
        Illustrative flow — not live advertising metrics
      </p>
    </div>
  );
}
