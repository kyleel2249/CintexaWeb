import { describe, expect, it } from "vitest";
import { getOpenJobs } from "../jobs";
// @ts-expect-error - plain build script (no types); guarded so importing it does not run the build.
import { renderJobPage, renderListPage } from "../../../scripts/prerender-careers.mjs";

const SHELL = `<!doctype html><html><head>
<link rel="canonical" href="https://cintexa.com/" />
<meta name="description" content="HOME DESC" />
<meta property="og:title" content="HOME" />
<meta property="og:image" content="https://images.unsplash.com/home.jpg" />
<meta property="og:image:width" content="1200" />
<meta name="twitter:image" content="https://images.unsplash.com/home.jpg" />
<title>Home</title></head><body><div id="root"></div></body></html>`;

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe("prerendered careers HTML (what link-preview bots read)", () => {
  const jobs = getOpenJobs(new Date("2026-10-10"));

  it("each job page carries that job's own preview, with no homepage leftovers", () => {
    for (const job of jobs) {
      const html = renderJobPage(SHELL, job);
      expect(html).not.toContain("unsplash");
      expect(html).not.toContain("HOME");
      expect(count(html, /property="og:image"/g)).toBe(1);
      expect(count(html, /name="twitter:image"/g)).toBe(1);
      expect(html).toContain(`<meta property="og:image" content="https://cintexa.com${job.socialImage}" />`);
      expect(html).toContain(`<meta property="og:image:width" content="${job.socialImageWidth}" />`);
      expect(html).toContain(`<meta property="og:image:height" content="${job.socialImageHeight}" />`);
      expect(html).toContain(`<link rel="canonical" href="https://cintexa.com/careers/${job.slug}" />`);
      expect(count(html, /<link rel="canonical"/g)).toBe(1);
      expect(count(html, /application\/ld\+json/g)).toBe(1);
      expect(html).toContain('data-seo="page"');
      expect(html).toContain(job.summary.slice(0, 30));
    }
  });

  it("the /careers page previews the newest vacancy", () => {
    const html = renderListPage(SHELL, jobs);
    expect(html).toContain(`<meta property="og:image" content="https://cintexa.com${jobs[0]!.socialImage}" />`);
    for (const job of jobs) expect(html).toContain(`/careers/${job.slug}`);
    expect(count(html, /property="og:image"/g)).toBe(1);
  });

  it("changing the job data changes the generated page", () => {
    const job = {
      ...jobs[0]!,
      title: "Totally New Title",
      socialImage: "/careers/new.png",
      socialImageWidth: 1200,
      socialImageHeight: 630,
    };
    const html = renderJobPage(SHELL, job);
    expect(html).toContain('<meta property="og:title" content="Totally New Title" />');
    expect(html).toContain('<meta property="og:image" content="https://cintexa.com/careers/new.png" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });
});
