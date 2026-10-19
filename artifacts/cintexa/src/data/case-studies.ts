/**
 * Case studies — the ONE source of truth is `case-studies.json`.
 *
 * The list page, every /case-studies/<slug> page, the prerendered HTML (title, description, preview image,
 * Open Graph / Twitter, JSON-LD) and the sitemap are all derived from it.
 *
 * Honesty rules (enforced by tests):
 *  - "illustrative" cases describe a typical engagement and must NOT contain invented figures.
 *  - "verified" cases are only allowed with a named client, recorded permission and dated evidence.
 */
import data from "./case-studies.json";

export type CaseStatus = "illustrative" | "verified";

export type CaseMetric = { name: string; why: string; how: string };

/** Measured outcome — only valid on a verified case. */
export type CaseEvidence = { metric: string; before: string; after: string; period: string; source: string };

export type CaseStudy = {
  slug: string;
  title: string;
  status: CaseStatus;
  service: string;
  /** The service page this case relates to. */
  serviceHref: string;
  industry: string;
  summary: string;
  problem: string;
  assessment: string;
  solution: string;
  implementation: string;
  results: string;
  technology: string;
  technologyTags: string[];
  /** What would be measured, and how — no numbers. */
  metrics: CaseMetric[];
  datePublished: string;
  dateUpdated: string;
  /** Verified cases only. */
  client?: string;
  permission?: boolean;
  evidence?: CaseEvidence[];
};

export const CASE_STUDIES: CaseStudy[] = data as CaseStudy[];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  illustrative: "Illustrative scenario",
  verified: "Verified results",
};

/** Newest first (stable for equal dates). */
export function getCaseStudies(): CaseStudy[] {
  return CASE_STUDIES.map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.dateUpdated.localeCompare(a.c.dateUpdated) || a.i - b.i)
    .map(({ c }) => c);
}

export const getCaseStudy = (slug: string): CaseStudy | undefined => CASE_STUDIES.find((c) => c.slug === slug);

export const caseUrlPath = (c: Pick<CaseStudy, "slug">) => `/case-studies/${c.slug}`;

/** The case's sections in reading order, used for the page, the contents list and the static HTML. */
export const CASE_SECTIONS = [
  { id: "problem", label: "The problem", field: "problem" },
  { id: "assessment", label: "Assessment", field: "assessment" },
  { id: "solution", label: "Solution", field: "solution" },
  { id: "implementation", label: "Implementation", field: "implementation" },
  { id: "results", label: "Results", field: "results" },
  { id: "technology", label: "Technology", field: "technology" },
] as const satisfies readonly { id: string; label: string; field: keyof CaseStudy }[];

/** Entries of the "On this page" list, in reading order. */
export function caseToc(c: CaseStudy): { id: string; label: string }[] {
  const [problem, assessment, solution, implementation, results, technology] = CASE_SECTIONS;
  return [
    problem,
    assessment,
    solution,
    implementation,
    results,
    ...(c.status === "verified" && c.evidence?.length ? [{ id: "evidence", label: "Measured results" }] : []),
    { id: "measurement", label: "How it would be measured" },
    technology,
  ];
}

/** Whole minutes to read, at ~200 words a minute (never less than 1). */
export function readingMinutes(c: CaseStudy): number {
  const words = [c.summary, c.problem, c.assessment, c.solution, c.implementation, c.results, c.technology, ...c.metrics.flatMap((m) => [m.name, m.why, m.how])]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ---------- preview image (generated card, named after its content) ----------

/** Tiny stable hash (FNV-1a, hex) — same in the browser, Node and the image script. */
export function contentHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Preview image path. The file name carries a hash of what the image shows (title, service, status), so
 * editing a case changes the expected file name: a stale image fails the build/tests instead of shipping,
 * and social networks fetch the new picture instead of a cached old one.
 */
export function caseImagePath(c: Pick<CaseStudy, "slug" | "title" | "service" | "status">): string {
  return `/case-studies/${c.slug}-${contentHash(`${c.title}|${c.service}|${c.status}`)}.png`;
}

export const CASE_IMAGE_SIZE = { width: 1200, height: 630 } as const;
