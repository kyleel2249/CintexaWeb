import { Suspense, lazy, useEffect, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useWebGLSupport } from "@/hooks/useWebGL";
import { BrandRevealFallback } from "@/components/scene/BrandRevealFallback";
import { BrandRevealSequence } from "@/components/hero/BrandRevealSequence";

const BrandReveal3D = lazy(() =>
  import("@/components/scene/BrandReveal3D").then((m) => ({ default: m.BrandReveal3D })),
);

/**
 * CINTEXA brand reveal:
 * - Desktop + WebGL + motion: R3F 5s cinematic scene
 * - Otherwise: photographic human-centered sequence (real people + IT + business)
 * - Reduced motion: static logo lockup
 */
export function BrandRevealHero() {
  const { allow3D, allowMotion, reducedMotion } = useMotion();
  const webglSupported = useWebGLSupport();
  const [preferPhotos, setPreferPhotos] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setPreferPhotos(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (reducedMotion || !allowMotion) {
    return <BrandRevealFallback />;
  }

  if (preferPhotos || !allow3D || !webglSupported) {
    return <BrandRevealSequence />;
  }

  return (
    <Suspense fallback={<BrandRevealSequence />}>
      <BrandReveal3D />
    </Suspense>
  );
}
