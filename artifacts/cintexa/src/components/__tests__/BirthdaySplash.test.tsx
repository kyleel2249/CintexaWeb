import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BirthdaySplash } from "../BirthdaySplash";

const BIRTHDAY = new Date("2026-10-10T09:00:00Z");

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(BIRTHDAY);
});
afterEach(() => vi.useRealTimers());

describe("BirthdaySplash", () => {
  it("does not appear when it isn't the user's birthday", () => {
    render(<BirthdaySplash userId="u1" name="Kyle" dateOfBirth="1990-03-05" timeZone="UTC" />);
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
  });
  it("does not appear without a date of birth", () => {
    render(<BirthdaySplash userId="u1" name="Kyle" dateOfBirth={null} timeZone="UTC" />);
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
  });

  it("celebrates by name, as an accessible dialog, once", () => {
    const { unmount } = render(<BirthdaySplash userId="u1" name="Kyle" dateOfBirth="1990-10-10" timeZone="UTC" />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Happy Birthday, Kyle!" })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Thank you!" }));
    unmount();
    // Remounting (reload / navigating to another tab) must not repeat it.
    render(<BirthdaySplash userId="u1" name="Kyle" dateOfBirth="1990-10-10" timeZone="UTC" />);
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
  });

  it("closes with the button, Escape and the backdrop", () => {
    const { unmount } = render(<BirthdaySplash userId="a" name="Kyle" dateOfBirth="1990-10-10" timeZone="UTC" />);
    fireEvent.click(screen.getByRole("button", { name: "Thank you!" }));
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
    unmount();

    const second = render(<BirthdaySplash userId="b" name="Kyle" dateOfBirth="1990-10-10" timeZone="UTC" />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
    second.unmount();

    render(<BirthdaySplash userId="c" name="Kyle" dateOfBirth="1990-10-10" timeZone="UTC" />);
    fireEvent.mouseDown(screen.getByTestId("birthday-splash"));
    expect(screen.queryByTestId("birthday-splash")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});
