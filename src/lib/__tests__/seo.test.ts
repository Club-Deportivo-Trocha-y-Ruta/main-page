import { describe, it, expect } from 'vitest';
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
  generateSportsTeamJsonLd,
  generateEventJsonLd,
  generateEventsListJsonLd,
  generatePersonJsonLd,
  generateArticleJsonLd,
  generateCourseJsonLd,
  generateGalleryJsonLd,
  generateBreadcrumbJsonLd,
} from '../seo';
import { SITE, SOCIAL } from '../constants';

// ============================================================
// generateOrganizationJsonLd
// ============================================================

describe('generateOrganizationJsonLd', () => {
  it('genera JSON-LD de tipo SportsOrganization', () => {
    const result = generateOrganizationJsonLd();
    expect(result['@context']).toBe('https://schema.org');
    expect(result['@type']).toBe('SportsOrganization');
    expect(result.name).toBe(SITE.name);
    expect(result.url).toBe(SITE.url);
    expect(result.sport).toBe('Mountain Biking');
  });

  it('incluye dirección postal completa', () => {
    const result = generateOrganizationJsonLd();
    const address = result.address as Record<string, unknown>;
    expect(address.addressLocality).toBe('Yumbo');
    expect(address.addressRegion).toBe('Valle del Cauca');
    expect(address.addressCountry).toBe('CO');
  });

  it('incluye redes sociales en sameAs', () => {
    const result = generateOrganizationJsonLd();
    const sameAs = result.sameAs as string[];
    expect(sameAs).toContain(SOCIAL.instagram);
    expect(sameAs).toContain(SOCIAL.facebook);
    expect(sameAs).toContain(SOCIAL.youtube);
  });
});

// ============================================================
// generateWebSiteJsonLd
// ============================================================

describe('generateWebSiteJsonLd', () => {
  it('genera JSON-LD de tipo WebSite', () => {
    const result = generateWebSiteJsonLd();
    expect(result['@type']).toBe('WebSite');
    expect(result.inLanguage).toBe('es-CO');
    expect(result.url).toBe(SITE.url);
  });
});

// ============================================================
// generateEventJsonLd
// ============================================================

describe('generateEventJsonLd', () => {
  const baseEvent = {
    title: 'Copa Valle XCO 2026',
    date: new Date('2026-05-15'),
    location: 'Pista Carlos Castro',
  };

  it('genera JSON-LD de tipo SportsEvent', () => {
    const result = generateEventJsonLd(baseEvent);
    expect(result['@type']).toBe('SportsEvent');
    expect(result.name).toBe('Copa Valle XCO 2026');
    expect(result.sport).toBe('Mountain Biking');
  });

  it('mapea status cancelled a EventCancelled', () => {
    const result = generateEventJsonLd({ ...baseEvent, status: 'cancelled' });
    expect(result.eventStatus).toBe('https://schema.org/EventCancelled');
  });

  it('mapea status past a EventCompleted', () => {
    const result = generateEventJsonLd({ ...baseEvent, status: 'past' });
    expect(result.eventStatus).toBe('https://schema.org/EventCompleted');
  });

  it('usa EventScheduled por defecto', () => {
    const result = generateEventJsonLd(baseEvent);
    expect(result.eventStatus).toBe('https://schema.org/EventScheduled');
  });

  it('incluye endDate cuando se provee', () => {
    const result = generateEventJsonLd({
      ...baseEvent,
      endDate: new Date('2026-05-16'),
    });
    expect(result.endDate).toBeDefined();
  });

  it('no incluye endDate cuando no se provee', () => {
    const result = generateEventJsonLd(baseEvent);
    expect(result).not.toHaveProperty('endDate');
  });

  it('incluye offers cuando hay registrationUrl', () => {
    const result = generateEventJsonLd({
      ...baseEvent,
      registrationUrl: 'https://example.com/registro',
    });
    const offers = result.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.url).toBe('https://example.com/registro');
  });

  it('usa organizer del club por defecto', () => {
    const result = generateEventJsonLd(baseEvent);
    const organizer = result.organizer as Record<string, unknown>;
    expect(organizer.name).toBe(SITE.name);
  });

  it('permite organizer personalizado', () => {
    const result = generateEventJsonLd({ ...baseEvent, organizer: 'FCC' });
    const organizer = result.organizer as Record<string, unknown>;
    expect(organizer.name).toBe('FCC');
  });
});

// ============================================================
// generateEventsListJsonLd
// ============================================================

describe('generateEventsListJsonLd', () => {
  it('genera ItemList con posiciones correctas', () => {
    const events = [
      { title: 'Evento 1', date: new Date(), url: '/calendario/e1' },
      { title: 'Evento 2', date: new Date(), url: '/calendario/e2' },
    ];
    const result = generateEventsListJsonLd(events);
    expect(result['@type']).toBe('ItemList');
    expect(result.numberOfItems).toBe(2);
    const items = result.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
  });
});

// ============================================================
// generateSportsTeamJsonLd
// ============================================================

describe('generateSportsTeamJsonLd', () => {
  it('genera JSON-LD con lista de atletas', () => {
    const members = [
      { name: 'Juan Pérez', url: '/equipo/juan-perez' },
      { name: 'Ana López', url: '/equipo/ana-lopez', photo: '/images/ana.jpg' },
    ];
    const result = generateSportsTeamJsonLd(members);
    expect(result['@type']).toBe('SportsTeam');
    const athletes = result.athlete as Array<Record<string, unknown>>;
    expect(athletes).toHaveLength(2);
    expect(athletes[0].name).toBe('Juan Pérez');
    expect(athletes[1]).toHaveProperty('image');
  });

  it('no incluye image si no hay foto', () => {
    const members = [{ name: 'Sin Foto', url: '/equipo/sin-foto' }];
    const result = generateSportsTeamJsonLd(members);
    const athletes = result.athlete as Array<Record<string, unknown>>;
    expect(athletes[0]).not.toHaveProperty('image');
  });
});

// ============================================================
// generatePersonJsonLd
// ============================================================

describe('generatePersonJsonLd', () => {
  it('genera JSON-LD de tipo Person', () => {
    const result = generatePersonJsonLd({
      name: 'Carlos Martínez',
      url: '/equipo/carlos-martinez',
    });
    expect(result['@type']).toBe('Person');
    expect(result.name).toBe('Carlos Martínez');
  });

  it('incluye sameAs con redes sociales', () => {
    const result = generatePersonJsonLd({
      name: 'Rider',
      url: '/equipo/rider',
      socialMedia: {
        instagram: 'https://instagram.com/rider',
        strava: 'https://strava.com/athletes/123',
      },
    });
    const sameAs = result.sameAs as string[];
    expect(sameAs).toContain('https://instagram.com/rider');
    expect(sameAs).toContain('https://strava.com/athletes/123');
  });

  it('formatea logros con posición', () => {
    const result = generatePersonJsonLd({
      name: 'Rider',
      url: '/equipo/rider',
      achievements: [
        { year: 2025, event: 'Copa Valle', position: 1, description: 'Oro' },
      ],
    });
    const awards = result.award as string[];
    expect(awards[0]).toBe('1° puesto - Copa Valle (2025)');
  });

  it('omite campos opcionales no proporcionados', () => {
    const result = generatePersonJsonLd({
      name: 'Simple',
      url: '/equipo/simple',
    });
    expect(result).not.toHaveProperty('image');
    expect(result).not.toHaveProperty('birthDate');
    expect(result).not.toHaveProperty('sameAs');
    expect(result).not.toHaveProperty('award');
  });
});

// ============================================================
// generateArticleJsonLd
// ============================================================

describe('generateArticleJsonLd', () => {
  const baseArticle = {
    title: 'Victoria en la Copa',
    date: new Date('2026-03-15'),
    author: 'Club Trocha y Ruta',
    excerpt: 'Gran resultado para el club...',
    url: '/noticias/victoria-copa',
  };

  it('genera JSON-LD de tipo NewsArticle', () => {
    const result = generateArticleJsonLd(baseArticle);
    expect(result['@type']).toBe('NewsArticle');
    expect(result.headline).toBe('Victoria en la Copa');
    expect(result.inLanguage).toBe('es-CO');
  });

  it('incluye dateModified cuando se provee updatedDate', () => {
    const result = generateArticleJsonLd({
      ...baseArticle,
      updatedDate: new Date('2026-03-16'),
    });
    expect(result).toHaveProperty('dateModified');
  });

  it('incluye keywords cuando hay tags', () => {
    const result = generateArticleJsonLd({
      ...baseArticle,
      tags: ['xco', 'resultados'],
    });
    expect(result.keywords).toBe('xco, resultados');
  });
});

// ============================================================
// generateCourseJsonLd
// ============================================================

describe('generateCourseJsonLd', () => {
  const baseCourse = {
    title: 'Escuela de Iniciación',
    url: '/programas/escuela-de-iniciacion',
    ageRange: '4-7 años',
    ageMin: 4,
    ageMax: 7,
    targetLevel: 'iniciación',
    schedule: 'Sábados 8am-10am',
    enrollmentOpen: true,
  };

  it('genera JSON-LD de tipo Course', () => {
    const result = generateCourseJsonLd(baseCourse);
    expect(result['@type']).toBe('Course');
    expect(result.name).toBe('Escuela de Iniciación');
  });

  it('incluye audiencia con rango de edad', () => {
    const result = generateCourseJsonLd(baseCourse);
    const audience = result.audience as Record<string, unknown>;
    expect(audience.suggestedMinAge).toBe(4);
    expect(audience.suggestedMaxAge).toBe(7);
  });

  it('incluye offers con disponibilidad cuando hay mensualidad', () => {
    const result = generateCourseJsonLd({ ...baseCourse, monthlyFee: '50000' });
    const instance = result.hasCourseInstance as Record<string, unknown>;
    const offers = instance.offers as Record<string, unknown>;
    expect(offers.price).toBe('50000');
    expect(offers.priceCurrency).toBe('COP');
    expect(offers.availability).toBe('https://schema.org/InStock');
  });

  it('marca SoldOut cuando enrollment está cerrado', () => {
    const result = generateCourseJsonLd({
      ...baseCourse,
      monthlyFee: '50000',
      enrollmentOpen: false,
    });
    const instance = result.hasCourseInstance as Record<string, unknown>;
    const offers = instance.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/SoldOut');
  });
});

// ============================================================
// generateGalleryJsonLd
// ============================================================

describe('generateGalleryJsonLd', () => {
  it('genera JSON-LD de tipo ImageGallery', () => {
    const result = generateGalleryJsonLd({
      title: 'Copa Valle 2026',
      url: '/galeria/copa-valle-2026',
      date: new Date('2026-03-15'),
      images: [{ src: '/img/1.jpg', alt: 'Foto 1' }],
    });
    expect(result['@type']).toBe('ImageGallery');
    expect(result.name).toBe('Copa Valle 2026');
  });

  it('limita imágenes a 10 en el JSON-LD', () => {
    const images = Array.from({ length: 15 }, (_, i) => ({
      src: `/img/${i}.jpg`,
      alt: `Foto ${i}`,
    }));
    const result = generateGalleryJsonLd({
      title: 'Galería grande',
      url: '/galeria/grande',
      date: new Date(),
      images,
    });
    const jsonImages = result.image as unknown[];
    expect(jsonImages).toHaveLength(10);
  });
});

// ============================================================
// generateBreadcrumbJsonLd
// ============================================================

describe('generateBreadcrumbJsonLd', () => {
  it('genera BreadcrumbList con posiciones', () => {
    const result = generateBreadcrumbJsonLd([
      { name: 'Inicio', url: '/' },
      { name: 'Equipo', url: '/equipo' },
      { name: 'Juan Pérez', url: '/equipo/juan-perez' },
    ]);
    expect(result['@type']).toBe('BreadcrumbList');
    const items = result.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[2].position).toBe(3);
  });

  it('genera URLs absolutas para paths relativos', () => {
    const result = generateBreadcrumbJsonLd([
      { name: 'Equipo', url: '/equipo' },
    ]);
    const items = result.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe(`${SITE.url}/equipo`);
  });
});
