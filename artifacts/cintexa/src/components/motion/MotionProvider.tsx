import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface MotionProfile {
  /** False when 3D / GSAP / Framer choreography should be disabled entirely. */
  allowMotion: boolean;
  /** False when even lightweight CSS transitions should be skipped. */
  allow3D: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** True on mobile devices with low CPU cores or low memory. */
  lowPower: boolean;
}

const MotionContext = createContext<MotionProfile>({
  allowMotion: true,
  allow3D: true,
  reducedMotion: false,
  saveData: false,
  lowPower: false,
});

/**
 * useMotionProfile — central signal used across the app to decide whether to
 * run 3D scenes, GSAP timelines, and Framer Motion animations.
 *
 * Rules (see MOTION.md):
 *  - prefers-reduced-motion            -> disable 3D, GSAP, Framer; static fallbacks
 *  - mobile + low cores/memory         -> 3D off or lighter
 *  - Save-Data header / 2G-3G effective type -> 3D disabled
 *  - off-screen canvas                 -> handled per-component via IntersectionObserver
 */
function computeProfile(): MotionProfile {
  if (typeof window === "undefined") {
    return { allowMotion: true, allow3D: true, reducedMotion: false, saveData: false, lowPower: false };
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  const lowPower = isMobile && (lowCores || lowMemory);

  const saveData = nav.connection?.saveData ?? false;
  const slowNetwork = ["slow-2g", "2g", "3g"].includes(nav.connection?.effectiveType ?? "4g");

  const allow3D = !reducedMotion && !lowPower && !saveData && !slowNetwork;
  const allowMotion = !reducedMotion;

  return { allowMotion, allow3D, reducedMotion, saveData: saveData || slowNetwork, lowPower };
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MotionProfile>(computeProfile);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setProfile(computeProfile());
    mql.addEventListener("change", update);
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.("change", update);
    return () => {
      mql.removeEventListener("change", update);
      conn?.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("no-motion", !profile.allowMotion);
  }, [profile.allowMotion]);

  const value = useMemo(() => profile, [profile]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  return useContext(MotionContext);
}
