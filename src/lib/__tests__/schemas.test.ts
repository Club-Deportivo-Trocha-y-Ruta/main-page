import { describe, it, expect } from 'vitest';
import {
  seoSchema,
  socialMediaSchema,
  ridersSchema,
  directivosSchema,
  newsSchema,
  eventsSchema,
  resultsSchema,
  programsSchema,
  sponsorsSchema,
  gallerySchema,
  rutasSchema,
  faqsSchema,
  pagesSchema,
  milestonesSchema,
} from '../schemas';

// ============================================================
// Schemas reutilizables
// ============================================================

describe('seoSchema', () => {
  it('acepta objeto vacío', () => {
    expect(seoSchema.parse({})).toEqual({});
  });

  it('acepta undefined (optional)', () => {
    expect(seoSchema.parse(undefined)).toBeUndefined();
  });

  it('valida metaDescription <= 160 chars', () => {
    expect(() => seoSchema.parse({ metaDescription: 'a'.repeat(161) })).toThrow();
  });

  it('acepta metaDescription de 160 chars exactos', () => {
    const result = seoSchema.parse({ metaDescription: 'a'.repeat(160) });
    expect(result?.metaDescription).toHaveLength(160);
  });
});

describe('socialMediaSchema', () => {
  it('acepta URLs válidas', () => {
    const result = socialMediaSchema.parse({
      instagram: 'https://instagram.com/club',
      strava: 'https://strava.com/clubs/123',
    });
    expect(result?.instagram).toBe('https://instagram.com/club');
  });

  it('rechaza URLs inválidas', () => {
    expect(() => socialMediaSchema.parse({ instagram: 'not-a-url' })).toThrow();
  });

  it('acepta undefined (optional)', () => {
    expect(socialMediaSchema.parse(undefined)).toBeUndefined();
  });
});

// ============================================================
// ridersSchema
// ============================================================

describe('ridersSchema', () => {
  const validRider = {
    name: 'Juan Pérez',
    photo: '/images/juan.jpg',
    birthDate: '2015-06-15',
    category: 'infantil',
  };

  it('acepta rider válido con defaults', () => {
    const result = ridersSchema.parse(validRider);
    expect(result.name).toBe('Juan Pérez');
    expect(result.level).toBe('formación');
    expect(result.active).toBe(true);
    expect(result.featured).toBe(false);
    expect(result.draft).toBe(false);
    expect(result.achievements).toEqual([]);
  });

  it('coerce birthDate de string a Date', () => {
    const result = ridersSchema.parse(validRider);
    expect(result.birthDate).toBeInstanceOf(Date);
  });

  it('rechaza categoría inválida', () => {
    expect(() => ridersSchema.parse({ ...validRider, category: 'profesional' })).toThrow();
  });

  it('rechaza sin campos requeridos', () => {
    expect(() => ridersSchema.parse({ name: 'Solo Nombre' })).toThrow();
  });

  it('acepta achievements con posición', () => {
    const result = ridersSchema.parse({
      ...validRider,
      achievements: [
        { year: 2025, event: 'Copa Valle', position: 1, description: 'Oro en infantil' },
      ],
    });
    expect(result.achievements).toHaveLength(1);
    expect(result.achievements[0].position).toBe(1);
  });
});

// ============================================================
// eventsSchema
// ============================================================

describe('eventsSchema', () => {
  const validEvent = {
    title: 'Copa Valle XCO',
    date: '2026-05-15',
    location: 'Pista Carlos Castro',
    category: 'xco',
  };

  it('acepta evento válido con defaults', () => {
    const result = eventsSchema.parse(validEvent);
    expect(result.status).toBe('upcoming');
    expect(result.level).toBe('departamental');
    expect(result.department).toBe('Valle del Cauca');
    expect(result.draft).toBe(false);
  });

  it('deja vacíos por defecto los campos que dependen del organizador', () => {
    // Sin convocatoria confirmada no hay categorías ni precios: los bloques de
    // la ficha no se pintan en vez de inventar un dato plausible.
    const result = eventsSchema.parse(validEvent);
    expect(result.categories).toEqual([]);
    expect(result.fees).toEqual([]);
    expect(result.circuit).toBeUndefined();
    expect(result.capacity).toBeUndefined();
    expect(result.urlSlug).toBeUndefined();
  });

  it('acepta la ficha completa de una válida', () => {
    const result = eventsSchema.parse({
      ...validEvent,
      urlSlug: 'copa-valle-yumbo-2026',
      venueSlug: 'pista-carlos-castro',
      updatedAt: '2026-08-29',
      circuit: { distanceKm: 3.8 },
      fees: [{ label: 'Teteros', amount: 50000 }],
      capacity: 350,
      categories: [{ name: 'Infantil A', ageMin: 7, ageMax: 8, laps: 1 }],
    });
    expect(result.urlSlug).toBe('copa-valle-yumbo-2026');
    expect(result.circuit?.distanceKm).toBe(3.8);
    expect(result.fees[0].amount).toBe(50000);
    expect(result.categories[0].name).toBe('Infantil A');
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('rechaza un circuito sin distancia o con distancia negativa', () => {
    expect(() => eventsSchema.parse({ ...validEvent, circuit: {} })).toThrow();
    expect(() => eventsSchema.parse({ ...validEvent, circuit: { distanceKm: -1 } })).toThrow();
  });

  it('rechaza un urlSlug que no sea kebab-case', () => {
    // Va directo a params.slug de getStaticPaths: una barra parte la ruta y un
    // acento o un espacio produce una URL que nadie puede teclear.
    for (const malo of ['Copa Valle', 'copa/valle', 'copa_valle', 'Copa-Valle', 'copa-válida']) {
      expect(() => eventsSchema.parse({ ...validEvent, urlSlug: malo }), malo).toThrow();
    }
    expect(() =>
      eventsSchema.parse({ ...validEvent, urlSlug: 'copa-valle-yumbo-2026' })
    ).not.toThrow();
  });

  it('rechaza un valor de inscripción negativo', () => {
    expect(() =>
      eventsSchema.parse({ ...validEvent, fees: [{ label: 'X', amount: -100 }] }),
    ).toThrow();
  });

  it('rechaza categoría de evento inválida', () => {
    expect(() => eventsSchema.parse({ ...validEvent, category: 'bmx' })).toThrow();
  });

  it('rechaza registrationUrl no válida como URL', () => {
    expect(() => eventsSchema.parse({ ...validEvent, registrationUrl: 'not-url' })).toThrow();
  });

  it('acepta todos los status válidos', () => {
    for (const status of ['upcoming', 'ongoing', 'past', 'cancelled']) {
      const result = eventsSchema.parse({ ...validEvent, status });
      expect(result.status).toBe(status);
    }
  });
});

// ============================================================
// newsSchema
// ============================================================

describe('newsSchema', () => {
  const validNews = {
    title: 'Victoria en la Copa',
    date: '2026-03-15',
    category: 'competencias',
    image: '/images/copa.jpg',
    excerpt: 'Gran resultado para el club en la Copa Valle.',
  };

  it('acepta noticia válida', () => {
    const result = newsSchema.parse(validNews);
    expect(result.author).toBe('Club Trocha y Ruta');
    expect(result.tags).toEqual([]);
  });

  it('rechaza excerpt > 200 chars', () => {
    expect(() => newsSchema.parse({ ...validNews, excerpt: 'a'.repeat(201) })).toThrow();
  });

  it('acepta excerpt de 200 chars exactos', () => {
    const result = newsSchema.parse({ ...validNews, excerpt: 'a'.repeat(200) });
    expect(result.excerpt).toHaveLength(200);
  });
});

// ============================================================
// programsSchema
// ============================================================

describe('programsSchema', () => {
  const validProgram = {
    title: 'Escuela de Iniciación',
    icon: 'bicycle',
    ageRange: '4-7 años',
    ageMin: 4,
    ageMax: 7,
    targetLevel: 'iniciación',
    schedule: 'Sábados 8am-10am',
    requirements: ['Bicicleta', 'Casco'],
    order: 1,
  };

  it('acepta programa válido', () => {
    const result = programsSchema.parse(validProgram);
    expect(result.enrollmentOpen).toBe(true);
    expect(result.active).toBe(true);
  });

  it('rechaza sin requirements (campo requerido)', () => {
    const { requirements, ...noReqs } = validProgram;
    expect(() => programsSchema.parse(noReqs)).toThrow();
  });

  it('rechaza targetLevel inválido', () => {
    expect(() => programsSchema.parse({ ...validProgram, targetLevel: 'avanzado' })).toThrow();
  });

  it('acepta un programa sin sesiones capturadas', () => {
    expect(programsSchema.parse(validProgram).sessions).toBeUndefined();
  });

  it('acepta sesiones con día, horas y lugar', () => {
    const result = programsSchema.parse({
      ...validProgram,
      sessions: [
        { day: 'tue', start: '16:30', end: '18:00', place: 'Pista Carlos Castro' },
        { day: 'sat', start: '07:00', end: '09:00' },
      ],
    });

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions?.[0].place).toBe('Pista Carlos Castro');
    expect(result.sessions?.[1].place).toBeUndefined();
  });

  it('rechaza un día que no es de la semana', () => {
    expect(() =>
      programsSchema.parse({
        ...validProgram,
        sessions: [{ day: 'lunes', start: '16:30', end: '18:00' }],
      }),
    ).toThrow();
  });

  it('exige la hora en formato HH:MM de 24 horas', () => {
    for (const start of ['4:30 PM', '16:3', '24:00', '16.30', '']) {
      expect(() =>
        programsSchema.parse({
          ...validProgram,
          sessions: [{ day: 'tue', start, end: '18:00' }],
        }),
      ).toThrow();
    }
  });

  it('rechaza una sesión que termina antes de empezar', () => {
    expect(() =>
      programsSchema.parse({
        ...validProgram,
        sessions: [{ day: 'tue', start: '18:00', end: '16:30' }],
      }),
    ).toThrow();

    expect(() =>
      programsSchema.parse({
        ...validProgram,
        sessions: [{ day: 'tue', start: '18:00', end: '18:00' }],
      }),
    ).toThrow();
  });
});

// ============================================================
// resultsSchema
// ============================================================

describe('resultsSchema', () => {
  const validResult = {
    event: 'copa-valle-2026',
    eventName: 'Copa Valle XCO 2026',
    date: '2026-05-15',
    category: 'infantil',
    positions: [
      { position: 1, riderName: 'Juan Pérez', time: '45:30' },
      { position: 2, riderName: 'Ana López' },
    ],
  };

  it('acepta resultado válido', () => {
    const result = resultsSchema.parse(validResult);
    expect(result.positions).toHaveLength(2);
    expect(result.positions[0].time).toBe('45:30');
  });

  it('rechaza sin positions', () => {
    const { positions, ...noPositions } = validResult;
    expect(() => resultsSchema.parse(noPositions)).toThrow();
  });
});

// ============================================================
// directivosSchema
// ============================================================

describe('directivosSchema', () => {
  it('acepta directivo válido', () => {
    const result = directivosSchema.parse({
      name: 'Director',
      role: 'presidente',
      roleLabel: 'Presidente',
    });
    expect(result.active).toBe(true);
    expect(result.certifications).toEqual([]);
  });

  it('una ficha sin draft sigue siendo publicable', () => {
    const result = directivosSchema.parse({
      name: 'Director',
      role: 'presidente',
      roleLabel: 'Presidente',
    });
    expect(result.draft).toBe(false);
  });

  it('acepta draft: true para una ficha guardada sin publicar', () => {
    const result = directivosSchema.parse({
      name: 'Director',
      role: 'presidente',
      roleLabel: 'Presidente',
      draft: true,
    });
    expect(result.draft).toBe(true);
  });

  it('conserva las credenciales y el año de ingreso que alimentan /equipo', () => {
    const result = directivosSchema.parse({
      name: 'Entrenadora',
      role: 'entrenador-principal',
      roleLabel: 'Directora Técnica',
      certifications: ['Licencia UCI nivel 1', 'Primeros auxilios'],
      yearJoined: 2018,
      order: 2,
    });
    expect(result.certifications).toHaveLength(2);
    expect(result.yearJoined).toBe(2018);
    expect(result.order).toBe(2);
  });

  it('rechaza email inválido', () => {
    expect(() =>
      directivosSchema.parse({
        name: 'Director',
        role: 'presidente',
        roleLabel: 'Presidente',
        email: 'not-email',
      }),
    ).toThrow();
  });
});

// ============================================================
// sponsorsSchema
// ============================================================

describe('sponsorsSchema', () => {
  it('acepta sponsor válido', () => {
    const result = sponsorsSchema.parse({
      name: 'BiciShop',
      logo: '/logos/bicishop.png',
      level: 'aliado',
    });
    expect(result.active).toBe(true);
  });

  it('rechaza nivel inválido', () => {
    expect(() =>
      sponsorsSchema.parse({
        name: 'Test',
        logo: '/logo.png',
        level: 'premium',
      }),
    ).toThrow();
  });
});

// ============================================================
// gallerySchema
// ============================================================

describe('gallerySchema', () => {
  it('acepta galería válida', () => {
    const result = gallerySchema.parse({
      title: 'Copa Valle 2026',
      date: '2026-03-15',
      cover: '/images/cover.jpg',
      images: [{ src: '/img/1.jpg', alt: 'Foto 1' }],
    });
    expect(result.category).toBe('competencia');
    expect(result.videos).toEqual([]);
  });

  it('rechaza video sin URL válida', () => {
    expect(() =>
      gallerySchema.parse({
        title: 'Test',
        date: '2026-01-01',
        cover: '/cover.jpg',
        images: [{ src: '/1.jpg', alt: 'Test' }],
        videos: [{ url: 'not-a-url', title: 'Video' }],
      }),
    ).toThrow();
  });
});

// ============================================================
// rutasSchema
// ============================================================

describe('rutasSchema', () => {
  const validRuta = {
    name: 'Circuito Yumbo',
    description: 'Ruta técnica por la montaña',
    distance: 15.5,
    elevationGain: 450,
    difficulty: 'moderada',
    surface: 'tierra',
    estimatedTime: '1h 30min',
    startPoint: 'Pista Carlos Castro',
    suitableFor: ['infantil', 'juvenil'],
  };

  it('acepta ruta válida', () => {
    const result = rutasSchema.parse(validRuta);
    expect(result.city).toBe('Yumbo');
    expect(result.active).toBe(true);
  });

  it('rechaza dificultad inválida', () => {
    expect(() => rutasSchema.parse({ ...validRuta, difficulty: 'extrema' })).toThrow();
  });

  it('rechaza suitableFor con categoría inválida', () => {
    expect(() => rutasSchema.parse({ ...validRuta, suitableFor: ['profesional'] })).toThrow();
  });
});

// ============================================================
// faqsSchema
// ============================================================

describe('faqsSchema', () => {
  it('acepta FAQ válida con defaults', () => {
    const result = faqsSchema.parse({
      question: '¿Cuánto cuesta?',
      answer: 'La mensualidad es de $50.000 COP.',
    });
    expect(result.category).toBe('general');
    expect(result.order).toBe(0);
    expect(result.draft).toBe(false);
  });
});

// ============================================================
// pagesSchema
// ============================================================

describe('pagesSchema', () => {
  it('acepta página válida con defaults', () => {
    const result = pagesSchema.parse({ title: 'Quiénes Somos' });
    expect(result.layout).toBe('page');
    expect(result.showInNav).toBe(false);
  });

  it('rechaza layout inválido', () => {
    expect(() => pagesSchema.parse({ title: 'Test', layout: 'sidebar' })).toThrow();
  });

  // Selector de edad de /programas: el copy es opcional porque solo lo usa esa
  // página. Ver `src/content/pages/programas.md`.
  it('acepta una página sin selector de edad', () => {
    expect(pagesSchema.parse({ title: 'Quiénes Somos' }).agePicker).toBeUndefined();
  });

  it('acepta el selector de edad con su pregunta y su aclaración', () => {
    const result = pagesSchema.parse({
      title: 'Programas',
      agePicker: {
        legend: '¿Qué edad tiene tu hijo?',
        hint: 'Es una ayuda visual.',
        allLabel: 'Todas las edades',
      },
    });

    expect(result.agePicker).toEqual({
      legend: '¿Qué edad tiene tu hijo?',
      hint: 'Es una ayuda visual.',
      allLabel: 'Todas las edades',
    });
  });

  it('la aclaración del selector es opcional', () => {
    const result = pagesSchema.parse({
      title: 'Programas',
      agePicker: { legend: '¿Qué edad tiene?', allLabel: 'Todas' },
    });

    expect(result.agePicker?.hint).toBeUndefined();
  });

  it('rechaza un selector de edad sin pregunta o sin texto de «todas»', () => {
    expect(() =>
      pagesSchema.parse({ title: 'Programas', agePicker: { allLabel: 'Todas' } }),
    ).toThrow();
    expect(() =>
      pagesSchema.parse({ title: 'Programas', agePicker: { legend: '¿Qué edad tiene?' } }),
    ).toThrow();
  });
});

// ============================================================
// milestonesSchema
// ============================================================

describe('milestonesSchema', () => {
  const valid = {
    label: '2010',
    title: 'De Ciclo Yumbo a Trocha y Ruta',
    body: 'El 1 de mayo de {{founded}} nace el club.',
  };

  it('acepta hito válido con defaults', () => {
    const result = milestonesSchema.parse(valid);
    expect(result.order).toBe(0);
    expect(result.draft).toBe(false);
    expect(result.image).toBeUndefined();
  });

  it('acepta hito con imagen y su alt', () => {
    const result = milestonesSchema.parse({
      ...valid,
      image: 'historia-pista.webp',
      imageAlt: 'Valla de la pista',
    });
    expect(result.image).toBe('historia-pista.webp');
  });

  it('rechaza imagen sin alt', () => {
    expect(() => milestonesSchema.parse({ ...valid, image: 'historia-pista.webp' })).toThrow();
  });

  it('rechaza imagen con alt en blanco', () => {
    expect(() =>
      milestonesSchema.parse({
        ...valid,
        image: 'historia-pista.webp',
        imageAlt: '   ',
      }),
    ).toThrow();
  });

  it('rechaza hito sin título', () => {
    expect(() => milestonesSchema.parse({ label: '2010', body: 'x' })).toThrow();
  });
});
