import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JOBS, getJobBySlug, getOpenJobs, isJobCurrent, type JobPosting } from "../jobs";
import { careersListSeo, jobNotFoundSeo, jobPostingJsonLd, jobSeo } from "../careers-seo";
// @ts-expect-error - plain build-script helper (no types), safe to import in tests.
import { readImageSize } from "../../../scripts/image-info.mjs";

const publicDir = path.resolve(__dirname, "../../../public");

describe("jobs.json is the single source of truth", () => {
  it("has unique slugs and ids", () => {
    expect(new Set(JOBS.map((j) => j.slug)).size).toBe(JOBS.length);
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(JOBS.length);
  });

  it("every job has a real raster preview image whose declared size matches the file", () => {
    for (const job of JOBS) {
      expect(job.socialImage, job.slug).toMatch(/\.(jpe?g|png|webp|gif)$/i);
      const file = path.join(publicDir, job.socialImage);
      expect(fs.existsSync(file), `${job.slug}: ${job.socialImage} exists`).toBe(true);
      const info = readImageSize(fs.readFileSync(file));
      expect(info, `${job.slug}: readable image`).not.toBeNull();
      expect({ w: info.width, h: info.height }, job.slug).toEqual({
        w: job.socialImageWidth,
        h: job.socialImageHeight,
      });
      expect(fs.existsSync(path.join(publicDir, job.image)), `${job.slug}: display image exists`).toBe(true);
    }
  });

  it("lists open vacancies newest first", () => {
    const dates = getOpenJobs(new Date("2026-10-10")).map((j) => j.datePosted);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("treats a posting past validThrough as closed", () => {
    const cleaner = JOBS.find((j) => j.slug === "cleaner")!;
    expect(isJobCurrent(cleaner, new Date("2026-10-10"))).toBe(true);
    expect(isJobCurrent(cleaner, new Date("2027-01-02"))).toBe(false);
    expect(getJobBySlug("cleaner", new Date("2027-01-02"))).toBeUndefined();
  });
});

describe("job SEO is derived from the job record", () => {
  it("builds page metadata and the preview image from each job", () => {
    for (const job of JOBS) {
      const seo = jobSeo(job);
      expect(seo.canonical).toBe(`https://cintexa.com/careers/${job.slug}`);
      expect(seo.image).toBe(`https://cintexa.com${job.socialImage}`);
      expect(seo.imageWidth).toBe(job.socialImageWidth);
      expect(seo.imageHeight).toBe(job.socialImageHeight);
      expect(seo.socialTitle).toBe(job.title);
      expect(seo.description).toContain(job.summary.slice(0, 40));
      expect(seo.robots).toContain("index");
    }
  });

  it("changes when the job changes (nothing is static)", () => {
    const base = JOBS[0]!;
    const edited: JobPosting = {
      ...base,
      title: "Brand New Title",
      summary: "A different summary.",
      socialImage: "/careers/other.png",
      socialImageWidth: 1200,
      socialImageHeight: 630,
    };
    const seo = jobSeo(edited);
    expect(seo.socialTitle).toBe("Brand New Title");
    expect(seo.description).toBe("A different summary.");
    expect(seo.image).toBe("https://cintexa.com/careers/other.png");
    expect(seo.twitterCard).toBe("summary_large_image");
  });

  it("uses the small Twitter card for square or portrait images", () => {
    for (const job of JOBS) expect(jobSeo(job).twitterCard).toBe("summary");
  });

  it("/careers preview follows the newest vacancy and lists every role", () => {
    const jobs = getOpenJobs(new Date("2026-10-10"));
    const seo = careersListSeo(jobs);
    expect(seo.image).toBe(`https://cintexa.com${jobs[0]!.socialImage}`);
    for (const j of jobs) expect(seo.description).toContain(j.role);

    const newer: JobPosting = {
      ...jobs[0]!,
      id: "x",
      slug: "x",
      role: "Driver",
      socialImage: "/careers/x.png",
      datePosted: "2026-11-01",
    };
    const next = careersListSeo([newer, ...jobs]);
    expect(next.image).toBe("https://cintexa.com/careers/x.png");
    expect(next.description).toContain("Driver");
  });

  it("emits valid JobPosting JSON-LD with the real employer and no undefined fields", () => {
    const bybeth = JOBS.find((j) => j.slug === "bybeth-boutique-sales-girl")!;
    const ld = jobPostingJsonLd(bybeth) as { "@graph": Record<string, unknown>[] };
    const posting = ld["@graph"].find((n) => n["@type"] === "JobPosting")!;
    expect(posting.hiringOrganization).toEqual({ "@type": "Organization", name: "ByBeth Boutique" });
    expect(posting.image).toEqual(["https://cintexa.com/careers/bybeth-boutique-sales-girl.png"]);
    expect(JSON.stringify(ld)).not.toContain("undefined");
    const cleaner = JOBS.find((j) => j.slug === "cleaner")!;
    const cleanerPosting = (jobPostingJsonLd(cleaner) as { "@graph": Record<string, unknown>[] })["@graph"].find(
      (n) => n["@type"] === "JobPosting",
    )!;
    expect(cleanerPosting.hiringOrganization).toEqual({ "@type": "Organization", name: "Hiring partner" });
  });

  it("keeps closed or unknown vacancies out of the index", () => {
    expect(jobNotFoundSeo().robots).toContain("noindex");
  });
});
