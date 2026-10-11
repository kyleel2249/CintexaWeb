import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const signUp = vi.fn();
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ signIn: vi.fn(), signUp, isSignedIn: false, isLoaded: true }),
  requestPasswordReset: vi.fn(),
  resetPasswordWithCode: vi.fn(),
}));
vi.mock("@/components/brand/AuthLogo3D", () => ({ AuthLogo3D: () => null }));

import { GetStarted } from "../GetStarted";

function fillBase(dob?: string) {
  fireEvent.change(document.getElementById("cintexa-signup-name")!, { target: { value: "Kyle Test" } });
  fireEvent.change(document.getElementById("cintexa-signup-email")!, { target: { value: "k@example.com" } });
  fireEvent.change(document.getElementById("cintexa-signup-password")!, { target: { value: "password123" } });
  if (dob !== undefined) fireEvent.change(document.getElementById("cintexa-signup-dob")!, { target: { value: dob } });
}

describe("Sign-up date of birth", () => {
  beforeEach(() => {
    signUp.mockReset();
    signUp.mockResolvedValue({ ok: true });
    localStorage.clear();
    window.history.pushState({}, "", "/sign-up");
  });

  it("offers an optional, labelled date field with no explanatory text", () => {
    render(<GetStarted />);
    const input = document.getElementById("cintexa-signup-dob") as HTMLInputElement;
    expect(input.type).toBe("date");
    expect(input.required).toBe(false);
    expect(input.autocomplete).toBe("bday");
    expect(input.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByText("Date of Birth")).toBeInTheDocument();
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByText(/birthday wishes|13 or older|optional —/i)).toBeNull();
  });

  it("sends the date with the sign-up", async () => {
    render(<GetStarted />);
    fillBase("1990-10-10");
    fireEvent.submit(document.getElementById("cx-panel-signup")!);
    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(signUp.mock.calls[0]![0]).toMatchObject({ email: "k@example.com", dateOfBirth: "1990-10-10" });
  });

  it("works without a date", async () => {
    render(<GetStarted />);
    fillBase();
    fireEvent.submit(document.getElementById("cx-panel-signup")!);
    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(signUp.mock.calls[0]![0].dateOfBirth).toBeUndefined();
  });

  it("blocks a future or under-age date with a clear message and does not call the API", async () => {
    render(<GetStarted />);
    fillBase("2999-01-01");
    fireEvent.submit(document.getElementById("cx-panel-signup")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/future/i);
    expect(signUp).not.toHaveBeenCalled();

    const recent = `${new Date().getFullYear() - 5}-01-01`;
    fireEvent.change(document.getElementById("cintexa-signup-dob")!, { target: { value: recent } });
    fireEvent.submit(document.getElementById("cx-panel-signup")!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/at least 13/i));
    expect(signUp).not.toHaveBeenCalled();
  });
});
