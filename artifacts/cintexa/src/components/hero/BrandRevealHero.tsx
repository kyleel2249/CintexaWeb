import { Suspense, lazy } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useWebGLSupport } from "@/hooks/useWebGL";
import { BrandRevealFallback } from "@/components/scene/BrandRevealFallback";

const BrandReveal3D = lazy(() =>
  import("@/components/scene/BrandReveal3D").then((m) => ({ default: m.BrandReveal3D })),
);

/**
 * Gates the cinematic 5s CINTEXA brand reveal behind WebGL + motion profile.
 * Falls back to a static brand lockup that remains faithful to the logo.
 */
export function BrandRevealHero() {
  const { allow3D } = useMotion();
  const webglSupported = useWebGLSupport();

  if (!allow3D || !webglSupported) {
    return <BrandRevealFallback />;
  }

  return (
    <Suspense fallback={<BrandRevealFallback />}>
      <BrandReveal3D />
    </Suspense>
  );
}
