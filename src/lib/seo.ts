import { SITE, CONTACT, SOCIAL } from './constants';

// ============================================================
// TIPOS
// ============================================================

type JsonLd = Record<string, unknown>;

interface EventInput {
  title: string;
  date: Date;
  endDate?: Date;
  location: string;
  city?: string;
  department?: string;
  description?: string;
  image?: string;
  url?: string;
  category?: string;
  level?: string;
  status?: string;
  registrationUrl?: string;
  organizer?: string;
}

interface ArticleInput {
  title: string;
  date: Date;
  updatedDate?: Date;
  author: string;
  excerpt: string;
  url: string;
  image?: string;
  category?: string;
  tags?: string[];
}

interface PersonInput {
  name: string;
  url: string;
  photo?: string;
  birthDate?: Date;
  category?: string;
  specialty?: string;
  achievements?: Array<{
    year: number;
    event: string;
    position?: number;
    description: string;
  }>;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    strava?: string;
    youtube?: string;
    tiktok?: string;
  };
}

interface CourseInput {
  title: string;
  url: string;
  description?: string;
  image?: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  targetLevel: string;
  schedule: string;
  monthlyFee?: string;
  enrollmentOpen: boolean;
}

interface GalleryInput {
  title: string;
  url: string;
  date: Date;
  description?: string;
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
}

// ============================================================
// HELPERS
// ============================================================

function organizationRef(): JsonLd {
  return {
    '@type': 'SportsOrganization',
    name: SITE.name,
    url: SITE.url,
  };
}

function fullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

// ============================================================
// GENERADORES JSON-LD
// ============================================================

/**
 * SportsOrganization — Homepage global
 * https://schema.org/SportsOrganization
 */
export function generateOrganizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: `${SITE.url}/images/logo.png`,
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
      postalCode: '760042',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 3.5965919,
      longitude: -76.4855763,
    },
    sport: 'Mountain Biking',
    sameAs: [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube],
    memberOf: {
      '@type': 'SportsOrganization',
      name: 'Federación Colombiana de Ciclismo',
    },
  };
}

/**
 * WebSite — SearchAction para sitelinks search box en Google
 * https://schema.org/WebSite
 */
export function generateWebSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    inLanguage: 'es-CO',
    publisher: {
      '@id': `${SITE.url}/#organization`,
    },
  };
}

/**
 * SportsTeam — Página /equipo
 * https://schema.org/SportsTeam
 */
export function generateSportsTeamJsonLd(
  members: Array<{ name: string; url: string; photo?: string; category?: string }>
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    '@id': `${SITE.url}/equipo/#team`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: `${SITE.url}/equipo`,
    sport: 'Mountain Biking',
    parentOrganization: {
      '@id': `${SITE.url}/#organization`,
    },
    athlete: members.map((m) => ({
      '@type': 'Person',
      name: m.name,
      url: fullUrl(m.url),
      ...(m.photo ? { image: fullUrl(m.photo) } : {}),
    })),
    location: {
      '@type': 'Place',
      name: 'Pista de Ciclomontañismo "Carlos Castro"',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Yumbo',
        addressRegion: 'Valle del Cauca',
        addressCountry: 'CO',
      },
    },
  };
}

/**
 * SportsEvent — Eventos individuales y lista de calendario
 * https://schema.org/SportsEvent
 */
export function generateEventJsonLd(event: EventInput): JsonLd {
  const eventStatus =
    event.status === 'cancelled'
      ? 'https://schema.org/EventCancelled'
      : event.status === 'past'
        ? 'https://schema.org/EventCompleted'
        : 'https://schema.org/EventScheduled';

  const result: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: event.title,
    startDate: event.date.toISOString(),
    ...(event.endDate ? { endDate: event.endDate.toISOString() } : {}),
    eventStatus,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city || 'Yumbo',
        addressRegion: event.department || 'Valle del Cauca',
        addressCountry: 'CO',
      },
    },
    ...(event.description ? { description: event.description } : {}),
    ...(event.image ? { image: fullUrl(event.image) } : {}),
    ...(event.url ? { url: fullUrl(event.url) } : {}),
    organizer: event.organizer
      ? { '@type': 'Organization', name: event.organizer }
      : organizationRef(),
    sport: 'Mountain Biking',
  };

  if (event.registrationUrl) {
    result.offers = {
      '@type': 'Offer',
      url: event.registrationUrl,
      availability: 'https://schema.org/InStock',
    };
  }

  return result;
}

/**
 * ItemList de eventos — Página /calendario
 * https://schema.org/ItemList
 */
export function generateEventsListJsonLd(
  events: Array<{ title: string; date: Date; url: string }>
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Calendario de Eventos',
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.title,
      url: fullUrl(e.url),
    })),
  };
}

/**
 * Person / Athlete — Páginas /equipo/[slug]
 * https://schema.org/Person
 */
export function generatePersonJsonLd(person: PersonInput): JsonLd {
  const sameAs: string[] = [];
  if (person.socialMedia) {
    for (const url of Object.values(person.socialMedia)) {
      if (url) sameAs.push(url);
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    url: fullUrl(person.url),
    ...(person.photo ? { image: fullUrl(person.photo) } : {}),
    ...(person.birthDate ? { birthDate: person.birthDate.toISOString().split('T')[0] } : {}),
    memberOf: {
      '@type': 'SportsTeam',
      name: SITE.name,
      url: SITE.url,
      sport: 'Mountain Biking',
    },
    ...(person.specialty ? { knowsAbout: person.specialty.toUpperCase() } : {}),
    ...(person.achievements && person.achievements.length > 0
      ? {
          award: person.achievements.map(
            (a) =>
              `${a.position ? `${a.position}° puesto - ` : ''}${a.event} (${a.year})`
          ),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * Article / NewsArticle — Páginas /noticias/[slug]
 * https://schema.org/NewsArticle
 */
export function generateArticleJsonLd(article: ArticleInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: article.date.toISOString(),
    ...(article.updatedDate
      ? { dateModified: article.updatedDate.toISOString() }
      : {}),
    author: {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
    },
    description: article.excerpt,
    url: fullUrl(article.url),
    ...(article.image ? { image: fullUrl(article.image) } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl(article.url),
    },
    inLanguage: 'es-CO',
  };
}

/**
 * Course — Páginas /programas/[slug]
 * https://schema.org/Course
 */
export function generateCourseJsonLd(course: CourseInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    url: fullUrl(course.url),
    description: course.description || course.title,
    ...(course.image ? { image: fullUrl(course.image) } : {}),
    provider: organizationRef(),
    educationalLevel: course.targetLevel,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      suggestedAge: course.ageRange,
      suggestedMinAge: course.ageMin,
      suggestedMaxAge: course.ageMax,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      courseSchedule: {
        '@type': 'Schedule',
        scheduleTimezone: 'America/Bogota',
        repeatFrequency: 'P1W',
        description: course.schedule,
      },
      ...(course.monthlyFee
        ? {
            offers: {
              '@type': 'Offer',
              price: course.monthlyFee,
              priceCurrency: 'COP',
              availability: course.enrollmentOpen
                ? 'https://schema.org/InStock'
                : 'https://schema.org/SoldOut',
            },
          }
        : {}),
    },
    inLanguage: 'es-CO',
  };
}

/**
 * ImageGallery — Páginas /galeria/[slug]
 * https://schema.org/ImageGallery
 */
export function generateGalleryJsonLd(gallery: GalleryInput): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: gallery.title,
    url: fullUrl(gallery.url),
    description: gallery.description,
    datePublished: gallery.date.toISOString(),
    image: gallery.images.slice(0, 10).map((img) => ({
      '@type': 'ImageObject',
      contentUrl: fullUrl(img.src),
      name: img.alt,
      ...(img.caption ? { caption: img.caption } : {}),
    })),
    author: organizationRef(),
    inLanguage: 'es-CO',
  };
}

/**
 * BreadcrumbList
 * https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: fullUrl(item.url),
    })),
  };
}
