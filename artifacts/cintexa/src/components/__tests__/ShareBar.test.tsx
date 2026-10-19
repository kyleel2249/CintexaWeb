import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ShareBar } from "../ShareBar";

const url = "https://cintexa.com/case-studies/x";

describe("ShareBar", () => {
  it("copies the page's own link", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });
    render(<ShareBar url={url} title="X" text="X — CINTEXA" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(url));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });
  it("links every network to that page", () => {
    Object.assign(navigator, { share: undefined });
    render(<ShareBar url={url} title="X" text="X — CINTEXA" />);
    for (const name of ["WhatsApp", "LinkedIn", "X", "Facebook", "Email"]) {
      expect(decodeURIComponent(screen.getByRole("link", { name }).getAttribute("href")!)).toContain(url);
    }
    expect(screen.queryByRole("button", { name: "Share…" })).toBeNull(); // no native share here
  });
  it("offers the device share sheet when there is one, and a compact mode", () => {
    const share = vi.fn(async () => undefined);
    Object.assign(navigator, { share });
    const { unmount } = render(<ShareBar url={url} title="X" text="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Share…" }));
    expect(share).toHaveBeenCalledWith({ title: "X", text: "t", url });
    unmount();
    render(<ShareBar url={url} title="X" text="t" compact />);
    expect(screen.queryByRole("link", { name: "LinkedIn" })).toBeNull();
    expect(screen.getByRole("link", { name: "WhatsApp" })).toBeInTheDocument();
  });
});
