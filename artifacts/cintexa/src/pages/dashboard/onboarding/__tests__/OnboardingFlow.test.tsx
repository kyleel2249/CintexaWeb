import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { OnboardingFlow } from "../OnboardingFlow";

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ getToken: async () => "fake-token" }),
}));

function renderFlow() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <OnboardingFlow />
      </MotionProvider>
    </QueryClientProvider>,
  );
}

describe("OnboardingFlow", () => {
  it("starts on the role step with all four roles offered", () => {
    renderFlow();
    expect(screen.getByRole("heading", { name: /what best describes you/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /creator/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /seller/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buyer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /consumer/i })).toBeInTheDocument();
  });

  it("shows role-specific interests after picking a role", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: /seller/i }));
    expect(screen.getByRole("heading", { name: /what are you most interested in/i })).toBeInTheDocument();
    // Seller-only interest should appear...
    expect(screen.getByText("Physical products")).toBeInTheDocument();
    // ...and a creator-only interest should not.
    expect(screen.queryByText("Music & audio")).not.toBeInTheDocument();
  });

  it("requires at least one interest before continuing to the frequency step", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: /buyer/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    fireEvent.click(screen.getByText("Marketing tools"));
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("heading", { name: /how often do you plan to use cintexa/i })).toBeInTheDocument();
  });
});
