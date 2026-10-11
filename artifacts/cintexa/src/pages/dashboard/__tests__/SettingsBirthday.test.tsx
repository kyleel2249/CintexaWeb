import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { CurrencyContext } from "@/lib/currency/context";

const updateAccount = vi.fn();
let currentUser: Record<string, unknown> | null = {
  id: "u1",
  fullName: "Kyle Test",
  firstName: "Kyle",
  dateOfBirth: null,
  birthdayEmail: true,
};

vi.mock("@/lib/auth", () => ({
  useUser: () => ({ user: currentUser }),
  useAuth: () => ({ signOut: vi.fn(), updateAccount }),
}));
vi.mock("@/hooks/useApi", () => ({
  useMyProfile: () => ({ data: { profile: null }, isLoading: false }),
  useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, isError: false }),
  useExportMyData: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteMyData: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("../DashboardShell", () => ({ DashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/insights/InsightPanel", () => ({ InsightPanel: () => null }));

import { DashboardSettings } from "../Settings";

const renderPage = () =>
  render(
    <CurrencyContext.Provider
      value={{ currency: "GHS", country: "GH", region: "GH", source: "network", preference: "auto", setPreference: () => undefined, detecting: false }}
    >
      <DashboardSettings />
    </CurrencyContext.Provider>,
  );

describe("Settings → Date of Birth", () => {
  beforeEach(() => {
    updateAccount.mockReset();
    updateAccount.mockResolvedValue({ ok: true });
    currentUser = { id: "u1", fullName: "Kyle Test", firstName: "Kyle", dateOfBirth: null, birthdayEmail: true };
  });

  it("is called “Date of Birth” and shows no explanations or extra controls", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Date of Birth" })).toBeInTheDocument();
    expect(screen.queryByText(/birthday/i)).toBeNull();
    expect(screen.queryByText(/wish you a happy birthday|only used for that|optional/i)).toBeNull();
    expect(screen.queryByLabelText(/Email me a birthday message/i)).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /birthday/i })).toBeNull();
    expect(document.getElementById("dob")!.getAttribute("aria-describedby")).toBeNull();
  });

  it("adds a date of birth", async () => {
    renderPage();
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled(); // nothing changed yet
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1990-10-10" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(updateAccount).toHaveBeenCalledWith({ dateOfBirth: "1990-10-10" }));
    expect(await screen.findByText("Date of birth saved.")).toBeInTheDocument();
  });

  it("shows the saved date and lets the user remove it", async () => {
    currentUser = { ...currentUser!, dateOfBirth: "1990-10-10" };
    renderPage();
    expect((screen.getByLabelText("Date of Birth") as HTMLInputElement).value).toBe("1990-10-10");
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateAccount).toHaveBeenLastCalledWith({ dateOfBirth: null }));
    expect(await screen.findByText("Date of birth removed.")).toBeInTheDocument();
  });

  it("rejects a bad date before calling the server, and reports server errors", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "2999-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/future/i);
    expect(updateAccount).not.toHaveBeenCalled();

    updateAccount.mockResolvedValueOnce({ ok: false, error: "Could not save your details" });
    fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1990-10-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your details");
  });
});
