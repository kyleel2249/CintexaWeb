import { useMotion } from "@/components/motion/MotionProvider";
import { BrandMark } from "@/components/brand/logo";

/**
 * CSS-only brand reveal for reduced-motion, low-power, or no-WebGL contexts.
 * Still communicates: assessment → technology → growth → CINTEXA.
 */
export function BrandRevealFallback() {
  const { allowMotion } = useMotion();

  return (
    <div
      className="relative mx-auto flex aspect-[4/3] w-full max-w-[560px] flex-col items-center justify-center overflow-hidden rounded-2xl px-6"
      style={{ background: "#0B0F14" }}
      role="img"
      aria-label="CINTEXA: technology that helps businesses understand, improve, and grow"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, hsl(45 90% 53% / 0.18), transparent 55%)",
        }}
      />
      <div
        className={allowMotion ? "brand-reveal-mark" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <BrandMark size="lg" />
        <p
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "1.75rem",
            letterSpacing: "-0.01em",
            color: "#F7F4EE",
            margin: 0,
          }}
        >
          CINTEXA
        </p>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.8rem",
            color: "rgba(247,244,238,0.65)",
            textAlign: "center",
            maxWidth: "18rem",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          Technology that helps businesses understand, improve, and grow.
        </p>
      </div>
      <style>{`
        @keyframes brand-reveal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .brand-reveal-mark {
          animation: brand-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-reveal-mark { animation: none; }
        }
      `}</style>
    </div>
  );
}
