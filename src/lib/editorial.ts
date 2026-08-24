/**
 * Sistema editorial — contrato visual único para todas las secciones del sitio.
 *
 * La idea: una sección no se inventa clases, elige variantes. Toda sección se
 * arma con las mismas cuatro piezas —marco, entrada narrativa, dato ilustrado y
 * paso siguiente— y los tokens de cada pieza viven aquí. Cuando una página se
 * rediseña, se traduce a este vocabulario en vez de escribir CSS nuevo.
 *
 * Componentes que consumen estos tokens: `src/components/editorial/*`.
 * Guía de uso y checklist: `docs/04-sistema-editorial.md`.
 */

/** Fondo sobre el que se apoya la sección. */
export type SectionTone = 'plain' | 'muted' | 'tinted' | 'dark' | 'brand';

/** Textura decorativa de fondo. `topo` = curvas de nivel (mapa de montaña). */
export type SectionPattern = 'none' | 'topo';

/** Ancho del contenido. El marco siempre ocupa el ancho completo. */
export type SectionWidth = 'narrow' | 'default' | 'wide';

/** Aire vertical de la sección. */
export type SectionSpacing = 'none' | 'compact' | 'default' | 'spacious';

export interface ToneTokens {
  /** Fondo + color de texto base del `<section>`. */
  surface: string;
  /** Titulares. */
  heading: string;
  /** Texto de apoyo: lead, descripciones, etiquetas. */
  muted: string;
  /** Antetítulo (eyebrow). */
  eyebrow: string;
  /** Hairline: bordes y separadores coherentes con el fondo. */
  hairline: string;
  /** Superficie de las tarjetas que van encima de este fondo. */
  card: string;
  /** Color del patrón decorativo (ya incluye su opacidad). */
  pattern: string;
  /** true cuando el fondo es oscuro: las ilustraciones deben invertirse. */
  inverted: boolean;
}

/**
 * Los tonos de marca (`brand`) llevan texto grafito, no blanco: el teal #20b7c9
 * solo alcanza 2.4:1 contra blanco y no cumple WCAG AA. Misma razón por la que
 * en fondos claros el eyebrow usa los tonos `-deep`.
 */
export const SECTION_TONES: Record<SectionTone, ToneTokens> = {
  plain: {
    surface: 'bg-surface text-text-primary',
    heading: 'text-text-primary',
    muted: 'text-text-secondary',
    eyebrow: 'text-primary-deep',
    hairline: 'border-black/10',
    card: 'bg-surface',
    pattern: 'text-primary/14',
    inverted: false,
  },
  muted: {
    surface: 'bg-surface-tint text-text-primary',
    heading: 'text-text-primary',
    muted: 'text-text-secondary',
    eyebrow: 'text-primary-deep',
    hairline: 'border-black/10',
    card: 'bg-surface',
    pattern: 'text-primary/16',
    inverted: false,
  },
  tinted: {
    surface: 'bg-gradient-to-br from-primary/10 via-surface to-accent/10 text-text-primary',
    heading: 'text-text-primary',
    muted: 'text-text-secondary',
    eyebrow: 'text-primary-deep',
    hairline: 'border-primary/15',
    card: 'bg-surface',
    pattern: 'text-primary/14',
    inverted: false,
  },
  dark: {
    surface: 'bg-surface-dark text-white',
    heading: 'text-white',
    muted: 'text-white/75',
    eyebrow: 'text-accent-light',
    hairline: 'border-white/15',
    card: 'bg-white/5',
    pattern: 'text-white/15',
    inverted: true,
  },
  brand: {
    surface: 'bg-primary text-surface-dark',
    heading: 'text-surface-dark',
    muted: 'text-surface-dark/80',
    eyebrow: 'text-surface-dark',
    hairline: 'border-surface-dark/20',
    card: 'bg-surface',
    pattern: 'text-surface-dark/15',
    inverted: false,
  },
};

export const SECTION_WIDTHS: Record<SectionWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export const SECTION_SPACING: Record<SectionSpacing, string> = {
  none: '',
  compact: 'py-12 md:py-16',
  default: 'py-16 md:py-24',
  spacious: 'py-20 md:py-32',
};

export function getTone(tone: SectionTone | undefined): ToneTokens {
  return SECTION_TONES[tone as SectionTone] ?? SECTION_TONES.plain;
}

export function getWidth(width: SectionWidth | undefined): string {
  return SECTION_WIDTHS[width as SectionWidth] ?? SECTION_WIDTHS.default;
}

export function getSpacing(spacing: SectionSpacing | undefined): string {
  return SECTION_SPACING[spacing as SectionSpacing] ?? SECTION_SPACING.default;
}

let svgSeq = 0;

/**
 * Identificador único para `<pattern>`, `<clipPath>` y demás `defs` de SVG.
 *
 * Dos secciones con la misma textura en una página no pueden compartir el id.
 * El contador vive aquí porque el frontmatter de un `.astro` se ejecuta en cada
 * render y no tiene ámbito de módulo propio.
 */
export function uniqueSvgId(prefix: string): string {
  svgSeq += 1;
  return `${prefix}-${svgSeq}`;
}

/**
 * Curvas de nivel para el patrón `topo`.
 *
 * Dos reglas para que el mosaico no se note: cada trazo entra y sale del tile a
 * la misma altura (no hay costura horizontal) y ningún punto de control se sale
 * del tile, porque `<pattern>` recorta lo que sobra. El espaciado entre curvas
 * sí es irregular —así se leen como curvas de nivel de un mapa y no como papel
 * rayado—, cuidando que el salto entre la última y la primera del siguiente
 * tile quede dentro del mismo rango.
 */
export const TOPO_TILE = 160;

export const TOPO_PATHS = [
  'M0 18 C 32 6, 74 30, 160 18',
  'M0 46 C 44 60, 96 32, 160 46',
  'M0 70 C 28 58, 88 84, 160 70',
  'M0 104 C 52 118, 104 88, 160 104',
  'M0 132 C 36 120, 92 146, 160 132',
] as const;

export interface ElevationOptions {
  /** Ancho del viewBox. */
  width?: number;
  /** Alto del viewBox. */
  height?: number;
  /** Número de muestras del perfil. Más muestras = curva más suave. */
  samples?: number;
}

export interface ElevationProfile {
  /** Trazo del terreno, de izquierda a derecha. */
  line: string;
  /** Mismo trazo cerrado contra el suelo, para rellenar por tramos. */
  area: string;
  /** Coordenada Y del suelo. */
  base: number;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Altura del terreno en el punto `t` (0 = inicio, 1 = final del recorrido). */
function terrainY(t: number, height: number): number {
  const base = height - height * 0.02;
  // easeInOutCubic: arranca suave, empina en la mitad, se asienta al final.
  const eased = t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
  // La ondulación crece con la altura: el terreno se vuelve más quebrado.
  const wave = Math.sin(t * Math.PI * 6) * height * 0.055 * (0.35 + 0.65 * t);
  return Math.min(Math.max(base - eased * (height * 0.72) - wave, height * 0.02), base);
}

/**
 * Perfil de elevación: la metáfora visual del sistema. Sube de izquierda a
 * derecha con ondulaciones de terreno, así que sirve para ilustrar cualquier
 * progresión (edades, temporada, crecimiento de una siembra) sin depender de
 * una librería de gráficos.
 *
 * El SVG que lo pinta se estira con `preserveAspectRatio="none"`, por eso el
 * viewBox es solo una escala de trabajo y no una proporción real.
 */
export function elevationProfile({
  width = 1000,
  height = 260,
  samples = 96,
}: ElevationOptions = {}): ElevationProfile {
  const base = round(height - height * 0.02);
  const points: string[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push(`${round(t * width)} ${round(terrainY(t, height))}`);
  }

  const line = `M${points.join(' L')}`;
  return { line, area: `${line} L${width} ${base} L0 ${base} Z`, base };
}

/**
 * Posición de un punto del perfil en porcentaje del recuadro que lo contiene.
 *
 * Los marcadores (hitos, banderas) se dibujan en HTML y no dentro del SVG: así
 * el texto no se deforma cuando el perfil se estira. Para colocarlos basta con
 * `left: x%` y `top: y%` sobre el mismo recuadro.
 */
export function elevationPointAt(
  t: number,
  { height = 260 }: Pick<ElevationOptions, 'height'> = {}
): { xPct: number; yPct: number } {
  const clamped = Math.min(Math.max(t, 0), 1);
  return {
    xPct: round(clamped * 100),
    yPct: round((terrainY(clamped, height) / height) * 100),
  };
}
