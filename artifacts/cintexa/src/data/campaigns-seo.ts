/**
 * Pure SEO builders for multi-vacancy campaigns — shared by the React page and the build-time
 * prerender, like careers-seo.ts. JobPosting JSON-LD is deliberately NOT emitted: the poster does not
 * state each role's location, employment type or description, and Google's JobPosting needs them.
 * Inventing them (or merging five jobs into one posting) would be misleading structured data.
 */
import { campaignCanonical, isCampaignOpen, type Campaign } from "./campaigns";
import { absoluteUrl, imageMimeType, twitterCardFor, SITE_NAME, SITE_URL, type PageSeoData } from "./careers-seo";

export function campaignSeo(campaign: Campaign, now: Date = new Date()): PageSeoData {
  const canonical = campaignCanonical(campaign);
  const open = isCampaignOpen(campaign, now);
  const image = absoluteUrl(campaign.image);
  const title = open ? campaign.pageTitle : `Closed: ${campaign.pageTitle}`;
  const description = open
    ? campaign.description
    : `Applications for these ${campaign.roles.length} Tobinco Pharmaceuticals Limited vacancies closed on ${campaign.deadlineLabel}. Record kept for reference.`;
  return {
    title,
    socialTitle: campaign.socialTitle,
    description,
    canonical,
    image,
    imageAlt: campaign.imageAlt,
    imageWidth: campaign.imageWidth,
    imageHeight: campaign.imageHeight,
    imageType: imageMimeType(campaign.image),
    ogType: "website",
    twitterCard: twitterCardFor(campaign.imageWidth, campaign.imageHeight),
    robots: "index, follow, max-image-preview:large",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": canonical,
          url: canonical,
          name: campaign.pageTitle,
          description: campaign.description,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          primaryImageOfPage: { "@type": "ImageObject", url: image },
          datePublished: campaign.datePosted,
          inLanguage: "en",
          about: { "@type": "Organization", name: campaign.employerName, url: campaign.employerUrl },
        },
        {
          "@type": "ItemList",
          "@id": `${canonical}#roles`,
          name: `${campaign.employerName} vacancies`,
          numberOfItems: campaign.roles.length,
          itemListElement: campaign.roles.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.title })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Careers", item: `${SITE_URL}/careers` },
            { "@type": "ListItem", position: 3, name: `${campaign.employerName} Job Alert`, item: canonical },
          ],
        },
        { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME },
      ],
    },
  };
}
