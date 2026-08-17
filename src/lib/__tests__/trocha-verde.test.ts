import { describe, it, expect } from 'vitest';
import * as TrochaVerdeLib from '../trocha-verde';
import {
  isRecycledTireProtector,
  summarizeTrees,
  summarizeRecycling,
  buildCategoryComposition,
  buildSpeciesInventory,
  summarizeDonors,
  buildPlantingTimeline,
  groupTreesByPlantingDate,
  checkMapReadiness,
  MIN_GEOLOCATED_TREES_FOR_MAP,
  type TreeInput,
} from '../trocha-verde';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

// Un puñado representativo del inventario real: mezcla protectores, categorías,
// padrinos y fechas de siembra repartidas en varias semanas.
const arbol = (overrides: Partial<TreeInput> = {}): TreeInput => ({
  species: 'Chambimbe',
  scientificName: 'Sapindus saponaria',
  category: 'nativo',
  protector: 'llanta-bicicleta',
  plantedDate: at('2026-04-01'),
  image: '/images/trocha-verde/chambimbe.webp',
  imageAlt: 'Árbol de Chambimbe',
  ...overrides,
});

// ============================================================
// summarizeTrees
// ============================================================

describe('summarizeTrees', () => {
  it('cuenta árboles, especies distintas y llantas recicladas', () => {
    const trees = [
      arbol({ species: 'Chambimbe', scientificName: 'Sapindus saponaria', protector: 'llanta-bicicleta' }),
      arbol({ species: 'Ixora', scientificName: 'Ixora coccinea', protector: 'llanta-moto' }),
      arbol({ species: 'Guayacán', scientificName: 'Handroanthus chrysanthus', protector: 'otro' }),
    ];
    const stats = summarizeTrees(trees);
    expect(stats.totalTrees).toBe(3);
    expect(stats.totalSpecies).toBe(3);
    expect(stats.totalRecycled).toBe(2);
  });

  it('agrupa la misma especie por nombre científico sin distinguir mayúsculas', () => {
    const trees = [
      arbol({ scientificName: 'Ixora coccinea' }),
      arbol({ scientificName: 'IXORA COCCINEA' }),
    ];
    expect(summarizeTrees(trees).totalSpecies).toBe(1);
  });

  it('usa el nombre común cuando no hay nombre científico', () => {
    const trees = [
      arbol({ species: 'Millonaria', scientificName: undefined }),
      arbol({ species: 'Millonaria', scientificName: undefined }),
    ];
    expect(summarizeTrees(trees).totalSpecies).toBe(1);
  });

  it('no se cae sin árboles', () => {
    expect(summarizeTrees([])).toEqual({ totalTrees: 0, totalSpecies: 0, totalRecycled: 0 });
  });

  it('no expone ninguna cifra de CO2 ni de área estimada', () => {
    const stats = summarizeTrees([arbol()]);
    expect(stats).not.toHaveProperty('co2ProjectedKg');
    expect(stats).not.toHaveProperty('areaM2');
  });
});

// ============================================================
// Reciclaje de llantas
// ============================================================

describe('isRecycledTireProtector', () => {
  it('reconoce llanta de bicicleta y de moto como reciclaje', () => {
    expect(isRecycledTireProtector('llanta-bicicleta')).toBe(true);
    expect(isRecycledTireProtector('llanta-moto')).toBe(true);
  });

  it('no cuenta piedras ni otro como llanta reciclada', () => {
    expect(isRecycledTireProtector('piedras')).toBe(false);
    expect(isRecycledTireProtector('otro')).toBe(false);
  });
});

describe('summarizeRecycling', () => {
  // La proporción real del club: 71 llanta-bicicleta, 1 llanta-moto, 5 otro.
  const inventario = [
    ...Array.from({ length: 71 }, () => ({ protector: 'llanta-bicicleta' })),
    { protector: 'llanta-moto' },
    ...Array.from({ length: 5 }, () => ({ protector: 'otro' })),
  ];

  it('distingue la llanta de bicicleta del resto de llantas recicladas', () => {
    const summary = summarizeRecycling(inventario);
    expect(summary.total).toBe(77);
    expect(summary.bicycleTireCount).toBe(71);
    expect(summary.tireCount).toBe(72);
  });

  it('redondea el porcentaje sobre el total', () => {
    expect(summarizeRecycling(inventario).tirePct).toBe(94); // 72/77 ≈ 93.5%
  });

  it('no se cae sin árboles', () => {
    expect(summarizeRecycling([])).toEqual({ total: 0, bicycleTireCount: 0, tireCount: 0, tirePct: 0 });
  });
});

// ============================================================
// Composición por categoría
// ============================================================

describe('buildCategoryComposition', () => {
  // La composición real: 36 ornamental, 22 frutal, 17 nativo, 2 maderable (77).
  const bosque = [
    ...Array.from({ length: 36 }, () => ({ category: 'ornamental' })),
    ...Array.from({ length: 22 }, () => ({ category: 'frutal' })),
    ...Array.from({ length: 17 }, () => ({ category: 'nativo' })),
    ...Array.from({ length: 2 }, () => ({ category: 'maderable' })),
  ];

  it('cuenta cada categoría y ordena de mayor a menor', () => {
    const composition = buildCategoryComposition(bosque);
    expect(composition.map((c) => c.category)).toEqual(['ornamental', 'frutal', 'nativo', 'maderable']);
    expect(composition.map((c) => c.count)).toEqual([36, 22, 17, 2]);
  });

  it('deriva el porcentaje de cada categoría sobre el total', () => {
    const composition = buildCategoryComposition(bosque);
    const maderable = composition.find((c) => c.category === 'maderable');
    expect(maderable?.pct).toBeCloseTo((2 / 77) * 100, 1);
  });

  it('no se cae sin árboles', () => {
    expect(buildCategoryComposition([])).toEqual([]);
  });
});

// ============================================================
// Inventario por especie
// ============================================================

describe('buildSpeciesInventory', () => {
  const trees = [
    arbol({ species: 'Ixora', scientificName: 'Ixora coccinea', category: 'ornamental', image: 'a.webp', imageAlt: 'a' }),
    arbol({ species: 'Ixora', scientificName: 'Ixora coccinea', category: 'ornamental', image: 'b.webp', imageAlt: 'b' }),
    arbol({ species: 'Ébano', scientificName: 'Albizia guachapele', category: 'nativo' }),
    arbol({ species: 'Guayacán', scientificName: 'Handroanthus chrysanthus', category: 'nativo' }),
  ];

  it('agrupa por especie y cuenta los ejemplares', () => {
    const inventory = buildSpeciesInventory(trees);
    const ixora = inventory.find((s) => s.commonName === 'Ixora');
    expect(ixora?.count).toBe(2);
  });

  it('usa la miniatura del primer ejemplar registrado', () => {
    const ixora = buildSpeciesInventory(trees).find((s) => s.commonName === 'Ixora');
    expect(ixora?.thumbnail).toBe('a.webp');
  });

  it('ordena alfabéticamente en español, tildes incluidas', () => {
    const names = buildSpeciesInventory(trees).map((s) => s.commonName);
    expect(names).toEqual(['Ébano', 'Guayacán', 'Ixora']);
  });

  it('no se cae sin árboles', () => {
    expect(buildSpeciesInventory([])).toEqual([]);
  });
});

// ============================================================
// Padrinos
// ============================================================

describe('summarizeDonors', () => {
  const trees = [
    arbol({ donor: 'Helmut Ortiz (Presidente del Club)' }),
    arbol({ donor: 'Helmut Ortiz (Presidente del Club)' }),
    arbol({ donor: 'Sra. Olga Hernández (abuela de Kevin Parea)' }),
    arbol({ donor: undefined }),
  ];

  it('cuenta cuántos árboles tienen padrino', () => {
    expect(summarizeDonors(trees).sponsoredTrees).toBe(3);
    expect(summarizeDonors(trees).total).toBe(4);
  });

  it('redondea el porcentaje con padrino', () => {
    expect(summarizeDonors(trees).pct).toBe(75);
  });

  it('agrupa por padrino y ordena de más a menos árboles', () => {
    const { donors } = summarizeDonors(trees);
    expect(donors[0]).toEqual({ name: 'Helmut Ortiz (Presidente del Club)', count: 2 });
    expect(donors[1]).toEqual({ name: 'Sra. Olga Hernández (abuela de Kevin Parea)', count: 1 });
  });

  it('deja fuera los árboles sin padrino registrado', () => {
    const { donors } = summarizeDonors(trees);
    const total = donors.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(3);
  });

  it('no se cae sin árboles', () => {
    expect(summarizeDonors([])).toEqual({ total: 0, sponsoredTrees: 0, pct: 0, donors: [] });
  });
});

// ============================================================
// Ritmo de siembra
// ============================================================

describe('buildPlantingTimeline', () => {
  it('devuelve null sin árboles: no se dibuja un recorrido vacío', () => {
    expect(buildPlantingTimeline([])).toBeNull();
  });

  it('agrupa por jornada y acumula en orden cronológico, sin importar el orden de entrada', () => {
    const trees = [
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-01') }),
      arbol({ plantedDate: at('2026-01-01') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
    ];

    const timeline = buildPlantingTimeline(trees)!;
    expect(timeline.total).toBe(10);
    expect(timeline.stops.map((s) => s.dateKey)).toEqual(['2026-01-01', '2026-01-08', '2026-01-22']);
    expect(timeline.stops.map((s) => s.count)).toEqual([2, 3, 5]);
    expect(timeline.stops.map((s) => s.cumulative)).toEqual([2, 5, 10]);
  });

  it('calcula el tramo real: del 1 al 22 de enero son 21 días, 3 semanas', () => {
    const trees = [
      arbol({ plantedDate: at('2026-01-01') }),
      arbol({ plantedDate: at('2026-01-01') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-08') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
      arbol({ plantedDate: at('2026-01-22') }),
    ];

    const timeline = buildPlantingTimeline(trees)!;
    expect(timeline.totalDays).toBe(21);
    expect(timeline.totalWeeks).toBe(3);
    expect(timeline.averagePerWeek).toBe(3.3); // 10 árboles / 3 semanas
  });

  it('ubica cada parada según el tiempo transcurrido, no según su índice', () => {
    const trees = [
      arbol({ plantedDate: at('2026-01-01') }),
      arbol({ plantedDate: at('2026-01-08') }), // una semana después: a un tercio del tramo
      arbol({ plantedDate: at('2026-01-22') }), // tres semanas después: el final
    ];

    const [first, second, last] = buildPlantingTimeline(trees)!.stops;
    expect(first.xPct).toBe(0);
    expect(second.xPct).toBe(33.3);
    expect(last.xPct).toBe(100);
  });

  it('la última parada siempre cierra en el 100% acumulado', () => {
    const trees = [
      arbol({ plantedDate: at('2026-03-15') }),
      arbol({ plantedDate: at('2026-04-01') }),
      arbol({ plantedDate: at('2026-05-18') }),
    ];
    const stops = buildPlantingTimeline(trees)!.stops;
    expect(stops[stops.length - 1].cumulativePct).toBe(100);
  });

  it('rotula cada parada con día y mes en español', () => {
    const trees = [arbol({ plantedDate: at('2026-03-15') }), arbol({ plantedDate: at('2026-05-18') })];
    const stops = buildPlantingTimeline(trees)!.stops;
    expect(stops[0]).toMatchObject({ day: '15', month: 'mar' });
    expect(stops[1]).toMatchObject({ day: '18', month: 'may' });
  });

  it('no se cae cuando toda la siembra fue el mismo día', () => {
    const trees = [
      arbol({ plantedDate: at('2026-06-01') }),
      arbol({ plantedDate: at('2026-06-01') }),
      arbol({ plantedDate: at('2026-06-01') }),
    ];
    const timeline = buildPlantingTimeline(trees)!;
    expect(timeline.totalDays).toBe(0);
    expect(timeline.totalWeeks).toBe(1); // nunca cero, para no dividir entre nada
    expect(timeline.stops).toHaveLength(1);
    expect(timeline.stops[0]).toMatchObject({ xPct: 0, cumulativePct: 100 });
  });

  it('refleja el tramo real del club: 77 árboles del 15 de marzo al 18 de mayo, ~9 semanas', () => {
    const fechas = [
      ['2026-03-15', 2],
      ['2026-04-01', 5],
      ['2026-04-04', 7],
      ['2026-04-09', 3],
      ['2026-04-22', 24],
      ['2026-05-03', 27],
      ['2026-05-18', 9],
    ] as const;
    const trees = fechas.flatMap(([fecha, cantidad]) =>
      Array.from({ length: cantidad }, () => arbol({ plantedDate: at(fecha) }))
    );

    const timeline = buildPlantingTimeline(trees)!;
    expect(timeline.total).toBe(77);
    expect(timeline.stops).toHaveLength(7);
    expect(timeline.totalWeeks).toBe(9);
  });
});

// ============================================================
// Jornadas (agrupación genérica por fecha)
// ============================================================

describe('groupTreesByPlantingDate', () => {
  const entrada = (id: string, fecha: string) => ({ id, data: { plantedDate: at(fecha) } });

  it('agrupa por día y ordena cronológicamente sin importar el orden de entrada', () => {
    const grupos = groupTreesByPlantingDate([
      entrada('c', '2026-05-03'),
      entrada('a', '2026-03-15'),
      entrada('b', '2026-04-01'),
    ]);
    expect(grupos.map((g) => g.dateKey)).toEqual(['2026-03-15', '2026-04-01', '2026-05-03']);
  });

  it('conserva todos los árboles de la misma jornada en el mismo grupo', () => {
    const grupos = groupTreesByPlantingDate([
      entrada('a', '2026-04-01'),
      entrada('b', '2026-04-01'),
      entrada('c', '2026-04-09'),
    ]);
    expect(grupos[0].trees.map((t) => t.id)).toEqual(['a', 'b']);
    expect(grupos[1].trees.map((t) => t.id)).toEqual(['c']);
  });

  it('no se cae sin árboles', () => {
    expect(groupTreesByPlantingDate([])).toEqual([]);
  });
});

// ============================================================
// Umbral del mapa
// ============================================================

describe('checkMapReadiness', () => {
  it('cuenta solo los árboles con latitud y longitud completas', () => {
    const trees = [
      { lat: 3.59, lng: -76.48 },
      { lat: 3.6 }, // sin lng: no cuenta
      {},
    ];
    expect(checkMapReadiness(trees).geolocated).toBe(1);
  });

  it('con los datos de hoy del club (2 de 77) el mapa no está listo', () => {
    const trees = [
      { lat: 3.59, lng: -76.48 },
      { lat: 3.6, lng: -76.49 },
      ...Array.from({ length: 75 }, () => ({})),
    ];
    const readiness = checkMapReadiness(trees);
    expect(readiness.geolocated).toBe(2);
    expect(readiness.total).toBe(77);
    expect(readiness.ready).toBe(false);
  });

  it('está listo justo al alcanzar el umbral, no antes', () => {
    const debajo = Array.from({ length: MIN_GEOLOCATED_TREES_FOR_MAP - 1 }, () => ({ lat: 1, lng: 1 }));
    const enElUmbral = Array.from({ length: MIN_GEOLOCATED_TREES_FOR_MAP }, () => ({ lat: 1, lng: 1 }));
    expect(checkMapReadiness(debajo).ready).toBe(false);
    expect(checkMapReadiness(enElUmbral).ready).toBe(true);
  });
});

// ============================================================
// Guardas de la migración: ninguna cifra inventada
// ============================================================

describe('sin CO2 ni área estimada en todo el módulo', () => {
  it('el archivo no exporta ninguna función ni constante relacionada con CO2 o área', () => {
    const keys = Object.keys(TrochaVerdeLib).map((k) => k.toLowerCase());
    expect(keys.some((k) => k.includes('co2'))).toBe(false);
    expect(keys.some((k) => k.includes('area'))).toBe(false);
  });

  it('TreeStats de getTreeStats no trae co2ProjectedKg ni areaM2', () => {
    // No se invoca getTreeStats() (requiere getCollection con runtime de Astro):
    // se fija el contrato sobre summarizeTrees(), que es lo que calcula.
    const stats = summarizeTrees([arbol()]);
    expect(Object.keys(stats).sort()).toEqual(['totalRecycled', 'totalSpecies', 'totalTrees']);
  });
});
