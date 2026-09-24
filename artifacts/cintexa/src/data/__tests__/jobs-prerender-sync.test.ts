import { describe, expect, it } from "vitest";
import { JOBS as realJobs } from "../jobs";
// @ts-expect-error - scripts/prerender-careers.mjs is a plain build script, not
// part of this package's TS project, but it's valid ESM and fine to import in a
// test (see the import.meta.url guard at the bottom of that file, which keeps
// this from also triggering the script's dist/ file-writing run()).
import { JOBS as prerenderJobs } from "../../../scripts/prerender-careers.mjs";

/**
 * scripts/prerender-careers.mjs keeps its own copy of JOBS (plain build scripts
 * can't straightforwardly import a TS module without adding a TS-execution
 * dependency to the build pipeline), and its own comment says as much: "Mirrors
 * src/data/jobs.ts — keep in sync when adding roles". This test is what actually
 * enforces that instead of just hoping someone remembers - the two currently
 * agree, but the next job added to one and not the other would otherwise ship a
 * silently wrong prerendered SEO page with no build-time signal.
 */
describe("jobs.ts and prerender-careers.mjs stay in sync", () => {
  it("have the same number of jobs", () => {
    expect(prerenderJobs.length).toBe(realJobs.length);
  });

  it("agree on every field the prerender script actually uses, for every job", () => {
    const fieldsUsedByPrerender = [
      "id", "slug", "title", "role", "employmentType", "location", "addressCountry",
      "requirements", "responsibilities", "summary", "description", "image",
      "applyPhone", "applyPhoneDisplay", "applyWhatsApp", "datePosted", "validThrough",
      "occupationalCategory", "status",
    ] as const;

    for (const real of realJobs) {
      const mirrored = prerenderJobs.find((j: { slug: string }) => j.slug === real.slug);
      expect(mirrored, `prerender-careers.mjs is missing job "${real.slug}"`).toBeDefined();
      for (const field of fieldsUsedByPrerender) {
        expect(
          (mirrored as Record<string, unknown>)[field],
          `field "${field}" on job "${real.slug}" has drifted between jobs.ts and prerender-careers.mjs`,
        ).toEqual((real as unknown as Record<string, unknown>)[field]);
      }
    }
  });
});
