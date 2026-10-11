import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const saveProfile = vi.fn();
let profileState: { isLoading: boolean; data?: { profile: Record<string, unknown> | null } };
let signedIn = true;

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ isSignedIn: signedIn, signOut: vi.fn() }),
  useUser: () => ({
    user: { id: "u1", firstName: "Kyle", fullName: "Kyle Test", dateOfBirth: null, birthdayEmail: true },
  }),
}));
vi.mock("@/hooks/useApi", () => ({
  useMyProfile: () => profileState,
  useUpdateProfile: () => ({ mutate: saveProfile }),
}));
vi.mock("@/lib/social-hub", () => ({ ensureAdminReferrer: vi.fn() }));

import { DashboardShell } from "../DashboardShell";

const renderShell = () =>
  render(
    <DashboardShell>
      <p>PAGE CONTENT</p>
    </DashboardShell>,
  );

describe("sign-up has no questionnaire", () => {
  beforeEach(() => {
    saveProfile.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    signedIn = true;
    profileState = { isLoading: false, data: { profile: { onboardingCompleted: false } } };
  });

  it("a brand-new account lands straight on the dashboard", () => {
    renderShell();
    expect(screen.getByText("PAGE CONTENT")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Dashboard sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Kyle/);
    // none of the old questionnaire (role → interests → frequency)
    expect(screen.queryByText(/What best describes you/i)).toBeNull();
    expect(screen.queryByText(/tailor your dashboard/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /continue|next|skip/i })).toBeNull();
  });

  it("marks the account set up once, in the background, with no referral when there is none", () => {
    const { rerender } = renderShell();
    expect(saveProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile.mock.calls[0]![0]).toEqual({ onboardingCompleted: true });
    rerender(
      <DashboardShell>
        <p>PAGE CONTENT</p>
      </DashboardShell>,
    );
    expect(saveProfile).toHaveBeenCalledTimes(1);
  });

  it("still attaches a referral link the visitor arrived through, then clears it", () => {
    localStorage.setItem("cintexa.pendingReferral", "ama_k");
    saveProfile.mockImplementation((_body: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.());
    renderShell();
    expect(saveProfile.mock.calls[0]![0]).toEqual({ onboardingCompleted: true, referredByUserId: "ama_k" });
    expect(localStorage.getItem("cintexa.pendingReferral")).toBeNull();
  });

  it("keeps the referral if saving fails, so it can be attached next time", () => {
    localStorage.setItem("cintexa.pendingReferral", "ama_k");
    renderShell(); // mutate never calls onSuccess
    expect(localStorage.getItem("cintexa.pendingReferral")).toBe("ama_k");
  });

  it("leaves established accounts alone", () => {
    profileState = { isLoading: false, data: { profile: { onboardingCompleted: true, role: "creator" } } };
    renderShell();
    expect(saveProfile).not.toHaveBeenCalled();
    expect(screen.getByText("PAGE CONTENT")).toBeInTheDocument();
  });

  it("waits for the profile before doing anything", () => {
    profileState = { isLoading: true };
    renderShell();
    expect(screen.getByText("Loading your portal…")).toBeInTheDocument();
    expect(saveProfile).not.toHaveBeenCalled();
    expect(screen.queryByText("PAGE CONTENT")).toBeNull();
  });

  it("does nothing for signed-out visitors", () => {
    signedIn = false;
    renderShell();
    expect(saveProfile).not.toHaveBeenCalled();
    expect(screen.getByText(/Get started to access your dashboard/)).toBeInTheDocument();
  });
});
