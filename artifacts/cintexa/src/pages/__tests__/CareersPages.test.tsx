import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { resetSavedJobsForTests } from "@/lib/saved-jobs";
import { getOpenJobs } from "@/data/jobs";

vi.mock("@/lib/email-notifications", () => ({ submitCareerAlert: vi.fn() }));
vi.mock("@/lib/careers-api", () => ({ submitApplication: vi.fn() }));

import { Careers } from "../Careers";
import { JobDetail } from "../JobDetail";

const jobs = getOpenJobs();
const [first, second] = jobs;
const meta = (name: string, attr = "name") => document.head.querySelector(`meta[${attr}="${name}"]`)?.getAttribute("content") ?? null;

beforeEach(() => {
  localStorage.clear();
  resetSavedJobsForTests();
  window.history.replaceState(null, "", "/careers");
});

describe("/careers list", () => {
  it("lists every vacancy, each linking to its own URL", () => {
    render(<Careers />);
    for (const job of jobs) {
      const card = document.getElementById(job.slug)!;
      expect(card, job.slug).toBeTruthy();
      expect(within(card).getByRole("link", { name: "View role & apply" })).toHaveAttribute("href", `/careers/${job.slug}`);
    }
    const unique = new Set(jobs.map((j) => `/careers/${j.slug}`));
    expect(unique.size).toBe(jobs.length);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vacancy feed (RSS)" })).toHaveAttribute("href", "/careers/feed.xml");
  });

  it("searches as you type and keeps the search in the URL", () => {
    render(<Careers />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: first!.role.toLowerCase() } });
    expect(document.getElementById(first!.slug)).toBeTruthy();
    expect(document.getElementById(second!.slug)).toBeNull();
    expect(window.location.search).toBe(`?${new URLSearchParams({ q: first!.role.toLowerCase() })}`);
    expect(screen.getByText(/Showing 1 of 2 vacancies/)).toBeInTheDocument();
  });

  it("opens a filtered view straight from a shared link", () => {
    window.history.replaceState(null, "", "/careers?q=cleaners");
    render(<Careers />);
    expect(document.getElementById("cleaner")).toBeTruthy();
    expect(document.getElementById("bybeth-boutique-sales-girl")).toBeNull();
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("cleaners");
  });

  it("filters by category and clears back to the full list", () => {
    render(<Careers />);
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Retail & fashion" } });
    expect(document.getElementById("bybeth-boutique-sales-girl")).toBeTruthy();
    expect(document.getElementById("cleaner")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(document.getElementById("cleaner")).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("shows a helpful empty state", () => {
    render(<Careers />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "astronaut" } });
    expect(screen.getByText("No vacancies match your search.")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
    expect(document.getElementById("cleaner")).toBeTruthy();
  });

  it("the Saved filter shows only saved vacancies", () => {
    render(<Careers />);
    fireEvent.click(within(document.getElementById("cleaner")!).getByRole("button", { name: /^Save/ }));
    fireEvent.click(screen.getByRole("button", { name: /Saved \(1\)/ }));
    expect(document.getElementById("cleaner")).toBeTruthy();
    expect(document.getElementById("bybeth-boutique-sales-girl")).toBeNull();
    expect(window.location.search).toBe("?saved=1");
  });

  it("sets per-page metadata from the live vacancy list", () => {
    render(<Careers />);
    expect(meta("og:image", "property")).toBe(`https://cintexa.com${first!.socialImage}`);
    expect(document.querySelectorAll('script[type="application/ld+json"][data-seo="page"]')).toHaveLength(1);
  });

  it("the alert form is on the page and rejects bad input", async () => {
    render(<Careers />);
    fireEvent.click(screen.getByRole("button", { name: "Get job & scholarship emails" }));
    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
  });
});

function renderDetail(slug: string) {
  const { hook } = memoryLocation({ path: `/careers/${slug}` });
  return render(
    <Router hook={hook}>
      <Route path="/careers/:id" component={JobDetail} />
    </Router>,
  );
}

describe("/careers/:slug — one page per vacancy", () => {
  it.each(jobs.map((j) => [j.slug, j.title] as const))("%s has its own page, heading, breadcrumb and apply form", (slug, title) => {
    renderDetail(slug);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Careers" })).toHaveAttribute("href", "/careers");
    expect(screen.getByRole("heading", { name: "Apply online" })).toBeInTheDocument();
    expect(meta("og:url", "property")).toBe(`https://cintexa.com/careers/${slug}`);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", `https://cintexa.com/careers/${slug}`);
  });

  it("links to the other vacancies, each with its own URL", () => {
    renderDetail(first!.slug);
    const related = screen.getByRole("heading", { name: "More vacancies" }).closest("section")!;
    expect(within(related).getByRole("link", { name: new RegExp(second!.title) })).toHaveAttribute("href", `/careers/${second!.slug}`);
    expect(screen.getByRole("link", { name: new RegExp(`${second!.role} →`) })).toHaveAttribute("href", `/careers/${second!.slug}`);
  });

  it("has share, save and print actions", () => {
    renderDetail(second!.slug);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", expect.stringContaining(encodeURIComponent(`/careers/${second!.slug}`)));
    expect(screen.getByRole("button", { name: `Save ${second!.role}` })).toBeInTheDocument();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });

  it("an unknown or closed vacancy says so and is kept out of search engines", () => {
    renderDetail("no-such-role");
    expect(screen.getByRole("heading", { name: "Role not found" })).toBeInTheDocument();
    expect(meta("robots")).toContain("noindex");
    expect(screen.queryByRole("heading", { name: "Apply online" })).toBeNull();
  });
});
