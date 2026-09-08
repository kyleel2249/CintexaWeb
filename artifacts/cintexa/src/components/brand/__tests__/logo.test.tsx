import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLogo, BrandMark, BrandWordmark } from "../logo";

describe("BrandMark", () => {
  it("renders an accessible SVG with the CINTEXA label", () => {
    render(<BrandMark />);
    expect(screen.getByRole("img", { name: "CINTEXA" })).toBeInTheDocument();
  });

  it("swaps colors for the inverse variant", () => {
    const { container } = render(<BrandMark variant="inverse" />);
    const rect = container.querySelector("rect");
    expect(rect).toHaveAttribute("fill", "#0B0F14");
  });
});

describe("BrandWordmark", () => {
  it("renders the CINTEXA wordmark text", () => {
    render(<BrandWordmark />);
    expect(screen.getByText("CINTEXA")).toBeInTheDocument();
  });
});

describe("BrandLogo", () => {
  it("renders both the mark and the wordmark together", () => {
    render(<BrandLogo />);
    expect(screen.getByRole("img", { name: "CINTEXA" })).toBeInTheDocument();
    expect(screen.getByText("CINTEXA")).toBeInTheDocument();
  });
});
