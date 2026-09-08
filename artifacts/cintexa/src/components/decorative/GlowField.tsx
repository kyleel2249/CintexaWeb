import { useMotion } from "@/components/motion/MotionProvider";

/**
 * Ambient colored blobs behind hero/section content — pulls from the full
 * palette (amber/teal/sky/violet) instead of leaving the dark theme flat.
 * Purely decorative: aria-hidden, absolutely positioned, never intercepts
 * clicks. Blobs stay static (no drift animation) when motion is reduced.
 */
export function GlowField({ className = "" }: { className?: string }) {
  const { allowMotion } = useMotion();

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{
          background: "hsl(var(--accent))",
          animation: allowMotion ? "cx-drift-a 14s ease-in-out infinite" : undefined,
        }}
      />
      <div
        className="absolute -right-16 top-10 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: "hsl(var(--sky))",
          animation: allowMotion ? "cx-drift-b 18s ease-in-out infinite" : undefined,
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{
          background: "hsl(var(--violet))",
          animation: allowMotion ? "cx-drift-c 16s ease-in-out infinite" : undefined,
        }}
      />
      <div
        className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full opacity-[0.15] blur-3xl"
        style={{
          background: "hsl(var(--teal))",
          animation: allowMotion ? "cx-drift-a 20s ease-in-out infinite reverse" : undefined,
        }}
      />
      <style>{`
        @keyframes cx-drift-a {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.08); }
        }
        @keyframes cx-drift-b {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 20px) scale(1.05); }
        }
        @keyframes cx-drift-c {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -25px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
