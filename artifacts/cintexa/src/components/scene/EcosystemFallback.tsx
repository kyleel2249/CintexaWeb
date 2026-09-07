import { useMotion } from "@/components/motion/MotionProvider";

const NODES = [
  { label: "Technology", color: "#6BB3FF", angle: 20, radius: 42 },
  { label: "Commerce", color: "#F5C518", angle: 100, radius: 46 },
  { label: "Motion", color: "#7DD3C7", angle: 190, radius: 40 },
  { label: "Intelligence", color: "#C4B5FD", angle: 280, radius: 46 },
];

/**
 * Pure-CSS orbital ecosystem — rendered when WebGL is unavailable,
 * prefers-reduced-motion is set, or the device/network is low-power (see
 * useMotionProfile in MOTION.md). Same visual language as the R3F scene:
 * a center node with four orbiting business pillars.
 */
export function EcosystemFallback() {
  const { allowMotion } = useMotion();

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      role="img"
      aria-label="CINTEXA business ecosystem: technology, commerce, motion, and intelligence orbiting a central core"
    >
      <div
        className="absolute inset-[8%] rounded-full border"
        style={{ borderColor: "hsl(var(--border))" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl"
        style={{
          background: "hsl(var(--accent))",
          boxShadow: "0 0 48px hsl(var(--accent) / 0.45)",
        }}
      />
      {NODES.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = 50 + node.radius * Math.cos(rad);
        const y = 50 + node.radius * Math.sin(rad);
        return (
          <div
            key={node.label}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animation: allowMotion ? `cx-float 6s ease-in-out ${node.angle}ms infinite` : undefined,
            }}
          >
            <div
              className="h-6 w-6 rounded-full"
              style={{ background: node.color, boxShadow: `0 0 18px ${node.color}55` }}
            />
            <span
              className="cx-eyebrow whitespace-nowrap"
              style={{ color: "hsl(var(--fg-muted))", fontSize: "0.6875rem" }}
            >
              {node.label}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes cx-float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
