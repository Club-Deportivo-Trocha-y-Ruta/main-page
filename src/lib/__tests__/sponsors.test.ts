import { describe, it, expect } from 'vitest';
import {
  SPONSOR_LEVELS,
  SPONSOR_LEVEL_ORDER,
  getSponsorLevel,
  isPublishableSponsor,
  groupByLevel,
  sponsorSince,
  summarizeSponsors,
  summarizeEvidence,
} from '../sponsors';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const sponsor = (id: string, level: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: {
    name: id,
    logo: `/images/sponsors/${id}.png`,
    level,
    active: true,
    draft: false,
    order: 0,
    ...extra,
  },
});

const evento = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { title: `Válida ${id}`, date: at(date), ...extra },
});

// ============================================================
// Identidad visual del nivel
// ============================================================

describe('getSponsorLevel', () => {
  it('resuelve los cuatro niveles definidos', () => {
    expect(getSponsorLevel('principal')).toBe(SPONSOR_LEVELS.principal);
    expect(getSponsorLevel('oficial')).toBe(SPONSOR_LEVELS.oficial);
    expect(getSponsorLevel('aliado')).toBe(SPONSOR_LEVELS.aliado);
    expect(getSponsorLevel('proveedor')).toBe(SPONSOR_LEVELS.proveedor);
  });

  it('cae en aliado ante un nivel desconocido', () => {
    expect(getSponsorLevel('platino')).toBe(SPONSOR_LEVELS.aliado);
  });

  it('el orden jerárquico va de principal (1) a proveedor (4)', () => {
    expect(SPONSOR_LEVEL_ORDER).toEqual(['principal', 'oficial', 'aliado', 'proveedor']);
    expect(SPONSOR_LEVELS.principal.order).toBe(1);
    expect(SPONSOR_LEVELS.proveedor.order).toBe(4);
  });

  it('cada nivel trae su propia lista de beneficios, sin inventar unos nuevos', () => {
    for (const level of SPONSOR_LEVEL_ORDER) {
      expect(SPONSOR_LEVELS[level].benefits.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// Filtro de publicación
// ============================================================

describe('isPublishableSponsor', () => {
  it('publica un sponsor activo, sin draft y con logo real', () => {
    expect(isPublishableSponsor(sponsor('smurfit-westrock', 'principal'))).toBe(true);
  });

  it('descarta los marcados como borrador', () => {
    expect(isPublishableSponsor(sponsor('ciclovalle', 'principal', { draft: true }))).toBe(false);
  });

  it('descarta los inactivos', () => {
    expect(isPublishableSponsor(sponsor('ex-aliado', 'aliado', { active: false }))).toBe(false);
  });

  it('descarta los que aún usan el logo placeholder', () => {
    expect(
      isPublishableSponsor(
        sponsor('nutrifit', 'proveedor', { logo: '/images/placeholder-sponsor.png' }),
      ),
    ).toBe(false);
  });

  it('filtra un listado mixto dejando solo los cuatro reales', () => {
    const listado = [
      sponsor('smurfit-westrock', 'principal'),
      sponsor('ciclovalle', 'principal', { draft: true }),
      sponsor('alcaldia-yumbo', 'oficial'),
      sponsor('deportes-montana', 'aliado', {
        draft: true,
        logo: '/images/placeholder-sponsor.png',
      }),
      sponsor('imderty', 'oficial'),
      sponsor('nutrifit', 'proveedor', { draft: true, logo: '/images/placeholder-sponsor.png' }),
      sponsor('ram-bike', 'aliado'),
    ];

    const publicables = listado.filter(isPublishableSponsor).map((s) => s.id);
    expect(publicables).toEqual(['smurfit-westrock', 'alcaldia-yumbo', 'imderty', 'ram-bike']);
  });
});

// ============================================================
// Agrupación por nivel
// ============================================================

describe('groupByLevel', () => {
  const aliados = [
    sponsor('smurfit-westrock', 'principal', { order: 2 }),
    sponsor('alcaldia-yumbo', 'oficial', { order: 2 }),
    sponsor('imderty', 'oficial', { order: 3 }),
    sponsor('ram-bike', 'aliado', { order: 5 }),
  ];

  it('agrupa en el orden jerárquico definido, no en el de llegada', () => {
    // Se pasan fuera de orden (aliado antes que oficial) a propósito.
    const desordenado = [aliados[3], aliados[1], aliados[0], aliados[2]];
    const grupos = groupByLevel(desordenado);
    expect(grupos.map((g) => g.level.id)).toEqual(['principal', 'oficial', 'aliado']);
  });

  it('omite los niveles sin sponsors en vez de pintarlos vacíos', () => {
    const grupos = groupByLevel(aliados);
    // No hay ningún "proveedor" real hoy: el grupo no debe aparecer.
    expect(grupos.find((g) => g.level.id === 'proveedor')).toBeUndefined();
    expect(grupos).toHaveLength(3);
  });

  it('dentro de cada nivel ordena por el campo order del contenido', () => {
    const grupos = groupByLevel(aliados);
    const oficial = grupos.find((g) => g.level.id === 'oficial')!;
    expect(oficial.sponsors.map((s) => s.id)).toEqual(['alcaldia-yumbo', 'imderty']);
  });

  it('no se cae con una lista vacía', () => {
    expect(groupByLevel([])).toEqual([]);
  });

  it('agrupa un nivel desconocido como aliado', () => {
    const grupos = groupByLevel([sponsor('raro', 'platino')]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].level.id).toBe('aliado');
  });
});

// ============================================================
// Antigüedad
// ============================================================

describe('sponsorSince', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');

  it('calcula el año y los años completos desde el inicio', () => {
    const tenure = sponsorSince(at('2020-01-01'), hoy);
    expect(tenure).not.toBeNull();
    expect(tenure!.year).toBe(2020);
    expect(tenure!.years).toBe(6);
    expect(tenure!.label).toBe('Con el club desde 2020');
  });

  it('un aliado que empezó este año lleva 0 años, no un negativo', () => {
    const tenure = sponsorSince(at('2026-01-01'), hoy);
    expect(tenure!.years).toBe(0);
    expect(tenure!.label).toBe('Con el club desde 2026');
  });

  it('devuelve null cuando no hay startDate, en vez de inventar una fecha', () => {
    expect(sponsorSince(undefined, hoy)).toBeNull();
  });
});

// ============================================================
// Resumen de los aliados actuales
// ============================================================

describe('summarizeSponsors', () => {
  it('cuenta el total y el año del aliado más antiguo', () => {
    const resumen = summarizeSponsors([
      { data: { startDate: at('2020-01-01') } },
      { data: { startDate: at('2026-01-01') } },
      { data: { startDate: at('2020-06-01') } },
    ]);
    expect(resumen.total).toBe(3);
    expect(resumen.oldestYear).toBe(2020);
  });

  it('ignora los que no traen startDate al calcular el más antiguo', () => {
    const resumen = summarizeSponsors([{ data: {} }, { data: { startDate: at('2022-01-01') } }]);
    expect(resumen.total).toBe(2);
    expect(resumen.oldestYear).toBe(2022);
  });

  it('no se cae sin sponsors', () => {
    expect(summarizeSponsors([])).toEqual({ total: 0, oldestYear: null });
  });
});

// ============================================================
// Evidencia de exposición (temporada, crónicas, siembra)
// ============================================================

describe('summarizeEvidence', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');
  const eventos = [
    evento('sevilla', '2026-01-31'),
    evento('ginebra', '2026-02-28'),
    evento('roldanillo', '2026-09-26'),
  ];

  it('deriva las fechas de la temporada con buildSeason, no con el total histórico', () => {
    const evidencia = summarizeEvidence(
      { events: eventos, publishedStories: 9, treesPlanted: 77 },
      hoy,
    );
    expect(evidencia.seasonDates).toBe(3);
    expect(evidencia.seasonYear).toBe(2026);
  });

  it('pasa de largo las crónicas y los árboles cuando sí hay conteo', () => {
    const evidencia = summarizeEvidence(
      { events: eventos, publishedStories: 9, treesPlanted: 77 },
      hoy,
    );
    expect(evidencia.publishedStories).toBe(9);
    expect(evidencia.treesPlanted).toBe(77);
  });

  it('deja en null cada campo sin datos, en vez de mostrar un cero', () => {
    const evidencia = summarizeEvidence({ events: [], publishedStories: 0, treesPlanted: 0 }, hoy);
    expect(evidencia.seasonDates).toBeNull();
    expect(evidencia.seasonYear).toBeNull();
    expect(evidencia.publishedStories).toBeNull();
    expect(evidencia.treesPlanted).toBeNull();
  });

  it('cada campo es independiente: una colección vacía no tumba las demás', () => {
    const evidencia = summarizeEvidence(
      { events: eventos, publishedStories: 0, treesPlanted: 77 },
      hoy,
    );
    expect(evidencia.seasonDates).toBe(3);
    expect(evidencia.publishedStories).toBeNull();
    expect(evidencia.treesPlanted).toBe(77);
  });
});
