import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CAMPAIGNS } from "@/data/campaigns";
import { CampaignDetail } from "../CampaignDetail";

const campaign = CAMPAIGNS[0]!;

afterEach(() => vi.useRealTimers());

describe("Tobinco campaign page", () => {
  it("shows the poster, five roles and a working position-specific email action while open", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-23T10:00:00Z"));
    render(<CampaignDetail campaign={campaign} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your Next Career Opportunity Starts Here" })).toBeInTheDocument();
    expect(screen.getByAltText(campaign.imageAlt)).toBeInTheDocument();
    expect(screen.getByText("Application Deadline: 28 October 2026")).toBeInTheDocument();
    expect(screen.getByText(campaign.applyInstructions)).toBeInTheDocument();

    for (const r of campaign.roles) {
      expect(screen.getByRole("heading", { level: 3, name: r.title })).toBeInTheDocument();
    }
    const apply = screen.getByRole("link", { name: "Apply Now for Head of Medical Sales & Field Force by email" });
    expect(apply).toHaveAttribute(
      "href",
      "mailto:careers@tobincopharma.com?subject=Application%20for%20Head%20of%20Medical%20Sales%20%26%20Field%20Force",
    );
    expect(screen.getAllByRole("link", { name: /Apply Now for .* by email/ })).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Email Your Application" })).toHaveAttribute("href", "mailto:careers@tobincopharma.com");
    expect(screen.getByText(/does not\s+mean your application has been sent/)).toBeInTheDocument();
  });

  it("disables every apply action after the deadline and keeps the record visible", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-29T08:00:00Z"));
    render(<CampaignDetail campaign={campaign} />);

    expect(screen.getByText("Applications closed on 28 October 2026")).toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: /Apply Now for/ })).toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Email Your Application" })).toBeNull();
    for (const r of campaign.roles) {
      expect(screen.getByRole("button", { name: `Applications for ${r.title} are closed` })).toBeDisabled();
      expect(screen.getByRole("heading", { level: 3, name: r.title })).toBeInTheDocument();
    }
  });
});
