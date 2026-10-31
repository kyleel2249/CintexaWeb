/**
 * CINTEXA as a single, consistent digital entity.
 *
 * EVERYTHING that describes the organisation to a machine (JSON-LD, llms.txt, prerendered HTML) or
 * to a visitor (the "At a glance" block on /about) is read from here, so the brand name, contact
 * details, service list and social profiles can never drift apart between pages.
 *
 * Rules for editing this file:
 *  - Only add facts the business has actually published. No invented address, founding date,
 *    registration number, awards, ratings or partners.
 *  - `address` is intentionally absent: CINTEXA says it "operates digitally" (see /about). Add a
 *    verified postal address here ONLY when the owner confirms one; schema, llms.txt and the About
 *    page pick it up automatically (see docs/SEO_AEO_GEO.md).
 *  - Plain TypeScript with no React/DOM imports, so build scripts (tsx) and tests can import it.
 */

export const SITE_URL = "https://cintexa.com";
export const SITE_NAME = "CINTEXA";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const ENTITY = {
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  /** One-sentence definition: the same wording is used by schema, llms.txt, the home FAQ and /about. */
  definition:
    "CINTEXA is a technology and digital business solutions company that builds custom software, websites, e-commerce experiences and business automation systems for growing organisations in Ghana and beyond.",
  /** Slightly longer description for Organization.description and llms.txt. */
  description:
    "CINTEXA helps businesses assess where they are, use information technology to solve practical problems, improve operations, reach customers and measure growth. Services include custom software development, web design and development, e-commerce, business automation, marketing and sales technology.",
  email: "info@cintexa.com",
  phone: "+233242483082",
  phoneDisplay: "+233 24 248 3082",
  whatsapp: "https://wa.me/233242483082",
  /** Official profiles. Add LinkedIn / X / YouTube here once they exist — they flow into `sameAs` automatically. */
  sameAs: [
    "https://web.facebook.com/profile.php?id=61591131675150",
    "https://www.tiktok.com/@cintexadotcom",
  ],
  areaServed: "Ghana",
  /** Languages the team works in with customers. */
  language: "en",
  logo: `${SITE_URL}/images/cintexa-logo-512.png`,
  logoWidth: 512,
  logoHeight: 512,
  defaultImage: `${SITE_URL}/images/og-cintexa.png`,
  defaultImageWidth: 1200,
  defaultImageHeight: 630,
  defaultImageAlt: "CINTEXA — technology and digital business solutions",
  /** Topics the organisation genuinely works on (schema `knowsAbout`). */
  knowsAbout: [
    "Custom software development",
    "Web design and development",
    "E-commerce",
    "Business process automation",
    "Digital marketing",
    "Search engine optimisation",
    "Customer relationship management",
    "Business analytics",
  ],
} as const;

export type ServiceId =
  | "website-development"
  | "software-development"
  | "ecommerce"
  | "marketing"
  | "sales"
  | "ads-boost";

export type ServiceEntry = {
  id: ServiceId;
  /** Human name used in navigation, schema `name` and anchor text. */
  name: string;
  path: string;
  /** schema.org Service.serviceType */
  serviceType: string;
  /** One factual sentence; reused in cards, schema, prerender and llms.txt. */
  summary: string;
  /** Entity chain shown in docs and used for "about" links in schema. */
  topics: string[];
};

export const SERVICES: ServiceEntry[] = [
  {
    id: "software-development",
    name: "Custom software development",
    path: "/solutions/software-development",
    serviceType: "Custom software development",
    summary:
      "Custom business applications, internal tools, APIs and integrations designed around how your team works.",
    topics: ["Business software", "Operational efficiency", "System integration"],
  },
  {
    id: "website-development",
    name: "Web design & development",
    path: "/solutions/website-development",
    serviceType: "Web design and web development",
    summary:
      "Responsive, accessible business websites, online stores and web applications that explain what you offer and help visitors take action.",
    topics: ["Business websites", "Digital presence", "Web applications"],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    path: "/solutions/ecommerce",
    serviceType: "E-commerce development",
    summary:
      "Online stores with product catalogues, checkout, order tracking and reporting, so a business can sell online with clear workflows.",
    topics: ["Online selling", "Product catalogue", "Order management"],
  },
  {
    id: "marketing",
    name: "Marketing technology",
    path: "/solutions/marketing",
    serviceType: "Digital marketing technology",
    summary:
      "Campaign planning, content, email and search tooling with measurement, so marketing channels work from one plan.",
    topics: ["Digital marketing", "Customer acquisition", "Search visibility"],
  },
  {
    id: "sales",
    name: "Sales technology",
    path: "/solutions/sales",
    serviceType: "Sales and CRM technology",
    summary:
      "Lead capture, pipeline tracking and customer follow-up so every enquiry has an owner and a next step.",
    topics: ["Lead generation", "CRM", "Customer follow-up"],
  },
  {
    id: "ads-boost",
    name: "Ads Boost",
    path: "/solutions/ads-boost",
    serviceType: "Digital advertising campaign management",
    summary:
      "Planning and reporting for paid advertising campaigns, connecting ad activity to enquiries and revenue.",
    topics: ["Paid advertising", "Campaign reporting", "Return on ad spend"],
  },
];

export const servicePath = (id: ServiceId): string => SERVICES.find((s) => s.id === id)!.path;

/** Absolute URL for a site path ("/about" -> https://cintexa.com/about; "/" -> https://cintexa.com/). */
export function abs(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${p}`;
}
