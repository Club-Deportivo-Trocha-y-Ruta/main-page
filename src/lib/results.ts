/**
 * Tablero de la temporada: la general del club, derivada de `results`.
 *
 * Una válida suelta dice quién ganó ese domingo; la general dice quién está
 * peleando el año. El club ya contaba esto a mano dentro de una crónica —las
 * clases `.standings-board` de `global.css`, con los puntos escritos literal en
 * el markdown— y ese mismo tablero se arma aquí a partir de los archivos de
 * `src/content/results`, para que deje de depender de que alguien recalcule
 * las barras a mano cada domingo.
 *
 * El módulo es puro: recibe arreglos y devuelve datos. No importa
 * `astro:content` ni toca el disco —igual que `calendar.ts`, `sponsors.ts` o
 * `transparency.ts`—, así que se prueba sin levantar Astro. Los eventos de la
 * temporada entran por parámetro, no se leen aquí.
 *
 * Las fechas del frontmatter se parsean como medianoche UTC (ver `calendar.ts`):
 * todo cálculo de año usa `getUTCFullYear()`.
 */
import { buildSeason } from './calendar';

// ─── Forma de los datos ───────────────────────────────────────────────────────

/** Una llegada dentro de una válida. Espejo de `resultsSchema.positions`. */
export interface ResultPosition {
  position: number;
  /** Slug del corredor en `riders`. Opcional en el contenido. */
  rider?: string;
  riderName: string;
  time?: string;
  /** Puntos de la válida. Ausente = 0 en la general (ver `buildStandings`). */
  points?: number;
}

/** Una válida, una categoría. Espejo de `resultsSchema`. */
export interface ResultData {
  event: string;
  eventName: string;
  date: Date;
  category: string;
  positions: ResultPosition[];
  clubHighlights?: string;
  totalParticipants?: number;
}

export interface ResultEntry {
  id: string;
  data: ResultData;
}

/**
 * Forma mínima de un evento para `buildSeason()`. Se declara aquí —en vez de
 * importar el tipo de `calendar.ts`, que no lo exporta— para que este módulo
 * siga recibiendo arreglos y nada más.
 */
export interface SeasonEventInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

// ─── Constantes del tablero ───────────────────────────────────────────────────

/**
 * Puntaje de referencia por válida cuando el contenido no permite derivarlo
 * (ningún resultado trae `points`). 40 es lo que ya usaban las crónicas escritas
 * a mano como puntaje del ganador de una válida de Copa Valle.
 */
export const DEFAULT_POINTS_PER_ROUND = 40;

/** Cuántos puestos forman la zona de podio de una categoría. */
export const PODIUM_SIZE = 3;

export type MovementDirection = 'up' | 'down' | 'same' | 'new';

/**
 * Cómo se rotula cada movimiento. La flecha da la forma y el verbo dice qué
 * pasó: el color nunca es la única señal (WCAG 1.4.1), así que el chip
 * funciona en escala de grises y con lector de pantalla.
 */
export const MOVEMENT_LABELS: Record<MovementDirection, { glyph: string; verb: string }> = {
  up: { glyph: '▲', verb: 'Sube' },
  down: { glyph: '▼', verb: 'Baja' },
  same: { glyph: '—', verb: 'Mantiene' },
  new: { glyph: '＋', verb: 'Nuevo' },
};

export interface Movement {
  direction: MovementDirection;
  /** Cuántos puestos se movió. 0 en `same` y en `new`. */
  places: number;
}

/** "Sube 2 puestos", "Mantiene", "Nuevo en el tablero". */
export function movementLabel(movement: Movement): string {
  const { verb } = MOVEMENT_LABELS[movement.direction];
  if (movement.direction === 'new') return `${verb} en el tablero`;
  if (movement.direction === 'same') return verb;
  return `${verb} ${movement.places} ${movement.places === 1 ? 'puesto' : 'puestos'}`;
}

// ─── Utilidades internas ──────────────────────────────────────────────────────

/**
 * Clave de comparación: sin acentos, sin espacios de más y en minúscula. El
 * CMS es texto libre y "Infantil A" / "infantil  a" son la misma categoría; el
 * texto que se muestra siempre es el primero que apareció en el contenido.
 */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// ─── La general ───────────────────────────────────────────────────────────────

/** Una válida del tablero: varias categorías comparten `event`. */
export interface StandingsRound {
  /** Slug del evento: es lo que agrupa las categorías de una misma fecha. */
  event: string;
  name: string;
  date: Date;
}

export interface RiderStanding {
  /** Clave estable dentro del tablero: categoría + nombre, normalizados. */
  key: string;
  riderName: string;
  /** Slug del corredor cuando el contenido lo trae. */
  rider: string | null;
  category: string;
  /** Puntos de todas las válidas cargadas. */
  total: number;
  /** Puntos ganados en la válida más reciente del tablero. */
  lastGain: number;
  /** Total antes de esa válida (`total - lastGain`). */
  previousTotal: number;
  /** Posición en su categoría; 1 = líder. */
  position: number;
  /** Posición antes de la última válida. `null` si no había corrido ninguna. */
  previousPosition: number | null;
  movement: Movement;
  /** Cuántas válidas del tablero corrió. */
  rounds: number;
  /** Suma de puestos de llegada. Es el criterio de desempate. */
  placingSum: number;
  /** true cuando ocupa uno de los tres primeros puestos de su categoría. */
  inPodium: boolean;
  /** Cuántos puntos le faltan para el podio. 0 si ya está; `null` si no hay línea. */
  pointsToPodium: number | null;
}

export interface CategoryStandings {
  /** Categoría tal como la escribe el contenido. */
  category: string;
  riders: RiderStanding[];
  /**
   * Puntos del 3.º: la línea que hay que alcanzar. `null` con menos de tres
   * corredores — sin tercer puesto no hay línea de podio que dibujar.
   */
  podiumPoints: number | null;
}

export interface Standings {
  categories: CategoryStandings[];
  /** Válidas puntuadas, de la más antigua a la más reciente. */
  rounds: StandingsRound[];
  /** La última válida puntuada: la que pinta el tramo claro de cada barra. */
  latest: StandingsRound | null;
  /** Año de la temporada. `null` sin resultados. */
  year: number | null;
  /** Escala del tablero: el máximo alcanzable en la temporada. */
  boardMax: number;
  /** Puntos todavía en juego: la zona rayada de la pista. */
  reach: number;
  /** Mejor puntaje observado en una válida (o el de referencia). */
  pointsPerRound: number;
  /** Válidas ya puntuadas. */
  roundsCounted: number;
  /** Válidas que corre la temporada, según el calendario. */
  seasonRounds: number;
  /** Válidas que faltan por correr. */
  remainingRounds: number;
  /** Nombre de la serie derivado de los eventos ("Copa Valle"), o `null`. */
  series: string | null;
}

export interface StandingsOptions {
  /**
   * Eventos de la temporada. Solo se usan para saber cuántas válidas tiene el
   * año y cuántas faltan: sin ellos, el tablero se escala con las válidas ya
   * puntuadas y no hay zona "en juego".
   */
  events?: SeasonEventInput[];
  now?: Date;
}

/** Acumulador interno por corredor. */
interface RiderAccumulator {
  key: string;
  riderName: string;
  rider: string | null;
  category: string;
  total: number;
  lastGain: number;
  previousTotal: number;
  placingSum: number;
  previousPlacingSum: number;
  rounds: Set<string>;
  previousRounds: number;
}

/**
 * Orden del tablero: más puntos primero. Con el mismo total gana quien acumule
 * **mejores puestos de llegada** (menor suma de posiciones) —el criterio de
 * desempate de la mayoría de series por puntos: dos corredores con 70 puntos no
 * valen lo mismo si uno los hizo con dos segundos y el otro con un primero y un
 * quinto—. Si también empatan ahí, el nombre ordena, para que el tablero no
 * cambie de orden entre builds.
 */
function compareByTotal(a: RiderAccumulator, b: RiderAccumulator): number {
  if (b.total !== a.total) return b.total - a.total;
  if (a.placingSum !== b.placingSum) return a.placingSum - b.placingSum;
  return a.riderName.localeCompare(b.riderName, 'es');
}

/** Mismo criterio, sobre el tablero anterior a la última válida. */
function compareByPreviousTotal(a: RiderAccumulator, b: RiderAccumulator): number {
  if (b.previousTotal !== a.previousTotal) return b.previousTotal - a.previousTotal;
  if (a.previousPlacingSum !== b.previousPlacingSum) {
    return a.previousPlacingSum - b.previousPlacingSum;
  }
  return a.riderName.localeCompare(b.riderName, 'es');
}

/**
 * Arma la general a partir de los resultados cargados.
 *
 * Decisiones que vale la pena tener escritas:
 *
 * - **Un corredor es su nombre dentro de su categoría.** El slug `rider` es
 *   opcional en el contenido y hoy falta en la mayoría de llegadas, así que no
 *   sirve como identidad. Cambiar de categoría a mitad de año es cambiar de
 *   general: son dos tableros distintos.
 * - **Sin `points` se suma 0, no se descarta la llegada.** Quien largó y no
 *   puntuó sigue en la general con las válidas que sí puntuó.
 * - **La última válida es la de fecha más reciente**, no la última del arreglo:
 *   el orden en que Astro entrega la colección no es el orden de la temporada.
 * - **El recorte por temporada NO se hace aquí.** La función suma todo lo que
 *   recibe, sin mirar el año de `date`: quien llama decide qué temporada le
 *   pasa (`/noticias` hoy le pasa la colección entera, que tiene una sola).
 *   En cuanto `src/content/results/` acumule una segunda temporada hay que
 *   filtrarla antes de llamar —o archivar el año cerrado—, o la general
 *   sumará puntos de años distintos y el rótulo "Temporada {año}" mentirá.
 *   Está anotado también en `src/content/results/README.md`.
 */
export function buildStandings(results: ResultEntry[], options: StandingsOptions = {}): Standings {
  const { events = [], now } = options;

  // ── Válidas: varias categorías comparten un mismo evento ──
  const rounds = new Map<string, StandingsRound>();
  for (const result of results) {
    const current = rounds.get(result.data.event);
    if (!current) {
      rounds.set(result.data.event, {
        event: result.data.event,
        name: result.data.eventName,
        date: result.data.date,
      });
    } else if (result.data.date.getTime() < current.date.getTime()) {
      // Dos archivos de la misma válida con fechas distintas: manda la primera.
      current.date = result.data.date;
    }
  }

  const orderedRounds = [...rounds.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.event.localeCompare(b.event),
  );
  const latest = orderedRounds.length > 0 ? orderedRounds[orderedRounds.length - 1] : null;

  // ── Acumulación por corredor ──
  const riders = new Map<string, RiderAccumulator>();
  let bestPoints = 0;

  for (const result of results) {
    const isLatest = latest !== null && result.data.event === latest.event;

    for (const entry of result.data.positions) {
      const key = `${fold(result.data.category)}::${fold(entry.riderName)}`;
      let acc = riders.get(key);
      if (!acc) {
        acc = {
          key,
          riderName: entry.riderName.trim(),
          rider: entry.rider ?? null,
          category: result.data.category.trim(),
          total: 0,
          lastGain: 0,
          previousTotal: 0,
          placingSum: 0,
          previousPlacingSum: 0,
          rounds: new Set<string>(),
          previousRounds: 0,
        };
        riders.set(key, acc);
      }
      // El slug puede llegar solo en una de las válidas: se conserva el primero.
      acc.rider ??= entry.rider ?? null;

      const points = typeof entry.points === 'number' ? entry.points : 0;
      if (points > bestPoints) bestPoints = points;

      acc.total += points;
      acc.placingSum += entry.position;
      acc.rounds.add(result.data.event);

      if (isLatest) {
        acc.lastGain += points;
      } else {
        acc.previousTotal += points;
        acc.previousPlacingSum += entry.position;
        acc.previousRounds += 1;
      }
    }
  }

  // ── Escala de la pista ──
  // El máximo alcanzable es "todas las válidas del año al mejor puntaje visto".
  // Sin resultados con puntos no hay nada que derivar y se usa el de referencia.
  const pointsPerRound = bestPoints > 0 ? bestPoints : DEFAULT_POINTS_PER_ROUND;
  const roundsCounted = orderedRounds.length;

  // Las fechas canceladas siguen en el calendario pero no se corren: no suman
  // puntos ni al máximo ni a lo que queda en juego.
  const season = events.length > 0 ? buildSeason(events, now) : null;
  const seasonRounds = season
    ? Math.max(season.total - season.cancelled, roundsCounted)
    : roundsCounted;
  const remainingRounds = Math.max(0, seasonRounds - roundsCounted);

  const maxTotal = Math.max(0, ...[...riders.values()].map((r) => r.total));
  // La escala nunca puede quedar por debajo de un total real: si una válida
  // repartió más puntos de los previstos, la barra se saldría de la pista.
  const boardMax = Math.max(seasonRounds * pointsPerRound, maxTotal, pointsPerRound);
  const reach = remainingRounds * pointsPerRound;

  // ── Agrupación por categoría ──
  const byCategory = new Map<string, RiderAccumulator[]>();
  for (const acc of riders.values()) {
    const key = fold(acc.category);
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(acc);
    else byCategory.set(key, [acc]);
  }

  const categories: CategoryStandings[] = [...byCategory.values()]
    .map((bucket) => {
      const ranked = [...bucket].sort(compareByTotal);

      // El tablero anterior solo lo forman quienes ya habían corrido: quien
      // debuta en la última válida no "subió" desde ningún puesto.
      const previousRanking = new Map<string, number>();
      [...bucket]
        .filter((acc) => acc.previousRounds > 0)
        .sort(compareByPreviousTotal)
        .forEach((acc, index) => previousRanking.set(acc.key, index + 1));

      const podiumPoints = ranked.length >= PODIUM_SIZE ? ranked[PODIUM_SIZE - 1].total : null;

      const riderRows: RiderStanding[] = ranked.map((acc, index) => {
        const position = index + 1;
        const previousPosition = previousRanking.get(acc.key) ?? null;
        const inPodium = position <= PODIUM_SIZE;

        let movement: Movement;
        if (previousPosition === null) {
          movement = { direction: 'new', places: 0 };
        } else if (previousPosition > position) {
          movement = { direction: 'up', places: previousPosition - position };
        } else if (previousPosition < position) {
          movement = { direction: 'down', places: position - previousPosition };
        } else {
          movement = { direction: 'same', places: 0 };
        }

        return {
          key: acc.key,
          riderName: acc.riderName,
          rider: acc.rider,
          category: acc.category,
          total: acc.total,
          lastGain: acc.lastGain,
          previousTotal: acc.previousTotal,
          position,
          previousPosition,
          movement,
          rounds: acc.rounds.size,
          placingSum: acc.placingSum,
          inPodium,
          pointsToPodium: inPodium
            ? 0
            : podiumPoints !== null
              ? Math.max(0, podiumPoints - acc.total)
              : null,
        };
      });

      return { category: ranked[0].category, riders: riderRows, podiumPoints };
    })
    // Alfabético por categoría: es como las nombra el organizador en la
    // planilla, y no depende de cuántos corredores tenga cada una ese domingo.
    .sort((a, b) => a.category.localeCompare(b.category, 'es'));

  return {
    categories,
    rounds: orderedRounds,
    latest,
    year: season?.year ?? latest?.date.getUTCFullYear() ?? null,
    boardMax,
    reach,
    pointsPerRound,
    roundsCounted,
    seasonRounds,
    remainingRounds,
    series: seriesName(orderedRounds.map((round) => round.name)),
  };
}

// ─── Nombre de la serie ───────────────────────────────────────────────────────

/**
 * Palabras que numeran una fecha, no nombran la serie. Se descartan antes de
 * comparar: "I Válida Copa Valle" y "VI Válida Copa Valle" comparten "Copa
 * Valle", que es lo que se quiere leer en el titular.
 */
const SERIES_STOPWORDS = new Set(['valida', 'validas', 'fecha', 'fase', 'etapa']);

const ROMAN = /^[ivxlcdm]+$/;

function seriesTokens(name: string): { raw: string; key: string }[] {
  return name
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((raw) => ({ raw, key: fold(raw) }))
    .filter(
      ({ key }) => key && !/^\d+$/.test(key) && !ROMAN.test(key) && !SERIES_STOPWORDS.has(key),
    );
}

/**
 * Nombre de la serie a partir de los nombres de las válidas: el tramo de
 * palabras más largo que comparten todas ("I Válida Copa Valle 2026 - Ginebra"
 * + "VI Válida Copa Valle 2026 - Roldanillo" → "Copa Valle").
 *
 * Con una sola válida devuelve `null` a propósito: no hay con qué comparar, y
 * el nombre completo de una carrera no es el nombre de la serie. También pide
 * al menos dos palabras — "Copa" sola no nombra nada— y así el titular cae en
 * su forma genérica en vez de afirmar una serie que no se puede probar.
 */
export function seriesName(names: string[]): string | null {
  const lists = names.map(seriesTokens).filter((tokens) => tokens.length > 0);
  if (lists.length < 2) return null;

  const [first, ...rest] = lists;
  const haystacks = rest.map((tokens) => ` ${tokens.map((t) => t.key).join(' ')} `);

  let best: { raw: string; key: string }[] | null = null;

  for (let start = 0; start < first.length; start++) {
    for (let end = first.length; end > start; end--) {
      const run = first.slice(start, end);
      if (best !== null && run.length <= best.length) break;
      const needle = ` ${run.map((t) => t.key).join(' ')} `;
      if (haystacks.every((hay) => hay.includes(needle))) {
        best = run;
        break;
      }
    }
  }

  if (best === null || best.length < 2) return null;
  return best.map((token) => token.raw).join(' ');
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

export interface StandingsSummary {
  standings: Standings;
  /** Corredores en el tablero. */
  riders: number;
  /** Categorías con al menos un corredor. */
  categories: number;
  /** Válidas puntuadas. */
  rounds: number;
  /** Válidas que faltan por correr. */
  remaining: number;
  /** Corredores en zona de podio de su categoría. */
  inPodium: number;
  /** Año de la temporada: el antetítulo de la sección. */
  year: number;
  /** Última válida puntuada. */
  latest: StandingsRound | null;
  /** Nombre de la serie, cuando los eventos permiten derivarlo. */
  series: string | null;
}

/**
 * Cifras de cabecera del tablero, o `null` cuando no hay nada que mostrar
 * —mismo contrato que `summarizeNews()` o `summarizePrograms()`, salvo que aquí
 * el `null` es total: sin resultados la sección entera no se pinta, porque un
 * tablero vacío no es información, es un hueco.
 */
export function summarizeStandings(
  results: ResultEntry[],
  options: StandingsOptions = {},
): StandingsSummary | null {
  if (results.length === 0) return null;

  const standings = buildStandings(results, options);
  const riders = standings.categories.reduce((sum, group) => sum + group.riders.length, 0);
  if (riders === 0 || standings.year === null) return null;

  return {
    standings,
    riders,
    categories: standings.categories.length,
    rounds: standings.roundsCounted,
    remaining: standings.remainingRounds,
    inPodium: standings.categories.reduce(
      (sum, group) => sum + group.riders.filter((rider) => rider.inPodium).length,
      0,
    ),
    year: standings.year,
    latest: standings.latest,
    series: standings.series,
  };
}
