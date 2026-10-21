import { describe, it, expect } from 'vitest';
import { buildClubFigures, heroPulse, validaPromo, VALIDA_PROMO_DAYS } from '../home';
import type { Ally, PhotoManifest, ValidaEvent } from '../valida';

const HOY = new Date('2026-08-16T12:00:00Z');

const race = (id: string, iso: string, city: string, status?: string) => ({
  id,
  data: { title: `Válida ${city}`, date: new Date(iso), city, status },
});

const TEMPORADA = [
  race('sevilla', '2026-01-25', 'Sevilla'),
  race('ginebra', '2026-02-28', 'Ginebra'),
  race('palmira', '2026-08-16', 'Palmira'),
  race('roldanillo', '2026-09-20', 'Roldanillo'),
];

// Los tres programas reales del club.
const PROGRAMAS = [
  { ageMin: 4, ageMax: 5, schedule: 'Martes y viernes 4:30 - 6:00 PM', maxStudents: 20 },
  { ageMin: 6, ageMax: 11, schedule: 'Lunes a viernes 4:00 - 6:00 PM', maxStudents: 25 },
  { ageMin: 12, ageMax: 99, schedule: 'Sáb 7-9 AM', maxStudents: 10 },
];

const COMPLETO = { years: 16, programs: PROGRAMAS, events: TEMPORADA, trees: 77, now: HOY };

// ============================================================
// buildClubFigures
// ============================================================

describe('buildClubFigures', () => {
  it('arma las cuatro cifras en orden fijo', () => {
    expect(buildClubFigures(COMPLETO).map((f) => f.id)).toEqual([
      'years',
      'programs',
      'season',
      'trees',
    ]);
  });

  it('cada cifra viaja con su procedencia y con dónde comprobarla', () => {
    for (const figure of buildClubFigures(COMPLETO)) {
      expect(figure.note.length).toBeGreaterThan(0);
      expect(figure.href).toMatch(/^\//);
    }
  });

  it('cuenta las fechas de la temporada y cuántas van corridas', () => {
    const season = buildClubFigures(COMPLETO).find((f) => f.id === 'season')!;
    expect(season.value).toBe(4);
    // Sevilla, Ginebra y la de hoy (Palmira, en curso).
    expect(season.note).toContain('3 ya corridas');
    expect(season.note).toContain('2026');
  });

  it('cuenta los programas y sus sesiones semanales', () => {
    const programs = buildClubFigures(COMPLETO).find((f) => f.id === 'programs')!;
    expect(programs.value).toBe(3);
    // 2 (Iniciación) + 5 (Formación) + 1 (Alto Rendimiento en este fixture)
    expect(programs.note).toBe('8 sesiones a la semana entre todos');
  });

  it('cae a describir la ruta cuando ningún horario es legible', () => {
    const figures = buildClubFigures({
      ...COMPLETO,
      programs: [{ ageMin: 4, ageMax: 5, schedule: 'A convenir' }],
    });
    expect(figures.find((f) => f.id === 'programs')!.note).toBe(
      'De la iniciación al alto rendimiento',
    );
  });

  it('no muestra las cifras que el contenido no sostiene', () => {
    const figures = buildClubFigures({
      years: null,
      programs: [],
      events: [],
      trees: 0,
      now: HOY,
    });
    expect(figures).toEqual([]);
  });

  it('se cae solo la cifra que falta, no la banda entera', () => {
    const figures = buildClubFigures({ ...COMPLETO, trees: null });
    expect(figures.map((f) => f.id)).toEqual(['years', 'programs', 'season']);
  });

  it('no repite las cifras históricas que muestra AboutPreview', () => {
    // `ridersTrained` y `medals` son afirmaciones del club sin dataset detrás:
    // viven en AboutPreview y no deben duplicarse aquí.
    const ids = buildClubFigures(COMPLETO).map((f) => f.id);
    expect(ids).not.toContain('riders');
    expect(ids).not.toContain('medals');
  });

  it('concuerda el singular', () => {
    const figures = buildClubFigures({
      years: 1,
      programs: [PROGRAMAS[0]],
      events: [TEMPORADA[3]],
      trees: 1,
      now: HOY,
    });
    expect(figures.map((f) => f.label)).toEqual([
      'año formando ciclistas',
      'programa de formación',
      'fecha en el calendario',
      'árbol sembrado',
    ]);
  });
});

// ============================================================
// heroPulse
// ============================================================

describe('heroPulse', () => {
  it('avisa cuando la carrera es hoy', () => {
    expect(heroPulse(TEMPORADA, HOY)).toMatchObject({
      today: true,
      when: 'Hoy',
      where: 'Palmira',
    });
  });

  it('da la fecha de la siguiente cuando no hay ninguna hoy', () => {
    const pulse = heroPulse(TEMPORADA, new Date('2026-08-20T12:00:00Z'));
    expect(pulse?.today).toBe(false);
    expect(pulse?.where).toBe('Roldanillo');
    expect(pulse?.when).toMatch(/^20 de [a-záéíóú]+$/);
  });

  it('devuelve null cuando ya corrió la temporada', () => {
    expect(heroPulse(TEMPORADA, new Date('2026-12-31T12:00:00Z'))).toBeNull();
  });

  it('devuelve null sin eventos', () => {
    expect(heroPulse([], HOY)).toBeNull();
  });

  it('deja la ciudad vacía si el evento no la trae, sin romperse', () => {
    const sinCiudad = [{ id: 'x', data: { title: 'Clásica', date: new Date('2026-09-01') } }];
    expect(heroPulse(sinCiudad, HOY)?.where).toBe('');
  });
});

// ============================================================
// validaPromo
// ============================================================

describe('validaPromo', () => {
  const event: ValidaEvent = {
    slug: 'copa-valle-yumbo-2026',
    published: true,
    eventId: 'x',
    nextEventId: null,
    title: 'VI Válida Copa Valle 2026 · Yumbo',
    shortTitle: 'VI Válida · Yumbo',
    series: 'Copa Valle',
    edition: 'VI Válida',
    date: '2026-10-18',
    venue: {
      name: 'Pista',
      shortName: 'Pista',
      address: '',
      city: 'Yumbo',
      department: 'Valle del Cauca',
      lat: 0,
      lng: 0,
    },
    organizer: 'o',
    host: 'h',
    resultsUrl: null,
    chronicle: null,
    album: null,
    photographer: { name: null, instagram: null, url: null },
    hero: { photoId: null, alt: '' },
    ogImage: null,
    institutions: [],
  };
  const photo = (id: string) => ({ id, group: 'g', w: 1, h: 1, taken: '', placas: [] });
  const manifest = (n: number): PhotoManifest => ({
    base: 'https://x',
    generatedAt: null,
    groups: [],
    photos: Array.from({ length: n }, (_, i) => photo(`p${i}`)),
  });
  const ally = (id: string): Ally => ({
    id,
    name: id,
    role: 'patrocinio',
    tagline: null,
    instagram: null,
    url: null,
    logo: `/${id}.webp`,
  });
  const allies = (n: number) => Array.from({ length: n }, (_, i) => ally(`a${i}`));
  const DURANTE = new Date('2026-10-21T12:00:00Z');

  it('arma los textos con las cifras de los datos', () => {
    expect(validaPromo(event, manifest(416), allies(25), false, DURANTE)).toEqual({
      eyebrow: 'VI Válida Copa Valle · Yumbo',
      title: 'Encuentra a tu ciclista en las fotos de la válida',
      highlight: 'fotos',
      lead: '416 fotos oficiales, gratis y en calidad original, gracias a 25 aliados.',
      cta: 'Buscar mi foto',
      href: '/copa-valle-yumbo-2026',
      contentId: 'valida-yumbo-2026',
    });
  });

  it('el resaltado es un fragmento literal del titular', () => {
    const promo = validaPromo(event, manifest(3), allies(2), false, DURANTE);
    expect(promo?.title).toContain(promo?.highlight);
  });

  it('concuerda el singular y omite el agradecimiento sin aliados', () => {
    expect(validaPromo(event, manifest(1), allies(1), false, DURANTE)?.lead).toBe(
      '1 foto oficial, gratis y en calidad original, gracias a 1 aliado.',
    );
    expect(validaPromo(event, manifest(5), [], false, DURANTE)?.lead).toBe(
      '5 fotos oficiales, gratis y en calidad original.',
    );
  });

  it('devuelve null si la página no está publicada', () => {
    const oculta = { ...event, published: false };
    expect(validaPromo(oculta, manifest(10), allies(2), false, DURANTE)).toBeNull();
  });

  it('devuelve null con datos de vista previa', () => {
    expect(validaPromo(event, manifest(10), allies(2), true, DURANTE)).toBeNull();
  });

  it('devuelve null sin fotos', () => {
    expect(validaPromo(event, manifest(0), allies(2), false, DURANTE)).toBeNull();
  });

  it('dura 28 días desde la fecha de la válida, medianoche UTC incluida', () => {
    expect(VALIDA_PROMO_DAYS).toBe(28);
    // 18-oct + 28 días = 15-nov 00:00 UTC.
    const ultimo = new Date('2026-11-15T00:00:00Z');
    const despues = new Date('2026-11-15T00:00:01Z');
    expect(validaPromo(event, manifest(10), allies(2), false, ultimo)).not.toBeNull();
    expect(validaPromo(event, manifest(10), allies(2), false, despues)).toBeNull();
  });

  it('se muestra antes de la fecha de la válida', () => {
    const antes = new Date('2026-10-10T12:00:00Z');
    expect(validaPromo(event, manifest(10), allies(2), false, antes)).not.toBeNull();
  });

  it('cruza el fin de mes sin desfasarse', () => {
    const finDeMes = { ...event, date: '2026-12-10' };
    // 10-dic + 28 = 7-ene-2027.
    expect(
      validaPromo(finDeMes, manifest(2), [], false, new Date('2027-01-07T00:00:00Z')),
    ).not.toBeNull();
    expect(
      validaPromo(finDeMes, manifest(2), [], false, new Date('2027-01-07T00:00:01Z')),
    ).toBeNull();
  });
});
