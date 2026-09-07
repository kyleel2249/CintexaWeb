import { Suspense, lazy } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useWebGLSupport } from "@/hooks/useWebGL";
import { EcosystemFallback } from "@/components/scene/EcosystemFallback";

const BusinessEcosystem3D = lazy(() =>
  import("@/components/scene/BusinessEcosystem3D").then((m) => ({ default: m.BusinessEcosystem3D })),
);

/** Renders the 3D ecosystem scene when the device/network profile allows it, else the CSS fallback. */
export function EcosystemHero() {
  const { allow3D } = useMotion();
  const webglSupported = useWebGLSupport();

  if (!allow3D || !webglSupported) {
    return <EcosystemFallback />;
  }

  return (
    <Suspense fallback={<EcosystemFallback />}>
      <BusinessEcosystem3D />
    </Suspense>
  );
}
