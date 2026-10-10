import { beforeEach, describe, expect, it } from "vitest";
import { applyPageSeo } from "../seo-dom";
import { getOpenJobs } from "@/data/jobs";
import { careersListSeo, jobSeo } from "@/data/careers-seo";

const meta = (attr: string, key: string) =>
  document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") ?? null;

describe("applyPageSeo (client-side navigation)", () => {
  const jobs = getOpenJobs(new Date("2026-10-10"));

  beforeEach(() => {
    document.head.innerHTML = `
      <meta property="og:image" content="https://old.example/home.jpg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <script type="application/ld+json" data-seo="page">{"prerendered":true}</script>`;
  });

  it("applies every tag from the job and replaces (not duplicates) prerendered JSON-LD", () => {
    const job = jobs[0]!;
    applyPageSeo(jobSeo(job));
    expect(document.title).toBe(`${job.title} | CINTEXA Careers`);
    expect(meta("property", "og:image")).toBe(`https://cintexa.com${job.socialImage}`);
    expect(meta("name", "twitter:image")).toBe(`https://cintexa.com${job.socialImage}`);
    expect(meta("property", "og:title")).toBe(job.title);
    expect(meta("name", "twitter:card")).toBe("summary");
    expect(meta("property", "og:image:width")).toBe(String(job.socialImageWidth));
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
    expect(document.head.querySelector('script[type="application/ld+json"]')!.textContent).toContain("JobPosting");
  });

  it("does not leak the previous page's image or data after navigating", () => {
    applyPageSeo(jobSeo(jobs[0]!));
    applyPageSeo(careersListSeo(jobs));
    expect(meta("property", "og:image")).toBe(`https://cintexa.com${jobs[0]!.socialImage}`);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(1);
    expect(document.head.querySelector('script[type="application/ld+json"]')!.textContent).toContain("CollectionPage");
  });

  it("cleanup removes the page JSON-LD when leaving the page", () => {
    const cleanup = applyPageSeo(jobSeo(jobs[0]!));
    cleanup();
    expect(document.head.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });

  it("drops image size/type tags when the new page does not know them", () => {
    applyPageSeo({ ...jobSeo(jobs[0]!), imageWidth: undefined, imageHeight: undefined, imageType: undefined });
    expect(meta("property", "og:image:width")).toBeNull();
    expect(meta("property", "og:image:height")).toBeNull();
  });
});
