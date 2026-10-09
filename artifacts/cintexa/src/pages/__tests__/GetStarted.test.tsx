import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const signIn = vi.fn();
const signUp = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ signIn, signUp, isSignedIn: false, isLoaded: true }),
  requestPasswordReset: vi.fn(),
  resetPasswordWithCode: vi.fn(),
}));
vi.mock("@/components/brand/AuthLogo3D", () => ({ AuthLogo3D: () => null }));

import { GetStarted } from "../GetStarted";

describe("GetStarted", () => {
  beforeEach(() => {
    signIn.mockReset();
    signUp.mockReset();
    localStorage.clear();
    window.history.pushState({}, "", "/get-started");
  });

  it("opens on sign up for new visitors and links Terms + Privacy", () => {
    render(<GetStarted />);
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
  });

  it("opens on log in for /sign-in", () => {
    window.history.pushState({}, "", "/sign-in");
    render(<GetStarted />);
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    render(<GetStarted />);
    const input = document.getElementById("cintexa-signup-password") as HTMLInputElement;
    expect(input.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.type).toBe("text");
  });

  it("rejects an invalid phone before calling the API", async () => {
    render(<GetStarted />);
    fireEvent.change(document.getElementById("cintexa-signup-name")!, { target: { value: "Kyle Test" } });
    fireEvent.change(document.getElementById("cintexa-signup-email")!, { target: { value: "k@example.com" } });
    fireEvent.change(document.getElementById("cintexa-signup-password")!, { target: { value: "password123" } });
    fireEvent.change(document.getElementById("cintexa-signup-phone")!, { target: { value: "abc" } });
    fireEvent.submit(document.getElementById("cx-panel-signup")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/valid phone/i);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows the server error on failed log in", async () => {
    window.history.pushState({}, "", "/sign-in");
    signIn.mockResolvedValue({ ok: false, error: "Invalid email or password." });
    render(<GetStarted />);
    fireEvent.change(document.getElementById("cintexa-login-email")!, { target: { value: "k@example.com" } });
    fireEvent.change(document.getElementById("cintexa-login-password")!, { target: { value: "wrong-pass" } });
    fireEvent.submit(document.getElementById("cx-panel-login")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password."));
  });
});
