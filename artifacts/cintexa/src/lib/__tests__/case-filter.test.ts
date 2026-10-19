import { describe, expect, it } from "vitest";
import { CASE_STUDIES, type CaseStudy } from "@/data/case-studies";
import { DEFAULT_CASE_FILTERS, adjacentCases, caseFacets, filterCases, hasActiveCaseFilters, parseCaseFilters, relatedCases, serializeCaseFilters, similarProjectLink } from "../case-filter";

const [web, shop, flow] = [
  CASE_STUDIES.find((c) => c.slug === "business-website-enquiry-workflow")!,
  CASE_STUDIES.find((c) => c.slug === "small-business-ecommerce-foundation")!,
  CASE_STUDIES.find((c) => c.slug === "administrative-workflow-automation")!,
];
const all = [web, shop, flow];

describe("filters ↔ URL", () => {
  it("round-trips and keeps the plain URL clean", () => {
    expect(serializeCaseFilters(DEFAULT_CASE_FILTERS)).toBe("");
    const f = { q: "online store", service: "E-commerce", industry: "Retail", status: "illustrative" as const, sort: "title" as const };
    expect(parseCaseFilters(serializeCaseFilters(f))).toEqual(f);
  });
  it("ignores junk values", () => {
    expect(parseCaseFilters("?status=hack&sort=x")).toMatchObject({ status: "", sort: "newest" });
    expect(parseCaseFilters(`?q=${"x".repeat(300)}`).q).toHaveLength(100);
    expect(hasActiveCaseFilters(DEFAULT_CASE_FILTERS)).toBe(false);
    expect(hasActiveCaseFilters({ ...DEFAULT_CASE_FILTERS, status: "verified" })).toBe(true);
  });
});

describe("filterCases", () => {
  const find = (over: Partial<typeof DEFAULT_CASE_FILTERS>) => filterCases(all, { ...DEFAULT_CASE_FILTERS, ...over }).map((c) => c.slug);
  it("searches every field, all words required", () => {
    expect(find({ q: "checkout" })).toEqual(["small-business-ecommerce-foundation"]);
    expect(find({ q: "WORKFLOW" }).length).toBeGreaterThan(0);
    expect(find({ q: "retail checkout" })).toEqual(["small-business-ecommerce-foundation"]);
    expect(find({ q: "retail astronaut" })).toEqual([]);
  });
  it("filters by service, industry and type", () => {
    expect(find({ service: "E-commerce" })).toEqual(["small-business-ecommerce-foundation"]);
    expect(find({ industry: "Operations & administration" })).toEqual(["administrative-workflow-automation"]);
    expect(find({ status: "illustrative" })).toHaveLength(3);
    expect(find({ status: "verified" })).toEqual([]);
  });
  it("sorts and never mutates", () => {
    const input = [flow, web, shop];
    const byTitle = filterCases(input, { ...DEFAULT_CASE_FILTERS, sort: "title" }).map((c) => c.title);
    expect(byTitle).toEqual([...byTitle].sort((a, b) => a.localeCompare(b)));
    expect(input).toEqual([flow, web, shop]);
  });
  it("counts facets", () => {
    const f = caseFacets(all);
    expect(f.services.map((x) => x.value)).toEqual(["E-commerce", "Software development", "Website development"]);
    expect(f.services.every((x) => x.count === 1)).toBe(true);
  });
});

describe("related, adjacent and the enquiry link", () => {
  const sameService: CaseStudy = { ...web, slug: "x", title: "X", industry: "Other" };
  it("prefers the same service, then industry; excludes itself", () => {
    expect(relatedCases(web, [web, shop, sameService], 2).map((c) => c.slug)).toEqual(["x", "small-business-ecommerce-foundation"]);
    expect(relatedCases(web, [web])).toEqual([]);
  });
  it("finds neighbours", () => {
    expect(adjacentCases(shop, all)).toEqual({ prev: web, next: flow });
    expect(adjacentCases(sameService, all)).toEqual({ prev: null, next: null });
  });
  it("builds a Contact link (not the sign-up page) pre-filled with this case", () => {
    const link = similarProjectLink(shop);
    expect(link.startsWith("/contact?")).toBe(true);
    const p = new URLSearchParams(link.split("?")[1]);
    expect(p.get("subject")).toBe("Project enquiry: E-commerce");
    expect(p.get("message")).toContain(shop.title);
  });
});
