/** Pure SEO builder for the Web Design & Development page — shared by the React page and the build-time prerender. */
import { WEB_DESIGN } from "./web-design";
import { SITE_NAME, SITE_URL, absoluteUrl, imageMimeType, twitterCardFor, type PageSeoData } from "./careers-seo";

export const WEB_DESIGN_URL = `${SITE_URL}${WEB_DESIGN.path}`;

export function webDesignSeo(): PageSeoData {
  const c = WEB_DESIGN;
  const image = absoluteUrl(c.image);
  return {
    title: c.metaTitle,
    socialTitle: c.socialTitle,
    description: c.metaDescription,
    canonical: WEB_DESIGN_URL,
    image,
    imageAlt: c.imageAlt,
    imageWidth: c.imageWidth,
    imageHeight: c.imageHeight,
    imageType: imageMimeType(c.image),
    ogType: "website",
    twitterCard: twitterCardFor(c.imageWidth, c.imageHeight),
    robots: "index, follow, max-image-preview:large",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "CINTEXA Technologies", alternateName: SITE_NAME, url: `${SITE_URL}/` },
        { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, publisher: { "@id": `${SITE_URL}/#organization` } },
        {
          "@type": "WebPage",
          "@id": WEB_DESIGN_URL,
          url: WEB_DESIGN_URL,
          name: c.metaTitle,
          description: c.metaDescription,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          primaryImageOfPage: { "@type": "ImageObject", url: image },
          dateModified: c.dateUpdated,
          inLanguage: "en",
          breadcrumb: { "@id": `${WEB_DESIGN_URL}#breadcrumb` },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${WEB_DESIGN_URL}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Web design & development", item: WEB_DESIGN_URL },
          ],
        },
        {
          "@type": "Service",
          "@id": `${WEB_DESIGN_URL}#service`,
          name: "Web design & development",
          serviceType: "Web design and web development",
          description: c.intro,
          provider: { "@id": `${SITE_URL}/#organization` },
          areaServed: { "@type": "Country", name: "Ghana" },
          url: WEB_DESIGN_URL,
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Web design & development services",
            itemListElement: c.services.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, description: s.solution } })),
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: c.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
      ],
    },
  };
}
