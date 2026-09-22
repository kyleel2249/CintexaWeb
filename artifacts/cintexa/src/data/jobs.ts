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
  addressCountry: string;
  requirements: string[];
  responsibilities: string[];
  summary: string;
  description: string;
  image: string;
  applyPhone: string;
  applyPhoneDisplay: string;
  applyWhatsApp: string;
  datePosted: string;
  validThrough?: string;
  occupationalCategory?: string;
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
    addressCountry: "GH",
    requirements: ["Available and dedicated", "Punctual", "High cleaning standards"],
    responsibilities: [
      "Daily cleaning of offices, meeting areas, restrooms, and common spaces",
      "Restock cleaning and hygiene supplies",
      "Report maintenance needs promptly",
      "Maintain a safe, welcoming workspace",
    ],
    summary:
      "Cleaner job vacancy in Ghana. Apply now — available and dedicated candidates welcome. Call or WhatsApp +233 59 516 8610.",
    description:
      "Keep workspaces clean, safe, and welcoming. Daily cleaning of offices, meeting areas, restrooms, and common spaces; restocking supplies; and reporting maintenance needs. Ideal for someone who is available and dedicated, punctual, and proud of high standards.",
    image: "/careers/cleaner-job-vacancy.jpeg",
    applyPhone: "+233595168610",
    applyPhoneDisplay: "+233 59 516 8610",
    applyWhatsApp: "233595168610",
    datePosted: "2026-09-21",
    validThrough: "2026-12-31",
    occupationalCategory: "37-2011.00",
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

/** Google JobPosting-compatible JSON-LD (+ optional graph helpers). */
export function jobPostingJsonLd(job: JobPosting, canonicalUrl: string): Record<string, unknown> {
  const absoluteImage = job.image.startsWith("http")
    ? job.image
    : `https://cintexa.com${job.image}`;

  const posting: Record<string, unknown> = {
    "@type": "JobPosting",
    "@id": `${canonicalUrl}#jobposting`,
    title: job.role,
    name: job.title,
    description: [job.summary, job.description, `Requirements: ${job.requirements.join("; ")}`]
      .filter(Boolean)
      .join("\n\n"),
    identifier: {
      "@type": "PropertyValue",
      name: "CINTEXA Careers",
      value: job.id,
    },
    datePosted: job.datePosted,
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: "Hiring partner",
      // Board is published on cintexa.com without naming the employer brand
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: job.addressCountry,
        addressRegion: job.location,
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: job.location,
    },
    jobLocationType: undefined,
    url: canonicalUrl,
    image: [absoluteImage],
    directApply: true,
    responsibilities: job.responsibilities.join(". "),
    qualifications: job.requirements.join(". "),
    occupationalCategory: job.occupationalCategory,
    industry: "Facilities services",
  };

  if (job.validThrough) {
    posting.validThrough = job.validThrough;
  }

  // Remove undefined keys
  Object.keys(posting).forEach((k) => {
    if (posting[k] === undefined) delete posting[k];
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      posting,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://cintexa.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Careers",
            item: "https://cintexa.com/careers",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: job.role,
            item: canonicalUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: job.title,
        description: job.summary,
        isPartOf: { "@id": "https://cintexa.com/#website" },
        about: { "@id": `${canonicalUrl}#jobposting` },
        inLanguage: "en",
      },
    ],
  };
}

export function careersListJsonLd(jobs: JobPosting[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://cintexa.com/careers#webpage",
        url: "https://cintexa.com/careers",
        name: "Careers & Job Vacancies in Ghana | Apply Now",
        description:
          "Browse open job vacancies including Cleaner roles in Ghana. Apply by call or WhatsApp.",
        isPartOf: { "@id": "https://cintexa.com/#website" },
        inLanguage: "en",
      },
      {
        "@type": "ItemList",
        "@id": "https://cintexa.com/careers#joblist",
        name: "Open job vacancies",
        numberOfItems: jobs.length,
        itemListElement: jobs.map((j, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://cintexa.com/careers/${j.slug}`,
          name: j.title,
          item: {
            "@type": "JobPosting",
            title: j.role,
            description: j.summary,
            datePosted: j.datePosted,
            employmentType: j.employmentType,
            url: `https://cintexa.com/careers/${j.slug}`,
            hiringOrganization: {
              "@type": "Organization",
              name: "Hiring partner",
            },
            jobLocation: {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressCountry: j.addressCountry,
                addressRegion: j.location,
              },
            },
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://cintexa.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Careers",
            item: "https://cintexa.com/careers",
          },
        ],
      },
    ],
  };
}
