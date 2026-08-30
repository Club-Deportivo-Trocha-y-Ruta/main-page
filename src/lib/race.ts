/**
 * Lógica derivada de la ficha de una válida (`/calendario/[slug]`).
 *
 * La página responde las preguntas de quien viene de otro municipio —cuándo,
 * dónde, cuánto mide el circuito, cuánto cuesta, hasta cuándo hay plazo— y para
 * eso cruza el evento con las crónicas y con el resto de la temporada.
 *
 * Puro, como el resto de `src/lib`: recibe arreglos por parámetro y no importa
 * `astro:content` ni `node:fs`. Las fechas del frontmatter son medianoche UTC,
 * así que todo lo que compare días lo hace con los getters `getUTC*` o con los
 * helpers de `@lib/calendar`.
 */

import {
  eventDay,
  formatCop,
  getEventCategory,
  getEventLevel,
  resolveEventStatus,
  type EventStatus,
} from './calendar';

const KM = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** `3.8` → `3,8`. En español colombiano el separador decimal es la coma. */
export function formatKm(value: number): string {
  return KM.format(value);
}

export interface RaceFact {
  icon: string;
  label: string;
  value: string;
}

export interface RaceCategory {
  name: string;
  group?: string;
  startTime?: string;
  ageMin?: number;
  ageMax?: number;
  laps?: number;
  course?: string;
}

export interface RaceScheduleItem {
  time: string;
  title: string;
  place?: string;
}

export interface RaceEventData {
  title: string;
  date: Date;
  endDate?: Date;
  location: string;
  city?: string;
  department?: string;
  category: string;
  level?: string;
  organizer?: string;
  status?: string;
  slug?: string;
  registrationDeadline?: Date;
  relatedNews?: string[];
  circuit?: { distanceKm: number; laps?: number; surface?: string };
  fees?: { label: string; amount: number }[];
  capacity?: number;
  categories?: RaceCategory[];
  schedule?: RaceScheduleItem[];
}

export interface RaceEvent {
  id: string;
  data: RaceEventData;
}

export interface ChronicleEntry {
  id: string;
  data: { title: string; draft?: boolean; relatedEvent?: string };
}

export interface RaceLink {
  href: string;
  title: string;
}

/**
 * Crónicas publicadas de una válida.
 *
 * La relación está escrita en las dos direcciones y ninguna es redundante: la
 * noticia apunta al evento (`relatedEvent`, que es el campo que llenan los
 * editores) y el evento lista sus noticias (`relatedNews`). Se cruzan las dos y
 * se deduplica por id, porque una crónica puede estar declarada en ambas.
 *
 * Las referencias que no resuelven se descartan en silencio: la regla del
 * proyecto es no armar nunca una URL desde un campo sin comprobar que existe.
 */
export function chroniclesOf(event: RaceEvent, news: ChronicleEntry[]): RaceLink[] {
  const published = news.filter((article) => !article.data.draft);
  const byId = new Map(published.map((article) => [article.id, article]));
  const found = new Map<string, RaceLink>();

  for (const article of published) {
    if (article.data.relatedEvent === event.id) {
      found.set(article.id, { href: `/noticias/${article.id}`, title: article.data.title });
    }
  }

  for (const id of event.data.relatedNews ?? []) {
    const article = byId.get(id);
    if (article) found.set(id, { href: `/noticias/${id}`, title: article.data.title });
  }

  return [...found.values()];
}

/**
 * Las demás fechas de la misma temporada, las más cercanas a esta primero.
 *
 * Sirve al que ya está mirando una válida y quiere saber qué más hay. Se
 * limitan a un año para que la ficha de 2027 no arrastre la temporada de 2026,
 * y se excluye la que se está viendo.
 *
 * El criterio es la **cercanía en el calendario**, no el orden de la temporada:
 * ordenar de enero a diciembre y cortar los cuatro primeros hacía que las diez
 * fichas enlazaran siempre al mismo arranque del año, y en la segunda mitad de
 * la temporada el bloque solo podía mostrar carreras ya corridas. Se ordena por
 * distancia a la fecha de esta válida y después se devuelve el recorte en orden
 * de calendario, que es como se lee una lista de fechas.
 */
export function otherDates<T extends RaceEvent>(
  event: T,
  events: T[],
  limit = 4,
): { event: T; status: EventStatus }[] {
  const year = event.data.date.getUTCFullYear();
  const pivot = event.data.date.getTime();

  return events
    .filter((other) => other.id !== event.id && other.data.date.getUTCFullYear() === year)
    .sort(
      (a, b) => Math.abs(a.data.date.getTime() - pivot) - Math.abs(b.data.date.getTime() - pivot)
    )
    .slice(0, limit)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
    .map((other) => ({ event: other, status: resolveEventStatus(other.data) }));
}

/**
 * ¿Sigue abierto el plazo de inscripción?
 *
 * `null` cuando no se puede afirmar nada: el evento está por venir y nadie ha
 * publicado fecha de cierre. No es lo mismo "no hay plazo publicado" que "el
 * plazo se venció", y la página tiene que poder distinguirlos para no anunciar
 * un cierre que nadie confirmó.
 *
 * El estado se mira **antes** que el plazo. Una válida cancelada o ya corrida no
 * admite inscripciones aunque su frontmatter no declare `registrationDeadline`,
 * y al revés estaba: el early-return por falta de plazo devolvía `null` y la
 * ficha lo leía como "no hay plazo publicado", dejando el CTA de inscripción a
 * la vista en una carrera que ya pasó.
 *
 * El corte va por día y no por milisegundos, igual que en `@lib/calendar`: el
 * frontmatter es medianoche UTC y comparar contra la hora exacta cerraría las
 * inscripciones la tarde anterior en Bogotá.
 */
export function registrationOpen(data: RaceEventData, today: string): boolean | null {
  const status = resolveEventStatus(data);
  if (status === 'cancelled' || status === 'past') return false;
  if (!data.registrationDeadline) return null;
  return today <= eventDay(data.registrationDeadline);
}

/**
 * Los datos duros de la ficha, en el orden en que los busca alguien que va a
 * viajar: qué prueba es, dónde, cuánto mide, cuánto cuesta, hasta cuándo.
 *
 * Cada hecho se omite cuando su dato no existe —regla del sistema editorial: si
 * el dato no está, el bloque no se pinta— en vez de rellenarse con un guion o
 * con una cifra plausible.
 */
export function raceFacts(data: RaceEventData): RaceFact[] {
  const facts: RaceFact[] = [];
  const category = getEventCategory(data.category);
  const level = getEventLevel(data.level);

  facts.push({ icon: category.icon, label: 'Modalidad', value: category.label });

  if (level) {
    facts.push({ icon: 'ph:trophy-bold', label: 'Nivel', value: level });
  }

  facts.push({
    icon: 'ph:map-pin-bold',
    label: 'Sede',
    value: data.city ? `${data.location} · ${data.city}` : data.location,
  });

  if (data.circuit) {
    const parts = [`${formatKm(data.circuit.distanceKm)} km por vuelta`];
    if (data.circuit.laps) {
      parts.push(`${data.circuit.laps} ${data.circuit.laps === 1 ? 'vuelta' : 'vueltas'}`);
    }
    if (data.circuit.surface) parts.push(data.circuit.surface);
    facts.push({ icon: 'ph:path-bold', label: 'Circuito', value: parts.join(' · ') });
  }

  if (data.organizer) {
    facts.push({ icon: 'ph:flag-banner-bold', label: 'Organiza', value: data.organizer });
  }

  if (data.fees && data.fees.length > 0) {
    facts.push({
      icon: 'ph:ticket-bold',
      label: 'Inscripción',
      value: data.fees
        .map((fee) => `${formatCop(fee.amount)} ${fee.label.toLowerCase()}`)
        .join(' · '),
    });
  }

  if (data.capacity) {
    facts.push({
      icon: 'ph:users-three-bold',
      label: 'Cupos',
      value: `${data.capacity} por categoría`,
    });
  }

  return facts;
}

/**
 * De qué servicio es un enlace de mapa, para la dimensión `content_id`.
 *
 * El valor estaba escrito a mano como 'google-maps' en la plantilla, así que un
 * `mapUrl` de Waze se habría contado como Google Maps. Mapa cerrado: la
 * dimensión solo toma valores que el catálogo documenta.
 */
export function mapProvider(url: string): 'google-maps' | 'waze' | 'otro' {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'otro';
  }

  // El corte va en el punto: `endsWith('google.com')` también acepta
  // `notgoogle.com`, que es exactamente como se cuela un dominio ajeno.
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);

  if (is('waze.com')) return 'waze';
  if (is('google.com') || is('google.com.co') || is('goo.gl')) return 'google-maps';
  return 'otro';
}

/**
 * La hora como se lee en Colombia: `08:30` → `8:30 a. m.`
 *
 * El frontmatter guarda 24 horas con cero a la izquierda para poder comparar
 * horas como texto (misma convención que `clubTimeOfDay()` en `@lib/calendar`);
 * lo que se lee en pantalla se formatea aquí.
 */
export function formatRaceTime(hhmm: string): string {
  const [hours, minutes] = hhmm.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return hhmm;
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/**
 * Distancia total de una categoría, **solo cuando se puede afirmar**.
 *
 * Devuelve `null` en cuanto la categoría declara un `course`: las infantiles
 * corren «el 70% de la pista», un «recorrido especial» o la «pista alterna», y
 * multiplicar sus vueltas por los 3,8 km del circuito publicaría una cifra que
 * nadie midió. Sin `course` la vuelta es completa y la cuenta es honesta.
 *
 * Se redondea a un decimal: el dato de origen tiene esa precisión.
 */
export function categoryDistance(
  category: RaceCategory,
  circuit?: { distanceKm: number }
): number | null {
  if (!circuit || !category.laps || category.course) return null;
  return Math.round(category.laps * circuit.distanceKm * 10) / 10;
}

/**
 * Las categorías agrupadas por manga, en el orden en que largan.
 *
 * Es el orden que importa: quien viaja no busca su categoría en una lista
 * alfabética, busca a qué hora sale. Las que no declaran manga caen en un grupo
 * sin rótulo al final, para que ninguna se pierda.
 */
export function groupCategories(
  categories: RaceCategory[]
): { group: string | null; startTime?: string; categories: RaceCategory[] }[] {
  const groups = new Map<string, RaceCategory[]>();

  for (const category of categories) {
    const key = category.group ?? '';
    groups.set(key, [...(groups.get(key) ?? []), category]);
  }

  return [...groups.entries()].map(([group, items]) => {
    // La manga puede tener dos horas (Prejuvenil A y Promocional largan antes
    // que el resto de la quinta); se rotula con la primera.
    const times = items.map((item) => item.startTime).filter(Boolean) as string[];
    return {
      group: group || null,
      startTime: times.length > 0 ? times.sort()[0] : undefined,
      categories: items,
    };
  });
}
