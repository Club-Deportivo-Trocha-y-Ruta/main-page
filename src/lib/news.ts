/**
 * Lógica compartida de las noticias del club.
 *
 * Las noticias son, en la práctica, la crónica de la temporada: válida tras
 * válida, con alguna jornada de comunidad en medio. Aquí se deriva lo que hace
 * falta para contarlas así —agrupación por mes, tiempo de lectura, resumen del
 * periodo cubierto— sin escribir nada en las plantillas.
 *
 * Las fechas del frontmatter se parsean como medianoche UTC. Colombia está en
 * UTC-5, así que todo cálculo de mes usa los getters UTC: con los locales, una
 * noticia del 1.º de marzo caería en febrero.
 */

export type NewsCategory = 'competencias' | 'club' | 'entrenamiento' | 'comunidad';

export interface CategoryStyle {
  /** Etiqueta legible. El valor del enum va en plural y en minúscula. */
  label: string;
  icon: string;
  /** Texto que cumple contraste AA sobre `soft`. */
  text: string;
  soft: string;
}

export const NEWS_CATEGORIES: Record<NewsCategory, CategoryStyle> = {
  competencias: {
    label: 'Competencia',
    icon: 'ph:flag-checkered-bold',
    text: 'text-primary-deep',
    soft: 'bg-primary/12',
  },
  club: {
    label: 'Club',
    icon: 'ph:users-three-bold',
    text: 'text-primary-deep',
    soft: 'bg-primary/12',
  },
  entrenamiento: {
    label: 'Entrenamiento',
    icon: 'ph:barbell-bold',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
  },
  comunidad: {
    label: 'Comunidad',
    icon: 'ph:hand-heart-bold',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
  },
};

export function getCategoryStyle(category: string): CategoryStyle {
  return NEWS_CATEGORIES[category as NewsCategory] ?? NEWS_CATEGORIES.club;
}

// ─── Tiempo de lectura ────────────────────────────────────────────────────────

/** Ritmo de lectura de referencia para prosa en español. */
export const WORDS_PER_MINUTE = 200;

/**
 * Minutos de lectura del cuerpo en markdown.
 *
 * Las crónicas traen HTML incrustado (tiras de cifras, carruseles de figuras) y
 * enlaces: se descuentan las etiquetas y las URL para no inflar la cuenta con
 * texto que nadie lee. Devuelve `null` si no hay cuerpo, para que la interfaz
 * omita el dato en vez de mostrar "0 min".
 */
export function readingTime(body: string | undefined): number | null {
  if (!body) return null;

  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ');

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words === 0) return null;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// ─── Agrupación por mes ───────────────────────────────────────────────────────

const MONTH_NAME = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' });

/** Clave ordenable `AAAA-MM`, en UTC. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "Septiembre 2026". El español escribe los meses en minúscula, pero aquí es
 *  un rótulo de sección, no prosa. */
export function monthLabel(date: Date): string {
  const name = MONTH_NAME.format(date);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getUTCFullYear()}`;
}

export interface MonthGroup<T> {
  key: string;
  label: string;
  items: T[];
}

/**
 * Agrupa por mes de publicación, del más reciente al más antiguo. Dentro de
 * cada mes se conserva el orden en que llegan los elementos, así que la página
 * decide cómo ordenarlos antes de llamar.
 */
export function groupByMonth<T extends { data: { date: Date } }>(items: T[]): MonthGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const key = monthKey(item.data.date);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => ({
      key,
      label: monthLabel(entries[0].data.date),
      items: entries,
    }));
}

// ─── Resumen del archivo ──────────────────────────────────────────────────────

export interface NewsSummary {
  total: number;
  /** Cuántas noticias hay de cada categoría presente. */
  byCategory: { category: NewsCategory; label: string; count: number }[];
  /** Periodo cubierto: "marzo – septiembre 2026". `null` si no hay noticias. */
  span: string | null;
}

export function summarizeNews<T extends { data: { date: Date; category: string } }>(
  items: T[]
): NewsSummary {
  if (items.length === 0) return { total: 0, byCategory: [], span: null };

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.data.category, (counts.get(item.data.category) ?? 0) + 1);
  }

  const times = items.map((item) => item.data.date.getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));

  const sameMonth = monthKey(from) === monthKey(to);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const span = sameMonth
    ? monthLabel(to)
    : sameYear
      ? `${MONTH_NAME.format(from)} – ${MONTH_NAME.format(to)} ${to.getUTCFullYear()}`
      : `${monthLabel(from)} – ${monthLabel(to)}`;

  return {
    total: items.length,
    byCategory: [...counts.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category: category as NewsCategory,
        label: getCategoryStyle(category).label,
        count,
      })),
    span,
  };
}
