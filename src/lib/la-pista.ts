/**
 * Lógica derivada de `/la-pista`: qué se entrena en la Pista Carlos Castro.
 *
 * Igual que `trocha-verde.ts`, todo sale del contenido —
 * `src/content/obstaculos/*.md`— y aquí solo se cuenta y se traduce a etiquetas.
 * Funciones puras: los obstáculos ya cargados entran por parámetro y quien
 * llama a `getCollection` es la página.
 *
 * El trazado del mapa no vive aquí sino en `track-map.ts`, que proyecta el GPX.
 * Plan completo: `docs/07-plan-la-pista.md`.
 */
import type { OBSTACLE_LEVELS, OBSTACLE_TYPES } from './schemas';

export type ObstacleType = (typeof OBSTACLE_TYPES)[number];
export type ObstacleLevel = (typeof OBSTACLE_LEVELS)[number];

/** Campos del frontmatter que necesita cualquier agregación de este archivo. */
export interface ObstacleInput {
  name: string;
  type: string;
  level: string;
  summary: string;
  skills: string[];
  programs: string[];
  builtOn?: Date;
  builtBy?: string;
  active: boolean;
  order: number;
}

// ─── Etiquetas y color ─────────────────────────────────────────────────────

/**
 * Nombre visible de cada tipo, en español colombiano y con el término técnico
 * entre paréntesis cuando el club usa los dos. Mismo criterio que
 * `categoryLabels` en `tree-utils.ts`: mapa abierto, cambios solo aditivos.
 */
export const obstacleTypeLabels: Record<string, string> = {
  'cajon-grava': 'Cajón de grava',
  'rock-garden': 'Jardín de rocas',
  drop: 'Caída (drop)',
  escalon: 'Escalón',
  tabla: 'Salto de mesa',
  doble: 'Doble',
  peralte: 'Peralte',
  'bajada-tecnica': 'Bajada técnica',
  raiz: 'Sección de raíces',
};

export const obstacleLevelLabels: Record<string, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

/**
 * Color de la etiqueta de nivel. Pares `bg`/`text` con contraste suficiente
 * sobre fondo claro (mismo patrón que `categoryColors`); nunca `primary` ni
 * `accent` como texto, que no cumplen 4.5:1.
 */
export const obstacleLevelColors: Record<string, { bg: string; text: string }> = {
  basico: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  intermedio: { bg: 'bg-amber-100', text: 'text-amber-800' },
  avanzado: { bg: 'bg-rose-100', text: 'text-rose-700' },
};

/** Orden de menos a más exigente, para listar niveles en un orden con sentido. */
const LEVEL_ORDER: readonly string[] = ['basico', 'intermedio', 'avanzado'];

export function obstacleTypeLabel(type: string): string {
  return obstacleTypeLabels[type] ?? type;
}

export function obstacleLevelLabel(level: string): string {
  return obstacleLevelLabels[level] ?? level;
}

// ─── Obstáculos visibles ───────────────────────────────────────────────────

/**
 * Los que se muestran: activos, en el orden del frontmatter. Un obstáculo
 * `active: false` es uno que se desmontó o se rehízo — se conserva la ficha
 * pero sale del recorrido. El filtro de `draft` lo hace la página en
 * `getCollection`, como en el resto del sitio.
 */
export function activeObstacles<T extends { active: boolean; order: number; name: string }>(
  obstacles: T[],
): T[] {
  return obstacles
    .filter((o) => o.active)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'));
}

// ─── Cifras de cabecera ────────────────────────────────────────────────────

export interface TrackSummary {
  /** Obstáculos activos. */
  totalObstacles: number;
  /** Habilidades distintas que se entrenan entre todos. */
  totalSkills: number;
  /** Programas distintos que usan la pista, según las fichas. */
  totalPrograms: number;
  /** Niveles cubiertos, de básico a avanzado. */
  levels: string[];
  /** Fecha de construcción más reciente, si alguna ficha la trae. */
  lastBuiltOn: Date | null;
}

/**
 * Cifras de la apertura. Devuelve `null` cuando no hay obstáculos activos: la
 * página omite el bloque en vez de escribir "0 obstáculos", igual que
 * `buildPlantingTimeline()` en Trocha Verde.
 */
export function summarizeTrack(obstacles: ObstacleInput[]): TrackSummary | null {
  const active = obstacles.filter((o) => o.active);
  if (active.length === 0) return null;

  const skills = new Set(active.flatMap((o) => o.skills.map(normalizeSkill)));
  const programs = new Set(active.flatMap((o) => o.programs));
  const levels = LEVEL_ORDER.filter((level) => active.some((o) => o.level === level));

  const builtDates = active
    .map((o) => o.builtOn)
    .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));

  return {
    totalObstacles: active.length,
    totalSkills: skills.size,
    totalPrograms: programs.size,
    levels,
    lastBuiltOn:
      builtDates.length > 0 ? new Date(Math.max(...builtDates.map((d) => d.getTime()))) : null,
  };
}

// ─── Habilidades ───────────────────────────────────────────────────────────

export interface SkillCount {
  skill: string;
  count: number;
}

/**
 * Habilidades ordenadas por cuántos obstáculos las entrenan. Alimenta el
 * `FactGrid` de "qué se entrena aquí".
 *
 * Se agrupa sin distinguir mayúsculas ni espacios sobrantes —"Peso atrás" y
 * "peso atrás " son la misma habilidad— pero se muestra la primera grafía que
 * aparece, la que escribió el entrenador.
 */
export function skillsByFrequency(obstacles: ObstacleInput[]): SkillCount[] {
  const counts = new Map<string, SkillCount>();

  for (const obstacle of obstacles.filter((o) => o.active)) {
    // Un obstáculo que repita la misma habilidad no la cuenta dos veces.
    const seen = new Set<string>();
    for (const raw of obstacle.skills) {
      const key = normalizeSkill(raw);
      if (key.length === 0 || seen.has(key)) continue;
      seen.add(key);

      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { skill: raw.trim(), count: 1 });
    }
  }

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.skill.localeCompare(b.skill, 'es'),
  );
}

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

// ─── Programas que usan la pista ───────────────────────────────────────────

export interface ProgramReference {
  id: string;
  title: string;
}

export interface TrackProgram extends ProgramReference {
  /** Obstáculos activos que trabaja ese programa. */
  obstacleCount: number;
}

/**
 * Cruza los slugs de `programs` de cada ficha con la colección `programs`.
 *
 * Un slug que no resuelve **rompe el build** con el nombre del obstáculo y del
 * programa: es la regla del proyecto de no armar nunca una URL desde un campo
 * sin comprobar que resuelve, y en una relación por slug el silencio produce
 * enlaces rotos que nadie ve hasta que un padre los abre.
 */
export function programsUsingTrack(
  obstacles: ObstacleInput[],
  programs: ProgramReference[],
): TrackProgram[] {
  const byId = new Map(programs.map((p) => [p.id, p]));
  const counts = new Map<string, number>();

  for (const obstacle of obstacles.filter((o) => o.active)) {
    for (const slug of new Set(obstacle.programs)) {
      if (!byId.has(slug)) {
        throw new Error(
          `El obstáculo "${obstacle.name}" referencia el programa "${slug}", que no existe en src/content/programs/. ` +
            `Programas disponibles: ${[...byId.keys()].join(', ') || '(ninguno)'}.`,
        );
      }
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  // Se respeta el orden en que llegan los programas: lo decide la página, que
  // ya los ordena por su propio criterio (edad).
  return programs
    .filter((p) => counts.has(p.id))
    .map((p) => ({ id: p.id, title: p.title, obstacleCount: counts.get(p.id)! }));
}

// ─── Hitos de la historia de la pista ─────────────────────────────────────

/**
 * Los cuatro hitos que narran la historia de la Pista Carlos Castro.
 * Solo estos aparecen en la sección "Historia de la pista" de `/la-pista`.
 * Se filtra aquí para que la página solo llame a `getCollection` y pase la
 * lista; no hay lógica de filtrado suelta en la plantilla.
 */
export const TRACK_MILESTONE_IDS = new Set([
  'la-casa-pista-carlos-castro',
  '2012-primera-valida',
  '2019-juegos-nacionales',
  '2021-panamericanos-junior',
]);

/**
 * Filtra una lista de entradas de hitos a los cuatro de la historia de la
 * pista, en el orden en que llegan (la página los ordena por `buildMilestoneItems`).
 */
export function filterTrackMilestones<T extends { id: string }>(entries: T[]): T[] {
  return entries.filter((e) => TRACK_MILESTONE_IDS.has(e.id));
}

// ─── Umbrales de visualización ─────────────────────────────────────────────

/**
 * Mínimo de obstáculos activos para mostrar la rejilla de tarjetas.
 * Con menos no vale la pena pintar la sección: la única ficha publicada
 * ocupa menos espacio que la introducción de sección.
 */
export const MIN_OBSTACLES_FOR_GRID = 2;

/**
 * Mínimo de obstáculos activos para mostrar el `FactGrid` de habilidades.
 * Con menos, los conteos de "1 obstáculo" en cada fila no aportan nada.
 */
export const MIN_OBSTACLES_FOR_SKILLS = 4;

// ─── Navegación entre fichas ───────────────────────────────────────────────

export interface AdjacentObstacles<T> {
  previous: T | null;
  next: T | null;
}

/**
 * El obstáculo anterior y el siguiente del recorrido, para cerrar una ficha de
 * detalle sin obligar a volver al índice. Mismo patrón que
 * `getAdjacentPrograms()` en `programs.ts`.
 *
 * Recibe la lista **ya ordenada** (la que devuelve `activeObstacles`): el orden
 * del recorrido lo decide el club con `order`, no este módulo.
 */
export function getAdjacentObstacles<T extends { id: string }>(
  obstacles: T[],
  currentId: string
): AdjacentObstacles<T> {
  const index = obstacles.findIndex((o) => o.id === currentId);
  if (index === -1) return { previous: null, next: null };

  return {
    previous: index > 0 ? obstacles[index - 1] : null,
    next: index < obstacles.length - 1 ? obstacles[index + 1] : null,
  };
}
