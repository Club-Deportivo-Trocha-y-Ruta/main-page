import { SITE, CONTACT, SOCIAL } from './constants';

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    description: SITE.description,
    foundingDate: `${SITE.founded}-05-01`,
    slogan: SITE.tagline,
    email: CONTACT.email,
    telephone: CONTACT.phoneLink,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'CL 8 Norte 2 N° 55',
      addressLocality: 'Yumbo',
      addressRegion: 'Valle del Cauca',
      addressCountry: 'CO',
    },
    sameAs: [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube],
    sport: 'Mountain Biking',
  };
}

export function generateEventJsonLd(event: {
  title: string;
  date: Date;
  location: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.title,
    startDate: event.date.toISOString(),
    location: {
      '@type': 'Place',
      name: event.location,
    },
    description: event.description,
    image: event.image,
    url: event.url,
    organizer: {
      '@type': 'SportsOrganization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export function generateArticleJsonLd(article: {
  title: string;
  date: Date;
  author: string;
  excerpt: string;
  url: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    datePublished: article.date.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.author,
      url: SITE.url,
    },
    description: article.excerpt,
    url: article.url,
    image: article.image,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
