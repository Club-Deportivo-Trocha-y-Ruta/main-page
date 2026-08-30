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

/** Colombia usa UTC-5 todo el año: no hay horario de verano que compensar. */
const COLOMBIA_OFFSET = '-05:00';
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * Fecha en ISO 8601 con el offset real de Colombia en vez de `Z`.
 *
 * Google News ordena por frescura usando la marca de tiempo, así que un
 * `...T00:00:00.000Z` —que es lo que devuelve `toISOString()`— sitúa la
 * noticia a las 19:00 del día anterior en hora local.
 *
 * Dos casos:
 * - Frontmatter con fecha sola (`2026-08-02`): `z.coerce.date()` la interpreta
 *   como medianoche UTC, pero el día que escribió el club es el del calendario
 *   colombiano. Se emite como medianoche de Bogotá para conservarlo.
 * - Frontmatter con hora (`2026-08-02T18:30:00-05:00`): el instante ya es
 *   correcto; sólo se reexpresa en componentes locales de Bogotá.
 */
export function toColombiaIso(date: Date): string {
  const isDateOnly =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (isDateOnly) {
    return `${date.toISOString().slice(0, 10)}T00:00:00${COLOMBIA_OFFSET}`;
  }

  const localComponents = new Date(date.getTime() - COLOMBIA_OFFSET_MS);
  return `${localComponents.toISOString().slice(0, 19)}${COLOMBIA_OFFSET}`;
}

/**
 * Autor de una noticia, como nodo schema.org.
 *
 * El byline visible y `article:author` ya mostraban el nombre del frontmatter,
 * pero el JSON-LD devolvía siempre la organización: tres respuestas distintas
 * a la misma pregunta. Google pide que el `author` estructurado coincida con
 * el byline. Cuando el crédito es del club, sigue siendo `Organization`.
 */
function articleAuthorNode(author: string): JsonLd {
  const isClub = [SITE.name, SITE.shortName, 'Club Trocha y Ruta'].some(
    (name) => name.toLowerCase() === author.trim().toLowerCase()
  );

  const club: JsonLd = {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
  };

  if (isClub) return club;

  return {
    '@type': 'Person',
    name: author.trim(),
    worksFor: club,
  };
}

/**
 * NewsMediaOrganization — editor de las noticias del sitio.
 *
 * Google News evalúa la transparencia del editor: quién publica, cómo
 * verifica y cómo corrige. Esas propiedades sólo existen en
 * `NewsMediaOrganization`, no en el `SportsOrganization` de la home, y las
 * cinco que se declaran aquí están efectivamente documentadas en
 * `/politica-editorial` (estándares, fuentes, correcciones con plazo,
 * conflictos de interés y cobertura de menores).
 *
 * No se declaran `diversityPolicy` ni `unnamedSourcesPolicy`: el club no
 * tiene esas políticas escritas y apuntarlas a una página que no las cubre
 * sería declarar algo falso.
 */
export function generateNewsMediaOrganizationJsonLd(): JsonLd {
  const editorialPolicy = `${SITE.url}/politica-editorial/`;

  return {
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE.url}/#publisher`,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/images/logo.png`,
    },
    email: CONTACT.email,
    telephone: CONTACT.phoneLink,
    ethicsPolicy: editorialPolicy,
    publishingPrinciples: editorialPolicy,
    correctionsPolicy: editorialPolicy,
    verificationFactCheckingPolicy: editorialPolicy,
    actionableFeedbackPolicy: editorialPolicy,
    parentOrganization: { '@id': `${SITE.url}/#organization` },
  };
}

function fullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

/**
 * URL absoluta de una PÁGINA, con barra final.
 *
 * El sitio emite `<link rel="canonical">` y las entradas del sitemap con barra
 * final. Si el JSON-LD apunta a la variante sin barra, Google ve dos
 * identificadores para la misma entidad. Usar esta helper —y no `fullUrl`—
 * siempre que el valor represente una página (`url`, `@id`, `mainEntityOfPage`).
 * `fullUrl` sigue siendo la correcta para imágenes y otros recursos.
 */
function pageUrl(path: string): string {
  const absolute = fullUrl(path);

  // Una URL externa no es nuestra para normalizar: añadirle una barra puede
  // cambiar a qué recurso apunta.
  if (!absolute.startsWith(SITE.url)) return absolute;

  const [withoutHash, hash] = absolute.split('#');
  const [base, query] = withoutHash.split('?');
  const normalized = base.endsWith('/') ? base : `${base}/`;
  return `${normalized}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
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
      url: pageUrl(m.url),
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
    ...(event.url ? { url: pageUrl(event.url) } : {}),
    organizer: event.organizer
      ? { '@type': 'Organization', name: event.organizer }
      : organizationRef(),
    sport: 'Mountain Biking',
  };

  // `InStock` en una carrera cancelada o ya corrida es una afirmación falsa
  // hacia Google, y las fichas de fechas pasadas conservan su `registrationUrl`.
  if (event.registrationUrl && eventStatus === 'https://schema.org/EventScheduled') {
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
      url: pageUrl(e.url),
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
    url: pageUrl(person.url),
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
  const imageArray = article.image ? [fullUrl(article.image)] : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    datePublished: toColombiaIso(article.date),
    dateModified: toColombiaIso(article.updatedDate ?? article.date),
    author: articleAuthorNode(article.author),
    description: article.excerpt,
    url: pageUrl(article.url),
    ...(imageArray ? { image: imageArray } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.tags && article.tags.length > 0 ? { keywords: article.tags.join(', ') } : {}),
    // Inline, no una referencia a `#publisher`: el nodo del editor sólo se
    // emite en la home, y una noticia tiene que ser autocontenida para que
    // Google resuelva al editor sin depender de haber rastreado otra página.
    publisher: generateNewsMediaOrganizationJsonLd(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl(article.url),
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
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
    url: pageUrl(course.url),
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
    url: pageUrl(gallery.url),
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
      item: pageUrl(item.url),
    })),
  };
}

/**
 * FAQPage — Páginas con preguntas frecuentes
 * https://schema.org/FAQPage
 */
export function generateFAQPageJsonLd(
  faqs: { question: string; answer: string }[]
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * SportsOrganization + SportsClub — Página /quienes-somos
 * Schema enriquecido con datos de ubicación, área de servicio y disciplinas
 * https://schema.org/SportsClub
 */
export function generateSportsClubJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['SportsOrganization', 'SportsClub'],
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    description: SITE.description,
    sport: 'Mountain Biking',
    foundingDate: '2010-05-01',
    logo: fullUrl('/favicon-512.png'),
    image: fullUrl('/images/hero-poster.jpg'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'CL 8 Norte 2 N° 55',
      addressLocality: 'Yumbo',
      addressRegion: 'Valle del Cauca',
      addressCountry: 'CO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 3.4572,
      longitude: -76.495,
    },
    telephone: CONTACT.phoneLink,
    email: CONTACT.email,
    areaServed: {
      '@type': 'City',
      name: 'Yumbo',
      containedInPlace: {
        '@type': 'State',
        name: 'Valle del Cauca',
      },
    },
    sameAs: [SOCIAL.instagram, SOCIAL.facebook, SOCIAL.youtube, SOCIAL.strava].filter(Boolean),
    slogan: SITE.tagline,
    knowsAbout: ['Ciclomontañismo', 'Mountain Biking', 'Ciclismo juvenil', 'XCO', 'XCM'],
  };
}

export function generateSocialInitiativeJsonLd(initiative: {
  title: string;
  date: Date;
  description: string;
  location?: string;
  image?: string;
  url: string;
  type: string;
}) {
  const isAmbiental = initiative.type === 'ambiental';

  const typeMap: Record<string, string> = {
    ambiental: 'Action',
    formacion: 'EducationEvent',
    recreacion: 'SportsEvent',
    educacion: 'EducationEvent',
    alianza: 'Event',
  };

  const base = {
    '@context': 'https://schema.org',
    '@type': typeMap[initiative.type] ?? 'Event',
    name: initiative.title,
    description: initiative.description,
    image: initiative.image,
    url: initiative.url,
    location: initiative.location
      ? { '@type': 'Place', name: initiative.location }
      : undefined,
  };

  if (isAmbiental) {
    return {
      ...base,
      actionStatus: 'ActiveActionStatus',
      startTime: initiative.date.toISOString(),
      agent: {
        '@type': 'SportsOrganization',
        name: 'Club Deportivo Trocha y Ruta',
        url: 'https://clubdeportivotrochayruta.org',
      },
    };
  }

  return {
    ...base,
    startDate: initiative.date.toISOString(),
    organizer: {
      '@type': 'SportsOrganization',
      name: 'Club Deportivo Trocha y Ruta',
      url: 'https://clubdeportivotrochayruta.org',
    },
  };
}
