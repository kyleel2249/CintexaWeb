/**
 * Public career postings — used by React routes and the prerender script.
 * Keep descriptions complete so crawlers and AI indexers receive full text.
 */

export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  role: string;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  location: string;
  requirements: string[];
  summary: string;
  description: string;
  image: string;
  applyPhone: string;
  applyPhoneDisplay: string;
  applyWhatsApp: string;
  datePosted: string;
  validThrough?: string;
  status: "open" | "closed";
};

export const JOBS: JobPosting[] = [
  {
    id: "cleaner-ghana",
    slug: "cleaner",
    title: "Cleaner Job Vacancy in Ghana — Apply Now",
    role: "Cleaner",
    employmentType: "FULL_TIME",
    location: "Ghana",
    requirements: ["Available and dedicated", "Punctual", "High cleaning standards"],
    summary:
      "Cleaner job vacancy in Ghana. Apply now — available and dedicated candidates welcome. Call or WhatsApp +233 59 516 8610.",
    description:
      "Keep workspaces clean, safe, and welcoming. Daily cleaning of offices, meeting areas, restrooms, and common spaces; restocking supplies; and reporting maintenance needs. Ideal for someone who is available and dedicated, punctual, and proud of high standards.",
    image: "/careers/cleaner-job-vacancy.jpeg",
    applyPhone: "+233595168610",
    applyPhoneDisplay: "+233 59 516 8610",
    applyWhatsApp: "233595168610",
    datePosted: "2026-09-21",
    status: "open",
  },
];

export function getJobBySlug(slug: string): JobPosting | undefined {
  return JOBS.find((j) => j.slug === slug && j.status === "open");
}

export function getOpenJobs(): JobPosting[] {
  return JOBS.filter((j) => j.status === "open");
}

export function jobWhatsAppUrl(job: JobPosting): string {
  const text = encodeURIComponent(
    `Hello, I am interested in the ${job.role} job vacancy. Please share application details.`,
  );
  return `https://wa.me/${job.applyWhatsApp}?text=${text}`;
}

export function jobPostingJsonLd(job: JobPosting, canonicalUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.role,
    description: `${job.summary} ${job.description}`,
    datePosted: job.datePosted,
    validThrough: job.validThrough,
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: "Hiring partner",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "GH",
        addressRegion: job.location,
      },
    },
    url: canonicalUrl,
    image: `https://cintexa.com${job.image}`,
    directApply: true,
  };
}
