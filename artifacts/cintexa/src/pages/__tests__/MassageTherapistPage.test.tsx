import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { JobDetail } from "../JobDetail";

describe("Massage Therapist vacancy page", () => {
  it("shows salary, requirements, working apply buttons and no online form", () => {
    const { hook } = memoryLocation({ path: "/careers/massage-therapist-kwabenya-accra" });
    render(
      <Router hook={hook}>
        <Route path="/careers/:id" component={JobDetail} />
      </Router>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Massage Therapist Job in Kwabenya, Accra");
    expect(screen.getAllByText("GH₵ 4,000–5,000 per month").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kwabenya, Accra, Ghana").length).toBeGreaterThan(0);
    expect(screen.getByText("Relevant certification in massage therapy.")).toBeInTheDocument();
    expect(screen.getByText("Practical experience in massage treatments.")).toBeInTheDocument();
    expect(screen.getByText("Strong client care and communication skills.")).toBeInTheDocument();

    const wa = screen.getAllByRole("link", { name: /Apply via WhatsApp/ });
    expect(wa.length).toBeGreaterThanOrEqual(2);
    for (const a of wa) {
      expect(a.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/233248368941\?text=/);
      expect(a).toHaveAttribute("target", "_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    }
    const calls = screen.getAllByRole("link", { name: /Call to Apply/ });
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const a of calls) expect(a).toHaveAttribute("href", "tel:+233248368941");

    expect(screen.queryByRole("heading", { name: "Apply online" })).toBeNull();
    expect(screen.queryByText("What you’ll do")).toBeNull();
  });
});
