import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { CASE_STUDIES, getCaseStudies, type CaseStudy } from "@/data/case-studies";
import { CaseStudies } from "../CaseStudies";
import { CaseStudyDetail } from "../CaseStudyDetail";

const cases = getCaseStudies();
const meta = (name: string, attr = "name") => document.head.querySelector(`meta[${attr}="${name}"]`)?.getAttribute("content") ?? null;

beforeEach(() => window.history.replaceState(null, "", "/case-studies"));

describe("/case-studies list", () => {
  it("lists every case with its own URL, honest labels, and a Contact (not sign-up) CTA", () => {
    render(<CaseStudies />);
    expect(screen.getByRole("heading", { level: 1, name: "Case studies" })).toBeInTheDocument();
    expect(screen.getByText(/clearly labelled illustrative scenarios/)).toBeInTheDocument();
    for (const c of cases) {
      const card = document.getElementById(c.slug)!;
      expect(within(card).getByRole("link", { name: "Read case study" })).toHaveAttribute("href", `/case-studies/${c.slug}`);
      expect(within(card).getByRole("link", { name: c.title })).toHaveAttribute("href", `/case-studies/${c.slug}`);
      expect(within(card).getByText("Illustrative scenario")).toBeInTheDocument();
      expect(within(card).getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Contact CINTEXA" })).toHaveAttribute("href", "/contact");
    expect(document.body.innerHTML).not.toContain("/get-started");
  });

  it("sets the page's preview from the newest case", () => {
    render(<CaseStudies />);
    expect(meta("og:image", "property")).toMatch(/\/case-studies\/.+-[0-9a-f]{8}\.png$/);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://cintexa.com/case-studies");
    expect(document.querySelectorAll('script[type="application/ld+json"][data-seo="page"]')).toHaveLength(1);
  });

  it("searches, filters, keeps state in the URL, and clears", () => {
    render(<CaseStudies />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "checkout" } });
    expect(document.getElementById("small-business-ecommerce-foundation")).toBeTruthy();
    expect(document.getElementById("business-website-enquiry-workflow")).toBeNull();
    expect(window.location.search).toBe("?q=checkout");
    expect(screen.getByText(/Showing 1 of 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(window.location.search).toBe("");
    fireEvent.change(screen.getByLabelText("Service"), { target: { value: "Website development" } });
    expect(document.getElementById("business-website-enquiry-workflow")).toBeTruthy();
    expect(document.getElementById("small-business-ecommerce-foundation")).toBeNull();
  });

  it("opens a filtered view from a shared link, and shows an empty state", () => {
    window.history.replaceState(null, "", "/case-studies?q=checkout");
    render(<CaseStudies />);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("checkout");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "astronaut" } });
    expect(screen.getByText("No case studies match your search.")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
    expect(document.getElementById("business-website-enquiry-workflow")).toBeTruthy();
  });

  it("the Verified filter shows nothing until a verified case exists", () => {
    render(<CaseStudies />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "verified" } });
    expect(screen.getByText("No case studies match your search.")).toBeInTheDocument();
  });
});

function renderDetail(slug: string) {
  const { hook } = memoryLocation({ path: `/case-studies/${slug}` });
  return render(
    <Router hook={hook}>
      <Route path="/case-studies/:slug" component={CaseStudyDetail} />
    </Router>,
  );
}

describe("/case-studies/:slug — one page per case", () => {
  it.each(CASE_STUDIES.map((c) => [c.slug, c] as const))("%s: full content, honest disclaimer, contents list and measurement plan", (_slug, c) => {
    renderDetail(c.slug);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(c.title);
    expect(screen.getByRole("note")).toHaveTextContent(/no client results are claimed/);
    for (const label of ["The problem", "Assessment", "Solution", "Implementation", "Results", "How it would be measured", "Technology"]) {
      expect(screen.getByRole("heading", { level: 2, name: label })).toBeInTheDocument();
    }
    expect(screen.getByText(c.problem)).toBeInTheDocument();
    const toc = screen.getByRole("navigation", { name: "On this page" });
    expect(within(toc).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(
      ["problem", "assessment", "solution", "implementation", "results", "measurement", "technology"].map((id) => `#${id}`),
    );
    const table = screen.getByRole("heading", { name: "How it would be measured" }).closest("section")!;
    expect(within(table).getAllByRole("row")).toHaveLength(c.metrics.length + 1);
    for (const t of c.technologyTags) expect(screen.getByText(t)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: c.service })).toHaveAttribute("href", c.serviceHref);
  });

  it("sets this case's own preview and canonical", () => {
    const c = cases[1]!;
    renderDetail(c.slug);
    expect(meta("og:url", "property")).toBe(`https://cintexa.com/case-studies/${c.slug}`);
    expect(meta("og:image", "property")).toMatch(new RegExp(`/case-studies/${c.slug}-[0-9a-f]{8}\\.png$`));
    expect(meta("og:type", "property")).toBe("article");
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", `https://cintexa.com/case-studies/${c.slug}`);
  });

  it("offers a pre-filled enquiry, share, print, related cases and previous/next", () => {
    const c = cases[1]!;
    renderDetail(c.slug);
    const link = screen.getByRole("link", { name: "Discuss a similar project" }).getAttribute("href")!;
    expect(link.startsWith("/contact?")).toBe(true);
    expect(new URLSearchParams(link.split("?")[1]).get("message")).toContain(c.title);
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", expect.stringContaining(encodeURIComponent(`/case-studies/${c.slug}`)));
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Print or save as PDF" }));
    expect(print).toHaveBeenCalled();
    print.mockRestore();
    const more = screen.getByRole("heading", { name: "More case studies" }).closest("section")!;
    expect(within(more).getAllByRole("link")).toHaveLength(2);
    const nav = screen.getByRole("navigation", { name: "Other case studies" });
    expect(within(nav).getByRole("link", { name: new RegExp(cases[0]!.title) })).toHaveAttribute("href", `/case-studies/${cases[0]!.slug}`);
    expect(within(nav).getByRole("link", { name: new RegExp(cases[2]!.title) })).toHaveAttribute("href", `/case-studies/${cases[2]!.slug}`);
  });

  it("an unknown case says so and stays out of search engines", () => {
    renderDetail("nope");
    expect(screen.getByRole("heading", { name: "Case study not found" })).toBeInTheDocument();
    expect(meta("robots")).toContain("noindex");
  });
});

describe("a verified case (supported, ready for real clients)", () => {
  const verified: CaseStudy = {
    ...CASE_STUDIES[0]!,
    slug: "verified-demo",
    title: "Verified demo",
    status: "verified",
    client: "Demo Client Ltd",
    permission: true,
    evidence: [{ metric: "Enquiry response time", before: "2 days", after: "4 hours", period: "Jan–Mar 2027", source: "Enquiry log" }],
  };
  beforeEach(() => void CASE_STUDIES.push(verified));
  afterEach(() => void CASE_STUDIES.splice(CASE_STUDIES.indexOf(verified), 1));

  it("shows the evidence table, names the client, and drops the 'illustrative' disclaimer", () => {
    renderDetail("verified-demo");
    expect(screen.queryByRole("note")).toBeNull();
    const evidence = screen.getByRole("heading", { name: "Measured results" }).closest("section")!;
    expect(within(evidence).getByText("Enquiry response time")).toBeInTheDocument();
    expect(within(evidence).getByText("4 hours")).toBeInTheDocument();
    expect(within(evidence).getByText("Enquiry log")).toBeInTheDocument();
    expect(within(evidence).getByText(/Demo Client Ltd/)).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "On this page" })).getByRole("link", { name: "Measured results" })).toBeInTheDocument();
    expect(within(screen.getAllByRole("list", { name: "Case study details" })[0]!).getByText("Verified results")).toBeInTheDocument();
  });
});
