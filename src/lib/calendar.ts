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
  'xco' | 'xcm' | 'dh' | 'ruta' | 'enduro' | 'recreativo' | 'social' | 'entrenamiento';

export type EventLevel =
  'municipal' | 'departamental' | 'regional' | 'nacional' | 'internacional' | 'interno';

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
  dh: { label: 'Descenso (downhill)', short: 'DH', icon: 'ph:trend-down-bold' },
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

const CLUB_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLUB_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * Hora de ahora mismo en la zona del club, como `HH:MM` de 24 horas.
 *
 * Va en 24 horas y con ceros a la izquierda por lo mismo que las fechas van en
 * `AAAA-MM-DD`: así dos horas se comparan como texto (`'07:00' < '16:30'`) sin
 * construir un `Date` intermedio ni volver a pensar en el huso. Lo que se lee
 * en pantalla lo formatea quien lo pinte.
 */
export function clubTimeOfDay(now: Date = new Date()): string {
  return CLUB_CLOCK.format(now);
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

const DAY_MONTH_YEAR = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const DAY_MONTH = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/**
 * Fecha larga de un evento, en prosa y en UTC (como se escribió):
 * «18 de octubre de 2026», «7 y 8 de noviembre de 2026» (días seguidos),
 * «7 al 9 de noviembre de 2026» o, si cruza de mes, «30 de octubre al 1 de
 * noviembre de 2026». Un `endDate` del mismo día se trata como un solo día.
 */
export function longDateRange(date: Date, endDate?: Date): string {
  if (!endDate || eventDay(endDate) === eventDay(date)) return DAY_MONTH_YEAR.format(date);
  const sameMonth =
    endDate.getUTCFullYear() === date.getUTCFullYear() &&
    endDate.getUTCMonth() === date.getUTCMonth();
  if (!sameMonth) return `${DAY_MONTH.format(date)} al ${DAY_MONTH_YEAR.format(endDate)}`;
  const joiner = endDate.getUTCDate() - date.getUTCDate() === 1 ? 'y' : 'al';
  return `${date.getUTCDate()} ${joiner} ${DAY_MONTH_YEAR.format(endDate)}`;
}

export interface SeasonStop<T> {
  event: T;
  id: string;
  /** Nombre corto de la parada: la ciudad, que es como la nombra todo el mundo. */
  label: string;
  /**
   * Segunda línea que dice cuál de las dos es, cuando la temporada pasa más de
   * una vez por la misma ciudad. `null` el resto del tiempo: en un riel donde
   * cada ciudad aparece una sola vez, repetir el tipo de fecha es ruido.
   */
  qualifier: string | null;
  day: string;
  month: string;
  /** La fecha en prosa («1 y 2 de agosto de 2026»), para lectores de pantalla. */
  dateLabel: string;
  status: EventStatus;
  /** Posición del punto en la barra, en % del ancho total. */
  pct: number;
}

/**
 * Un mes del año de la temporada, con sus paradas.
 *
 * El riel de una parada por fecha crecía con cada evento que se agregaba hasta
 * no caber en la pantalla. El año, en cambio, siempre tiene doce meses: agrupar
 * por mes deja el dibujo de un tamaño fijo, por muchas fechas que tenga la
 * temporada, y además muestra el ritmo real del año (los meses sin carrera
 * también cuentan).
 */
export interface SeasonMonth<T> {
  /** 0 = enero. */
  index: number;
  /** "ene", "sept": el rótulo corto, como el de cada parada. */
  short: string;
  /** "enero": el nombre completo, para lectores de pantalla. */
  name: string;
  stops: SeasonStop<T>[];
  /**
   * Cuánto del mes ya pasó, de 0 a 1, contado hasta hoy en la zona del club.
   * Los meses de un año ya cerrado valen 1 y los de uno por venir, 0.
   */
  elapsed: number;
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
  /** Los doce meses del año de la temporada, de enero a diciembre. */
  months: SeasonMonth<T>[];
}

const MONTH_LONG = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' });

/** Fracción del mes `index` de `year` que ya pasó a la fecha `today` (`AAAA-MM-DD`). */
function monthElapsed(year: number, index: number, today: string): number {
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  if (year !== todayYear) return year < todayYear ? 1 : 0;
  if (index !== todayMonth - 1) return index < todayMonth - 1 ? 1 : 0;
  const daysInMonth = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  return Math.round((todayDay / daysInMonth) * 10000) / 10000;
}

interface SeasonInput {
  id: string;
  data: {
    title: string;
    shortName?: string;
    date: Date;
    endDate?: Date;
    city?: string;
    status?: string;
  };
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

  // La ciudad identifica la válida mejor que el título completo, pero no siempre
  // basta: el club corre dos veces en Yumbo y dos en Ginebra el mismo año, y dos
  // paradas con el mismo rótulo se leen como una fecha repetida. Donde la ciudad
  // vuelve, la parada añade su `shortName` para decir cuál de las dos es.
  const labelOf = (event: T) => event.data.city ?? event.data.title;
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const event of inSeason) {
    const label = labelOf(event);
    if (seen.has(label)) repeated.add(label);
    seen.add(label);
  }

  const stops: SeasonStop<T>[] = inSeason.map((event, index) => ({
    event,
    id: event.id,
    // ("VI Válida Copa Valle 2026 - Roldanillo" no cabe en un punto.)
    label: labelOf(event),
    qualifier: repeated.has(labelOf(event)) ? (event.data.shortName ?? null) : null,
    day: dayLabel(event.data.date, event.data.endDate),
    month: monthShort(event.data.date),
    dateLabel: longDateRange(event.data.date, event.data.endDate),
    status: resolveEventStatus(event.data, now),
    // Los puntos se reparten en el centro de su tramo.
    pct: Math.round(((index + 0.5) / inSeason.length) * 10000) / 100,
  }));

  const completed = stops.filter((s) => s.status === 'past' || s.status === 'ongoing').length;
  const cancelled = stops.filter((s) => s.status === 'cancelled').length;

  // Cada parada va en el mes en que arranca: una fecha del 31 de julio al 2 de
  // agosto se anuncia en julio, que es cuando hay que estar allá.
  const today = clubToday(now);
  const months: SeasonMonth<T>[] = Array.from({ length: 12 }, (_, index) => {
    const first = new Date(Date.UTC(year, index, 1));
    return {
      index,
      short: monthShort(first),
      name: MONTH_LONG.format(first),
      stops: stops.filter((stop) => stop.event.data.date.getUTCMonth() === index),
      elapsed: monthElapsed(year, index, today),
    };
  });

  return {
    year,
    stops,
    completed,
    total: stops.length,
    cancelled,
    progressPct: stops.length === 0 ? 0 : Math.round((completed / stops.length) * 10000) / 100,
    next: stops.find((s) => s.status === 'upcoming' || s.status === 'ongoing') ?? null,
    months,
  };
}

/**
 * Las fechas canceladas que todavía no han pasado, en orden.
 *
 * Una válida cancelada no compite por ser "la próxima" —el orden se leería
 * torcido—, pero tampoco puede desaparecer: quien ya la tenía apuntada necesita
 * enterarse. Las de meses atrás, no. El corte va por día (`AAAA-MM-DD` en la
 * zona del club, igual que todo este módulo) y no por milisegundos: comparar
 * contra `Date.now()` descartaría la fecha del día mismo desde las 7 p.m. del
 * día anterior en Bogotá, porque el frontmatter es medianoche UTC.
 *
 * Vive aquí y no en cada página porque la portada y `/calendario` muestran la
 * misma lista y no pueden discrepar.
 */
export function cancelledAhead<T extends SeasonInput>(events: T[], now: Date = new Date()): T[] {
  const today = clubToday(now);

  return events
    .filter(
      (event) =>
        resolveEventStatus(event.data, now) === 'cancelled' &&
        eventDay(event.data.endDate ?? event.data.date) >= today,
    )
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}
