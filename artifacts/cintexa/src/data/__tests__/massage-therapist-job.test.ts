import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JOBS, getJobBySlug, getOpenJobs, jobWhatsAppUrl } from "../jobs";
import { jobPostingJsonLd, jobSeo } from "../careers-seo";
// @ts-expect-error - plain build script (no types); guarded so importing it does not run the build.
import { renderJobPage } from "../../../scripts/prerender-careers.mjs";

const root = path.resolve(__dirname, "../../..");
const SLUG = "massage-therapist-kwabenya-accra";
const SHELL = `<!doctype html><html><head><title>Home</title></head><body><div id="root"></div></body></html>`;

describe("Massage Therapist — Kwabenya, Accra vacancy", () => {
  const job = JOBS.find((j) => j.slug === SLUG)!;

  it("is open, listed and has its own canonical URL", () => {
    expect(job).toBeDefined();
    expect(getJobBySlug(SLUG)).toBe(job);
    expect(getOpenJobs().map((j) => j.slug)).toContain(SLUG);
    expect(jobSeo(job).canonical).toBe(`https://cintexa.com/careers/${SLUG}`);
  });

  it("keeps the poster's facts and invents nothing", () => {
    expect(job.role).toBe("Massage Therapist");
    expect(job.location).toBe("Kwabenya, Accra, Ghana");
    expect(job.facts?.find((f) => f.label === "Salary range")?.value).toBe("GH₵ 4,000–5,000 per month");
    expect(job.requirements).toEqual([
      "Relevant certification in massage therapy.",
      "Practical experience in massage treatments.",
      "Strong client care and communication skills.",
    ]);
    expect(job.employerName).toBeUndefined(); // the poster names no employer
    expect(job.responsibilities).toEqual([]);
    expect(job.validThrough).toBeUndefined(); // no deadline stated
    expect(job.benefits).toBeUndefined();
    expect(job.phoneOnly).toBe(true); // no online form is invented
  });

  it("has working phone and WhatsApp actions on the exact number", () => {
    expect(job.applyPhone).toBe("+233248368941");
    expect(job.applyPhoneDisplay).toBe("+233 24 836 8941");
    expect(job.applyWhatsApp).toBe("233248368941");
    const url = jobWhatsAppUrl(job)!;
    expect(url.startsWith("https://wa.me/233248368941?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1]!)).toBe(
      "Hello, I am interested in the Massage Therapist vacancy in Kwabenya, Accra. Please provide information about the application process and the next steps. Thank you.",
    );
  });

  it("ships the real poster at the declared size", () => {
    const buf = fs.readFileSync(path.join(root, "public", job.image));
    expect(buf.subarray(0, 2).toString("hex")).toBe("ffd8");
    expect(job.image).toBe("/careers/massage-therapist-job-kwabenya-accra.jpg");
    expect(job.socialImage).toBe(job.image);
    expect([job.socialImageWidth, job.socialImageHeight]).toEqual([853, 1280]);
  });

  it("emits JobPosting data with the advertised salary and no invented deadline or employer", () => {
    const graph = (jobPostingJsonLd(job) as { "@graph": Record<string, unknown>[] })["@graph"];
    const posting = graph.find((n) => n["@type"] === "JobPosting")!;
    expect(posting.baseSalary).toEqual({
      "@type": "MonetaryAmount",
      currency: "GHS",
      value: { "@type": "QuantitativeValue", minValue: 4000, maxValue: 5000, unitText: "MONTH" },
    });
    expect(posting).not.toHaveProperty("validThrough");
    expect(posting).not.toHaveProperty("responsibilities");
  });

  it("prerenders a crawler-readable page without an empty duties section", () => {
    const html = renderJobPage(SHELL, job);
    expect(html).toContain(`<link rel="canonical" href="https://cintexa.com/careers/${SLUG}" />`);
    expect(html).toContain("GH₵ 4,000–5,000 per month");
    expect(html).toContain("tel:+233248368941");
    expect(html).not.toContain("What you’ll do");
  });
});
