import { useEffect, useState } from "react";

/** Detects WebGL support once on mount. Assumes true until checked to avoid a flash. */
export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setSupported(Boolean(gl));
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
