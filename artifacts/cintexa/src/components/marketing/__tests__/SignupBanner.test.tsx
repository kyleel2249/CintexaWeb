import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SignupBanner } from "../SignupBanner";
import { clearPromoCode } from "@/lib/platform-economics";

function renderBanner() {
  return render(
    <MotionProvider>
      <SignupBanner />
    </MotionProvider>,
  );
}

describe("SignupBanner", () => {
  afterEach(() => {
    clearPromoCode();
  });

  it("renders all three signup steps", () => {
    renderBanner();
    expect(screen.getByText("Create your free account")).toBeInTheDocument();
    expect(screen.getByText("Tell us what you do")).toBeInTheDocument();
    expect(screen.getByText("Start growing")).toBeInTheDocument();
  });

  it("links to the signup page", () => {
    renderBanner();
    expect(screen.getByRole("link", { name: /get started free/i })).toHaveAttribute("href", "/get-started");
  });

  it("renders the headline", () => {
    renderBanner();
    expect(screen.getByText(/keep your sale — up and running in three easy steps/i)).toBeInTheDocument();
  });

  it("shows the default 7% fee rate when no promo is active", () => {
    renderBanner();
    expect(screen.getByText(/platform fee is 7%/i)).toBeInTheDocument();
  });

  it("shows the promo 5% fee rate once FREE2026 is applied", () => {
    localStorage.setItem("cintexa.promo.code", "FREE2026");
    renderBanner();
    expect(screen.getByText(/platform fee is 5%/i)).toBeInTheDocument();
  });
});
