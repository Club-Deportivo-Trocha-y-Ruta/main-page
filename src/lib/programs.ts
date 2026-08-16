/**
 * Lógica compartida de los programas del club: identidad visual de cada nivel,
 * datos derivados del frontmatter (sesiones por semana) y la "ruta de
 * formación" que ilustra cómo un niño avanza de una etapa a la siguiente.
 *
 * Todo lo que se muestre en pantalla sale de `src/content/programs/*.md`; aquí
 * solo se traduce a algo dibujable. Nada de copys hardcodeados.
 */

export type ProgramLevel = 'iniciación' | 'formación' | 'competición' | 'recreativo';

export interface LevelStyle {
  /** Etiqueta legible del nivel. */
  label: string;
  /** Frase corta que explica la etapa en la regla de edades. */
  focus: string;
  /** Icono Phosphor por defecto del nivel. */
  icon: string;
  /** Variable CSS del color de la etapa: sirve para SVG y para `style`. */
  color: string;
  /** Clase de texto que sí cumple contraste AA sobre fondos claros. */
  text: string;
  /** Fondo suave para chips e iconos. */
  soft: string;
  /** Fondo sólido para barras y marcadores. */
  solid: string;
  /** Texto que va encima de `solid` cumpliendo contraste AA. */
  ink: string;
  /** Borde de la tarjeta al hacer hover. */
  border: string;
}

/**
 * La progresión de color acompaña la progresión deportiva: lima brillante en el
 * juego, teal de marca en la formación, teal profundo en la competencia.
 */
export const LEVEL_STYLES: Record<ProgramLevel, LevelStyle> = {
  'iniciación': {
    label: 'Iniciación',
    focus: 'Juego y equilibrio',
    icon: 'ph:bicycle-bold',
    color: 'var(--color-accent)',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
    solid: 'bg-accent',
    ink: 'text-surface-dark',
    border: 'border-accent',
  },
  'formación': {
    label: 'Formación',
    focus: 'Técnica y fondo',
    icon: 'ph:mountains-bold',
    color: 'var(--color-primary)',
    text: 'text-primary-deep',
    soft: 'bg-primary/15',
    solid: 'bg-primary',
    ink: 'text-surface-dark',
    border: 'border-primary',
  },
  'competición': {
    label: 'Competición',
    focus: 'Rendimiento y podio',
    icon: 'ph:trophy-bold',
    color: 'var(--color-primary-deep)',
    text: 'text-primary-deep',
    soft: 'bg-primary-deep/15',
    solid: 'bg-primary-deep',
    ink: 'text-white',
    border: 'border-primary-deep',
  },
  'recreativo': {
    label: 'Recreativo',
    focus: 'Rodar por gusto',
    icon: 'ph:person-simple-bike-bold',
    color: 'var(--color-primary-light)',
    text: 'text-primary-deep',
    soft: 'bg-primary-light/20',
    solid: 'bg-primary-light',
    ink: 'text-surface-dark',
    border: 'border-primary-light',
  },
};

export function getLevelStyle(level: string): LevelStyle {
  return LEVEL_STYLES[level as ProgramLevel] ?? LEVEL_STYLES['iniciación'];
}

// ─── Horario semanal ──────────────────────────────────────────────────────────

const WEEK = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export type WeekDay = (typeof WEEK)[number];

/** La semana en orden de lectura, de lunes a domingo. */
export const WEEK_DAYS: readonly WeekDay[] = WEEK;

export interface DayLabel {
  /** Nombre completo, con tilde: "Miércoles". */
  label: string;
  /** Abreviatura para columnas estrechas: "Mié". */
  short: string;
  /**
   * Inicial para la vista más compacta. La X de miércoles es la convención
   * española para no confundirlo con martes.
   */
  initial: string;
}

/**
 * Los nombres de los días viven junto al vocabulario que los parsea, no en cada
 * plantilla: `WEEK` va sin tildes porque el parseo normaliza, pero lo que se lee
 * en pantalla sí las lleva.
 */
export const WEEK_DAY_LABELS: Record<WeekDay, DayLabel> = {
  lunes: { label: 'Lunes', short: 'Lun', initial: 'L' },
  martes: { label: 'Martes', short: 'Mar', initial: 'M' },
  miercoles: { label: 'Miércoles', short: 'Mié', initial: 'X' },
  jueves: { label: 'Jueves', short: 'Jue', initial: 'J' },
  viernes: { label: 'Viernes', short: 'Vie', initial: 'V' },
  sabado: { label: 'Sábado', short: 'Sáb', initial: 'S' },
  domingo: { label: 'Domingo', short: 'Dom', initial: 'D' },
};

/** Abreviaturas usadas en los horarios del CMS (ya sin tildes). */
const DAY_ALIASES: Record<string, WeekDay> = {
  lun: 'lunes',
  mar: 'martes',
  mie: 'miercoles',
  jue: 'jueves',
  vie: 'viernes',
  sab: 'sabado',
  dom: 'domingo',
};

// Nombres completos primero: así "martes" no se parte en "mar" + "tes".
const DAY_PATTERN = new RegExp(
  `\\b(${[...WEEK, ...Object.keys(DAY_ALIASES)].join('|')})\\b`,
  'g'
);

/** Conectores que convierten dos días sueltos en un rango ("lunes a viernes"). */
const RANGE_CONNECTOR = /^\s*(a|al|hasta)\s*$/;

/**
 * Separador de sesiones dentro de un mismo horario. Un programa con varias
 * sesiones distintas las escribe como "Mar/Jue 4-6 PM (salida) · Mié 4-6 PM
 * (gymkanas)": cada tramo trae su propia hora y su propia aclaración.
 */
const SEGMENT_SEPARATOR = /[·|;]/;

/** Franja horaria: "4:30 - 6:00 PM", "7-9 AM", "4 a 6 PM". */
const TIME_PATTERN =
  /\d{1,2}(?::\d{2})?\s*(?:[-–—]|\ba\b)\s*\d{1,2}(?::\d{2})?\s*(?:[ap]\.?\s?m\.?)?/i;

/** Aclaración entre paréntesis: "(salida)", "(gymkanas en pista)". */
const NOTE_PATTERN = /\(([^)]+)\)/;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Los días que menciona un tramo, ya con los rangos expandidos. */
function daysInSegment(segment: string): WeekDay[] {
  const text = normalize(segment);
  const matches = [...text.matchAll(DAY_PATTERN)];
  const days = new Set<WeekDay>();

  for (let i = 0; i < matches.length; i++) {
    const current = (DAY_ALIASES[matches[i][1]] ?? matches[i][1]) as WeekDay;
    days.add(current);

    const next = matches[i + 1];
    if (!next) continue;

    const gap = text.slice(matches[i].index + matches[i][0].length, next.index);
    if (!RANGE_CONNECTOR.test(gap)) continue;

    // Rango: se agregan los días intermedios. Si el rango cruza el fin de
    // semana ("viernes a lunes") se recorre la semana dándole la vuelta.
    const from = WEEK.indexOf(current);
    const to = WEEK.indexOf((DAY_ALIASES[next[1]] ?? next[1]) as WeekDay);
    const span = (to - from + WEEK.length) % WEEK.length;
    for (let step = 1; step <= span; step++) {
      days.add(WEEK[(from + step) % WEEK.length]);
    }
  }

  return WEEK.filter((day) => days.has(day));
}

/** Una sesión del horario: qué días, a qué hora y con qué aclaración. */
export interface ScheduleSegment {
  days: WeekDay[];
  /** Franja tal como la escribió el club. `null` si el tramo no trae hora. */
  time: string | null;
  /** Lo que iba entre paréntesis. `null` si no hay. */
  note: string | null;
  /** El tramo completo, sin tocar: el respaldo cuando no se entendió nada. */
  raw: string;
}

/**
 * Descompone el horario de texto libre del CMS en sus sesiones.
 *
 * `schedule` no tiene formato obligatorio —lo escribe una persona en Sveltia—,
 * así que se leen nombres completos y abreviaturas, se expanden los rangos y se
 * separan los tramos:
 *
 *   "Martes y viernes 4:30 - 6:00 PM"
 *     → [{ days: [martes, viernes], time: "4:30 - 6:00 PM" }]
 *   "Mar/Jue 4-6 PM (salida) · Sáb 7-9 AM (salida)"
 *     → [{ days: [martes, jueves], time: "4-6 PM", note: "salida" },
 *        { days: [sabado],         time: "7-9 AM", note: "salida" }]
 *
 * Un tramo del que no se reconoce ningún día se devuelve igual, con `days`
 * vacío y su `raw` intacto: quien lo pinte decide si lo muestra como texto en
 * vez de perderlo. Nada se inventa y nada se descarta en silencio.
 */
export function parseSchedule(schedule: string | undefined): ScheduleSegment[] {
  if (!schedule) return [];

  return schedule
    .split(SEGMENT_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((raw) => ({
      days: daysInSegment(raw),
      time: TIME_PATTERN.exec(raw)?.[0].trim() ?? null,
      note: NOTE_PATTERN.exec(raw)?.[1].trim() ?? null,
      raw,
    }));
}

/**
 * Los días distintos que cubre un horario, en orden de lunes a domingo.
 * Devuelve `null` cuando no reconoce ninguno: la interfaz oculta el dato en vez
 * de inventarlo.
 */
export function parseScheduleDays(schedule: string | undefined): WeekDay[] | null {
  const days = new Set(parseSchedule(schedule).flatMap((segment) => segment.days));
  if (days.size === 0) return null;
  return WEEK.filter((day) => days.has(day));
}

/**
 * Cuántos días a la semana entrena un programa.
 *
 *   "Martes y viernes 4:30 - 6:00 PM"            → 2
 *   "Lunes a viernes 4:00 - 6:00 PM"             → 5
 *   "Mar/Jue 4-6 PM · Mié 4-6 PM · Sáb · Dom"    → 5
 */
export function countWeeklySessions(schedule: string | undefined): number | null {
  return parseScheduleDays(schedule)?.length ?? null;
}

// ─── Ruta de formación (regla de edades + perfil) ─────────────────────────────

/** Desde esta edad, el `ageMax` del frontmatter significa "en adelante". */
export const OPEN_ENDED_AGE = 90;

/** Años que se le dibujan a un tramo abierto para que no se coma la regla. */
export const OPEN_ENDED_SPAN = 7;

export interface PathwayInput {
  id: string;
  title: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  targetLevel: string;
}

/**
 * Adapta una entrada de la colección `programs` a la ruta de formación, para
 * que las páginas no tengan que repetir el mapeo campo por campo.
 */
export function toPathwayInput(program: { id: string; data: Omit<PathwayInput, 'id'> }): PathwayInput {
  return {
    id: program.id,
    title: program.data.title,
    ageRange: program.data.ageRange,
    ageMin: program.data.ageMin,
    ageMax: program.data.ageMax,
    targetLevel: program.data.targetLevel,
  };
}

export interface PathwayStage extends PathwayInput {
  /** Posición en la ruta, 1-based: el "01 / 02 / 03" que se ve en pantalla. */
  step: number;
  level: LevelStyle;
  /** Etiqueta compacta para la regla: "3–5" o "12+". */
  shortAge: string;
  /** El tramo no tiene techo de edad. */
  openEnded: boolean;
  /** Inicio del tramo en años (inclusive). */
  from: number;
  /** Fin del tramo en años (exclusivo). */
  to: number;
  /** Posición y ancho del tramo, en % del ancho total de la regla. */
  startPct: number;
  widthPct: number;
}

export interface PathwayTick {
  age: number;
  pct: number;
  /** Marca mayor: coincide con el arranque de una etapa y se etiqueta. */
  major: boolean;
}

export interface Pathway {
  stages: PathwayStage[];
  ticks: PathwayTick[];
  domain: { from: number; to: number };
}

const pct = (value: number, from: number, to: number) =>
  Math.round(((value - from) / (to - from)) * 10000) / 100;

/**
 * Traduce los programas a una regla de edades continua.
 *
 * La regla asume tramos que no se pisan: si dos programas comparten edades, el
 * corte se hace donde arranca el siguiente para que la barra siga siendo
 * legible. Los huecos sí se respetan —si ninguna etapa cubre una edad, se ve—.
 */
export function buildPathway(programs: PathwayInput[]): Pathway {
  const sorted = [...programs].sort((a, b) => a.ageMin - b.ageMin);

  const bounds = sorted.map((program, index) => {
    const openEnded = program.ageMax >= OPEN_ENDED_AGE;
    const next = sorted[index + 1];
    const rawTo = openEnded ? program.ageMin + OPEN_ENDED_SPAN : program.ageMax + 1;
    const clamped = next ? Math.min(rawTo, next.ageMin) : rawTo;
    return {
      program,
      openEnded,
      from: program.ageMin,
      // Todo tramo cubre al menos un año: si el contenido trae una edad máxima
      // menor que la mínima, la barra se dibuja igual en vez de desaparecer.
      to: Math.max(clamped, program.ageMin + 1),
    };
  });

  const domain = {
    from: bounds.length > 0 ? bounds[0].from : 0,
    to: bounds.length > 0 ? bounds[bounds.length - 1].to : 1,
  };
  // Un solo programa de un año dejaría el dominio en cero: se le da un año.
  if (domain.to <= domain.from) domain.to = domain.from + 1;

  const stages: PathwayStage[] = bounds.map(({ program, openEnded, from, to }, index) => {
    const startPct = pct(from, domain.from, domain.to);
    return {
      ...program,
      step: index + 1,
      level: getLevelStyle(program.targetLevel),
      shortAge: openEnded ? `${from}+` : `${from}–${to - 1}`,
      openEnded,
      from,
      to,
      startPct,
      widthPct: Math.round((pct(to, domain.from, domain.to) - startPct) * 100) / 100,
    };
  });

  const stageStarts = new Set(stages.map((stage) => stage.from));
  const ticks: PathwayTick[] = [];
  for (let age = domain.from; age <= domain.to; age++) {
    ticks.push({
      age,
      pct: pct(age, domain.from, domain.to),
      major: stageStarts.has(age),
    });
  }

  return { stages, ticks, domain };
}

/**
 * Cifras de cabecera de la sección. Solo se devuelve lo que el contenido
 * respalda: si ningún horario es legible, `weeklySessions` queda en `null`.
 */
export interface ProgramTotals {
  programs: number;
  ageRange: string | null;
  weeklySessions: number | null;
  seats: number | null;
}

export function summarizePrograms(
  programs: { ageMin: number; ageMax: number; schedule?: string; maxStudents?: number }[]
): ProgramTotals {
  if (programs.length === 0) {
    return { programs: 0, ageRange: null, weeklySessions: null, seats: null };
  }

  const minAge = Math.min(...programs.map((p) => p.ageMin));
  const maxAge = Math.max(...programs.map((p) => p.ageMax));

  const sessions = programs
    .map((p) => countWeeklySessions(p.schedule))
    .filter((value): value is number => value !== null);

  const seats = programs
    .map((p) => p.maxStudents)
    .filter((value): value is number => typeof value === 'number');

  return {
    programs: programs.length,
    ageRange: maxAge >= OPEN_ENDED_AGE ? `${minAge}+` : `${minAge}–${maxAge}`,
    weeklySessions: sessions.length > 0 ? sessions.reduce((a, b) => a + b, 0) : null,
    seats: seats.length > 0 ? seats.reduce((a, b) => a + b, 0) : null,
  };
}

// ─── Programa anterior y siguiente ────────────────────────────────────────────

export interface AdjacentPrograms {
  previous: PathwayInput | null;
  next: PathwayInput | null;
}

/**
 * Programa inmediatamente anterior y siguiente en la ruta, ordenados por
 * `ageMin` — el mismo criterio que usa `buildPathway()`. La página de detalle
 * la usa para enlazar a la etapa vecina: quien cae en el programa equivocado
 * no tiene que volver al índice a buscar el que sí le corresponde.
 *
 * Devuelve `null` en el lado que no exista: el primer programa no tiene
 * anterior, el último no tiene siguiente. También devuelve ambos en `null`
 * si `currentId` no aparece en la lista.
 */
export function getAdjacentPrograms(
  programs: PathwayInput[],
  currentId: string
): AdjacentPrograms {
  const sorted = [...programs].sort((a, b) => a.ageMin - b.ageMin);
  const index = sorted.findIndex((program) => program.id === currentId);

  if (index === -1) return { previous: null, next: null };

  return {
    previous: index > 0 ? sorted[index - 1] : null,
    next: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
}
