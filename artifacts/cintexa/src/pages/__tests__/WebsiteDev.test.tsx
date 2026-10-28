import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { WEB_DESIGN } from "@/data/web-design";
import { WebsiteDev } from "../WebsiteDev";

describe("Web design & development page", () => {
  it("renders the H1, CTAs, every service, FAQs and valid links", () => {
    const { hook } = memoryLocation({ path: "/solutions/website-development" });
    render(<Router hook={hook}><WebsiteDev /></Router>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Professional Web Design & Development Company");
    expect(screen.getAllByRole("link", { name: "Request a Website Consultation" })[0]).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("link", { name: "View Our Work" })).toHaveAttribute("href", "/case-studies");
    for (const s of WEB_DESIGN.services) expect(screen.getByRole("heading", { level: 3, name: s.title })).toBeInTheDocument();
    for (const f of WEB_DESIGN.faqs) expect(screen.getByText(f.q)).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(document.title).toBe("Web Design & Development Company in Ghana | CINTEXA");
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://cintexa.com/solutions/website-development");
  });
});
