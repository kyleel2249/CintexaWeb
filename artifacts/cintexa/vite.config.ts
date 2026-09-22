import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // vendor-three (three/@react-three/fiber/@react-three/drei) is ~1.2MB minified.
    // It's already isolated here on purpose so it never lands in the initial/index
    // chunk: BusinessEcosystem3D and BrandReveal3D are React.lazy()-loaded and only
    // pull this chunk in on WebGL-capable, motion-enabled devices (see
    // components/hero/EcosystemHero.tsx and BrandRevealHero.tsx, which fall back to
    // CSS/photo sequences otherwise). Raising the warning limit here just silences
    // Rollup's default 500kB notice for that known, intentionally-large, lazy chunk
    // rather than papering over a real problem.
    chunkSizeWarningLimit: 1300,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          "vendor-clerk": ["@clerk/clerk-react", "@clerk/themes"],
          "vendor-motion": ["framer-motion", "gsap"],
        },
      },
    },
  },
});
