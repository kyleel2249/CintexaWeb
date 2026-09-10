import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home } from "../Home";
import { MotionProvider } from "@/components/motion/MotionProvider";

describe("Home page", () => {
  it("renders the headline and primary calls to action", () => {
    render(
      <MotionProvider>
        <Home />
      </MotionProvider>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/one connected core/i);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/get-started");
    expect(screen.getByRole("link", { name: /see the platform/i })).toBeInTheDocument();
  });

  it("links each pillar card to its solution page", () => {
    render(
      <MotionProvider>
        <Home />
      </MotionProvider>,
    );
    expect(screen.getByRole("link", { name: /ads boost/i })).toHaveAttribute("href", "/solutions/ads-boost");
  });
});
