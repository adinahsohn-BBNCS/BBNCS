import type { FaqItem } from "../data/faqs";
import { business } from "../data/site";

export const siteUrl = "https://bbncs.com";

export function getCanonicalUrl(pathname: string): string {
  const url = new URL(pathname, siteUrl);
  if (url.pathname !== "/" && !url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  return url.href;
}

export function buildLocalBusinessSchema() {
  const sameAs = [
    business.social.facebook,
    business.social.linkedin,
    business.social.instagram,
    business.social.youtube,
    business.googleReviewsUrl,
  ].filter((url) => url && url !== "#");

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${siteUrl}/#organization`,
    name: business.name,
    alternateName: business.shortName,
    url: siteUrl,
    telephone: business.phoneTel,
    email: business.email,
    image: `${siteUrl}/images/logo.png`,
    description: `${business.name} — managed IT, backup, and IT support for Temecula-area businesses since ${business.temeculaSince}.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line1,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.511062,
      longitude: -117.156951,
    },
    areaServed: [
      { "@type": "City", name: "Temecula" },
      { "@type": "City", name: "Murrieta" },
      { "@type": "City", name: "Menifee" },
      { "@type": "AdministrativeArea", name: "Riverside County, CA" },
    ],
    foundingDate: String(business.inBusinessSince),
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    sameAs,
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: business.name,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildServiceSchema(page: {
  title: string;
  metaDescription: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.title,
    description: page.metaDescription,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: {
      "@type": "City",
      name: "Temecula",
    },
    url: `${siteUrl}/${page.slug}/`,
  };
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}
