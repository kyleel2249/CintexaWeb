import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useMotion } from "./MotionProvider";

interface PointerParallaxProps {
  children: ReactNode;
  className?: string;
  /** Max travel in px at the container's edge. */
  strength?: number;
}

/**
 * Shifts content slightly toward the cursor position within its container.
 * Purely a desktop-hover flourish — becomes fully static with no listeners
 * attached when motion is disabled, so it costs nothing on reduced-motion
 * or low-power devices.
 */
export function PointerParallax({ children, className, strength = 12 }: PointerParallaxProps) {
  const { allowMotion } = useMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const x = useTransform(springX, [-1, 1], [-strength, strength]);
  const y = useTransform(springY, [-1, 1], [-strength, strength]);

  if (!allowMotion) {
    return <div className={className}>{children}</div>;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
