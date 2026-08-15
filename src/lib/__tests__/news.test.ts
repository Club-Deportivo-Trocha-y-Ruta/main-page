import { describe, it, expect, afterEach } from 'vitest';
import {
  readingTime,
  monthKey,
  monthLabel,
  groupByMonth,
  summarizeNews,
  getCategoryStyle,
  NEWS_CATEGORIES,
  WORDS_PER_MINUTE,
} from '../news';

const entry = (date: string, category = 'competencias') => ({
  data: { date: new Date(date), category },
});

// ============================================================
// readingTime
// ============================================================

describe('readingTime', () => {
  it('estima los minutos a partir del número de palabras', () => {
    const body = 'palabra '.repeat(WORDS_PER_MINUTE * 3).trim();
    expect(readingTime(body)).toBe(3);
  });

  it('nunca baja de un minuto', () => {
    expect(readingTime('Isabel ganó en Palmira.')).toBe(1);
  });

  it('no cuenta el HTML incrustado de las crónicas', () => {
    const conHtml = `<div class="stat-strip"><p class="stat-strip__item"><span class="stat-strip__value">${'x'} </span></p></div> Isabel ganó.`;
    expect(readingTime(conHtml)).toBe(1);
    // Las etiquetas no deben pesar más que el texto real.
    const soloEtiquetas = '<div class="a"><span class="b"></span></div>'.repeat(60);
    expect(readingTime(soloEtiquetas)).toBeNull();
  });

  it('cuenta el texto del enlace pero no la URL', () => {
    const conEnlaces = Array.from(
      { length: 100 },
      () => '[Copa Valle](https://ejemplo.com/una/ruta/larguisima/que-no-se-lee)'
    ).join(' ');
    // 200 palabras visibles ("Copa Valle" x100) = 1 minuto; con las URL serían más.
    expect(readingTime(conEnlaces)).toBe(1);
  });

  it('ignora los bloques de código', () => {
    const body = '```\n' + 'codigo '.repeat(500) + '\n```\nIsabel ganó.';
    expect(readingTime(body)).toBe(1);
  });

  it('devuelve null cuando no hay cuerpo', () => {
    expect(readingTime(undefined)).toBeNull();
    expect(readingTime('')).toBeNull();
    expect(readingTime('   \n  ')).toBeNull();
  });
});

// ============================================================
// Meses en UTC
// ============================================================

describe('meses', () => {
  const originalTZ = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it('usa la fecha UTC, no la local', () => {
    // Colombia es UTC-5: con getters locales, la medianoche UTC del 1.º de
    // marzo cae el 28 de febrero y la noticia se archivaría en el mes anterior.
    process.env.TZ = 'America/Bogota';
    const primeroDeMarzo = new Date('2026-03-01T00:00:00Z');
    expect(monthKey(primeroDeMarzo)).toBe('2026-03');
    expect(monthLabel(primeroDeMarzo)).toBe('Marzo 2026');
  });

  it('rotula el mes con inicial mayúscula', () => {
    expect(monthLabel(new Date('2026-09-27T00:00:00Z'))).toBe('Septiembre 2026');
  });

  it('genera claves ordenables', () => {
    const claves = ['2026-01-05', '2025-12-31', '2026-10-02'].map((d) => monthKey(new Date(d)));
    expect([...claves].sort()).toEqual(['2025-12', '2026-01', '2026-10']);
  });
});

// ============================================================
// groupByMonth
// ============================================================

describe('groupByMonth', () => {
  it('agrupa por mes, del más reciente al más antiguo', () => {
    const groups = groupByMonth([
      entry('2026-08-02'),
      entry('2026-08-01'),
      entry('2026-06-14'),
      entry('2026-03-01'),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['2026-08', '2026-06', '2026-03']);
    expect(groups[0].label).toBe('Agosto 2026');
    expect(groups[0].items).toHaveLength(2);
  });

  it('conserva el orden con el que llegan los elementos de un mes', () => {
    const primero = entry('2026-08-02');
    const segundo = entry('2026-08-01');
    const [agosto] = groupByMonth([primero, segundo]);
    expect(agosto.items).toEqual([primero, segundo]);
  });

  it('no mezcla el mismo mes de años distintos', () => {
    const groups = groupByMonth([entry('2026-03-10'), entry('2025-03-10')]);
    expect(groups.map((g) => g.key)).toEqual(['2026-03', '2025-03']);
  });

  it('devuelve una lista vacía sin elementos', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});

// ============================================================
// summarizeNews
// ============================================================

describe('summarizeNews', () => {
  it('cuenta el total y ordena las categorías por frecuencia', () => {
    const summary = summarizeNews([
      entry('2026-03-01'),
      entry('2026-04-19'),
      entry('2026-04-22', 'comunidad'),
    ]);
    expect(summary.total).toBe(3);
    expect(summary.byCategory[0]).toEqual({
      category: 'competencias',
      label: 'Competencia',
      count: 2,
    });
    expect(summary.byCategory[1].count).toBe(1);
  });

  it('describe el periodo cubierto según lo que abarque', () => {
    expect(summarizeNews([entry('2026-03-01'), entry('2026-08-02')]).span).toBe(
      'marzo – agosto 2026'
    );
    expect(summarizeNews([entry('2026-08-01'), entry('2026-08-02')]).span).toBe('Agosto 2026');
    expect(summarizeNews([entry('2025-11-01'), entry('2026-02-02')]).span).toBe(
      'Noviembre 2025 – Febrero 2026'
    );
  });

  it('no inventa nada cuando no hay noticias', () => {
    expect(summarizeNews([])).toEqual({ total: 0, byCategory: [], span: null });
  });
});

// ============================================================
// Categorías
// ============================================================

describe('getCategoryStyle', () => {
  it('traduce el valor del enum a una etiqueta legible', () => {
    expect(getCategoryStyle('competencias').label).toBe('Competencia');
  });

  it('cae en una categoría neutra ante un valor desconocido', () => {
    expect(getCategoryStyle('opinión')).toBe(NEWS_CATEGORIES.club);
  });

  it('ninguna categoría usa el teal o el lima vivos como color de texto', () => {
    // Sobre fondos claros solo los tonos -deep cumplen 4.5:1.
    for (const [name, style] of Object.entries(NEWS_CATEGORIES)) {
      expect(style.text, name).toMatch(/-deep$/);
    }
  });
});
