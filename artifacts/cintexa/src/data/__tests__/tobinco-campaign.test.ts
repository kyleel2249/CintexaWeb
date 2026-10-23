import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAMPAIGNS, getCampaignBySlug, isCampaignOpen, mailtoUrl, roleMailto, roleSubject } from "../campaigns";
import { campaignSeo } from "../campaigns-seo";
// @ts-expect-error - plain build script (no types); guarded so importing it does not run the build.
import { renderCampaignPage } from "../../../scripts/prerender-careers.mjs";

const SLUG = "tobinco-pharmaceuticals-limited-job-alert-october-2026";
const root = path.resolve(__dirname, "../../..");
const SHELL = `<!doctype html><html><head><title>Home</title><link rel="canonical" href="https://cintexa.com/" /></head><body><div id="root"></div></body></html>`;

describe("Tobinco Pharmaceuticals Limited recruitment campaign", () => {
  const c = getCampaignBySlug(SLUG)!;

  it("exists with the exact employer, deadline, email and five roles", () => {
    expect(CAMPAIGNS).toContain(c);
    expect(c.employerName).toBe("Tobinco Pharmaceuticals Limited");
    expect(c.applyEmail).toBe("careers@tobincopharma.com");
    expect(c.deadline).toBe("2026-10-28");
    expect(c.deadlineLabel).toBe("28 October 2026");
    expect(c.roles.map((r) => r.title)).toEqual([
      "Group Marketing Director",
      "Head of Medical Sales & Field Force",
      "Product Manager",
      "Product Development Manager",
      "Regulatory Affairs Pharmacist",
    ]);
    expect(c.applyInstructions).toBe(
      "Interested and qualified candidates should submit their CVs and cover letter to careers@tobincopharma.com indicating the position you are applying for in the subject line.",
    );
  });

  it("builds correctly encoded position-specific mailto links", () => {
    expect(roleMailto(c, c.roles[0]!)).toBe(
      "mailto:careers@tobincopharma.com?subject=Application%20for%20Group%20Marketing%20Director",
    );
    expect(roleMailto(c, c.roles[1]!)).toBe(
      "mailto:careers@tobincopharma.com?subject=Application%20for%20Head%20of%20Medical%20Sales%20%26%20Field%20Force",
    );
    for (const r of c.roles) {
      expect(roleSubject(r)).toBe(`Application for ${r.title}`);
      const url = roleMailto(c, r);
      expect(url.startsWith("mailto:careers@tobincopharma.com?subject=")).toBe(true);
      expect(decodeURIComponent(url.split("subject=")[1]!)).toBe(`Application for ${r.title}`);
      expect(url.split("?")).toHaveLength(2);
    }
    expect(mailtoUrl("careers@tobincopharma.com")).toBe("mailto:careers@tobincopharma.com");
  });

  it("is open through the deadline day, then shows as closed (but is never removed)", () => {
    expect(isCampaignOpen(c, new Date("2026-10-23T09:00:00Z"))).toBe(true);
    expect(isCampaignOpen(c, new Date("2026-10-28T23:00:00Z"))).toBe(true);
    expect(isCampaignOpen(c, new Date("2026-10-29T00:00:01Z"))).toBe(false);
    expect(isCampaignOpen({ ...c, status: "closed" }, new Date("2026-10-23"))).toBe(false);
    expect(getCampaignBySlug(SLUG)).toBeDefined();
    expect(campaignSeo(c, new Date("2026-11-01")).title.startsWith("Closed:")).toBe(true);
  });

  it("ships the real poster at the declared size", () => {
    const file = path.join(root, "public", c.image);
    expect(path.basename(c.image)).toBe("cintexa-careers-tobinco-pharmaceuticals-job-alert-october-2026.jpg");
    const buf = fs.readFileSync(file);
    expect(buf[0]).toBe(0xff); // JPEG magic
    expect(buf[1]).toBe(0xd8);
    expect(c.imageAlt).toContain("28 October 2026");
  });

  it("has canonical, Open Graph image and no misleading JobPosting data in the prerendered HTML", () => {
    const html = renderCampaignPage(SHELL, c, new Date("2026-10-23"));
    expect(html).toContain(`<link rel="canonical" href="https://cintexa.com/careers/${SLUG}" />`);
    expect(html).toContain(`<meta property="og:image" content="https://cintexa.com${c.image}" />`);
    expect(html).toContain("<title>Tobinco Pharmaceuticals Limited Jobs — October 2026 | Careers</title>");
    expect(html).not.toContain('"JobPosting"');
    expect(html).toContain("BreadcrumbList");
    for (const r of c.roles) expect(html).toContain(r.title.replace(/&/g, "&amp;"));
    expect(html).toContain("careers@tobincopharma.com");
    expect(html).toContain("subject=Application%20for%20Head%20of%20Medical%20Sales%20%26%20Field%20Force");
  });

  it("removes apply links from the prerendered HTML once closed", () => {
    const html = renderCampaignPage(SHELL, c, new Date("2026-11-02"));
    expect(html).not.toContain("subject=Application");
    expect(html).toContain("Applications closed");
  });
});

describe("static /careers HTML (what crawlers and no-JS visitors get)", () => {
  it("links to the campaign page", async () => {
    // @ts-expect-error - plain build script (no types)
    const { renderListPage } = await import("../../../scripts/prerender-careers.mjs");
    const html = renderListPage(SHELL, []);
    expect(html).toContain(`href="/careers/${SLUG}"`);
    expect(html).toContain("Group Marketing Director");
  });
});
