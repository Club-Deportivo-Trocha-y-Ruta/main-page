/**
 * Lógica compartida de `/enlaces`, el linktree del QR.
 *
 * Esta página es la que se abre cuando alguien escanea el código impreso en un
 * afiche, en la camiseta del equipo o en el pendón del club **en plena
 * carrera**. Quien la mira está de pie, con datos móviles y treinta segundos.
 *
 * De ahí lo que se deriva aquí: lo que viene (la próxima fecha real de la
 * temporada, que la página no sabía) y las cifras del club, que estaban
 * escritas a mano —una de ellas, "Yumbo / Valle del Cauca", ni siquiera era
 * una cifra: era la dirección repetida del pie de página—.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`. Recibe los datos y el
 * "ahora" por parámetro, igual que `gallery.ts` o `calendar.ts`.
 */
import { buildSeason } from './calendar';

// ─── Lo que viene ───────────────────────────────────────────────────────────

interface RaceInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

export interface NextRace {
  id: string;
  title: string;
  /** La ciudad, que es como todo el mundo nombra la válida. */
  city: string | null;
  /** Día del mes, o "1-2" si dura varios días. */
  day: string;
  /** Mes abreviado: "sep". */
  month: string;
  /** La carrera es hoy: quien escanea el QR probablemente está ahí mismo. */
  today: boolean;
}

/**
 * La próxima parada de la temporada, vía `buildSeason()` — la misma derivación
 * que usa `/calendario`, para que las dos páginas nunca se contradigan.
 *
 * Devuelve `null` cuando ya corrió todo o no hay eventos publicados: la página
 * simplemente no pinta el bloque, en vez de anunciar un "próximamente" vacío.
 */
export function nextRace(events: RaceInput[], now: Date = new Date()): NextRace | null {
  const { next } = buildSeason(events, now);
  if (!next) return null;

  return {
    id: next.id,
    title: next.event.data.title,
    city: next.event.data.city ?? null,
    day: next.day,
    month: next.month,
    today: next.status === 'ongoing',
  };
}

// ─── En qué punto va el año ─────────────────────────────────────────────────

export interface SeasonProgress {
  year: number;
  /** Fechas ya corridas, incluida la que está en curso. */
  completed: number;
  total: number;
}

/**
 * El avance de la temporada, para contarlo en una línea. `null` cuando el año
 * no tiene fechas publicadas.
 */
export function seasonProgress(events: RaceInput[], now: Date = new Date()): SeasonProgress | null {
  const season = buildSeason(events, now);
  if (season.total === 0) return null;

  return { year: season.year, completed: season.completed, total: season.total };
}

// ─── Las cifras ─────────────────────────────────────────────────────────────

export interface LinktreeStat {
  value: number;
  unit?: string;
  label: string;
}

export interface LinktreeStatsInput {
  /** Años cumplidos del club (`getYearsActive()`). */
  years: number | null;
  /** Corredores formados (`CLUB_STATS.ridersTrained`). */
  riders: number | null;
  /** Árboles sembrados (`summarizeTrees()`). */
  trees: number | null;
}

/**
 * Las tres cifras de cabecera. Solo entra lo que el contenido sostiene: una
 * cifra que no se puede calcular no se rellena con texto, se cae y quedan las
 * demás.
 */
export function linktreeStats({ years, riders, trees }: LinktreeStatsInput): LinktreeStat[] {
  const stats: LinktreeStat[] = [];

  if (years !== null && years > 0) {
    stats.push({ value: years, label: years === 1 ? 'año formando' : 'años formando' });
  }
  if (riders !== null && riders > 0) {
    stats.push({ value: riders, unit: '+', label: 'corredores' });
  }
  if (trees !== null && trees > 0) {
    stats.push({ value: trees, label: trees === 1 ? 'árbol sembrado' : 'árboles sembrados' });
  }

  return stats;
}
