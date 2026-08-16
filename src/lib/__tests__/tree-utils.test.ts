import { describe, it, expect } from 'vitest';
import {
  getProtector,
  protectorDescription,
  describeProtectorMix,
  daysSincePlanted,
  timeSincePlanted,
  plantingSpan,
  findSpeciesForTree,
  treesOfSpecies,
  treeDisplayLabel,
  summarizeSpeciesTrees,
  speciesGrammar,
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
