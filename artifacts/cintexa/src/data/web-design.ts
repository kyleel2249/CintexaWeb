/**
 * Web Design & Development service page — the ONE source of truth is `web-design.json`.
 * The React page, the prerendered HTML (title, description, Open Graph, JSON-LD), the sitemap entry
 * (lastmod) and the tests all derive from it. Plain JSON so the sitemap script can read it with bare `node`.
 * Canonical path stays /solutions/website-development (the existing, already-linked URL);
 * /services/web-design-development 301-redirects to it (see public/_redirects).
 */
import data from "./web-design.json";

export type WebService = {
  id: string;
  title: string;
  problem: string;
  solution: string;
  benefits: string[];
  features: string[];
  cta: { label: string; href: string };
};

export type WebDesignContent = {
  path: string;
  dateUpdated: string;
  eyebrow: string;
  h1: string;
  headline: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  socialTitle: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  services: WebService[];
  process: { step: string; title: string; copy: string }[];
  standards: { title: string; copy: string }[];
  faqs: { q: string; a: string }[];
  related: { label: string; href: string; copy: string }[];
};

export const WEB_DESIGN = data as WebDesignContent;
export const WEB_DESIGN_PATH = WEB_DESIGN.path;
export const WEB_DESIGN_ALIAS = "/services/web-design-development";
export const WEB_DESIGN_LABEL = "Web design & development";
