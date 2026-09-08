import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotion } from "./MotionProvider";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds — pass increasing values for a list of siblings. */
  delay?: number;
  /** Distance (px) to travel on reveal. */
  distance?: number;
}

/**
 * Fades + slides content in the first time it scrolls into view. When motion
 * is disabled (reduced-motion, low-power device, save-data), content renders
 * immediately at its final position — no IntersectionObserver work, no
 * animation, just static content, per MOTION.md's fallback rules.
 */
export function ScrollReveal({ children, className, delay = 0, distance = 24 }: ScrollRevealProps) {
  const { allowMotion } = useMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!allowMotion);

  useEffect(() => {
    if (!allowMotion || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [allowMotion]);

  if (!allowMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: distance }}
      animate={isVisible ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
