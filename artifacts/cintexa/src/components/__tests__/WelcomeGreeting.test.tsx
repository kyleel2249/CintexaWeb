import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { WelcomeGreeting } from "../WelcomeGreeting";
import { markWelcome, resetWelcomeForTests } from "@/lib/greetings/welcome";
import { AuthProvider, useAuth } from "@/lib/auth";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  resetWelcomeForTests();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("WelcomeGreeting", () => {
  it("renders nothing when the user did not just sign in", () => {
    render(<WelcomeGreeting name="Kyle" userId="u1" country="GH" />);
    expect(screen.queryByTestId("welcome-greeting")).toBeNull();
  });

  it("greets the user by name right after sign-in, and can be dismissed", () => {
    markWelcome("signin");
    render(<WelcomeGreeting name="Kyle" userId="u1" country="GH" streakDays={3} />);
    const banner = screen.getByTestId("welcome-greeting");
    expect(banner).toHaveAttribute("role", "status");
    expect(banner.textContent).toContain("Kyle");
    fireEvent.click(screen.getByRole("button", { name: /dismiss welcome/i }));
    expect(screen.queryByTestId("welcome-greeting")).toBeNull();
  });

  it("welcomes a brand-new account to CINTEXA", () => {
    markWelcome("signup");
    render(<WelcomeGreeting name="Ama" userId="u2" country="US" />);
    expect(screen.getByTestId("welcome-greeting").textContent).toMatch(/CINTEXA/);
  });

  it("closes itself after a few seconds", () => {
    vi.useFakeTimers();
    markWelcome("signin");
    render(<WelcomeGreeting name="Kyle" userId="u1" country={null} />);
    expect(screen.getByTestId("welcome-greeting")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(16_000);
    });
    expect(screen.queryByTestId("welcome-greeting")).toBeNull();
  });
});

describe("sign-in triggers the welcome", () => {
  it("successful sign-in and sign-up mark a welcome; a failed sign-in does not", async () => {
    const user = { id: "u1", email: "k@example.com", fullName: "Kyle Test" };
    const responses = [
      new Response(JSON.stringify({ error: "Invalid email or password." }), { status: 401 }),
      new Response(JSON.stringify({ token: "t", user }), { status: 200 }),
      new Response(JSON.stringify({ token: "t2", user }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift() as Response));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      expect((await result.current.signIn("k@example.com", "wrong")).ok).toBe(false);
    });
    expect(sessionStorage.getItem("cintexa_welcome")).toBeNull();

    await act(async () => {
      expect((await result.current.signIn("k@example.com", "right-pass")).ok).toBe(true);
    });
    expect(JSON.parse(sessionStorage.getItem("cintexa_welcome")!).kind).toBe("signin");

    await act(async () => {
      await result.current.signUp({ fullName: "Kyle Test", email: "k@example.com", password: "password123" });
    });
    expect(JSON.parse(sessionStorage.getItem("cintexa_welcome")!).kind).toBe("signup");
  });
});
