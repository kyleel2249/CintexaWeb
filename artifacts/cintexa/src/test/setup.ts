import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure each test starts with a clean DOM regardless of the globals setting.
afterEach(() => {
  cleanup();
});

// jsdom has no real canvas/WebGL implementation. useWebGLSupport() already
// catches this and falls back to the CSS ecosystem — this stub just keeps
// jsdom's "not implemented" warning out of test output.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// jsdom doesn't implement matchMedia — MotionProvider and useMotion() rely on
// it, so every test render needs a stub or it throws.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
