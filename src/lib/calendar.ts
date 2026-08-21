/**
 * Lógica compartida del calendario del club.
 *
 * El calendario no es una lista de fechas: es una temporada con un antes y un
 * después. Aquí se deriva en qué punto va —qué se corrió, qué sigue— y se
 * traducen los valores del schema a algo legible.
 *
 * (Ojo con el nombre: `events.ts` es el catálogo de analytics, no esto.)
 *
 * Las fechas del frontmatter (AAAA-MM-DD) se parsean como medianoche UTC; el
 * "hoy" se calcula en la zona del club. Comparar días como texto `AAAA-MM-DD`
 * evita toda la aritmética de husos.
 */

export type EventCategory =
  | 'xco'
  | 'xcm'
  | 'ruta'
  | 'enduro'
  | 'recreativo'
  | 'social'
  | 'entrenamiento';

export type EventLevel =
  | 'municipal'
  | 'departamental'
  | 'regional'
  | 'nacional'
  | 'internacional'
  | 'interno';

export type EventStatus = 'upcoming' | 'ongoing' | 'past' | 'cancelled';

/** Zona horaria del club: define qué día es "hoy" para el calendario. */
export const CLUB_TIME_ZONE = 'America/Bogota';

export interface CategoryStyle {
  /** Nombre completo, para leer sin conocer la sigla. */
  label: string;
  /** Sigla para espacios estrechos. */
  short: string;
  icon: string;
}

/**
 * Las categorías del schema son siglas de la disciplina. Hasta ahora se pasaban
 * por `getCategoryLabel()` de utils, que traduce categorías de corredores
 * (infantil, juvenil…), así que salían en crudo y en minúscula.
 */
export const EVENT_CATEGORIES: Record<EventCategory, CategoryStyle> = {
  xco: { label: 'Cross Country olímpico', short: 'XCO', icon: 'ph:mountains-bold' },
  xcm: { label: 'Maratón de montaña', short: 'XCM', icon: 'ph:path-bold' },
  ruta: { label: 'Ciclismo de ruta', short: 'Ruta', icon: 'ph:road-horizon-bold' },
  enduro: { label: 'Enduro', short: 'Enduro', icon: 'ph:mountains-bold' },
  recreativo: {
    label: 'Rodada recreativa',
    short: 'Recreativa',
    icon: 'ph:person-simple-bike-bold',
  },
  social: { label: 'Jornada social', short: 'Social', icon: 'ph:hand-heart-bold' },
  entrenamiento: { label: 'Entrenamiento', short: 'Entreno', icon: 'ph:barbell-bold' },
};

export const EVENT_LEVELS: Record<EventLevel, string> = {
  municipal: 'Municipal',
  departamental: 'Departamental',
  regional: 'Regional',
  nacional: 'Nacional',
  internacional: 'Internacional',
  interno: 'Interno del club',
};

export const EVENT_STATUS: Record<EventStatus, string> = {
  upcoming: 'Próximo',
  ongoing: 'En curso',
  past: 'Corrido',
  cancelled: 'Cancelado',
};

export function getEventCategory(category: string): CategoryStyle {
  return EVENT_CATEGORIES[category as EventCategory] ?? EVENT_CATEGORIES.xco;
}

export function getEventLevel(level: string | undefined): string | null {
  return level ? (EVENT_LEVELS[level as EventLevel] ?? null) : null;
}

export function getEventStatusLabel(status: string): string {
  return EVENT_STATUS[status as EventStatus] ?? EVENT_STATUS.upcoming;
}

// ─── Estado real de un evento ─────────────────────────────────────────────────

const UTC_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'UTC',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const CLUB_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLUB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Día del evento como `AAAA-MM-DD`, leído en UTC igual que se escribió. */
export function eventDay(date: Date): string {
  return UTC_DAY.format(date);
}

/** Día de hoy en la zona del club, como `AAAA-MM-DD`. */
export function clubToday(now: Date = new Date()): string {
  return CLUB_DAY.format(now);
}

export interface EventDates {
  date: Date;
  endDate?: Date;
  status?: string;
}

/**
 * Estado real del evento a día de hoy.
 *
 * El `status` del frontmatter es manual y se queda viejo: un evento del sábado
 * pasado seguiría anunciándose como próximo hasta que alguien edite el archivo.
 * Se deriva de la fecha y solo se respeta `cancelled`, que no se puede deducir.
 */
export function resolveEventStatus(event: EventDates, now: Date = new Date()): EventStatus {
  if (event.status === 'cancelled') return 'cancelled';

  const today = clubToday(now);
  const start = eventDay(event.date);
  const end = event.endDate ? eventDay(event.endDate) : start;

  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'ongoing';
}

// ─── La temporada ─────────────────────────────────────────────────────────────

const DAY = new Intl.DateTimeFormat('es-CO', { day: 'numeric', timeZone: 'UTC' });
const MONTH_SHORT = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' });

/** "26" o "1-2" cuando el evento dura varios días del mismo mes. */
export function dayLabel(date: Date, endDate?: Date): string {
  const sameMonth =
    endDate &&
    endDate.getUTCFullYear() === date.getUTCFullYear() &&
    endDate.getUTCMonth() === date.getUTCMonth();
  return sameMonth ? `${DAY.format(date)}-${DAY.format(endDate)}` : DAY.format(date);
}

/** "sep" — algunos entornos añaden un punto al mes abreviado; se descarta. */
export function monthShort(date: Date): string {
  return MONTH_SHORT.format(date).replace('.', '');
}

export interface SeasonStop<T> {
  event: T;
  id: string;
  /** Nombre corto de la parada: la ciudad, que es como la nombra todo el mundo. */
  label: string;
  day: string;
  month: string;
  status: EventStatus;
  /** Posición del punto en la barra, en % del ancho total. */
  pct: number;
}

export interface Season<T> {
  year: number;
  stops: SeasonStop<T>[];
  /** Fechas ya corridas (incluye la que está en curso). */
  completed: number;
  total: number;
  /** Fechas del calendario que se cayeron. Se siguen pintando, pero no se corren. */
  cancelled: number;
  /** Avance de la temporada en %, para pintar la barra. */
  progressPct: number;
  next: SeasonStop<T> | null;
}

interface SeasonInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

/**
 * Arma la temporada en curso: las fechas de un año, en orden, con el punto
 * donde va el club. Se toma el año de hoy si tiene eventos; si no, el más
 * reciente que los tenga —así la página no queda vacía en enero.
 */
export function buildSeason<T extends SeasonInput>(events: T[], now: Date = new Date()): Season<T> {
  const currentYear = Number(clubToday(now).slice(0, 4));
  const years = new Set(events.map((e) => e.data.date.getUTCFullYear()));
  const year = years.has(currentYear)
    ? currentYear
    : ([...years].sort((a, b) => b - a)[0] ?? currentYear);

  const inSeason = events
    .filter((event) => event.data.date.getUTCFullYear() === year)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());

  const stops: SeasonStop<T>[] = inSeason.map((event, index) => ({
    event,
    id: event.id,
    // La ciudad identifica la válida mejor que el título completo
    // ("VI Válida Copa Valle 2026 - Roldanillo" no cabe en un punto).
    label: event.data.city ?? event.data.title,
    day: dayLabel(event.data.date, event.data.endDate),
    month: monthShort(event.data.date),
    status: resolveEventStatus(event.data, now),
    // Los puntos se reparten en el centro de su tramo.
    pct: Math.round(((index + 0.5) / inSeason.length) * 10000) / 100,
  }));

  const completed = stops.filter((s) => s.status === 'past' || s.status === 'ongoing').length;
  const cancelled = stops.filter((s) => s.status === 'cancelled').length;

  return {
    year,
    stops,
    completed,
    total: stops.length,
    cancelled,
    progressPct: stops.length === 0 ? 0 : Math.round((completed / stops.length) * 10000) / 100,
    next: stops.find((s) => s.status === 'upcoming' || s.status === 'ongoing') ?? null,
  };
}
