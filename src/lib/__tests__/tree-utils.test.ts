import { describe, it, expect } from 'vitest';
import {
  getProtector,
  protectorDescription,
  protectorStory,
  describeProtectorMix,
  daysSincePlanted,
  timeSincePlanted,
  plantingSpan,
  findSpeciesForTree,
  treesOfSpecies,
  treeDisplayLabel,
  summarizeSpeciesTrees,
  speciesGrammar,
  speciesHeadline,
  commonPlace,
  placeWithArticle,
  categoryLabels,
  categoryColors,
  journeyLabels,
  PROTECTOR_LABELS,
} from '../tree-utils';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const especie = (id: string, commonName: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { commonName, ...extra },
});

const arbol = (id: string, species: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: {
    species,
    plantedDate: at('2026-04-01'),
    protector: 'llanta-bicicleta',
    order: 0,
    ...extra,
  },
});

// ============================================================
// El índice de Trocha Verde depende de estos mapas: no deben romperse
// ============================================================

describe('mapas compartidos con el índice de Trocha Verde', () => {
  it('conserva las cuatro categorías que ya consume TrochaVerdeGrid/Siembras', () => {
    expect(categoryLabels).toEqual({
      frutal: 'Frutal',
      ornamental: 'Ornamental',
      nativo: 'Nativo',
      maderable: 'Maderable',
    });
    expect(Object.keys(categoryColors)).toEqual(['frutal', 'ornamental', 'nativo', 'maderable']);
  });

  it('conserva las etiquetas de jornada que usa el índice', () => {
    expect(journeyLabels[0]).toBe('Primera siembra');
    expect(journeyLabels[5]).toBe('Sexta siembra');
  });
});

// ============================================================
// Protector: la llanta reciclada
// ============================================================

describe('getProtector', () => {
  it('resuelve los cuatro protectores del schema', () => {
    expect(getProtector('llanta-bicicleta')).toBe(PROTECTOR_LABELS['llanta-bicicleta']);
    expect(getProtector('llanta-moto')).toBe(PROTECTOR_LABELS['llanta-moto']);
    expect(getProtector('piedras')).toBe(PROTECTOR_LABELS.piedras);
    expect(getProtector('otro')).toBe(PROTECTOR_LABELS.otro);
  });

  it('cae en el protector artesanal ante un valor desconocido', () => {
    expect(getProtector('jaula-de-madera')).toBe(PROTECTOR_LABELS.otro);
  });
});

describe('protectorDescription', () => {
  it('antepone "Llanta" al color exacto cuando el árbol lo trae', () => {
    expect(protectorDescription('llanta-bicicleta', 'rosada')).toBe('Llanta rosada');
    expect(protectorDescription('llanta-moto', 'verde y amarilla')).toBe('Llanta verde y amarilla');
  });

  it('usa la etiqueta genérica de la llanta sin color', () => {
    expect(protectorDescription('llanta-bicicleta')).toBe('Llanta de bicicleta reciclada');
  });

  it('ignora el color en protectores que no son llanta', () => {
    // En los datos reales "otro"/"piedras" nunca traen protectorColor, pero la
    // función no debe inventar "Llanta {color}" si algún día llega uno.
    expect(protectorDescription('otro', 'naranja')).toBe('Protector artesanal');
    expect(protectorDescription('piedras')).toBe('Círculo de piedras');
  });
});

describe('describeProtectorMix', () => {
  it('no se cae sin protectores', () => {
    expect(describeProtectorMix([])).toBe('');
  });

  it('nombra el protector único cuando toda la especie comparte uno', () => {
    expect(describeProtectorMix([{ protector: 'llanta-bicicleta', count: 9 }])).toBe(
      'Llanta de bicicleta reciclada'
    );
  });

  it('desglosa la mezcla cuando la especie usa más de un protector', () => {
    expect(
      describeProtectorMix([
        { protector: 'llanta-bicicleta', count: 8 },
        { protector: 'llanta-moto', count: 1 },
      ])
    ).toBe('8 con llanta de bicicleta reciclada · 1 con llanta de moto reciclada');
  });
});

describe('protectorStory', () => {
  it('cuenta la historia de la llanta reciclada para los dos protectores de llanta', () => {
    expect(protectorStory('llanta-bicicleta')).toContain('llanta');
    expect(protectorStory('llanta-bicicleta')).toBe(protectorStory('llanta-moto'));
  });

  it('usa la frase genérica de protección artesanal para piedras y otro', () => {
    expect(protectorStory('piedras')).toBe(protectorStory('otro'));
    expect(protectorStory('piedras')).not.toContain('llanta');
  });

  it('no se cae con un protector desconocido: cae en la frase artesanal', () => {
    expect(protectorStory('jaula-de-madera')).toBe(protectorStory('otro'));
  });
});

// ============================================================
// Tiempo transcurrido desde la siembra
// ============================================================

describe('daysSincePlanted', () => {
  it('cuenta los días completos entre la siembra y hoy', () => {
    expect(daysSincePlanted(at('2026-03-15'), new Date('2026-08-16T15:00:00Z'))).toBe(154);
    expect(daysSincePlanted(at('2026-05-18'), new Date('2026-08-16T15:00:00Z'))).toBe(90);
  });

  it('da 0 el mismo día de la siembra', () => {
    expect(daysSincePlanted(at('2026-04-01'), new Date('2026-04-01T20:00:00Z'))).toBe(0);
  });

  it('nunca es negativo, ni con una fecha de siembra futura', () => {
    expect(daysSincePlanted(at('2026-12-01'), new Date('2026-08-16T15:00:00Z'))).toBe(0);
  });

  it('usa el día del club, no el UTC, en la madrugada', () => {
    // 2026-09-26T02:00Z todavía es 25 de septiembre en Colombia (UTC-5): un
    // árbol sembrado el 25 lleva 0 días, no -1 ni 1 por el corte de UTC.
    const madrugada = new Date('2026-09-26T02:00:00Z');
    expect(daysSincePlanted(at('2026-09-25'), madrugada)).toBe(0);
  });
});

describe('timeSincePlanted', () => {
  const hoy = new Date('2026-08-16T15:00:00Z');

  it('cuenta en días durante la primera semana', () => {
    expect(timeSincePlanted(at('2026-08-15'), hoy)).toEqual({ days: 1, value: 1, unit: 'día' });
    expect(timeSincePlanted(at('2026-08-11'), hoy)).toEqual({ days: 5, value: 5, unit: 'días' });
  });

  it('pasa a semanas entre 7 y 29 días', () => {
    // Exactamente 7 días: el primer punto en el que "semana" es alcanzable.
    expect(timeSincePlanted(at('2026-08-09'), hoy)).toEqual({
      days: 7,
      value: 1,
      unit: 'semana',
    });
    expect(timeSincePlanted(at('2026-08-02'), hoy)).toEqual({
      days: 14,
      value: 2,
      unit: 'semanas',
    });
  });

  it('pasa a meses entre 30 y 364 días — el tramo de todos los árboles de hoy', () => {
    // Exactamente 30 días: el primer punto en el que "mes" es alcanzable.
    expect(timeSincePlanted(at('2026-07-17'), hoy)).toEqual({ days: 30, value: 1, unit: 'mes' });
    expect(timeSincePlanted(at('2026-03-15'), hoy)).toEqual({ days: 154, value: 5, unit: 'meses' });
    expect(timeSincePlanted(at('2026-05-18'), hoy)).toEqual({ days: 90, value: 3, unit: 'meses' });
  });

  it('pasa a años a partir de 365 días', () => {
    const resultado = timeSincePlanted(at('2025-08-16'), hoy);
    expect(resultado.unit).toBe('año');
    expect(resultado.value).toBe(1);
  });
});

describe('plantingSpan', () => {
  it('muestra una sola fecha completa cuando toda la especie se sembró el mismo día', () => {
    expect(plantingSpan(at('2026-03-15'), at('2026-03-15'))).toBe('15 de marzo de 2026');
  });

  it('omite el año de la primera fecha cuando el rango cae en el mismo año', () => {
    expect(plantingSpan(at('2026-03-15'), at('2026-05-18'))).toBe(
      '15 de marzo – 18 de mayo de 2026'
    );
  });

  it('muestra el año en ambos extremos cuando el rango cruza de año', () => {
    expect(plantingSpan(at('2025-12-20'), at('2026-01-05'))).toBe(
      '20 de diciembre de 2025 – 5 de enero de 2026'
    );
  });
});

// ============================================================
// Emparejar árboles con su especie
// ============================================================

describe('findSpeciesForTree', () => {
  const especies = [
    especie('guayacan', 'Guayacán'),
    // El archivo real se llama "lengua-suegra.md" pero el nombre común (y el
    // campo `species` de los 4 árboles) es "Lengua de suegra": ids distintos.
    especie('lengua-suegra', 'Lengua de suegra'),
  ];

  it('empareja por nombre común aunque el id del archivo sea distinto', () => {
    const arbolLenguaSuegra = arbol('mayo-2026-lengua-suegra-1', 'Lengua de suegra');
    const encontrada = findSpeciesForTree(arbolLenguaSuegra, especies);
    expect(encontrada?.id).toBe('lengua-suegra');
  });

  it('empareja el caso simple donde el id ya coincide con el nombre', () => {
    const encontrada = findSpeciesForTree(arbol('guayacan-2', 'Guayacán'), especies);
    expect(encontrada?.id).toBe('guayacan');
  });

  it('devuelve undefined cuando ningún archivo de especie corresponde', () => {
    // "Abano" no tiene species/abano.md en el contenido real.
    expect(findSpeciesForTree(arbol('dia-tierra-abano', 'Abano'), especies)).toBeUndefined();
  });
});

describe('treesOfSpecies', () => {
  const ixora = especie('ixora', 'Ixora');
  const arboles = [
    arbol('ixora-3', 'Ixora', { order: 3 }),
    arbol('ixora-1', 'Ixora', { order: 1 }),
    arbol('mango-1', 'Mango', { order: 2 }),
    arbol('ixora-2', 'Ixora', { order: 2 }),
  ];

  it('filtra por nombre común y ordena por el campo order del CMS', () => {
    const resultado = treesOfSpecies(arboles, ixora);
    expect(resultado.map((t) => t.id)).toEqual(['ixora-1', 'ixora-2', 'ixora-3']);
  });

  it('no se cae cuando ningún árbol coincide', () => {
    expect(treesOfSpecies(arboles, especie('mirto', 'Mirto'))).toEqual([]);
  });
});

describe('treeDisplayLabel', () => {
  it('no numera cuando la especie tiene un solo árbol', () => {
    const unico = arbol('ceiba', 'Ceiba');
    expect(treeDisplayLabel(unico, [unico])).toBe('Ceiba');
  });

  it('numera según la posición dentro de los árboles ya ordenados de la especie', () => {
    const hermanos = [
      arbol('mango-1', 'Mango', { order: 1 }),
      arbol('mango-2', 'Mango', { order: 2 }),
      arbol('mango-3', 'Mango', { order: 3 }),
    ];
    expect(treeDisplayLabel(hermanos[0], hermanos)).toBe('Mango 1');
    expect(treeDisplayLabel(hermanos[2], hermanos)).toBe('Mango 3');
  });
});

// ============================================================
// Agregación por especie
// ============================================================

describe('summarizeSpeciesTrees', () => {
  it('devuelve null sin árboles, en vez de cifras en cero', () => {
    expect(summarizeSpeciesTrees([])).toBeNull();
  });

  it('agrega total, rango de siembra, padrinos y mezcla de protectores', () => {
    const arboles = [
      arbol('ixora-1', 'Ixora', {
        plantedDate: at('2026-04-22'),
        donor: 'Vivero Guacandá',
        protector: 'llanta-bicicleta',
      }),
      arbol('ixora-2', 'Ixora', {
        plantedDate: at('2026-05-18'),
        protector: 'llanta-bicicleta',
      }),
      arbol('ixora-3', 'Ixora', {
        plantedDate: at('2026-04-09'),
        donor: 'Familia Rojas',
        protector: 'llanta-moto',
      }),
    ];

    const resumen = summarizeSpeciesTrees(arboles)!;
    expect(resumen.total).toBe(3);
    expect(resumen.firstPlanted).toEqual(at('2026-04-09'));
    expect(resumen.lastPlanted).toEqual(at('2026-05-18'));
    expect(resumen.sponsored).toBe(2);
    expect(resumen.protectors).toEqual([
      { protector: 'llanta-bicicleta', count: 2 },
      { protector: 'llanta-moto', count: 1 },
    ]);
  });

  it('un solo árbol es a la vez el primero y el último', () => {
    const resumen = summarizeSpeciesTrees([arbol('ceiba', 'Ceiba', { plantedDate: at('2026-03-15') })])!;
    expect(resumen.firstPlanted).toEqual(resumen.lastPlanted);
    expect(resumen.sponsored).toBe(0);
  });
});

// ============================================================
// Concordancia de género y número
// ============================================================

describe('speciesGrammar', () => {
  it('usa el plural femenino y "Nuestras" cuando el contenido marca feminine', () => {
    const gramatica = speciesGrammar({ commonName: 'Acacia', plural: 'Acacias', feminine: true });
    expect(gramatica).toEqual({
      plural: 'Acacias',
      article: 'las',
      Article: 'Las',
      possessive: 'Nuestras',
    });
  });

  it('usa el masculino por defecto cuando feminine no está definido', () => {
    const gramatica = speciesGrammar({ commonName: 'Guayacán', plural: 'Guayacanes' });
    expect(gramatica.article).toBe('los');
    expect(gramatica.Article).toBe('Los');
    expect(gramatica.possessive).toBe('Nuestros');
  });

  it('arma el plural con commonName + "s" cuando el contenido no trae plural', () => {
    // "Mango" es uno de los 8 species/*.md reales sin campo `plural`.
    expect(speciesGrammar({ commonName: 'Mango' }).plural).toBe('Mangos');
  });
});

describe('speciesHeadline', () => {
  const mangoTommy = {
    commonName: 'Mango Tommy',
    plural: 'Mangos Tommy',
    description: 'Variedad comercial de mango de frutos grandes, líder de exportación colombiana.',
  };

  const stats = (over: Partial<ReturnType<typeof summarizeSpeciesTrees>> = {}) => ({
    total: 3,
    firstPlanted: new Date(Date.UTC(2026, 3, 12)),
    lastPlanted: new Date(Date.UTC(2026, 4, 3)),
    sponsored: 2,
    protectors: [{ protector: 'llanta-bicicleta', count: 3 }],
    ...over,
  });

  // El motivo del reenfoque: el titular ya no puede ser el nombre de la especie
  // a secas, que es lo que hacía competir la página con búsquedas botánicas.
  it('el encabezado habla de los ejemplares del club, no de la especie', () => {
    const h = speciesHeadline(mangoTommy, stats() as never);
    expect(h.heading).toBe('Nuestros 3 Mangos Tommy');
    expect(h.heading).not.toBe(mangoTommy.commonName);
  });

  it('en singular omite el número y concuerda el posesivo', () => {
    const h = speciesHeadline(mangoTommy, stats({ total: 1 }) as never);
    expect(h.heading).toBe('Nuestro Mango Tommy');
  });

  it('concuerda en femenino', () => {
    const h = speciesHeadline(
      { commonName: 'Ixora', plural: 'Ixoras', feminine: true, description: 'Arbusto ornamental.' },
      stats({ total: 4 }) as never
    );
    expect(h.heading).toBe('Nuestras 4 Ixoras');
    expect(h.seoTitle).toContain('sembradas');
  });

  it('el título SEO nombra al club y cabe holgado en un resultado de búsqueda', () => {
    const h = speciesHeadline(mangoTommy, stats() as never);
    expect(h.seoTitle).toBe('3 Mangos Tommy sembrados por Trocha y Ruta');
    expect(h.seoTitle.length).toBeLessThanOrEqual(70);
  });

  it('la bajada sale del inventario: cantidad, lugar, periodo y padrinos', () => {
    const h = speciesHeadline(mangoTommy, stats() as never, 'Pista de Ciclomontañismo Carlos Castro');
    expect(h.lead).toContain('3 Mangos Tommy sembrados');
    expect(h.lead).toContain('en la Pista de Ciclomontañismo Carlos Castro');
    expect(h.lead).toContain('2026');
    expect(h.lead).toContain('2 tienen padrino o madrina');
  });

  it('omite la mención de padrinos cuando no hay ninguno', () => {
    const h = speciesHeadline(mangoTommy, stats({ sponsored: 0 }) as never);
    expect(h.lead).not.toContain('padrino');
  });

  it('usa el singular del verbo con un solo padrino', () => {
    const h = speciesHeadline(mangoTommy, stats({ sponsored: 1 }) as never);
    expect(h.lead).toContain('1 tiene padrino o madrina');
  });

  // Bajar la inicial del nombre dejaba "guayacán Azul", con el adjetivo
  // capitalizado a mitad de frase.
  it('no altera la capitalización de nombres con adjetivo', () => {
    const h = speciesHeadline(
      { commonName: 'Guayacán Azul', plural: 'Guayacanes Azules', description: 'Árbol nativo.' },
      stats({ total: 1 }) as never
    );
    expect(h.heading).toBe('Nuestro Guayacán Azul');
  });

  it('sin ejemplares cae al texto botánico, que es lo único cierto', () => {
    const h = speciesHeadline(mangoTommy, null);
    expect(h.heading).toBe('Mango Tommy');
    expect(h.lead).toBe(mangoTommy.description);
    expect(h.seoDescription).toBe(mangoTommy.description);
  });

  it('omite el lugar si el inventario no lo declara', () => {
    const h = speciesHeadline(mangoTommy, stats() as never);
    expect(h.lead).not.toContain(' en ,');
    expect(h.seoDescription).toContain('por el Club Deportivo Trocha y Ruta');
  });
});

describe('commonPlace', () => {
  const arbol = (location?: string) => ({ data: { location } });

  it('devuelve la ubicación declarada por la mayoría', () => {
    expect(
      commonPlace([arbol('Pista Carlos Castro'), arbol('Pista Carlos Castro'), arbol('Parque central')])
    ).toBe('Pista Carlos Castro');
  });

  it('ignora ubicaciones vacías o en blanco', () => {
    expect(commonPlace([arbol(undefined), arbol('   '), arbol('Pista Carlos Castro')])).toBe(
      'Pista Carlos Castro'
    );
  });

  it('devuelve undefined si ningún árbol declara ubicación', () => {
    expect(commonPlace([arbol(undefined), arbol('')])).toBeUndefined();
  });

  it('devuelve undefined con la lista vacía', () => {
    expect(commonPlace([])).toBeUndefined();
  });
});

describe('placeWithArticle', () => {
  it('antepone el artículo femenino a los lugares conocidos', () => {
    expect(placeWithArticle('Pista de Ciclomontañismo Carlos Castro')).toBe(
      'la Pista de Ciclomontañismo Carlos Castro'
    );
    expect(placeWithArticle('Escuela Rural Guabinas')).toBe('la Escuela Rural Guabinas');
  });

  it('antepone el artículo masculino cuando corresponde', () => {
    expect(placeWithArticle('Parque Central')).toBe('el Parque Central');
  });

  it('respeta el artículo que ya trae el contenido', () => {
    expect(placeWithArticle('la pista Carlos Castro')).toBe('la pista Carlos Castro');
    expect(placeWithArticle('El Vergel')).toBe('El Vergel');
  });

  // Preferimos un nombre sin artículo a inventar un género equivocado.
  it('deja el nombre intacto si no puede determinar el género', () => {
    expect(placeWithArticle('Km 4 vía Dapa')).toBe('Km 4 vía Dapa');
  });

  it('tolera espacios sobrantes y cadenas vacías', () => {
    expect(placeWithArticle('  Pista Carlos Castro  ')).toBe('la Pista Carlos Castro');
    expect(placeWithArticle('   ')).toBe('');
  });
});
