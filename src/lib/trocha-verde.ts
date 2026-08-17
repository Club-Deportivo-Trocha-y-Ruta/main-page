/**
 * Lógica compartida de Trocha Verde: agregaciones del inventario de árboles.
 *
 * Todo lo que se muestre en pantalla sale de `src/content/trees/*.md`; aquí
 * solo se traduce a algo contable o dibujable. Funciones puras — nada de
 * `getCollection` salvo en el wrapper de compatibilidad al final del archivo:
 * los árboles ya cargados entran como parámetro, y quien arma la colección es
 * la página. Mismo patrón que `calendar.ts` y `programs.ts`.
 *
 * Dos cifras que el sitio publicaba —CO₂ proyectado y área cubierta— NO salen
 * de contenido real: `co2EstimateKg` está vacío en los 77 árboles del club, y
 * el "área" se inventaba a partir del tipo de protector. El sistema editorial
 * es estricto en esto (docs/04-sistema-editorial.md, regla 3): si el dato no
 * existe, el bloque no se pinta. Por eso ninguna función de este archivo
 * calcula CO₂ ni área — si el club mide CO₂ algún día, `co2EstimateKg` ya
 * existe en `treesSchema` y se puede sumar aquí mismo.
 */
import { eventDay, dayLabel, monthShort } from './calendar';

/** Campos del contenido que necesita cualquier agregación de este archivo. */
export interface TreeInput {
  species: string;
  scientificName?: string;
  category: string;
  protector: string;
  donor?: string;
  plantedDate: Date;
  image: string;
  imageAlt: string;
  lat?: number;
  lng?: number;
}

// ─── Totales de cabecera ───────────────────────────────────────────────────

export interface TreeStats {
  totalTrees: number;
  totalSpecies: number;
  totalRecycled: number;
}

/**
 * Cifras de cabecera: cuántos árboles, cuántas especies distintas y cuántos
 * llevan una llanta (de bicicleta o de moto) como protector. Sin CO₂ ni área:
 * ver nota de cabecera del archivo.
 */
export function summarizeTrees(trees: TreeInput[]): TreeStats {
  const speciesSet = new Set(
    trees.map((t) => (t.scientificName ?? t.species).toLowerCase())
  );

  return {
    totalTrees: trees.length,
    totalSpecies: speciesSet.size,
    totalRecycled: trees.filter((t) => isRecycledTireProtector(t.protector)).length,
  };
}

// ─── Reciclaje: llantas como protector ─────────────────────────────────────

/** Protectores hechos con una llanta reciclada (de bicicleta o de moto). */
const RECYCLED_TIRE_PROTECTORS: ReadonlySet<string> = new Set([
  'llanta-bicicleta',
  'llanta-moto',
]);

export function isRecycledTireProtector(protector: string): boolean {
  return RECYCLED_TIRE_PROTECTORS.has(protector);
}

export interface RecyclingSummary {
  total: number;
  /** Protegidos específicamente con llanta de bicicleta: el corazón de la historia. */
  bicycleTireCount: number;
  /** Llanta de bicicleta + llanta de moto: toda llanta reciclada como protector. */
  tireCount: number;
  /** `tireCount` sobre `total`, redondeado. */
  tirePct: number;
}

export function summarizeRecycling(trees: Pick<TreeInput, 'protector'>[]): RecyclingSummary {
  const total = trees.length;
  const bicycleTireCount = trees.filter((t) => t.protector === 'llanta-bicicleta').length;
  const tireCount = trees.filter((t) => isRecycledTireProtector(t.protector)).length;

  return {
    total,
    bicycleTireCount,
    tireCount,
    tirePct: total > 0 ? Math.round((tireCount / total) * 100) : 0,
  };
}

// ─── Composición del bosque por categoría ──────────────────────────────────

export interface CategorySlice {
  category: string;
  count: number;
  /** % del total, con un decimal. */
  pct: number;
}

/**
 * Reparto del inventario por categoría (nativo, frutal, ornamental,
 * maderable), de mayor a menor. Solo números: las etiquetas y colores de cada
 * categoría viven en `@lib/tree-utils`, que ya usan esta y otras páginas.
 */
export function buildCategoryComposition(trees: Pick<TreeInput, 'category'>[]): CategorySlice[] {
  const total = trees.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();
  for (const tree of trees) {
    counts.set(tree.category, (counts.get(tree.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── Inventario por especie ─────────────────────────────────────────────────

export interface SpeciesInventoryEntry {
  /** Clave de agrupación: nombre científico si existe, si no el nombre común. */
  key: string;
  commonName: string;
  scientificName: string;
  category: string;
  count: number;
  thumbnail: string;
  thumbnailAlt: string;
}

/**
 * Especies distintas sembradas, con cuántos ejemplares tiene cada una. La
 * miniatura y el nombre son los del primer árbol de esa especie que aparece
 * en el listado.
 */
export function buildSpeciesInventory(
  trees: Pick<TreeInput, 'species' | 'scientificName' | 'category' | 'image' | 'imageAlt'>[]
): SpeciesInventoryEntry[] {
  const bySpecies = new Map<string, SpeciesInventoryEntry>();

  for (const tree of trees) {
    const key = tree.scientificName ?? tree.species;
    const existing = bySpecies.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    bySpecies.set(key, {
      key,
      commonName: tree.species,
      scientificName: tree.scientificName ?? '',
      category: tree.category,
      count: 1,
      thumbnail: tree.image,
      thumbnailAlt: tree.imageAlt,
    });
  }

  return [...bySpecies.values()].sort((a, b) => a.commonName.localeCompare(b.commonName, 'es'));
}

// ─── Padrinos ────────────────────────────────────────────────────────────────

export interface DonorEntry {
  name: string;
  count: number;
}

export interface DonorSummary {
  total: number;
  /** Árboles con un padrino registrado en `donor`. */
  sponsoredTrees: number;
  /** `sponsoredTrees` sobre `total`, redondeado. */
  pct: number;
  /** Padrinos distintos, de más a menos árboles. */
  donors: DonorEntry[];
}

export function summarizeDonors(trees: Pick<TreeInput, 'donor'>[]): DonorSummary {
  const total = trees.length;
  const withDonor = trees.filter(
    (t): t is { donor: string } => typeof t.donor === 'string' && t.donor.length > 0
  );

  const counts = new Map<string, number>();
  for (const tree of withDonor) {
    counts.set(tree.donor, (counts.get(tree.donor) ?? 0) + 1);
  }

  const donors = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    sponsoredTrees: withDonor.length,
    pct: total > 0 ? Math.round((withDonor.length / total) * 100) : 0,
    donors,
  };
}

// ─── Ritmo de siembra: cómo se acumularon los árboles en el tiempo ─────────

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PlantingStop {
  dateKey: string;
  date: Date;
  /** Día del mes, ej. "15". */
  day: string;
  /** Mes abreviado, ej. "mar". */
  month: string;
  /** Árboles sembrados ese día. */
  count: number;
  /** Total acumulado hasta ese día, inclusive. */
  cumulative: number;
  /** `cumulative` sobre el total, 0-100, con un decimal. */
  cumulativePct: number;
  /** Posición en el recorrido según el tiempo transcurrido, 0-100. */
  xPct: number;
}

export interface PlantingTimeline {
  start: Date;
  end: Date;
  totalDays: number;
  /** Semanas entre la primera y la última siembra, redondeado (mínimo 1). */
  totalWeeks: number;
  /** Árboles sembrados por semana, en promedio, con un decimal. */
  averagePerWeek: number;
  total: number;
  /** Una parada por jornada de siembra, en orden cronológico. */
  stops: PlantingStop[];
}

/**
 * Cómo se acumularon las siembras en el tiempo: una parada por jornada
 * (fecha distinta de `plantedDate`), con el conteo del día y el acumulado.
 * Devuelve `null` sin árboles: la página omite la ilustración en vez de
 * dibujar un recorrido vacío.
 *
 * Las paradas se ubican por tiempo transcurrido real, no por índice: dos
 * jornadas separadas por dos semanas quedan dos veces más lejos en el
 * recorrido que dos separadas por una, igual que pasó de verdad.
 */
export function buildPlantingTimeline(trees: Pick<TreeInput, 'plantedDate'>[]): PlantingTimeline | null {
  if (trees.length === 0) return null;

  const byDate = new Map<string, { date: Date; count: number }>();
  for (const tree of trees) {
    const dateKey = eventDay(tree.plantedDate);
    const entry = byDate.get(dateKey);
    if (entry) entry.count += 1;
    else byDate.set(dateKey, { date: tree.plantedDate, count: 1 });
  }

  const dateKeys = [...byDate.keys()].sort();
  const start = byDate.get(dateKeys[0])!.date;
  const end = byDate.get(dateKeys[dateKeys.length - 1])!.date;
  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const total = trees.length;

  let cumulative = 0;
  const stops: PlantingStop[] = dateKeys.map((dateKey) => {
    const { date, count } = byDate.get(dateKey)!;
    cumulative += count;
    const elapsedDays = Math.round((date.getTime() - start.getTime()) / DAY_MS);

    return {
      dateKey,
      date,
      day: dayLabel(date),
      month: monthShort(date),
      count,
      cumulative,
      cumulativePct: Math.round((cumulative / total) * 1000) / 10,
      xPct: totalDays > 0 ? Math.round((elapsedDays / totalDays) * 1000) / 10 : 0,
    };
  });

  const totalWeeks = Math.max(1, Math.round(totalDays / 7));

  return {
    start,
    end,
    totalDays,
    totalWeeks,
    averagePerWeek: Math.round((total / totalWeeks) * 10) / 10,
    total,
    stops,
  };
}

// ─── Jornadas: árboles agrupados por fecha de siembra ──────────────────────

export interface PlantingGroup<T> {
  dateKey: string;
  date: Date;
  trees: T[];
}

interface PlantingDateInput {
  data: { plantedDate: Date };
}

/**
 * Agrupa árboles ya cargados por su fecha de siembra, en orden cronológico.
 * Genérica sobre `T` (como `buildSeason<T>` en `calendar.ts`) para que la
 * página pueda agrupar `CollectionEntry<'trees'>` completos y decidir después
 * qué jornadas muestra y cómo las rotula.
 */
export function groupTreesByPlantingDate<T extends PlantingDateInput>(
  trees: T[]
): PlantingGroup<T>[] {
  const groups = new Map<string, PlantingGroup<T>>();

  for (const tree of trees) {
    const dateKey = eventDay(tree.data.plantedDate);
    const group = groups.get(dateKey);
    if (group) group.trees.push(tree);
    else groups.set(dateKey, { dateKey, date: tree.data.plantedDate, trees: [tree] });
  }

  return [...groups.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

// ─── Mapa: umbral para justificar montar el island ─────────────────────────

/**
 * Mínimo de árboles geolocalizados para montar `TrochaVerdeMap` (Leaflet
 * completo, el island más pesado del sitio).
 *
 * Con 2 de 77 árboles geolocalizados, un mapa solo muestra dos alfileres
 * sueltos sobre una pista vacía: no representa el inventario y no justifica
 * el peso de la librería. El corte se fija en 20 —alrededor de una cuarta
 * parte del inventario actual— porque desde ahí el mapa empieza a dibujar
 * zonas y agrupaciones reales de siembra en vez de puntos aislados. Por
 * debajo del umbral la sección no desaparece: sigue diciendo cuántos árboles
 * de los 77 ya tienen ubicación, en vez de ocultar el dato.
 */
export const MIN_GEOLOCATED_TREES_FOR_MAP = 20;

export interface MapReadiness {
  geolocated: number;
  total: number;
  /** `true` cuando `geolocated` alcanza `MIN_GEOLOCATED_TREES_FOR_MAP`. */
  ready: boolean;
}

export function checkMapReadiness(trees: Pick<TreeInput, 'lat' | 'lng'>[]): MapReadiness {
  const geolocated = trees.filter(
    (t) => typeof t.lat === 'number' && typeof t.lng === 'number'
  ).length;

  return {
    geolocated,
    total: trees.length,
    ready: geolocated >= MIN_GEOLOCATED_TREES_FOR_MAP,
  };
}

// ─── Compatibilidad: getTreeStats() con getCollection incorporado ─────────

/**
 * Wrapper con `getCollection` para quien ya llamaba `getTreeStats()` sin
 * argumentos (`AboutPreview.astro`, `quienes-somos.astro`,
 * `patrocinadores.astro`, fuera del alcance de esta migración). El cálculo
 * real vive en `summarizeTrees()`, puro y testeado sin runtime de Astro; este
 * wrapper solo carga la colección y se la pasa.
 */
export async function getTreeStats(): Promise<TreeStats> {
  const { getCollection } = await import('astro:content');
  const trees = await getCollection('trees', (t) => !t.data.draft);
  return summarizeTrees(trees.map((t) => t.data));
}
