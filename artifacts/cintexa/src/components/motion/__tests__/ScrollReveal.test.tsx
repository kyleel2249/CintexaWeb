import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScrollReveal } from "../ScrollReveal";
import { MotionProvider } from "../MotionProvider";

describe("ScrollReveal", () => {
  it("renders its children", () => {
    render(
      <MotionProvider>
        <ScrollReveal>
          <p>Reveal me</p>
        </ScrollReveal>
      </MotionProvider>,
    );
    expect(screen.getByText("Reveal me")).toBeInTheDocument();
  });
});
