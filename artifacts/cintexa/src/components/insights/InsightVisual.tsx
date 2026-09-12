import { Suspense, useMemo } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import type { InsightResult } from "@/lib/insights";

type Props = {
  result: InsightResult | null;
  tab: string;
};

/** CSS / static fallback — always available, respects reduced motion. */
function InsightVisualFallback({ result, tab }: Props) {
  const { allowMotion } = useMotion();
  const metrics = result?.metrics?.slice(0, 6) ?? [];
  const nodes = metrics.length
    ? metrics.map((m, i) => ({
        label: m.name,
        value: m.value === null || m.value === undefined ? "—" : String(m.value),
        color: ["#6BB3FF", "#F5C518", "#7DD3C7", "#C4B5FD", "#F472B6", "#34D399"][i % 6],
        angle: (i / Math.max(metrics.length, 1)) * 360,
      }))
    : [
        { label: tab, value: "—", color: "#6BB3FF", angle: 0 },
        { label: "Evidence", value: String(result?.evidence?.length ?? 0), color: "#7DD3C7", angle: 120 },
        { label: "Findings", value: String(result?.keyFindings?.length ?? 0), color: "#F5C518", angle: 240 },
      ];

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[280px]"
      role="img"
      aria-label={`${result?.displayName ?? "Insight"} visualization`}
    >
      <div className="absolute inset-[12%] rounded-full border" style={{ borderColor: "hsl(var(--border))" }} />
      <div
        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl text-center text-[10px] font-semibold"
        style={{
          background: "hsl(var(--accent))",
          color: "hsl(var(--accent-ink))",
          boxShadow: "0 0 32px hsl(var(--accent) / 0.4)",
        }}
      >
        Insight
      </div>
      {nodes.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = 50 + 38 * Math.cos(rad);
        const y = 50 + 38 * Math.sin(rad);
        return (
          <div
            key={n.label}
            className="absolute flex max-w-[72px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animation: allowMotion ? `cx-insight-float 5s ease-in-out ${n.angle}ms infinite` : undefined,
            }}
          >
            <div className="h-3.5 w-3.5 rounded-full" style={{ background: n.color, boxShadow: `0 0 12px ${n.color}66` }} />
            <span className="text-center text-[10px] font-medium leading-tight">{n.value}</span>
            <span className="text-center text-[9px] text-[hsl(var(--fg-muted))]">{n.label}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes cx-insight-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/** Lightweight motion scene when profile allows 3D / animation. */
function InsightScene3D({ result }: { result: InsightResult | null }) {
  const count = Math.max(result?.metrics?.length ?? 3, 3);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg-inset))]">
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.35), transparent 65%)" }}
      />
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 28;
        const y = 50 + Math.sin(angle) * 28;
        return (
          <div
            key={i}
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: `hsl(${200 + i * 25} 80% 60%)`,
              boxShadow: `0 0 16px hsl(${200 + i * 25} 80% 60% / 0.5)`,
              animation: `cx-insight-orbit 8s linear ${i * 0.2}s infinite`,
            }}
          />
        );
      })}
      <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[hsl(var(--accent))] shadow-lg" />
      <style>{`
        @keyframes cx-insight-orbit {
          from { filter: brightness(1); }
          50% { filter: brightness(1.25); }
          to { filter: brightness(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Insight visualization: animated when allowed, CSS fallback otherwise.
 * Never required to understand the report — pure enhancement.
 */
export function InsightVisual({ result, tab }: Props) {
  const { allow3D, allowMotion } = useMotion();
  const show3D = allow3D && allowMotion;

  return useMemo(() => {
    if (!show3D) return <InsightVisualFallback result={result} tab={tab} />;
    return (
      <Suspense fallback={<InsightVisualFallback result={result} tab={tab} />}>
        <InsightScene3D result={result} />
      </Suspense>
    );
  }, [show3D, result, tab]);
}
