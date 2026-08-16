/**
 * Shared lookup tables and pure helpers for the tree collection.
 *
 * Used by index.astro, TrochaVerdeGrid.astro, TrochaVerdeSiembras.astro y las
 * páginas de detalle de Trocha Verde (`/trocha-verde/[species]` y
 * `/trocha-verde/arboles/[slug]`). Los mapas de arriba (`categoryLabels`,
 * `categoryColors`, `statusLabels`, `statusColors`, `journeyLabels`) los
 * consume también el índice de Trocha Verde: cualquier cambio aquí debe ser
 * aditivo, nunca romper esas firmas.
 *
 * Mismo patrón que `calendar.ts`: mapas tipados + funciones puras que reciben
 * los datos ya cargados por la página, para poder testearlas sin el runtime
 * de Astro.
 */
import { slugify } from './utils';
import { clubToday, eventDay } from './calendar';

export const categoryLabels: Record<string, string> = {
  frutal: 'Frutal',
  ornamental: 'Ornamental',
  nativo: 'Nativo',
  maderable: 'Maderable',
};

export const categoryColors: Record<string, { bg: string; text: string }> = {
  frutal: { bg: 'bg-amber-100', text: 'text-amber-700' },
  ornamental: { bg: 'bg-purple-100', text: 'text-purple-900' },
  nativo: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  maderable: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export const statusLabels: Record<string, string> = {
  sembrado: 'Sembrado',
  creciendo: 'Creciendo',
  floreciendo: 'Floreciendo',
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  sembrado: { bg: 'bg-sky-100', text: 'text-sky-700' },
  creciendo: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  floreciendo: { bg: 'bg-pink-100', text: 'text-pink-700' },
};

export const journeyLabels: Record<number, string> = {
  0: 'Primera siembra',
  1: 'Segunda siembra',
  2: 'Tercera siembra',
  3: 'Cuarta siembra',
  4: 'Quinta siembra',
  5: 'Sexta siembra',
};

// ─── Protector: la llanta reciclada que cuida cada árbol ───────────────────────
//
// 71 de los 77 árboles del club están sembrados dentro de una llanta de
// bicicleta reciclada — las mismas llantas que ruedan en los entrenamientos.
// `piedras` está en el schema pero ningún árbol real lo usa hoy; se deja
// resuelto igual, con el mismo criterio de "no perder un valor desconocido"
// que usa `getCategoryProfile()` en transparency.ts.

export type TreeProtector = 'llanta-bicicleta' | 'llanta-moto' | 'piedras' | 'otro';

export interface ProtectorInfo {
  /** Nombre completo del protector, para una ficha o un dato ilustrado. */
  label: string;
  icon: string;
}

export const PROTECTOR_LABELS: Record<TreeProtector, ProtectorInfo> = {
  'llanta-bicicleta': { label: 'Llanta de bicicleta reciclada', icon: 'ph:tire-bold' },
  'llanta-moto': { label: 'Llanta de moto reciclada', icon: 'ph:tire-bold' },
  piedras: { label: 'Círculo de piedras', icon: 'ph:circles-three-bold' },
  otro: { label: 'Protector artesanal', icon: 'ph:shield-check-bold' },
};

const FALLBACK_PROTECTOR: ProtectorInfo = PROTECTOR_LABELS.otro;

export function getProtector(protector: string): ProtectorInfo {
  return PROTECTOR_LABELS[protector as TreeProtector] ?? FALLBACK_PROTECTOR;
}

/**
 * Texto del protector para la ficha de un árbol puntual: el tipo y, cuando el
 * contenido trae el color exacto, "Llanta {color}" tal como lo escribe el
 * club (p. ej. "Llanta rosada") — solo aplica a llantas, porque en los datos
 * reales `piedras`/`otro` nunca traen color.
 */
export function protectorDescription(protector: string, protectorColor?: string): string {
  const isTire = protector === 'llanta-bicicleta' || protector === 'llanta-moto';
  if (isTire && protectorColor) return `Llanta ${protectorColor}`;
  return getProtector(protector).label;
}

export interface ProtectorTally {
  protector: string;
  count: number;
}

/**
 * "Llanta de bicicleta reciclada" cuando todos los árboles de la especie
 * comparten protector, o el desglose ("8 con..., 1 con...") cuando la especie
 * mezcla más de un tipo — nunca se asume que todos comparten uno solo.
 */
export function describeProtectorMix(protectors: ProtectorTally[]): string {
  if (protectors.length === 0) return '';
  if (protectors.length === 1) return getProtector(protectors[0].protector).label;
  return protectors
    .map((entry) => `${entry.count} con ${getProtector(entry.protector).label.toLowerCase()}`)
    .join(' · ');
}

// ─── Tiempo transcurrido desde la siembra ───────────────────────────────────────
//
// Misma precaución de husos que documenta calendar.ts: `plantedDate` se
// parsea como medianoche UTC y "hoy" se calcula en la zona del club
// (`clubToday()`), para que un árbol sembrado el 1.º de marzo no aparezca con
// un día de más o de menos según la hora de build.

const DAY_MS = 24 * 60 * 60 * 1000;

function utcMidnight(dayString: string): number {
  return new Date(`${dayString}T00:00:00.000Z`).getTime();
}

/** Días completos entre la siembra y "hoy" en la zona del club. Nunca negativo. */
export function daysSincePlanted(plantedDate: Date, now: Date = new Date()): number {
  const today = utcMidnight(clubToday(now));
  const planted = utcMidnight(eventDay(plantedDate));
  return Math.max(0, Math.round((today - planted) / DAY_MS));
}

export interface PlantedDuration {
  /** Días exactos, por si una interfaz necesita el número crudo. */
  days: number;
  /** Cifra ya redondeada a la unidad más legible para ese tramo. */
  value: number;
  /** Unidad de `value`, en singular o plural según corresponda. */
  unit: string;
}

/**
 * Cuánto lleva vivo un árbol, en la unidad más legible para su edad: días
 * durante la primera semana, semanas durante el primer mes, meses durante su
 * primer año, años después. Hoy todos los árboles del club caen en el tramo
 * de meses (sembrados entre marzo y mayo de 2026), pero la función no asume
 * ese rango. Los cortes (7/30/365 días) coinciden con el tamaño de cada
 * unidad para que el singular ("1 semana", "1 mes") sea alcanzable y no solo
 * un caso que el código contempla pero nunca ocurre.
 */
export function timeSincePlanted(plantedDate: Date, now: Date = new Date()): PlantedDuration {
  const days = daysSincePlanted(plantedDate, now);

  if (days < 7) {
    return { days, value: days, unit: days === 1 ? 'día' : 'días' };
  }
  if (days < 30) {
    const weeks = Math.max(1, Math.round(days / 7));
    return { days, value: weeks, unit: weeks === 1 ? 'semana' : 'semanas' };
  }
  if (days < 365) {
    const months = Math.max(1, Math.round(days / 30));
    return { days, value: months, unit: months === 1 ? 'mes' : 'meses' };
  }
  const years = Math.max(1, Math.round(days / 365));
  return { days, value: years, unit: years === 1 ? 'año' : 'años' };
}

const LONG_DAY_MONTH = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const LONG_DATE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * "15 de marzo de 2026" cuando toda una especie se sembró el mismo día, o el
 * rango completo ("15 de marzo – 18 de mayo de 2026") cuando no. Dentro de un
 * mismo año se omite el año de la primera fecha para no repetirlo dos veces.
 */
export function plantingSpan(first: Date, last: Date): string {
  if (first.getTime() === last.getTime()) return LONG_DATE.format(first);

  const sameYear = first.getUTCFullYear() === last.getUTCFullYear();
  return sameYear
    ? `${LONG_DAY_MONTH.format(first)} – ${LONG_DATE.format(last)}`
    : `${LONG_DATE.format(first)} – ${LONG_DATE.format(last)}`;
}

// ─── Emparejar árboles con su especie ───────────────────────────────────────────
//
// El id de una especie sale del nombre del archivo en el CMS y puede no
// coincidir con `slugify(commonName)` — hoy pasa con "lengua-suegra.md" para
// la especie "Lengua de suegra" (sus 4 árboles traen `species: "Lengua de
// suegra"`, que slugifica a "lengua-de-suegra"). Comparar el mismo campo en
// ambos lados —el nombre común— es resistente a esa diferencia; comparar
// contra el id del archivo no lo es.

interface SpeciesLike {
  id: string;
  data: { commonName: string };
}

interface TreeSpeciesField {
  data: { species: string };
}

/**
 * Especie que corresponde a un árbol, buscada por nombre común. `undefined`
 * cuando el árbol no tiene especie asociada en el contenido (hoy pasa con
 * "Abano": no existe `species/abano.md`) — la página omite el enlace en vez
 * de apuntar a una ruta que no existe.
 */
export function findSpeciesForTree<S extends SpeciesLike>(
  tree: TreeSpeciesField,
  allSpecies: S[]
): S | undefined {
  const target = slugify(tree.data.species);
  return allSpecies.find((species) => slugify(species.data.commonName) === target);
}

interface TreeLike extends TreeSpeciesField {
  data: { species: string; order: number };
}

/** Árboles de una especie, en el mismo orden en que los cura el CMS (`order`). */
export function treesOfSpecies<T extends TreeLike>(trees: T[], species: SpeciesLike): T[] {
  const target = slugify(species.data.commonName);
  return trees
    .filter((tree) => slugify(tree.data.species) === target)
    .sort((a, b) => a.data.order - b.data.order);
}

/**
 * "Mango 3" cuando la especie tiene más de un árbol, según su posición en
 * `speciesTrees` — el mismo orden en que se listan en la página de la
 * especie, así el número de la ficha coincide con el de la rejilla. Con un
 * solo árbol de la especie, el nombre no necesita número.
 */
export function treeDisplayLabel<T extends { id: string; data: { species: string } }>(
  tree: T,
  speciesTrees: T[]
): string {
  if (speciesTrees.length <= 1) return tree.data.species;
  const index = speciesTrees.findIndex((entry) => entry.id === tree.id);
  return index === -1 ? tree.data.species : `${tree.data.species} ${index + 1}`;
}

// ─── Agregación por especie ──────────────────────────────────────────────────────

export interface SpeciesTreeStats {
  total: number;
  firstPlanted: Date;
  lastPlanted: Date;
  /** Árboles con `donor` en el contenido, sin importar el texto exacto. */
  sponsored: number;
  /** De más a menos frecuente. */
  protectors: ProtectorTally[];
}

/**
 * Cifras que respaldan la página de una especie: cuántos árboles, cuándo se
 * sembró el primero y el último, cuántos tienen padrino y con qué los
 * protege el club. `null` sin árboles — la página no tiene nada que resumir
 * todavía (no pasa hoy, pero el schema no obliga a que una especie tenga ya
 * un árbol sembrado).
 */
export function summarizeSpeciesTrees<
  T extends { data: { plantedDate: Date; donor?: string; protector: string } },
>(trees: T[]): SpeciesTreeStats | null {
  if (trees.length === 0) return null;

  const times = trees.map((tree) => tree.data.plantedDate.getTime());

  const tally = new Map<string, number>();
  for (const tree of trees) {
    tally.set(tree.data.protector, (tally.get(tree.data.protector) ?? 0) + 1);
  }

  return {
    total: trees.length,
    firstPlanted: new Date(Math.min(...times)),
    lastPlanted: new Date(Math.max(...times)),
    sponsored: trees.filter((tree) => Boolean(tree.data.donor)).length,
    protectors: [...tally.entries()]
      .map(([protector, count]) => ({ protector, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ─── Concordancia de género y número ─────────────────────────────────────────────

export interface SpeciesGrammar {
  /** El campo `plural` del contenido, o `commonName` + "s" cuando no está. */
  plural: string;
  /** Artículo determinado plural que concuerda en género. */
  article: 'las' | 'los';
  /** El mismo artículo, capitalizado para arrancar frase. */
  Article: 'Las' | 'Los';
  /** Posesivo plural que concuerda en género: "Nuestras Acacias", "Nuestros Guayacanes". */
  possessive: 'Nuestras' | 'Nuestros';
}

/**
 * `plural`/`feminine` existen en el schema de `species` para esto: nombrar la
 * especie sin caer en el genérico "los árboles de esta especie". Sin
 * `plural` en el contenido se arma con `commonName` + "s" (8 de las 32
 * especies de hoy no lo traen, todas masculinas: "Mango" → "Mangos").
 */
export function speciesGrammar(species: {
  commonName: string;
  plural?: string;
  feminine?: boolean;
}): SpeciesGrammar {
  const plural = species.plural ?? `${species.commonName}s`;
  const article = species.feminine ? 'las' : 'los';
  return {
    plural,
    article,
    Article: article === 'las' ? 'Las' : 'Los',
    possessive: species.feminine ? 'Nuestras' : 'Nuestros',
  };
}
