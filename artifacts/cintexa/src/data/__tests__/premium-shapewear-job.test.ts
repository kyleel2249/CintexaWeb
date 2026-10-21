import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JOBS, getJobBySlug, getOpenJobs, jobWhatsAppUrl } from "../jobs";
import { jobSeo, jobPostingJsonLd } from "../careers-seo";

const root = path.resolve(__dirname, "../../..");
const SLUG = "premium-shapewear-sales-assistant";

describe("Premium Shapewear — Sales Assistant vacancy", () => {
  const job = JOBS.find((j) => j.slug === SLUG)!;

  it("exists, is open and has its own canonical URL", () => {
    expect(job).toBeDefined();
    expect(getJobBySlug(SLUG)).toBe(job);
    expect(getOpenJobs().map((j) => j.slug)).toContain(SLUG);
    expect(jobSeo(job).canonical).toBe(`https://cintexa.com/careers/${SLUG}`);
    expect(jobSeo(job).title).toBe("Sales Assistant Job at Premium Shapewear | CINTEXA Careers");
  });

  it("keeps the flyer's facts and invents nothing", () => {
    expect(job.employerName).toBe("Premium Shapewear");
    expect(job.reference).toBe("PSW-SA-2026-001");
    expect(job.applyPhone).toBe("+233242402472");
    expect(job.applyPhoneDisplay).toBe("024 240 2472");
    expect(job.responsibilities).toHaveLength(5);
    const text = JSON.stringify(job);
    for (const needle of ["Ashiyie", "Amanfro", "Adenta", "Oyarifa", "Tuesday", "Saturday", "Twi", "commission"]) {
      expect(text, needle).toContain(needle);
    }
    expect(job.validThrough).toBeUndefined(); // the flyer states no deadline
    expect(job.applyWhatsApp).toBeUndefined(); // the flyer says call — no WhatsApp channel is invented
    expect(jobWhatsAppUrl(job)).toBeUndefined();
  });

  it("ships the real flyer at the declared size", () => {
    const file = path.join(root, "public", job.image);
    expect(fs.existsSync(file)).toBe(true);
    const buf = fs.readFileSync(file);
    expect(buf.subarray(0, 2).toString("hex")).toBe("ffd8"); // JPEG
    expect(job.socialImage).toBe(job.image);
    expect([job.socialImageWidth, job.socialImageHeight]).toEqual([720, 1080]);
  });

  it("emits JobPosting data without invented salary, deadline or WhatsApp", () => {
    const graph = (jobPostingJsonLd(job) as { "@graph": Record<string, unknown>[] })["@graph"];
    const posting = graph.find((n) => n["@type"] === "JobPosting")!;
    expect((posting.identifier as { value: string }).value).toBe("PSW-SA-2026-001");
    expect(posting).not.toHaveProperty("baseSalary");
    expect(posting).not.toHaveProperty("validThrough");
    expect((posting.hiringOrganization as { name: string }).name).toBe("Premium Shapewear");
  });
});
