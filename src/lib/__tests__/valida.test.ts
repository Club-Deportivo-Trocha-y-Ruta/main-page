import { describe, it, expect } from 'vitest';
import {
  allyCreditLine,
  allyHandle,
  allyHref,
  allyLogoSources,
  allyRoleLabel,
  equalAreaWidth,
  groupAlliesByRole,
  assignGroup,
  assignGroupByFolder,
  folderKey,
  chipLabel,
  countPhotos,
  DESCRIPTION_MAX,
  dockItems,
  downloadFileName,
  editionFacts,
  editionHighlights,
  galleryEmptyCopy,
  groupPhotos,
  groupSearch,
  groupTitle,
  heroCopy,
  historicStats,
  initialFilterFromSearch,
  isPublished,
  joinCategories,
  listInProse,
  longDate,
  numbersAvailable,
  pageMeta,
  photoAlt,
  photoCount,
  photoIdFromHash,
  photoShareUrl,
  photoUrls,
  recapCards,
  lapRanking,
  formatClock,
  compositionGroups,
  municipalityLegend,
  municipalityTotal,
  ritmoAvailable,
  type Vueltas2026,
  recapLead,
  ribbonColumns,
  sortAllies,
  summarizeAllies,
  takenClock,
  takenSeconds,
  TITLE_MAX,
  type Ally,
  type Edition2026,
  type PhotoManifest,
  type RecapKey,
  type ScheduledGroup,
  type ValidaData,
  type ValidaEvent,
} from '../valida';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const schedule: ScheduledGroup[] = [
  { id: 'previa', label: 'Antes de la salida', categories: [], description: '', start: null },
  {
    id: 'manga-1',
    label: 'Manga 1',
    categories: ['Teteros sin pedales', 'Teteros con pedales'],
    description: '',
    start: '08:30',
  },
  {
    id: 'manga-2',
    label: 'Manga 2',
    categories: ['Preinfantil A', 'Preinfantil B'],
    description: '',
    start: '09:00',
  },
  {
    id: 'manga-3',
    label: 'Manga 3',
    categories: ['Infantil A', 'Infantil B'],
    description: '',
    start: '10:15',
  },
];

function photo(id: string, group: string, taken: string) {
  return { id, group, w: 1600, h: 1067, taken };
}

const manifest: PhotoManifest = {
  base: 'https://clubdeportivotrochayruta.org/media/valida-yumbo-2026/',
  generatedAt: '2026-10-19T09:00:00-05:00',
  groups: schedule.map(({ start: _start, ...group }) => group),
  photos: [
    photo('b-0002', 'manga-1', '2026-10-18T08:41:12-05:00'),
    photo('a-0001', 'manga-1', '2026-10-18T08:41:12-05:00'),
    photo('c-0003', 'manga-3', '2026-10-18T10:20:00-05:00'),
    photo('d-0004', 'fantasma', '2026-10-18T13:10:00-05:00'),
    photo('e-0005', 'previa', 'sin-hora'),
  ],
};

const emptyManifest: PhotoManifest = { ...manifest, photos: [] };

const allies: Ally[] = [
  {
    id: 'yumbileta',
    name: 'Yumbileta',
    role: 'patrocinio',
    tagline: null,
    instagram: 'yumbileta',
    url: null,
    logo: '/images/valida-yumbo-2026/aliados/yumbileta.webp',
  },
  {
    id: 'ascomy',
    name: 'ASCOMY',
    role: 'apoyo',
    tagline: null,
    instagram: null,
    url: null,
    logo: '/images/valida-yumbo-2026/aliados/ascomy.webp',
  },
  {
    id: 'aguila-roja',
    name: 'Café Águila Roja',
    role: 'patrocinio',
    tagline: null,
    instagram: null,
    url: 'https://ejemplo.test',
    logo: '/images/valida-yumbo-2026/aliados/aguila-roja.webp',
  },
  {
    id: 'beru',
    name: 'Alquiequipos Beru',
    role: 'patrocinio',
    tagline: null,
    instagram: '@beru',
    url: null,
    logo: '/images/valida-yumbo-2026/aliados/beru.webp',
  },
];

const event: ValidaEvent = {
  slug: 'copa-valle-yumbo-2026',
  published: false,
  eventId: '2026-10-copa-valle-vii-yumbo',
  nextEventId: null,
  title: 'VI Válida Copa Valle 2026 · Yumbo',
  shortTitle: 'VI Válida · Yumbo',
  series: 'Copa Valle 2026',
  edition: 'VI Válida',
  date: '2026-10-18',
  venue: {
    name: 'Pista de Ciclomontañismo Carlos Castro',
    shortName: 'Pista Carlos Castro',
    address: '',
    city: 'Yumbo',
    department: 'Valle del Cauca',
    lat: 3.59,
    lng: -76.48,
  },
  organizer: 'Comisión Vallecaucana de Ciclomontañismo',
  host: 'Club Deportivo Trocha y Ruta',
  resultsUrl: null,
  chronicle: null,
  album: null,
  photographer: { name: null, instagram: null, url: null },
  hero: { photoId: null, alt: 'La pista' },
  ogImage: null,
  institutions: [],
};

const data: ValidaData = {
  source: 'Datos: Comisión',
  historico: [
    {
      id: 'ciclistas',
      value: '600',
      prefix: 'Cerca de',
      label: 'ciclistas',
      note: 'nota',
      icon: 'ph:users-three-bold',
    },
    { id: 'vacio', value: '  ', label: 'no debería salir', icon: 'ph:x' },
    {
      id: 'terminan',
      value: '96',
      suffix: 'de cada 100',
      label: 'terminan',
      icon: 'ph:flag-checkered-bold',
    },
  ],
  edicion2026: null,
};

// ─── URLs ──────────────────────────────────────────────────────────────────────

describe('photoUrls', () => {
  it('arma las tres versiones bajo la base, sin barras duplicadas', () => {
    const urls = photoUrls('https://ejemplo.test/media/valida/', 'dsc-0231-7f3a');
    expect(urls).toEqual({
      thumb: 'https://ejemplo.test/media/valida/thumb/dsc-0231-7f3a.webp',
      web: 'https://ejemplo.test/media/valida/web/dsc-0231-7f3a.webp',
      original: 'https://ejemplo.test/media/valida/original/dsc-0231-7f3a.jpg',
    });
  });

  it('el nombre de descarga lleva el slug del evento y el id', () => {
    expect(downloadFileName('copa-valle-yumbo-2026', 'dsc-0231-7f3a')).toBe(
      'copa-valle-yumbo-2026-dsc-0231-7f3a.jpg',
    );
  });

  it('el enlace para compartir apunta a la foto con un hash y descarta el hash previo', () => {
    expect(photoShareUrl('https://ejemplo.test/copa-valle-yumbo-2026#fotos', 'x-1')).toBe(
      'https://ejemplo.test/copa-valle-yumbo-2026#foto-x-1',
    );
  });

  it('lee el id de una foto desde el hash y rechaza otros hashes', () => {
    expect(photoIdFromHash('#foto-dsc-0231-7f3a')).toBe('dsc-0231-7f3a');
    expect(photoIdFromHash('foto-abc')).toBe('abc');
    expect(photoIdFromHash('#fotos')).toBeNull();
    expect(photoIdFromHash('#foto-')).toBeNull();
    expect(photoIdFromHash('')).toBeNull();
  });
});

// ─── Hora y asignación ─────────────────────────────────────────────────────────

describe('takenSeconds y assignGroup', () => {
  it('lee la hora local del texto ISO sin depender de la zona horaria de la máquina', () => {
    expect(takenSeconds('2026-10-18T08:41:12-05:00')).toBe(8 * 3600 + 41 * 60 + 12);
    expect(takenSeconds('2026-10-18T23:05')).toBe(23 * 3600 + 5 * 60);
    expect(takenSeconds('2026-10-18')).toBeNull();
    expect(takenSeconds('2026-10-18T25:00:00')).toBeNull();
  });

  it('asigna la foto al último grupo que ya había salido', () => {
    expect(assignGroup('2026-10-18T08:29:59-05:00', schedule)).toBe('previa');
    expect(assignGroup('2026-10-18T08:30:00-05:00', schedule)).toBe('manga-1');
    expect(assignGroup('2026-10-18T09:00:00-05:00', schedule)).toBe('manga-2');
    expect(assignGroup('2026-10-18T10:14:59-05:00', schedule)).toBe('manga-2');
    expect(assignGroup('2026-10-18T13:30:00-05:00', schedule)).toBe('manga-3');
  });

  it('sin hora legible cae en el grupo sin salida; sin ese grupo, en el primero', () => {
    expect(assignGroup(null, schedule)).toBe('previa');
    expect(assignGroup('basura', schedule)).toBe('previa');
    const onlyMangas = schedule.filter((group) => group.start !== null);
    expect(assignGroup(null, onlyMangas)).toBe('manga-1');
    expect(assignGroup('2026-10-18T07:00:00-05:00', onlyMangas)).toBe('manga-1');
  });

  it('respeta las horas aunque los grupos vengan desordenados', () => {
    const shuffled = [schedule[3], schedule[1], schedule[0], schedule[2]];
    expect(assignGroup('2026-10-18T09:30:00-05:00', shuffled)).toBe('manga-2');
  });

  it('falla claramente sin grupos', () => {
    expect(() => assignGroup('2026-10-18T09:30:00-05:00', [])).toThrow(/no hay grupos/);
  });

  it('formatea la hora de captura en 12 horas', () => {
    expect(takenClock('2026-10-18T08:41:12-05:00')).toBe('8:41 a. m.');
    expect(takenClock('2026-10-18T12:05:00-05:00')).toBe('12:05 p. m.');
    expect(takenClock('2026-10-18T00:07:00-05:00')).toBe('12:07 a. m.');
    expect(takenClock('sin-hora')).toBe('');
  });
});

// ─── Agrupación ────────────────────────────────────────────────────────────────

describe('groupPhotos', () => {
  it('devuelve los grupos con fotos en el orden del manifest, ordenadas por hora y luego por id', () => {
    const grouped = groupPhotos(manifest);
    expect(grouped.map((entry) => entry.group.id)).toEqual([
      'previa',
      'manga-1',
      'manga-3',
      'otras',
    ]);
    expect(grouped[1].photos.map((p) => p.id)).toEqual(['a-0001', 'b-0002']);
  });

  it('sin hora de captura conserva el orden del manifest en vez de ordenar por id', () => {
    const sinHora: PhotoManifest = {
      ...manifest,
      photos: ['z-0003', 'a-0001', 'm-0002'].map((id) => photo(id, 'manga-1', '')),
    };
    const grouped = groupPhotos(sinHora);
    expect(grouped[0].photos.map((p) => p.id)).toEqual(['z-0003', 'a-0001', 'm-0002']);
  });

  it('omite los grupos vacíos y recoge las fotos de grupos desconocidos en «Otras»', () => {
    const grouped = groupPhotos(manifest);
    expect(grouped.some((entry) => entry.group.id === 'manga-2')).toBe(false);
    const otras = grouped[grouped.length - 1];
    expect(otras.group.label).toBe('Otras fotos');
    expect(otras.photos.map((p) => p.id)).toEqual(['d-0004']);
  });

  it('con el manifest vacío no hay grupos', () => {
    expect(groupPhotos(emptyManifest)).toEqual([]);
    expect(countPhotos(emptyManifest)).toBe(0);
    expect(countPhotos(manifest)).toBe(5);
  });

  it('cuenta en singular y plural', () => {
    expect(photoCount(1)).toBe('1 foto');
    expect(photoCount(180)).toBe('180 fotos');
  });
});

describe('textos de grupo y de foto', () => {
  it('comprime categorías gemelas y une la última con «y»', () => {
    expect(joinCategories([])).toBe('');
    expect(joinCategories(['Promocional'])).toBe('Promocional');
    expect(joinCategories(['Infantil A', 'Infantil B'])).toBe('Infantil A y B');
    expect(joinCategories(['Prejuvenil A', 'Promocional', 'Máster'])).toBe(
      'Prejuvenil A, Promocional y Máster',
    );
    expect(joinCategories(['Teteros sin pedales', 'Teteros con pedales'])).toBe(
      'Teteros sin pedales y Teteros con pedales',
    );
  });

  it('el título del grupo lleva las categorías cuando las hay', () => {
    expect(groupTitle(schedule[3])).toBe('Manga 3 · Infantil A y B');
    expect(groupTitle(schedule[0])).toBe('Antes de la salida');
  });

  it('el chip habla de categorías, nunca de «Manga N» a secas', () => {
    expect(chipLabel({ ...schedule[3], chip: 'Infantil' })).toBe('Infantil');
    expect(chipLabel({ ...schedule[3], chip: '  ' })).toBe('Infantil A y B');
    expect(chipLabel(schedule[3])).toBe('Infantil A y B');
    expect(chipLabel(schedule[0])).toBe('Antes de la salida');
  });

  it('el texto alternativo no nombra a nadie: manga, categorías y posición', () => {
    expect(photoAlt(schedule[3], 16, 180)).toBe('Manga 3, Infantil A y B: foto 17 de 180');
    expect(photoAlt(schedule[0], 0, 3)).toBe('Antes de la salida: foto 1 de 3');
  });
});

// ─── Filtro por URL ────────────────────────────────────────────────────────────

describe('filtro por URL', () => {
  it('lee el filtro inicial de la URL y descarta grupos que no existen', () => {
    expect(initialFilterFromSearch('?manga=manga-3', manifest)).toEqual({ group: 'manga-3' });
    expect(initialFilterFromSearch('manga=nada', manifest)).toEqual({ group: null });
    expect(initialFilterFromSearch('', manifest)).toEqual({ group: null });
  });

  it('arma la query para compartir un grupo', () => {
    expect(groupSearch('manga-3')).toBe('?manga=manga-3');
    expect(groupSearch(null)).toBe('');
  });
});

// ─── Aliados ───────────────────────────────────────────────────────────────────

describe('aliados', () => {
  it('ordena alfabéticamente sin distinguir tildes ni mayúsculas', () => {
    expect(sortAllies(allies).map((ally) => ally.id)).toEqual([
      'beru',
      'ascomy',
      'aguila-roja',
      'yumbileta',
    ]);
  });

  it('no muta el arreglo original', () => {
    const copy = [...allies];
    sortAllies(allies);
    expect(allies).toEqual(copy);
  });

  it('enlaza a Instagram si está confirmado, si no a la web, si no a nada', () => {
    expect(allyHref(allies[0])).toBe('https://www.instagram.com/yumbileta/');
    expect(allyHref(allies[3])).toBe('https://www.instagram.com/beru/');
    expect(allyHref(allies[2])).toBe('https://ejemplo.test');
    expect(allyHref(allies[1])).toBeNull();
    expect(allyHandle(allies[3])).toBe('@beru');
    expect(allyHandle(allies[1])).toBeNull();
  });

  it('etiqueta los roles y resume', () => {
    expect(allyRoleLabel('patrocinio')).toBe('Patrocinador');
    expect(allyRoleLabel('apoyo')).toBe('Apoyo');
    expect(summarizeAllies(allies)).toEqual({ total: 4, sponsors: 3, supporters: 1 });
  });

  it('agrupa por rol, patrocinio primero y alfabético dentro de cada grupo', () => {
    const groups = groupAlliesByRole(allies);
    expect(groups.map((group) => [group.role, group.title])).toEqual([
      ['patrocinio', 'Con el patrocinio de'],
      ['apoyo', 'Con el apoyo de'],
    ]);
    expect(groups[0].allies.map((ally) => ally.id)).toEqual(['beru', 'aguila-roja', 'yumbileta']);
    expect(groups[1].allies.map((ally) => ally.id)).toEqual(['ascomy']);
  });

  it('la descripción sale por grupo, solo si todas las del grupo la tienen', () => {
    const withTagline = (ally: Ally, tagline: string | null): Ally => ({ ...ally, tagline });
    const [sponsors, supporters] = groupAlliesByRole([
      withTagline(allies[0], 'Paletería artesanal de Yumbo'),
      withTagline(allies[2], null),
      withTagline(allies[3], 'Alquiler de equipos'),
      withTagline(allies[1], 'Asociación de Comerciantes'),
    ]);
    // A Café Águila Roja le falta: ninguna del grupo la muestra.
    expect(sponsors.taglines).toBe(false);
    // ASCOMY, sola en su grupo, la tiene: la conserva.
    expect(supporters.taglines).toBe(true);
    // Una descripción en blanco cuenta como que no la tiene.
    expect(groupAlliesByRole([withTagline(allies[1], '  ')])[0].taglines).toBe(false);
  });

  it('un rol sin aliados no deja un grupo vacío', () => {
    const onlySponsors = allies.filter((ally) => ally.role === 'patrocinio');
    expect(groupAlliesByRole(onlySponsors).map((group) => group.role)).toEqual(['patrocinio']);
    expect(groupAlliesByRole([])).toEqual([]);
  });

  it('la línea de crédito nombra solo los roles que hay', () => {
    expect(allyCreditLine(allies)).toBe('Con el patrocinio y el apoyo de');
    expect(allyCreditLine(allies.filter((ally) => ally.role === 'patrocinio'))).toBe(
      'Con el patrocinio de',
    );
    expect(allyCreditLine(allies.filter((ally) => ally.role === 'apoyo'))).toBe('Con el apoyo de');
    expect(allyCreditLine([])).toBe('');
  });

  it('la franja abre las casillas para seguir en dos filas: ocho hasta 16 aliados, nueve con 18', () => {
    expect(ribbonColumns(0)).toBe(8);
    expect(ribbonColumns(3)).toBe(8); // pocos aliados: la casilla no crece
    expect(ribbonColumns(16)).toBe(8); // dos filas de ocho, como el afiche
    expect(ribbonColumns(17)).toBe(9);
    expect(ribbonColumns(18)).toBe(9); // dos filas de nueve, no ocho, ocho y dos sueltos
    expect(ribbonColumns(21)).toBe(11);
  });

  it('iguala la superficie de los logos, no la caja', () => {
    const box = { side: 40, maxWidth: 90, maxHeight: 55 };
    const area = (ratio: number) => {
      const width = equalAreaWidth(ratio, box);
      return width * (width / ratio);
    };
    // Rapi Wey (4,13:1), un cuadrado y ASCOMY (0,79:1) ocupan lo mismo.
    expect(area(4.13)).toBeCloseTo(1600, -1);
    expect(area(1)).toBeCloseTo(1600, -1);
    expect(area(0.79)).toBeCloseTo(1600, -1);
    expect(equalAreaWidth(4.13, box)).toBeGreaterThan(equalAreaWidth(1, box));
  });

  it('una proporción extrema se encoge hasta caber, sin desbordar la casilla', () => {
    const box = { side: 40, maxWidth: 90, maxHeight: 55 };
    expect(equalAreaWidth(9, box)).toBe(90); // tope de ancho
    expect(equalAreaWidth(0.25, box)).toBe(13.8); // alto 55 = 13,75 / 0,25
    expect(equalAreaWidth(null, box)).toBe(40); // sin proporción: cuadrado
    expect(equalAreaWidth(0, box)).toBe(40);
  });

  it('el srcset lleva la versión chica (-320) y la grande, con el ancho real de cada una', () => {
    const logo = '/images/valida-yumbo-2026/aliados/rapi-wey.webp';
    // Apaisado: la caja limita por ancho (320 y 640).
    expect(allyLogoSources({ logo, logoRatio: 4.13 })).toEqual({
      src: logo,
      srcset:
        '/images/valida-yumbo-2026/aliados/rapi-wey-320.webp 320w, /images/valida-yumbo-2026/aliados/rapi-wey.webp 640w',
    });
    // Vertical (ASCOMY): la caja limita por alto, 200 × 0,79 y 400 × 0,79.
    expect(allyLogoSources({ logo, logoRatio: 0.79 }).srcset).toBe(
      '/images/valida-yumbo-2026/aliados/rapi-wey-320.webp 158w, /images/valida-yumbo-2026/aliados/rapi-wey.webp 316w',
    );
    // Sin proporción no se adivina: solo el `src`.
    expect(allyLogoSources({ logo, logoRatio: null })).toEqual({ src: logo, srcset: undefined });
    expect(allyLogoSources({ logo: '/images/x.png', logoRatio: 2 }).srcset).toBeUndefined();
  });

  it('lista en prosa', () => {
    expect(listInProse([])).toBe('');
    expect(listInProse(['Shimano'])).toBe('Shimano');
    expect(listInProse(['GW', 'Shimano'])).toBe('GW y Shimano');
    expect(listInProse(['IMDERTY', 'GW', 'Shimano'])).toBe('IMDERTY, GW y Shimano');
  });
});

// ─── Cifras ────────────────────────────────────────────────────────────────────

describe('cifras', () => {
  it('las históricas salen del JSON y las vacías se omiten', () => {
    const stats = historicStats(data);
    expect(stats.map((stat) => stat.id)).toEqual(['ciclistas', 'terminan']);
    expect(stats[0]).toEqual({
      id: 'ciclistas',
      value: '600',
      prefix: 'Cerca de',
      suffix: null,
      label: 'ciclistas',
      note: 'nota',
      icon: 'ph:users-three-bold',
    });
    expect(stats[1].suffix).toBe('de cada 100');
    expect(stats[1].prefix).toBeNull();
  });

  it('sin edición 2026 no hay hechos', () => {
    expect(editionFacts(null)).toEqual([]);
    expect(editionFacts({})).toEqual([]);
  });

  it('solo pinta las cifras presentes y formatea en español', () => {
    const facts = editionFacts({
      corredores: 1234,
      municipios: 22,
      departamentos: 4,
      terminaron: null,
      finalMasAjustado: '2 segundos en infantil A',
    });
    expect(facts.map((fact) => fact.label)).toEqual([
      'Corredores en la salida',
      'De dónde vinieron',
      'El final más ajustado',
    ]);
    expect(facts[0].value).toBe('1.234');
    expect(facts[1].value).toBe('22 municipios de 4 departamentos');
  });

  it('«mujeres» dice «en las categorías femeninas»: teteros es mixta y no cuenta', () => {
    const [fact] = editionFacts({ mujeres: 37 });
    expect(fact).toMatchObject({
      id: 'mujeres',
      label: 'En las categorías femeninas',
      value: '37',
    });
  });

  it('municipios sin departamentos no inventa el dato', () => {
    const [fact] = editionFacts({ municipios: 22 });
    expect(fact.value).toBe('22 municipios');
  });

  it('los fieles se dicen sobre 33, que es el piso de la cuenta', () => {
    const [fact] = editionFacts({ fieles33Volvieron: 21 });
    expect(fact).toEqual({
      id: 'fieles33Volvieron',
      icon: 'ph:repeat-bold',
      label: 'De los 33 que corrieron las tres, volvieron',
      value: '21 de 33',
    });
  });

  it('el total de corredores no se publica si queda por debajo del umbral (regla §8)', () => {
    const edition = { corredores: 214, municipios: 22 };
    expect(editionFacts(edition, { minRunners: 228 }).map((fact) => fact.label)).toEqual([
      'De dónde vinieron',
    ]);
    expect(editionFacts(edition, { minRunners: 214 }).map((fact) => fact.label)).toEqual([
      'Corredores en la salida',
      'De dónde vinieron',
    ]);
    expect(editionFacts(edition, { minRunners: null }).map((fact) => fact.label)).toEqual([
      'Corredores en la salida',
      'De dónde vinieron',
    ]);
    expect(editionFacts(edition).map((fact) => fact.label)).toEqual([
      'Corredores en la salida',
      'De dónde vinieron',
    ]);
  });

  it('las cifras destacadas parten el final más ajustado en cifra, unidad y frase', () => {
    const highlights = editionHighlights({
      municipios: 22,
      departamentos: 4,
      ninosHasta12: 104,
      finalMasAjustado: '2 segundos en infantil A',
    });
    expect(highlights.map((item) => item.id)).toEqual([
      'municipios',
      'ninosHasta12',
      'finalMasAjustado',
    ]);
    expect(highlights[0].label).toBe('municipios de 4 departamentos llegaron a la salida');
    expect(highlights[2]).toMatchObject({
      value: 2,
      unit: 'segundos',
      label: 'decidieron el final más ajustado, en infantil A',
    });
  });

  it('un final con otra forma va entero, y sin edición no hay destacadas', () => {
    expect(editionHighlights({ finalMasAjustado: 'Foto finish' })[0]).toMatchObject({
      value: 'Foto finish',
      label: 'el final más ajustado',
    });
    expect(editionHighlights({ finalMasAjustado: '0,4 segundos en élite' })[0]).toMatchObject({
      value: '0,4',
      unit: 'segundos',
    });
    expect(editionHighlights(null)).toEqual([]);
    expect(editionHighlights({ corredores: 300 })).toEqual([]);
  });
});

describe('numbersAvailable', () => {
  const sinHistorico: ValidaData = { ...data, historico: [], edicion2026: null };

  it('con solo las cifras históricas hay sección', () => {
    expect(numbersAvailable(data)).toBe(true);
  });

  it('sin históricas ni edición no hay nada que pintar, y una histórica en blanco no cuenta', () => {
    expect(numbersAvailable(sinHistorico)).toBe(false);
    expect(numbersAvailable({ ...sinHistorico, edicion2026: {} })).toBe(false);
    expect(numbersAvailable({ ...sinHistorico, historico: [data.historico[1]] })).toBe(false);
  });

  it('un solo dato de la edición basta, sea de los destacados o del listado', () => {
    expect(numbersAvailable({ ...sinHistorico, edicion2026: { municipios: 22 } })).toBe(true);
    expect(numbersAvailable({ ...sinHistorico, edicion2026: { clubes: 40 } })).toBe(true);
    expect(
      numbersAvailable({ ...sinHistorico, edicion2026: { finalMasAjustado: 'Foto finish' } }),
    ).toBe(true);
  });

  it('un total de corredores bajo el umbral no cuenta como dato (regla §8)', () => {
    expect(
      numbersAvailable({
        ...sinHistorico,
        totalMinimoPublicable: 228,
        edicion2026: { corredores: 214 },
      }),
    ).toBe(false);
    expect(
      numbersAvailable({
        ...sinHistorico,
        totalMinimoPublicable: 228,
        edicion2026: { corredores: 240 },
      }),
    ).toBe(true);
    expect(numbersAvailable({ ...sinHistorico, edicion2026: { corredores: 214 } })).toBe(true);
    // Con otra cifra al lado, el total oculto no quita la sección.
    expect(
      numbersAvailable({
        ...sinHistorico,
        totalMinimoPublicable: 228,
        edicion2026: { corredores: 214, municipios: 22 },
      }),
    ).toBe(true);
  });

  it('los bloques nuevos (ritmo, composición, municipios) también bastan', () => {
    const ritmo = { valor: 15, unidad: 'segundos por vuelta', titulo: 'Título', texto: 'Texto.' };
    expect(numbersAvailable({ ...sinHistorico, ritmo2026: ritmo })).toBe(true);
    expect(numbersAvailable({ ...sinHistorico, ritmo2026: { ...ritmo, texto: ' ' } })).toBe(false);
    expect(
      numbersAvailable({
        ...sinHistorico,
        composicion2026: { grupos: [{ grupo: 'Grupo Uno', edad: '4 y 5 años', n: 10 }] },
      }),
    ).toBe(true);
    expect(
      numbersAvailable({
        ...sinHistorico,
        composicion2026: { grupos: [{ grupo: 'Grupo Uno', n: 0 }] },
      }),
    ).toBe(false);
    expect(
      numbersAvailable({
        ...sinHistorico,
        municipios2026: { departamentos: [{ nombre: 'Depto Uno', municipios: ['Pueblo A'] }] },
      }),
    ).toBe(true);
    expect(
      numbersAvailable({
        ...sinHistorico,
        municipios2026: { departamentos: [{ nombre: 'Depto Uno', municipios: [] }] },
      }),
    ).toBe(false);
  });

  it('coincide con la cuenta que hace ValidaNumbers para pintarse, en todas las combinaciones', () => {
    // La cuenta del componente: históricas, o destacadas, o hechos que no van destacados.
    const sectionPaints = (d: ValidaData): boolean => {
      const highlights = editionHighlights(d.edicion2026);
      const highlighted = new Set(highlights.map((item) => item.id));
      const facts = editionFacts(d.edicion2026, { minRunners: d.totalMinimoPublicable }).filter(
        (fact) => !highlighted.has(fact.id),
      );
      return historicStats(d).length > 0 || highlights.length > 0 || facts.length > 0;
    };
    const editions: (Edition2026 | null)[] = [
      null,
      {},
      { corredores: 214 },
      { corredores: 240 },
      { municipios: 22 },
      { municipios: 22, departamentos: 4 },
      { ninosHasta12: 104 },
      { clubes: 40 },
      { categorias: 18 },
      { mujeres: 60 },
      { terminaron: 190 },
      { fieles33Volvieron: 21 },
      { podiosClub: 3 },
      { finalMasAjustado: '2 segundos en infantil A' },
      { finalMasAjustado: '  ' },
      { corredores: 214, municipios: 22 },
    ];
    for (const historico of [data.historico, [data.historico[1]], []]) {
      for (const totalMinimoPublicable of [undefined, null, 228]) {
        for (const edicion2026 of editions) {
          const candidate: ValidaData = { ...data, historico, totalMinimoPublicable, edicion2026 };
          expect(
            numbersAvailable(candidate),
            JSON.stringify({ historico: historico.length, totalMinimoPublicable, edicion2026 }),
          ).toBe(sectionPaints(candidate));
        }
      }
    }
  });
});

// ─── Metadatos ─────────────────────────────────────────────────────────────────

describe('pageMeta y publicación', () => {
  it('con fotos, el título vende las fotos; sin ellas, describe la válida', () => {
    const withPhotos = pageMeta(event, manifest, allies);
    expect(withPhotos.title).toBe('Fotos de la VI Válida Copa Valle 2026 en Yumbo');
    expect(withPhotos.description).toContain('5 fotos');
    expect(withPhotos.description).toContain('4 aliados');

    const without = pageMeta(event, emptyManifest, allies);
    expect(without.title).toBe('VI Válida Copa Valle 2026 en Yumbo: fotos y aliados');
    expect(without.description).toContain('Pista Carlos Castro de Yumbo');
  });

  it('título y descripción caben en lo que Google muestra, con y sin fotos', () => {
    for (const meta of [
      pageMeta(event, manifest, allies),
      pageMeta(event, emptyManifest, allies),
    ]) {
      expect(meta.title.length, meta.title).toBeLessThanOrEqual(TITLE_MAX);
      expect(meta.description.length, meta.description).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
    // Con cuatro cifras de fotos y dos de aliados sigue cabiendo.
    const big: PhotoManifest = {
      ...manifest,
      photos: Array.from({ length: 1500 }, (_, i) =>
        photo(`p-${i}`, 'manga-1', '2026-10-18T09:00:00'),
      ),
    };
    const many = Array.from({ length: 24 }, (_, i) => ({
      ...allies[0],
      id: `a-${i}`,
      name: `Aliado ${i}`,
    }));
    expect(pageMeta(event, big, many).description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });

  it('isPublished solo acepta true', () => {
    expect(isPublished(event)).toBe(false);
    expect(isPublished({ ...event, published: true })).toBe(true);
  });

  it('la fecha larga no se corre un día por la zona horaria', () => {
    expect(longDate('2026-10-18')).toBe('domingo, 18 de octubre de 2026');
  });
});

// ─── Apertura ──────────────────────────────────────────────────────────────────

describe('heroCopy', () => {
  it('con fotos, la apertura promete las fotos', () => {
    expect(heroCopy(event, 420)).toEqual({
      title: 'Tus fotos de la VI Válida en Yumbo',
      highlight: 'Tus fotos',
      lead: 'Gratis y en calidad original, ordenadas por categoría. Son del domingo 18 de octubre de 2026 en la Pista Carlos Castro, la casa del Club Deportivo Trocha y Ruta.',
      shareTitle: 'Fotos oficiales de la VI Válida Copa Valle 2026 · Yumbo',
    });
  });

  it('sin fotos, la apertura narra la jornada y resalta la ciudad', () => {
    expect(heroCopy(event, 0)).toEqual({
      title: 'Así se corrió la VI Válida en Yumbo',
      highlight: 'Yumbo',
      lead: 'El domingo 18 de octubre de 2026 la Copa Valle se corrió en la Pista Carlos Castro, la casa del Club Deportivo Trocha y Ruta. Aquí están los aliados que le apostaron a la válida y lo que dejó la jornada.',
      shareTitle: 'VI Válida Copa Valle 2026 · Yumbo',
    });
  });

  it('una sola foto ya es «con fotos»', () => {
    expect(heroCopy(event, 1).highlight).toBe('Tus fotos');
  });

  it('el resaltado es parte del titular, con o sin fotos', () => {
    for (const photos of [0, 1, 420]) {
      const copy = heroCopy(event, photos);
      expect(copy.title, copy.title).toContain(copy.highlight);
    }
  });

  it('la fecha entra en la frase sin la coma de la fecha larga', () => {
    expect(heroCopy(event, 10).lead).not.toContain('domingo,');
    expect(heroCopy(event, 0).lead).not.toContain('domingo,');
  });

  it('los textos salen del evento: otra edición, otra ciudad, otro anfitrión', () => {
    const other: ValidaEvent = {
      ...event,
      edition: 'VII Válida',
      date: '2027-10-17',
      host: 'Otro club',
      venue: { ...event.venue, city: 'Cali', shortName: 'Pista del Valle' },
    };
    const copy = heroCopy(other, 5);
    expect(copy.title).toBe('Tus fotos de la VII Válida en Cali');
    expect(copy.lead).toContain(
      'domingo 17 de octubre de 2027 en la Pista del Valle, la casa del Otro club',
    );
    expect(heroCopy(other, 0).highlight).toBe('Cali');
  });
});

// ─── Galería sin fotos ─────────────────────────────────────────────────────────

describe('galleryEmptyCopy', () => {
  it('promete las fotos para el día siguiente a la válida', () => {
    expect(galleryEmptyCopy('2026-10-18')).toEqual({
      title: 'Las fotos oficiales estarán aquí el lunes 19 de octubre',
      body: 'Gratis y en calidad original, agrupadas por categoría para que encuentres las tuyas en segundos.',
    });
  });

  it('el día siguiente cruza de mes y de año sin correrse', () => {
    expect(galleryEmptyCopy('2026-10-31').title).toBe(
      'Las fotos oficiales estarán aquí el domingo 1 de noviembre',
    );
    expect(galleryEmptyCopy('2026-12-31').title).toBe(
      'Las fotos oficiales estarán aquí el viernes 1 de enero',
    );
  });

  it('sigue al JSON: otra fecha de la válida, otro día en el texto', () => {
    expect(galleryEmptyCopy('2027-10-17').title).toBe(
      'Las fotos oficiales estarán aquí el lunes 18 de octubre',
    );
  });
});

// ─── Resumen de la jornada ─────────────────────────────────────────────────────

describe('recapCards y recapLead', () => {
  const full = {
    resultsUrl: 'https://resultados.test/valida',
    organizer: 'Comisión Vallecaucana de Ciclomontañismo',
    chronicleId: 'cronica-valida-yumbo',
    album: { id: 'valida-yumbo', imageCount: 24 },
  };
  const none = { resultsUrl: null, organizer: full.organizer, chronicleId: null, album: null };

  // Las tarjetas que salen de pedir solo algunas, por el mismo camino de la página.
  const pick = (keys: RecapKey[]) =>
    recapCards({
      ...none,
      resultsUrl: keys.includes('resultados') ? full.resultsUrl : null,
      chronicleId: keys.includes('cronica') ? full.chronicleId : null,
      album: keys.includes('album') ? full.album : null,
    });

  it('arma resultados, crónica y álbum, en ese orden', () => {
    const cards = recapCards(full);
    expect(cards.map((card) => card.key)).toEqual(['resultados', 'cronica', 'album']);
    expect(cards.map((card) => card.href)).toEqual([
      'https://resultados.test/valida',
      '/noticias/cronica-valida-yumbo',
      '/galeria/valida-yumbo',
    ]);
    expect(cards.map((card) => card.title)).toEqual([
      'Resultados oficiales',
      'La crónica de la jornada',
      'El álbum del club',
    ]);
  });

  it('el título es un sustantivo y el botón un verbo: la banda de una sola tarjeta no repite', () => {
    const [results, chronicle, album] = recapCards(full);
    for (const card of [results, chronicle, album]) expect(card.title).not.toBe(card.cta);
    expect(chronicle).toMatchObject({
      description: 'Publicada por el club.',
      cta: 'Leer la crónica',
    });
    expect(album).toMatchObject({ cta: 'Ver el álbum' });
  });

  it('solo los resultados salen del sitio, y solo ellos emiten evento de GA4', () => {
    const [results, chronicle, album] = recapCards(full);
    expect(results).toMatchObject({
      external: true,
      event: 'race_results_click',
      contentId: 'resultados-oficiales',
      description:
        'Las posiciones de la jornada. Fuente: Comisión Vallecaucana de Ciclomontañismo.',
    });
    for (const card of [chronicle, album]) {
      expect(card.external).toBe(false);
      expect(card.event).toBeUndefined();
      expect(card.contentId).toBeUndefined();
    }
  });

  it('lo que no existe no se pinta', () => {
    expect(recapCards(none)).toEqual([]);
    expect(pick(['cronica', 'album']).map((card) => card.key)).toEqual(['cronica', 'album']);
    expect(pick(['resultados', 'album']).map((card) => card.key)).toEqual(['resultados', 'album']);
    expect(pick(['cronica']).map((card) => card.key)).toEqual(['cronica']);
  });

  it('un enlace vacío no es un enlace', () => {
    expect(recapCards({ ...none, resultsUrl: '', chronicleId: '' })).toEqual([]);
  });

  it('el álbum cuenta sus fotos en singular y plural, o no las cuenta si no trae', () => {
    const describeAlbum = (imageCount: number) =>
      recapCards({ ...none, album: { id: 'a', imageCount } })[0].description;
    expect(describeAlbum(24)).toBe('24 fotos en la galería del club.');
    expect(describeAlbum(1)).toBe('1 foto en la galería del club.');
    expect(describeAlbum(0)).toBe('En la galería del club.');
  });

  it('la bajada nombra lo que hay, en cada combinación de dos o tres tarjetas', () => {
    const cases: [RecapKey[], string][] = [
      [
        ['resultados', 'cronica', 'album'],
        'Aquí están los resultados oficiales, la crónica del club y el álbum de la jornada.',
      ],
      [['resultados', 'cronica'], 'Aquí están los resultados oficiales y la crónica del club.'],
      [['resultados', 'album'], 'Aquí están los resultados oficiales y el álbum de la jornada.'],
      [['cronica', 'album'], 'Aquí están la crónica del club y el álbum de la jornada.'],
    ];
    for (const [keys, lead] of cases) {
      expect(recapLead(pick(keys)), keys.join('+')).toBe(lead);
    }
  });

  it('con una sola tarjeta no hay bajada: la página pinta una banda que se explica sola', () => {
    for (const key of ['resultados', 'cronica', 'album'] as RecapKey[]) {
      expect(recapLead(pick([key])), key).toBe('');
    }
  });

  it('sin tarjetas no hay sección: la bajada va vacía en vez de «Aquí están .»', () => {
    expect(recapLead([])).toBe('');
  });
});

// ─── Índice flotante ───────────────────────────────────────────────────────────

describe('dockItems', () => {
  const all = {
    totalPhotos: 420,
    allyCount: 16,
    recapCount: 3,
    data,
    trackCount: 5,
    hasNextStop: true,
  };
  const ids = (input: Parameters<typeof dockItems>[0]) => dockItems(input).map((item) => item.id);

  it('una entrada por sección, en el orden de la página', () => {
    expect(dockItems(all)).toEqual([
      { id: 'fotos', label: 'Fotos', icon: 'ph:camera-bold', count: 420 },
      { id: 'aliados', label: 'Aliados', icon: 'ph:handshake-bold', count: 16 },
      { id: 'cifras', label: 'Cifras', icon: 'ph:chart-bar-bold' },
      { id: 'resultados', label: 'Resultados', icon: 'ph:trophy-bold' },
      { id: 'la-pista', label: 'La pista', icon: 'ph:map-pin-bold' },
      {
        id: 'siguiente',
        label: 'Próxima válida',
        shortLabel: 'Próxima',
        icon: 'ph:flag-checkered-bold',
      },
    ]);
  });

  it('«Fotos» se queda sin fotos (la galería pinta su estado vacío), pero sin cifra', () => {
    const photos = dockItems({ ...all, totalPhotos: 0 }).find((item) => item.id === 'fotos');
    expect(photos).toEqual({ id: 'fotos', label: 'Fotos', icon: 'ph:camera-bold', count: null });
  });

  it('cada sección que no se pinta quita su entrada', () => {
    expect(ids({ ...all, allyCount: 0 })).toEqual([
      'fotos',
      'cifras',
      'resultados',
      'la-pista',
      'siguiente',
    ]);
    expect(ids({ ...all, recapCount: 0 })).toEqual([
      'fotos',
      'aliados',
      'cifras',
      'la-pista',
      'siguiente',
    ]);
    expect(ids({ ...all, trackCount: 0 })).toEqual([
      'fotos',
      'aliados',
      'cifras',
      'resultados',
      'siguiente',
    ]);
    expect(ids({ ...all, data: { ...data, historico: [], edicion2026: null } })).toEqual([
      'fotos',
      'aliados',
      'resultados',
      'la-pista',
      'siguiente',
    ]);
  });

  it('«Cifras» sigue a numbersAvailable: un dato de la edición la trae aunque no haya históricas', () => {
    const onlyEdition: ValidaData = { ...data, historico: [], edicion2026: { municipios: 22 } };
    expect(numbersAvailable(onlyEdition)).toBe(true);
    expect(ids({ ...all, data: onlyEdition })).toContain('cifras');
    const hidden: ValidaData = {
      ...data,
      historico: [],
      totalMinimoPublicable: 228,
      edicion2026: { corredores: 214 },
    };
    expect(numbersAvailable(hidden)).toBe(false);
    expect(ids({ ...all, data: hidden })).not.toContain('cifras');
  });

  it('sin próxima parada, el cierre es la clase de prueba', () => {
    const last = dockItems({ ...all, hasNextStop: false }).at(-1);
    expect(last).toEqual({
      id: 'siguiente',
      label: 'Clase de prueba',
      shortLabel: 'Clase gratis',
      icon: 'ph:bicycle-bold',
    });
  });

  it('solo el cierre lleva etiqueta corta, y siempre más corta que la completa', () => {
    for (const hasNextStop of [true, false]) {
      for (const item of dockItems({ ...all, hasNextStop })) {
        if (item.id === 'siguiente') {
          expect(item.shortLabel, item.label).toBeTruthy();
          expect(item.shortLabel!.length).toBeLessThan(item.label.length);
        } else {
          expect(item.shortLabel, item.id).toBeUndefined();
        }
      }
    }
  });

  it('con lo mínimo quedan «Fotos» y el cierre: las dos que el índice necesita para pintarse', () => {
    const minimal = {
      totalPhotos: 0,
      allyCount: 0,
      recapCount: 0,
      data: { ...data, historico: [], edicion2026: null },
      trackCount: 0,
      hasNextStop: false,
    };
    expect(ids(minimal)).toEqual(['fotos', 'siguiente']);
  });

  it('solo «Fotos» y «Aliados» llevan cifra, y nunca una cifra en cero', () => {
    for (const item of dockItems(all)) {
      if (item.id === 'fotos' || item.id === 'aliados') expect(item.count).toBeGreaterThan(0);
      else expect(item.count).toBeUndefined();
    }
  });
});

// ─── Mejores promedios por vuelta ──────────────────────────────────────────────

describe('formatClock', () => {
  it('formatea M:SS y H:MM:SS, redondeando al segundo', () => {
    expect(formatClock(762)).toBe('12:42');
    expect(formatClock(4575)).toBe('1:16:15');
    expect(formatClock(16.4)).toBe('0:16');
    expect(formatClock(59.6)).toBe('1:00');
  });
});

describe('lapRanking', () => {
  const lapData: Vueltas2026 = {
    source: 'Datos de prueba',
    categorias: [
      { code: 'A', label: 'Categoría A', vueltas: 6 },
      { code: 'B', label: 'Categoría B', vueltas: 2 },
      { code: 'C', label: 'Categoría C', vueltas: 3 },
    ],
    tiempos: [
      { categoria: 'A', puesto: 1, tiempo: '1:16:15', nombre: 'Ana Prueba' }, // 762.5 s/vuelta
      { categoria: 'B', puesto: 1, tiempo: '0:25:00', nombre: 'Beto Ejemplo' }, // 750 s/vuelta
      { categoria: 'C', puesto: 3, tiempo: '0:40:00' }, // 800 s/vuelta, sin nombre
      { categoria: 'ZZ', puesto: 1, tiempo: '0:01:00', nombre: 'Fuera Categoría' },
    ],
  };

  it('ordena por promedio por vuelta entre categorías con distintas vueltas', () => {
    const rows = lapRanking(lapData);
    expect(rows.map((row) => row.categoryLabel)).toEqual([
      'Categoría B',
      'Categoría A',
      'Categoría C',
    ]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);
    expect(rows[0]).toMatchObject({ laps: 2, perLap: '12:30', total: '25:00', position: 1 });
    expect(rows[1]).toMatchObject({ laps: 6, perLap: '12:43', total: '1:16:15' });
  });

  it('ignora las categorías desconocidas', () => {
    expect(lapRanking(lapData).some((row) => row.categoryLabel === 'ZZ')).toBe(false);
    expect(lapRanking(lapData)).toHaveLength(3);
  });

  it('respeta el límite', () => {
    expect(lapRanking(lapData, 2)).toHaveLength(2);
    expect(lapRanking(lapData, 0)).toEqual([]);
  });

  it('la diferencia es por vuelta, con guion en el primero', () => {
    const rows = lapRanking(lapData);
    expect(rows[0].gap).toBe('—');
    expect(rows[0].gapToFirstSeconds).toBe(0);
    expect(rows[1].gap).toBe('+0:13');
    expect(rows[2].gap).toBe('+0:50');
  });

  it('la diferencia cuadra con los promedios que se muestran', () => {
    // 1:16:15 / 6 = 12:42,5 → 12:43 y 51:53 / 4 = 12:58,25 → 12:58: la resta
    // de lo que se lee es 0:15 (sin redondear serían 15,75 s → «0:16»).
    const [first, second] = lapRanking({
      source: 'x',
      categorias: [
        { code: 'E', label: 'E', vueltas: 6 },
        { code: 'P', label: 'P', vueltas: 4 },
      ],
      tiempos: [
        { categoria: 'E', puesto: 1, tiempo: '1:16:15' },
        { categoria: 'P', puesto: 1, tiempo: '0:51:53' },
      ],
    });
    expect([first.perLap, second.perLap]).toEqual(['12:43', '12:58']);
    expect(second.gap).toBe('+0:15');
  });

  it('sin nombre devuelve null', () => {
    const rows = lapRanking(lapData);
    expect(rows[0].name).toBe('Beto Ejemplo');
    expect(rows[2].name).toBeNull();
  });

  it('el empate en promedio lo decide el menor tiempo total y luego el orden de categorías', () => {
    const tie = lapRanking({
      source: 'x',
      categorias: [
        { code: 'A', label: 'A', vueltas: 2 },
        { code: 'B', label: 'B', vueltas: 4 },
        { code: 'C', label: 'C', vueltas: 4 },
      ],
      tiempos: [
        { categoria: 'B', puesto: 1, tiempo: '0:40:00' },
        { categoria: 'A', puesto: 1, tiempo: '0:20:00' },
        { categoria: 'C', puesto: 1, tiempo: '0:40:00' },
      ],
    });
    expect(tie.map((row) => row.categoryLabel)).toEqual(['A', 'B', 'C']);
  });

  describe('solo las categorías femeninas', () => {
    const womenData: Vueltas2026 = {
      source: 'Datos de prueba',
      categorias: [
        { code: 'M', label: 'Mixta Uno', vueltas: 4 },
        { code: 'F1', label: 'Femenina Uno', vueltas: 3, femenina: true },
        { code: 'F2', label: 'Femenina Dos', vueltas: 2, femenina: true },
        { code: 'F3', label: 'Femenina Tres', vueltas: 2, femenina: false },
      ],
      tiempos: [
        { categoria: 'M', puesto: 1, tiempo: '0:40:00' }, // 600 s/vuelta, la mejor general
        { categoria: 'F1', puesto: 1, tiempo: '0:36:00' }, // 720 s/vuelta
        { categoria: 'F1', puesto: 2, tiempo: '0:37:30' }, // 750
        { categoria: 'F2', puesto: 1, tiempo: '0:24:10' }, // 725 s/vuelta
        { categoria: 'F3', puesto: 1, tiempo: '0:20:00' }, // 600, pero no es femenina
      ],
    };

    it('deja fuera las que no llevan la marca y ordena el resto igual', () => {
      const rows = lapRanking(womenData, 10, { onlyFemale: true });
      expect(rows.map((row) => `${row.categoryLabel} ${row.position}`)).toEqual([
        'Femenina Uno 1',
        'Femenina Dos 1',
        'Femenina Uno 2',
      ]);
      expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);
    });

    it('la diferencia se mide contra la primera de ellas, no contra la general', () => {
      const rows = lapRanking(womenData, 10, { onlyFemale: true });
      expect(rows[0].gap).toBe('—');
      expect(rows[1].gap).toBe('+0:05');
      expect(rows[2].gap).toBe('+0:30');
      // La general sigue midiendo contra la mejor de todas.
      expect(lapRanking(womenData, 10)[1].gap).toBe('+0:00');
    });

    it('sin la opción no filtra, y sin categorías femeninas queda vacío', () => {
      expect(lapRanking(womenData, 10, {})).toHaveLength(5);
      expect(lapRanking(lapData, 10, { onlyFemale: true })).toEqual([]);
    });

    it('respeta el límite sobre la lista filtrada', () => {
      expect(lapRanking(womenData, 2, { onlyFemale: true })).toHaveLength(2);
    });
  });

  it('sin datos devuelve una lista vacía', () => {
    expect(lapRanking(null)).toEqual([]);
    expect(lapRanking(undefined)).toEqual([]);
    expect(lapRanking({ source: 'x', categorias: [], tiempos: [] })).toEqual([]);
  });
});

describe('recapCards: clasificación general', () => {
  const base = {
    resultsUrl: 'https://resultados.test/valida',
    generalUrl: 'https://resultados.test/general',
    organizer: 'Comisión X',
    chronicleId: null,
    album: null,
  };

  it('va justo después de los resultados oficiales y sale del sitio con su evento', () => {
    const cards = recapCards(base);
    expect(cards.map((card) => card.key)).toEqual(['resultados', 'general']);
    expect(cards[1]).toMatchObject({
      icon: 'ph:ranking-bold',
      title: 'Clasificación general',
      cta: 'Ver la general',
      href: 'https://resultados.test/general',
      external: true,
      event: 'race_results_click',
      contentId: 'clasificacion-general',
      description: 'La general de la Copa Valle después de esta válida. Fuente: Comisión X.',
    });
  });

  it('sin enlace no hay tarjeta, y la bajada la nombra', () => {
    expect(recapCards({ ...base, generalUrl: null }).map((card) => card.key)).toEqual([
      'resultados',
    ]);
    expect(recapLead(recapCards(base))).toBe(
      'Aquí están los resultados oficiales y la clasificación general.',
    );
  });
});

// ─── Ritmo, composición y procedencia ──────────────────────────────────────────

describe('ritmoAvailable', () => {
  const base = { valor: 15, unidad: 'segundos por vuelta', titulo: 'Título', texto: 'Texto.' };

  it('pide unidad, titular y texto con contenido', () => {
    expect(ritmoAvailable(base)).toBe(true);
    expect(ritmoAvailable({ ...base, unidad: ' ' })).toBe(false);
    expect(ritmoAvailable({ ...base, titulo: '' })).toBe(false);
    expect(ritmoAvailable({ ...base, texto: '' })).toBe(false);
    expect(ritmoAvailable(null)).toBe(false);
    expect(ritmoAvailable(undefined)).toBe(false);
  });
});

describe('compositionGroups', () => {
  it('escala común desde cero: el mayor llena el 100 % y las demás son proporcionales', () => {
    const bars = compositionGroups({
      grupos: [
        { grupo: 'Grupo Uno', edad: '4 y 5 años', n: 20 },
        { grupo: 'Grupo Dos', edad: '', n: 50 },
        { grupo: 'Grupo Tres', n: 10 },
      ],
    });
    expect(bars.map((bar) => bar.percent)).toEqual([40, 100, 20]);
    expect(bars.map((bar) => bar.age)).toEqual(['4 y 5 años', '', '']);
    expect(bars.map((bar) => bar.n)).toEqual([20, 50, 10]);
  });

  it('omite los grupos en cero o sin nombre y sin datos devuelve vacío', () => {
    expect(
      compositionGroups({
        grupos: [
          { grupo: 'Grupo Uno', n: 0 },
          { grupo: ' ', n: 5 },
        ],
      }),
    ).toEqual([]);
    expect(compositionGroups(null)).toEqual([]);
    expect(compositionGroups(undefined)).toEqual([]);
  });
});

describe('municipalityLegend', () => {
  const places = {
    departamentos: [
      { nombre: 'Depto Uno', municipios: ['Pueblo A', 'Pueblo B'] },
      { nombre: 'Depto Vacío', municipios: [] },
      { nombre: 'Depto Dos', municipios: ['Pueblo C'] },
    ],
  };

  it('numera como los marcadores (por posición), omite los vacíos y dice «1 municipio» en singular', () => {
    const legend = municipalityLegend(places);
    expect(legend.map((item) => [item.number, item.name, item.countLabel])).toEqual([
      [1, 'Depto Uno', '2 municipios'],
      [3, 'Depto Dos', '1 municipio'],
    ]);
    expect(legend[0].municipalities).toEqual(['Pueblo A', 'Pueblo B']);
  });

  it('el total suma todos los municipios y sin datos es cero', () => {
    expect(municipalityTotal(places)).toBe(3);
    expect(municipalityTotal(null)).toBe(0);
    expect(municipalityLegend(undefined)).toEqual([]);
  });
});

describe('folderKey y assignGroupByFolder', () => {
  const folders = {
    'teteros sin pedales': 'manga-1',
    'preinfantil a femenino': 'manga-2',
    extras: 'previa',
    inexistente: 'manga-99',
  };

  it('normaliza el nombre de carpeta: sin número, sin tildes, en minúsculas', () => {
    expect(folderKey('1402 - TETEROS SIN PEDALES')).toBe('teteros sin pedales');
    expect(folderKey('1ER TANDA DE PREMIACIÓN')).toBe('1er tanda de premiacion');
    expect(folderKey('EXTRAS')).toBe('extras');
  });

  it('asigna por la primera carpeta de la ruta, no por el nombre del archivo', () => {
    expect(assignGroupByFolder('1402 - TETEROS SIN PEDALES/DSC_0015.jpg', folders, schedule)).toBe(
      'manga-1',
    );
    expect(
      assignGroupByFolder('303 - PREINFANTIL A FEMENINO/IMG_5230.jpg', folders, schedule),
    ).toBe('manga-2');
    expect(assignGroupByFolder('EXTRAS/DSC_0027-2.jpg', folders, schedule)).toBe('previa');
  });

  it('devuelve null si la carpeta no está en el mapa o apunta a un grupo inexistente', () => {
    expect(assignGroupByFolder('999 - OTRA/IMG_1.jpg', folders, schedule)).toBeNull();
    expect(assignGroupByFolder('INEXISTENTE/IMG_1.jpg', folders, schedule)).toBeNull();
    expect(assignGroupByFolder('IMG_1.jpg', folders, schedule)).toBeNull();
  });
});
