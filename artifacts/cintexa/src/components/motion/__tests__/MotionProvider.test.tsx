import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MotionProvider, useMotion } from "../MotionProvider";

function Probe() {
  const { allowMotion, allow3D, reducedMotion } = useMotion();
  return (
    <div>
      <span data-testid="allowMotion">{String(allowMotion)}</span>
      <span data-testid="allow3D">{String(allow3D)}</span>
      <span data-testid="reducedMotion">{String(reducedMotion)}</span>
    </div>
  );
}

describe("MotionProvider", () => {
  it("defaults to motion allowed when no reduced-motion preference is set", () => {
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId("allowMotion")).toHaveTextContent("true");
    expect(screen.getByTestId("reducedMotion")).toHaveTextContent("false");
  });

  it("toggles the no-motion class on <html> based on the profile", () => {
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(document.documentElement.classList.contains("no-motion")).toBe(false);
  });
});
