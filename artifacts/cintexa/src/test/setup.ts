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

// jsdom has no IntersectionObserver — ScrollReveal and the 3D hero's
// off-screen pause both use it. Stub it as "always intersecting" so
// components mount without crashing; behavior itself isn't under test here.
if (typeof window.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

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

// jsdom has no requestAnimationFrame. GSAP's internal ticker (used by
// GsapStagger/ScrollTrigger) schedules callbacks through it and can fire
// after a test's DOM has already torn down, throwing "requestAnimationFrame
// is not defined" as an unhandled error that fails the whole test run even
// though the test itself passed. Stub it the same way jsdom's other missing
// browser APIs are stubbed above.
if (typeof window.requestAnimationFrame === "undefined") {
  window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
    setTimeout(() => callback(Date.now()), 16)) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((handle: number) => clearTimeout(handle)) as typeof window.cancelAnimationFrame;
}
