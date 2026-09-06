import { useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

/** Top-of-viewport reading progress bar. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const { allowMotion } = useMotion();

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      setProgress(height > 0 ? Math.min(1, scrollTop / height) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div
        className="h-full origin-left bg-[hsl(var(--accent))] shadow-[0_0_12px_hsl(var(--accent)/.55)]"
        style={{
          transform: `scaleX(${progress})`,
          transition: allowMotion ? "transform 80ms linear" : undefined,
        }}
      />
    </div>
  );
}
