/**
 * Public career postings — the ONE source of truth is `jobs.json`.
 *
 * Everything careers-related is derived from it: the /careers list, /careers/:slug pages, the
 * prerendered HTML (title, description, Open Graph, Twitter card, JSON-LD), and sitemap.xml.
 * Add or edit a vacancy in jobs.json and every surface updates on the next build — there is no
 * second copy to keep in sync. Plain JSON keeps it readable by `node` with no install step
 * (the daily sitemap workflow relies on that).
 */
import jobsData from "./jobs.json";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACTOR"
  | "TEMPORARY"
  | "INTERN"
  | "VOLUNTEER"
  | "PER_DIEM"
  | "OTHER";

export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  role: string;
  /** Hiring organisation shown publicly and in JSON-LD. Defaults to "Hiring partner". */
  employerName?: string;
  category?: string;
  industry?: string;
  employmentType: EmploymentType;
  /** Human label overriding the employmentType wording (e.g. "Flexible hours"). */
  employmentLabel?: string;
  location: string;
  addressLocality?: string;
  addressRegion?: string;
  addressCountry: string;
  requirements: string[];
  responsibilities: string[];
  summary: string;
  description: string;
  applyNote?: string;
  whatsAppMessage?: string;
  /** Image shown on the page. */
  image: string;
  imageAlt?: string;
  /** Raster image (JPEG/PNG/WebP) used for og:image / twitter:image / JSON-LD. */
  socialImage: string;
  socialImageWidth: number;
  socialImageHeight: number;
  applyPhone: string;
  applyPhoneDisplay: string;
  applyWhatsApp: string;
  datePosted: string;
  validThrough?: string;
  occupationalCategory?: string;
  status: "open" | "closed";
};

export const JOBS: JobPosting[] = jobsData as JobPosting[];

/** Open and not past its validThrough date (a lapsed posting must not stay listed as open). */
export function isJobCurrent(job: JobPosting, now: Date = new Date()): boolean {
  if (job.status !== "open") return false;
  if (!job.validThrough) return true;
  const end = new Date(`${job.validThrough}T23:59:59Z`);
  return Number.isNaN(end.getTime()) || end.getTime() >= now.getTime();
}

/** Current vacancies, newest first (stable for equal dates). */
export function getOpenJobs(now: Date = new Date()): JobPosting[] {
  return JOBS.map((job, index) => ({ job, index }))
    .filter(({ job }) => isJobCurrent(job, now))
    .sort((a, b) => b.job.datePosted.localeCompare(a.job.datePosted) || a.index - b.index)
    .map(({ job }) => job);
}

export function getJobBySlug(slug: string, now: Date = new Date()): JobPosting | undefined {
  return JOBS.find((j) => j.slug === slug && isJobCurrent(j, now));
}

export function employmentLabel(job: JobPosting): string {
  if (job.employmentLabel) return job.employmentLabel;
  return job.employmentType
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function jobWhatsAppUrl(job: JobPosting): string {
  const text = encodeURIComponent(
    job.whatsAppMessage ??
      `Hello, I am interested in the ${job.role} job vacancy. Please share application details.`,
  );
  return `https://wa.me/${job.applyWhatsApp}?text=${text}`;
}

// Structured-data builders live in careers-seo.ts; re-exported so existing imports keep working.
export { jobPostingJsonLd, careersListJsonLd } from "./careers-seo";
