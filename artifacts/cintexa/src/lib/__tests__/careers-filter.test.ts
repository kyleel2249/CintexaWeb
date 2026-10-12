import { describe, expect, it } from "vitest";
import type { JobPosting } from "@/data/jobs";
import { JOBS } from "@/data/jobs";
import {
  DEFAULT_FILTERS,
  adjacentJobs,
  closesLabel,
  daysUntilClose,
  facets,
  filterJobs,
  hasActiveFilters,
  isClosingSoon,
  isNew,
  parseFilters,
  postedLabel,
  relatedJobs,
  serializeFilters,
} from "../careers-filter";

const NOW = new Date("2026-10-11T12:00:00Z");
const bybeth = JOBS.find((j) => j.slug === "bybeth-boutique-sales-girl")!; // posted 9 Oct, no closing date
const cleaner = JOBS.find((j) => j.slug === "cleaner")!; // posted 21 Sep, closes 31 Dec
const all = [bybeth, cleaner]; // newest first, like the page

describe("URL ↔ filters", () => {
  it("round-trips, and keeps the plain list URL clean", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
    const f = { q: "sales girl", category: "Retail & fashion", type: "Flexible hours", sort: "closing" as const, saved: true };
    const url = serializeFilters(f);
    expect(url).toBe("?q=sales+girl&category=Retail+%26+fashion&type=Flexible+hours&sort=closing&saved=1");
    expect(parseFilters(url)).toEqual(f);
  });
  it("falls back to defaults for junk", () => {
    expect(parseFilters("?sort=hack&saved=yes&q=" + "x".repeat(500))).toMatchObject({ sort: "newest", saved: false });
    expect(parseFilters("?q=" + "x".repeat(500)).q).toHaveLength(100);
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, q: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, saved: true })).toBe(true);
  });
});

describe("filterJobs", () => {
  it("searches every field, requiring every word", () => {
    const find = (q: string) => filterJobs(all, { ...DEFAULT_FILTERS, q }).map((j) => j.slug);
    expect(find("bybeth")).toEqual(["bybeth-boutique-sales-girl"]);
    expect(find("CLEANERS")).toEqual(["cleaner"]);
    expect(find("east legon")).toEqual(["bybeth-boutique-sales-girl"]);
    expect(find("churches")).toEqual(["cleaner"]);
    expect(find("sales cleaners")).toEqual([]);
    expect(find("")).toHaveLength(2);
  });
  it("filters by category, type and saved", () => {
    expect(filterJobs(all, { ...DEFAULT_FILTERS, category: "Facilities & cleaning" })).toEqual([cleaner]);
    expect(filterJobs(all, { ...DEFAULT_FILTERS, type: "Flexible hours" })).toEqual([bybeth]);
    expect(filterJobs(all, { ...DEFAULT_FILTERS, saved: true }, new Set(["cleaner"]))).toEqual([cleaner]);
    expect(filterJobs(all, { ...DEFAULT_FILTERS, saved: true }, new Set())).toEqual([]);
  });
  it("sorts newest, closing soonest (undated last) and by title", () => {
    expect(filterJobs([cleaner, bybeth], DEFAULT_FILTERS)).toEqual([bybeth, cleaner]);
    expect(filterJobs([bybeth, cleaner], { ...DEFAULT_FILTERS, sort: "closing" })).toEqual([cleaner, bybeth]);
    const byTitle = filterJobs(all, { ...DEFAULT_FILTERS, sort: "title" }).map((j) => j.title);
    expect(byTitle).toEqual([...byTitle].sort((a, b) => a.localeCompare(b)));
  });
  it("never mutates its input", () => {
    const input = [cleaner, bybeth];
    filterJobs(input, DEFAULT_FILTERS);
    expect(input).toEqual([cleaner, bybeth]);
  });
});

describe("facets", () => {
  it("counts categories and types", () => {
    const f = facets(all);
    expect(f.categories).toEqual([
      { value: "Facilities & cleaning", count: 1 },
      { value: "Retail & fashion", count: 1 },
    ]);
    expect(f.types.map((t) => t.value).sort()).toEqual(["Flexible hours", "Full Time"]);
  });
});

describe("labels and badges", () => {
  it("describes how long ago a vacancy was posted", () => {
    const at = (iso: string) => new Date(iso);
    expect(postedLabel(bybeth, at("2026-10-09T08:00:00Z"))).toBe("Posted today");
    expect(postedLabel(bybeth, at("2026-10-10T08:00:00Z"))).toBe("Posted yesterday");
    expect(postedLabel(bybeth, NOW)).toBe("Posted 2 days ago");
    expect(postedLabel(cleaner, NOW)).toBe("Posted 2 weeks ago");
    expect(postedLabel(cleaner, at("2027-01-15T00:00:00Z"))).toBe("Posted 3 months ago");
    expect(postedLabel(bybeth, at("2026-01-01T00:00:00Z"))).toBe("Posted today"); // never negative
  });
  it("counts days to the closing date", () => {
    expect(daysUntilClose(cleaner, NOW)).toBe(81);
    expect(closesLabel(cleaner, NOW)).toBe("Closes in 81 days");
    expect(closesLabel(cleaner, new Date("2026-12-30T10:00:00Z"))).toBe("Closes tomorrow");
    expect(closesLabel(cleaner, new Date("2026-12-31T10:00:00Z"))).toBe("Closes today");
    expect(closesLabel(cleaner, new Date("2027-01-02T10:00:00Z"))).toBeNull(); // already closed
    expect(closesLabel(bybeth, NOW)).toBeNull(); // no closing date
    expect(daysUntilClose(bybeth, NOW)).toBeNull();
  });
  it("flags New and Closing soon", () => {
    expect(isNew(bybeth, NOW)).toBe(true);
    expect(isNew(cleaner, NOW)).toBe(false);
    expect(isClosingSoon(cleaner, NOW)).toBe(false);
    expect(isClosingSoon(cleaner, new Date("2026-12-20T10:00:00Z"))).toBe(true);
    expect(isClosingSoon(bybeth, NOW)).toBe(false);
  });
});

describe("related and adjacent", () => {
  const extra: JobPosting = { ...bybeth, id: "x", slug: "x", category: "Facilities & cleaning", datePosted: "2026-08-01" };
  it("prefers the same category, never lists the job itself, and honours the limit", () => {
    expect(relatedJobs(cleaner, [bybeth, cleaner, extra], 3).map((j) => j.slug)).toEqual(["x", "bybeth-boutique-sales-girl"]);
    expect(relatedJobs(cleaner, [bybeth, cleaner, extra], 1).map((j) => j.slug)).toEqual(["x"]);
    expect(relatedJobs(cleaner, [cleaner])).toEqual([]);
  });
  it("finds previous/next neighbours in the page order", () => {
    expect(adjacentJobs(bybeth, all)).toEqual({ prev: null, next: cleaner });
    expect(adjacentJobs(cleaner, all)).toEqual({ prev: bybeth, next: null });
    expect(adjacentJobs(extra, all)).toEqual({ prev: null, next: null });
  });
});
