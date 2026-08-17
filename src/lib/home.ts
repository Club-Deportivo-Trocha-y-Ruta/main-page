/**
 * Lógica compartida de la portada.
 *
 * La portada tenía dos problemas de datos, no de diseño:
 *
 * 1. La banda de cifras decía ser dinámica y no lo era. Calculaba
 *    `Math.max(<constante>, conteoDeLaColección)`, pero los cinco corredores
 *    están en `draft`, así que el conteo era 0 y la constante ganaba siempre.
 *    Código muerto disfrazado de dato vivo.
 * 2. Esa banda repetía dos cifras que `AboutPreview` ya mostraba más abajo
 *    —niños formados y medallas—: la misma afirmación sin respaldo, dos veces
 *    en la misma página.
 *
 * Aquí se arma lo que la portada sí puede sostener: cifras que salen del
 * contenido del sitio y que el lector puede comprobar haciendo clic. Cada una
 * viaja con su procedencia (`note`), que es la regla del sistema —toda cifra
 * sale del contenido— hecha visible.
 *
 * Las cifras históricas del club —80 niños formados, 100 medallas— se
 * eliminaron del sitio entero: no tenían fuente de verdad.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`. Recibe los datos por
 * parámetro, igual que `gallery.ts` o `contact.ts`.
 */
import { buildSeason } from './calendar';
import { summarizePrograms } from './programs';

// ─── Cifras verificables de la portada ──────────────────────────────────────

export interface ClubFigure {
  /** Identificador estable: sirve de `key` y para testear sin depender del texto. */
  id: 'years' | 'programs' | 'season' | 'trees';
  value: number;
  /** Sufijo pegado a la cifra. */
  unit?: string;
  label: string;
  /** De dónde sale el dato. Es la trazabilidad, hecha texto. */
  note: string;
  icon: string;
  /** A dónde va quien quiera comprobarlo. */
  href: string;
}

interface ProgramFigureInput {
  ageMin: number;
  ageMax: number;
  schedule?: string;
  maxStudents?: number;
}

interface SeasonFigureInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

export interface ClubFiguresInput {
  /** Años cumplidos del club (`getYearsActive()`). */
  years: number | null;
  programs: ProgramFigureInput[];
  events: SeasonFigureInput[];
  /** Árboles del inventario Trocha Verde. */
  trees: number | null;
  now?: Date;
}

/**
 * Las cifras de la banda de credibilidad, en orden fijo.
 *
 * Cada una se cae por separado si el contenido no la sostiene: sin programas
 * publicados no hay cifra de programas, y la banda se pinta con las que
 * queden. Nunca se rellena un hueco con texto inventado.
 */
export function buildClubFigures({
  years,
  programs,
  events,
  trees,
  now = new Date(),
}: ClubFiguresInput): ClubFigure[] {
  const figures: ClubFigure[] = [];

  if (years !== null && years > 0) {
    figures.push({
      id: 'years',
      value: years,
      label: years === 1 ? 'año formando ciclistas' : 'años formando ciclistas',
      note: 'Desde mayo de 2010, en Yumbo',
      icon: 'ph:flag-banner-bold',
      href: '/quienes-somos',
    });
  }

  const totals = summarizePrograms(programs);
  if (totals.programs > 0) {
    figures.push({
      id: 'programs',
      value: totals.programs,
      label: totals.programs === 1 ? 'programa de formación' : 'programas de formación',
      // La edad de entrada (4 años) ya la dan el hero y `/programas`, derivada
      // de la colección. Aquí la nota aporta lo que no se dice en otro sitio:
      // cuántas sesiones semanales suman los tres programas.
      note:
        totals.weeklySessions !== null
          ? `${totals.weeklySessions} sesiones a la semana entre todos`
          : 'De la iniciación al alto rendimiento',
      icon: 'ph:path-bold',
      href: '/programas',
    });
  }

  const season = buildSeason(events, now);
  if (season.total > 0) {
    figures.push({
      id: 'season',
      value: season.total,
      label: season.total === 1 ? 'fecha en el calendario' : 'fechas en el calendario',
      note: `Temporada ${season.year}: ${season.completed} ya corridas`,
      icon: 'ph:calendar-dots-bold',
      href: '/calendario',
    });
  }

  if (trees !== null && trees > 0) {
    figures.push({
      id: 'trees',
      value: trees,
      label: trees === 1 ? 'árbol sembrado' : 'árboles sembrados',
      note: 'Inventario de Trocha Verde, uno por uno',
      icon: 'ph:tree-bold',
      href: '/trocha-verde',
    });
  }

  return figures;
}

// ─── El pulso del hero ──────────────────────────────────────────────────────

export interface HeroPulse {
  /** La carrera es hoy. */
  today: boolean;
  /** "20 de sep" o "hoy". */
  when: string;
  /** La ciudad, que es como se nombra la válida. */
  where: string;
  title: string;
}

/**
 * Lo que está pasando en el club, para que el hero no sea un cartel fijo.
 *
 * Sale de `buildSeason()` —la misma derivación de `/calendario` y de
 * `/enlaces`—, así que las tres páginas nunca se contradicen. Devuelve `null`
 * cuando ya corrió toda la temporada: entonces el hero se queda como estaba,
 * sin anunciar un "próximamente" que nadie escribió.
 */
export function heroPulse(events: SeasonFigureInput[], now: Date = new Date()): HeroPulse | null {
  const { next } = buildSeason(events, now);
  if (!next) return null;

  const today = next.status === 'ongoing';

  return {
    today,
    when: today ? 'Hoy' : `${next.day} de ${next.month}`,
    where: next.event.data.city ?? '',
    title: next.event.data.title,
  };
}
