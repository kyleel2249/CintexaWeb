import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMotion } from "./MotionProvider";

gsap.registerPlugin(ScrollTrigger);

interface GsapStaggerProps {
  children: ReactNode;
  className?: string;
  /** CSS selector (relative to the container) for the items to stagger — defaults to direct children. */
  itemSelector?: string;
  stagger?: number;
}

/**
 * GSAP + ScrollTrigger section choreography: children fade/rise in with a
 * stagger as the container enters the viewport. This is the one place GSAP
 * is actually used — MOTION.md names it as part of the stack, so this wires
 * it to something real instead of an unused dependency. Skips entirely
 * (renders as plain static content) when motion is disabled.
 */
export function GsapStagger({ children, className, itemSelector = ":scope > *", stagger = 0.08 }: GsapStaggerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { allowMotion } = useMotion();

  useEffect(() => {
    if (!allowMotion || !containerRef.current) return;

    const items = containerRef.current.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
          },
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [allowMotion, itemSelector, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
