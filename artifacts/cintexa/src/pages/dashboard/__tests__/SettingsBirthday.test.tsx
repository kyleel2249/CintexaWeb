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

describe("Settings → Birthday", () => {
  beforeEach(() => {
    updateAccount.mockReset();
    updateAccount.mockResolvedValue({ ok: true });
    currentUser = { id: "u1", fullName: "Kyle Test", firstName: "Kyle", dateOfBirth: null, birthdayEmail: true };
  });

  it("adds a date of birth and keeps the email preference", async () => {
    renderPage();
    const save = screen.getByRole("button", { name: "Save birthday" });
    expect(save).toBeDisabled(); // nothing changed yet
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-10-10" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(updateAccount).toHaveBeenCalledWith({ dateOfBirth: "1990-10-10", birthdayEmail: true }));
    expect(await screen.findByText("Birthday saved.")).toBeInTheDocument();
  });

  it("shows the saved date, lets the user switch the email off, and remove the date", async () => {
    currentUser = { ...currentUser!, dateOfBirth: "1990-10-10" };
    renderPage();
    expect((screen.getByLabelText("Date of birth") as HTMLInputElement).value).toBe("1990-10-10");
    expect(screen.getByText(/Your next birthday: (10 October|October 10)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Email me a birthday message on my birthday"));
    fireEvent.click(screen.getByRole("button", { name: "Save birthday" }));
    await waitFor(() => expect(updateAccount).toHaveBeenLastCalledWith({ dateOfBirth: "1990-10-10", birthdayEmail: false }));

    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save birthday" }));
    await waitFor(() => expect(updateAccount).toHaveBeenLastCalledWith({ dateOfBirth: null, birthdayEmail: true }));
  });

  it("rejects a bad date before calling the server, and reports server errors", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "2999-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Save birthday" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/future/i);
    expect(updateAccount).not.toHaveBeenCalled();

    updateAccount.mockResolvedValueOnce({ ok: false, error: "Could not save your details" });
    fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-10-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Save birthday" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save your details");
  });
});
