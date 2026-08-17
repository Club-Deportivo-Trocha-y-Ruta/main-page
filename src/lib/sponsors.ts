/**
 * Lógica compartida de patrocinadores: identidad visual y progresión de cada
 * nivel, agrupación de los aliados actuales y las cifras que respaldan la
 * inversión de una marca ante quien todavía no ha firmado.
 *
 * Todo lo que se muestre en pantalla sale de `src/content/sponsors/*.md` o de
 * otras collections (`events`, `news`, `trees`); aquí solo se deriva y se
 * traduce a algo pintable. Nada de copys hardcodeados en la plantilla.
 */
import { buildSeason } from './calendar';

export type SponsorLevel = 'principal' | 'oficial' | 'aliado' | 'proveedor';

export interface SponsorLevelInfo {
  id: SponsorLevel;
  /** Nombre corto del nivel, para el encabezado de una tarjeta: "Principal". */
  label: string;
  /** Frase para agrupar a los aliados actuales: "Patrocinadores oficiales". */
  labelPlural: string;
  /** Icono Phosphor del nivel. */
  icon: string;
  /** Posición en la jerarquía visual: 1 = el nivel más alto. */
  order: number;
  /** Qué diferencia a este nivel del anterior en la progresión. */
  tagline: string;
  /**
   * Dónde aparece la marca en este nivel. Fuente: los beneficios que el club
   * ya tenía redactados — aquí solo se centralizan, nunca se inventan nuevos.
   */
  benefits: string[];
  /** Variable CSS del color del nivel: sirve para `style` inline. */
  color: string;
  /** Clase de texto que cumple contraste AA sobre fondos claros. */
  text: string;
  /** Fondo suave para chips e insignias. */
  soft: string;
  /** Fondo sólido para la insignia del nivel. */
  solid: string;
  /** Texto que va encima de `solid` cumpliendo contraste AA. */
  ink: string;
  /** Borde de la tarjeta del nivel. */
  border: string;
}

/**
 * La progresión visual acompaña la progresión de inversión: lima claro en el
 * nivel de entrada, hasta el teal profundo del patrocinador principal, que es
 * quien debe mandar sobre los demás en la página.
 */
export const SPONSOR_LEVELS: Record<SponsorLevel, SponsorLevelInfo> = {
  principal: {
    id: 'principal',
    label: 'Principal',
    labelPlural: 'Patrocinador principal',
    icon: 'ph:trophy-bold',
    order: 1,
    tagline: 'El nivel de mayor visibilidad: uniforme, eventos y reportes propios.',
    benefits: [
      'Logo destacado en el uniforme oficial',
      'Presencia en todos los eventos y competencias',
      'Logo prominente en el sitio web',
      'Menciones en redes sociales',
      'Banner en las competencias',
      'Reporte de impacto cada trimestre',
    ],
    color: 'var(--color-primary-deep)',
    text: 'text-primary-deep',
    soft: 'bg-primary-deep/10',
    solid: 'bg-primary-deep',
    ink: 'text-white',
    border: 'border-primary-deep',
  },
  oficial: {
    id: 'oficial',
    label: 'Oficial',
    labelPlural: 'Patrocinadores oficiales',
    icon: 'ph:seal-check-bold',
    order: 2,
    tagline: 'Presencia constante en el sitio y en los eventos más importantes.',
    benefits: [
      'Logo en el sitio web',
      'Presencia en los eventos principales',
      'Menciones en redes sociales',
      'Logo en el material promocional',
    ],
    color: 'var(--color-primary)',
    text: 'text-primary-deep',
    soft: 'bg-primary/12',
    solid: 'bg-primary',
    ink: 'text-surface-dark',
    border: 'border-primary',
  },
  aliado: {
    id: 'aliado',
    label: 'Aliado',
    labelPlural: 'Aliados',
    icon: 'ph:handshake-bold',
    order: 3,
    tagline: 'La puerta de entrada: tu logo ya rueda con el club.',
    benefits: ['Logo en el sitio web', 'Mención en redes sociales', 'Logo en el material impreso'],
    color: 'var(--color-accent)',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
    solid: 'bg-accent',
    ink: 'text-surface-dark',
    border: 'border-accent',
  },
  proveedor: {
    id: 'proveedor',
    label: 'Proveedor',
    labelPlural: 'Proveedores oficiales',
    icon: 'ph:briefcase-bold',
    order: 4,
    tagline: 'Reconocimiento oficial para quien mantiene al equipo en marcha.',
    benefits: [
      'Reconocimiento como proveedor oficial del club',
      'Logo en la sección de proveedores',
      'Mención en los eventos relevantes',
    ],
    color: 'var(--color-accent-light)',
    text: 'text-accent-deep',
    soft: 'bg-accent/10',
    solid: 'bg-accent-light',
    ink: 'text-surface-dark',
    border: 'border-accent-light',
  },
};

/** Del más alto al más bajo: el orden en el que se lee la progresión. */
export const SPONSOR_LEVEL_ORDER: SponsorLevel[] = ['principal', 'oficial', 'aliado', 'proveedor'];

export function getSponsorLevel(level: string): SponsorLevelInfo {
  return SPONSOR_LEVELS[level as SponsorLevel] ?? SPONSOR_LEVELS.aliado;
}

// ─── Filtro de publicación ─────────────────────────────────────────────────────

export interface SponsorFilterable {
  data: {
    draft: boolean;
    active: boolean;
    logo: string;
  };
}

/**
 * Un sponsor es publicable si no es borrador, está activo y su logo no es el
 * placeholder de demostración. Las tres condiciones vienen del contenido: hoy
 * descartan los tres patrocinadores ficticios marcados "no publicar" en
 * `src/content/sponsors/`.
 */
export function isPublishableSponsor<T extends SponsorFilterable>(sponsor: T): boolean {
  return !sponsor.data.draft && sponsor.data.active && !sponsor.data.logo.includes('placeholder');
}

// ─── Agrupación por nivel ──────────────────────────────────────────────────────

export interface SponsorGroup<T> {
  level: SponsorLevelInfo;
  sponsors: T[];
}

interface LevelledSponsor {
  data: { level: string; order: number };
}

/**
 * Agrupa los aliados actuales por nivel, en el orden jerárquico de
 * `SPONSOR_LEVEL_ORDER`. Un nivel sin sponsors no aparece: hoy no hay ningún
 * `proveedor` real, así que ese grupo se omite en vez de pintarse vacío.
 */
export function groupByLevel<T extends LevelledSponsor>(sponsors: T[]): SponsorGroup<T>[] {
  const buckets = new Map<SponsorLevel, T[]>();

  for (const sponsor of sponsors) {
    const level = getSponsorLevel(sponsor.data.level).id;
    const bucket = buckets.get(level);
    if (bucket) bucket.push(sponsor);
    else buckets.set(level, [sponsor]);
  }

  return SPONSOR_LEVEL_ORDER.filter((level) => (buckets.get(level)?.length ?? 0) > 0).map(
    (level) => ({
      level: SPONSOR_LEVELS[level],
      sponsors: [...(buckets.get(level) ?? [])].sort((a, b) => a.data.order - b.data.order),
    }),
  );
}

// ─── Antigüedad ────────────────────────────────────────────────────────────────

export interface SponsorTenure {
  /** Año de inicio, en UTC — mismo criterio que el resto del sitio para fechas
   *  del frontmatter (`coerce.date()` se parsea como medianoche UTC). */
  year: number;
  /** Años completos transcurridos desde el inicio. 0 el mismo año que empezó. */
  years: number;
  /** "Con el club desde 2020", lista para mostrar. */
  label: string;
}

/**
 * Antigüedad de un aliado a partir de `startDate`. `startDate` es opcional en
 * el schema, así que devuelve `null` cuando no está — la tarjeta omite el dato
 * en vez de inventar una fecha.
 */
export function sponsorSince(
  startDate: Date | undefined,
  now: Date = new Date(),
): SponsorTenure | null {
  if (!startDate) return null;

  const year = startDate.getUTCFullYear();
  const years = Math.max(0, now.getUTCFullYear() - year);

  return { year, years, label: `Con el club desde ${year}` };
}

// ─── Resumen de los aliados actuales ───────────────────────────────────────────

export interface SponsorsSummary {
  total: number;
  /** Año del aliado más antiguo, o `null` si ninguno trae `startDate`. */
  oldestYear: number | null;
}

/** Cifras de cabecera de la sección de aliados actuales. */
export function summarizeSponsors<T extends { data: { startDate?: Date } }>(
  sponsors: T[],
): SponsorsSummary {
  if (sponsors.length === 0) return { total: 0, oldestYear: null };

  const years = sponsors
    .map((s) => s.data.startDate?.getUTCFullYear())
    .filter((year): year is number => typeof year === 'number');

  return {
    total: sponsors.length,
    oldestYear: years.length > 0 ? Math.min(...years) : null,
  };
}

// ─── Evidencia de exposición ────────────────────────────────────────────────────

interface SeasonDatesInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

export interface EvidenceInput {
  /** Eventos de la temporada, ya sin `draft` (igual que en `/calendario`). */
  events: SeasonDatesInput[];
  /** Noticias publicadas, ya sin `draft`: aquí solo hace falta el conteo. */
  publishedStories: number;
  /** Árboles sembrados por Trocha Verde, ya sin `draft`: solo el conteo. */
  treesPlanted: number;
}

export interface SponsorEvidence {
  /** Fechas de competencia en la temporada en curso. */
  seasonDates: number | null;
  /** Año de esa temporada — para rotular la cifra anterior. */
  seasonYear: number | null;
  publishedStories: number | null;
  treesPlanted: number | null;
}

/**
 * Traduce tres collections del club en la evidencia que un patrocinador
 * necesita para entender dónde aparece su marca: cuántas fechas corre el
 * equipo, cuántas crónicas se publican y cuántos árboles lleva sembrados
 * Trocha Verde. Reutiliza `buildSeason()` para "cuántas fechas corre el club
 * en la temporada" en vez de reinventar qué año es la temporada en curso.
 *
 * Cada campo cae en `null` cuando la colección está vacía: el bloque
 * correspondiente no se pinta en vez de mostrar un cero.
 */
export function summarizeEvidence(input: EvidenceInput, now: Date = new Date()): SponsorEvidence {
  const season = buildSeason(input.events, now);

  return {
    seasonDates: season.total > 0 ? season.total : null,
    seasonYear: season.total > 0 ? season.year : null,
    publishedStories: input.publishedStories > 0 ? input.publishedStories : null,
    treesPlanted: input.treesPlanted > 0 ? input.treesPlanted : null,
  };
}
