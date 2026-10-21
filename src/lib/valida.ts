/**
 * Lógica pura de la página de una válida corrida en casa
 * (`/copa-valle-yumbo-2026`): la galería oficial descargable, el muro de
 * aliados y las cifras del evento, más los textos que la página arma según lo
 * que haya (apertura, estado sin fotos, resumen de la jornada, índice flotante).
 *
 * Todo el texto y todo dato visible salen de `src/data/valida-yumbo-2026/*.json`;
 * aquí solo se deriva y se traduce a algo pintable. Sin `astro:content`, sin
 * `node:fs` y **sin imports locales**: `scripts/valida-fotos.mjs` importa este
 * archivo directamente con Node (type stripping), así que no puede usar alias
 * `@lib/*` ni sintaxis de TypeScript con semántica en runtime (enums,
 * namespaces, parameter properties).
 *
 * Reglas que atraviesan el módulo:
 * - Ningún nombre de menor: los textos alternativos y los pies de foto se arman
 *   con manga y categoría, nunca con personas.
 * - El número de placa nunca viaja a analítica: identifica a un corredor y la
 *   mayoría son niños. Aquí solo sirve para filtrar en el navegador.
 */

// ─── Tipos de los datos ────────────────────────────────────────────────────────

export interface ValidaVenue {
  name: string;
  shortName: string;
  address: string;
  city: string;
  department: string;
  lat: number;
  lng: number;
}

export interface ValidaPhotographer {
  name: string | null;
  instagram: string | null;
  url: string | null;
  /** Logo para el tema claro (negro) y el oscuro (blanco). */
  logo?: { light: string; dark: string } | null;
}

export interface ValidaEvent {
  slug: string;
  /** Mientras es `false` la página existe pero va con `noindex`, fuera del
   *  sitemap y sin enlaces: el patrón de `/equipo`. */
  published: boolean;
  /** Id de la colección `events` al que pertenece la página. */
  eventId: string;
  /** Id de la siguiente fecha de la temporada, para el paso siguiente. */
  nextEventId: string | null;
  title: string;
  shortTitle: string;
  series: string;
  edition: string;
  /** AAAA-MM-DD. */
  date: string;
  venue: ValidaVenue;
  organizer: string;
  host: string;
  resultsUrl: string | null;
  /** Clasificación general de la Copa Valle después de esta válida, cuando exista. */
  generalUrl?: string | null;
  /** Slug de la crónica en `news`, cuando exista. */
  chronicle: string | null;
  /** Slug del álbum curado en `gallery`, cuando exista. */
  album: string | null;
  photographer: ValidaPhotographer;
  hero: { photoId: string | null; alt: string };
  /** Ruta pública de la imagen para compartir (1200×630), cuando exista. */
  ogImage: string | null;
  institutions: string[];
}

export type AllyRole = 'patrocinio' | 'apoyo';

export interface Ally {
  id: string;
  name: string;
  role: AllyRole;
  tagline: string | null;
  /** Usuario de Instagram sin `@`, solo cuando está confirmado. */
  instagram: string | null;
  url: string | null;
  /** Ruta pública del logo (`/images/valida-yumbo-2026/aliados/<id>.webp`). */
  logo: string;
  /**
   * Ancho ÷ alto del logo recortado, escrito por `scripts/prepare-valida-aliados.mjs`.
   * Sirve para igualar el **área** de los logos en el muro: en una caja fija, un
   * logo apaisado llena el ancho y uno cuadrado queda chico, y en un muro de
   * «todos iguales» el chico se lee como el aliado menor.
   */
  logoRatio?: number | null;
}

export interface PhotoGroup {
  id: string;
  label: string;
  categories: string[];
  description: string;
  /**
   * Texto corto del chip de filtro («Infantil», «Femeninas»). Las familias
   * saben la categoría de su deportista, no el número de manga, que lo fija el
   * cronograma de la Comisión. Sin él, el chip usa las categorías o el label.
   */
  chip?: string | null;
}

/** Grupo con hora de salida: lo que lee el pipeline en `mangas.json`. */
export interface ScheduledGroup extends PhotoGroup {
  /** "HH:MM" en hora local, o `null` para el grupo de antes de la primera salida. */
  start: string | null;
}

export interface Photo {
  id: string;
  group: string;
  /** Ancho y alto de la versión web, para reservar el espacio (CLS). */
  w: number;
  h: number;
  /** Hora de captura, ISO local (`2026-10-18T08:41:12-05:00`). */
  taken: string;
  /** Números de placa visibles, si alguien los etiquetó. */
  placas: number[];
}

export interface PhotoManifest {
  /** URL absoluta de la carpeta de medios, sin barra final. */
  base: string;
  generatedAt: string | null;
  groups: PhotoGroup[];
  photos: Photo[];
}

export interface HistoricFact {
  id: string;
  value: string;
  prefix?: string | null;
  suffix?: string | null;
  label: string;
  note?: string | null;
  icon: string;
}

export interface Edition2026 {
  corredores?: number | null;
  municipios?: number | null;
  departamentos?: number | null;
  categorias?: number | null;
  mujeres?: number | null;
  terminaron?: number | null;
  ninosHasta12?: number | null;
  clubes?: number | null;
  fieles33Volvieron?: number | null;
  podiosClub?: number | null;
  finalMasAjustado?: string | null;
}

export interface LapCategory {
  code: string;
  label: string;
  vueltas: number;
  /** Categoría solo de mujeres (teteros es mixta y no la lleva). */
  femenina?: boolean;
}

export interface LapTime {
  categoria: string;
  puesto: number;
  /** Tiempo total `H:MM:SS` (o `M:SS`). */
  tiempo: string;
  /** Solo en las filas que entran al top: minimización de datos. */
  nombre?: string;
}

/** Quienes completaron todas las vueltas de su categoría, con su tiempo total. */
export interface Vueltas2026 {
  source: string;
  categorias: LapCategory[];
  tiempos: LapTime[];
}

export interface ValidaData {
  source: string;
  /** Título del bloque histórico («2022, 2024 y 2025»); sin él, «Ediciones anteriores». */
  historicoTitulo?: string | null;
  /**
   * Regla de `yumbo-en-numeros.md` §8: si el total de corredores de la edición
   * queda por debajo de este número (el del año anterior), el total no se
   * publica. Lo demás (municipios, el final más ajustado, los fieles) va siempre.
   */
  totalMinimoPublicable?: number | null;
  historico: HistoricFact[];
  edicion2026: Edition2026 | null;
  /** Promedios por vuelta de 2026; sin él no hay bloque. */
  vueltas2026?: Vueltas2026 | null;
  /** La cifra que se cuenta sola («15 segundos por vuelta»); sin ella no hay bloque. */
  ritmo2026?: Ritmo2026 | null;
  /** Competidores por grupo de categorías; sin ella no hay «Quiénes corrieron». */
  composicion2026?: Composicion2026 | null;
  /** Mapa y municipios por departamento; sin ellos no hay «De dónde vinieron». */
  municipios2026?: Municipios2026 | null;
}

export interface Ritmo2026 {
  valor: number;
  unidad: string;
  titulo: string;
  texto: string;
}

export interface CompositionGroup {
  grupo: string;
  /** Rango de edades; vacío o ausente si el grupo no se define por edad. */
  edad?: string | null;
  n: number;
}

export interface Composicion2026 {
  nota?: string | null;
  grupos: CompositionGroup[];
  masNumerosa?: { categoria: string; n: number } | null;
}

export interface MunicipalityDepartment {
  nombre: string;
  municipios: string[];
}

export interface Municipios2026 {
  /** Ruta pública al SVG; sin ella la leyenda va sola. */
  mapa?: string | null;
  nota?: string | null;
  departamentos: MunicipalityDepartment[];
}

// ─── URLs de las fotos ─────────────────────────────────────────────────────────

export interface PhotoUrls {
  thumb: string;
  web: string;
  original: string;
}

/**
 * Las tres versiones de una foto viven bajo `base`, en carpetas fijas que
 * escribe el pipeline. El original conserva la extensión `.jpg` del archivo
 * que entregó el fotógrafo; las otras dos son WebP.
 */
export function photoUrls(base: string, id: string): PhotoUrls {
  const root = base.replace(/\/+$/, '');
  return {
    thumb: `${root}/thumb/${id}.webp`,
    web: `${root}/web/${id}.webp`,
    original: `${root}/original/${id}.jpg`,
  };
}

/** Nombre con el que se guarda el original al descargarlo. */
export function downloadFileName(eventSlug: string, id: string): string {
  return `${eventSlug}-${id}.jpg`;
}

/** Enlace directo a una foto dentro de la página: `#foto-<id>`. */
export function photoShareUrl(pageUrl: string, id: string): string {
  const clean = pageUrl.split('#')[0];
  return `${clean}#foto-${id}`;
}

export const PHOTO_HASH_PREFIX = 'foto-';

/** Id de la foto que pide un `location.hash`, o `null` si el hash es otra cosa. */
export function photoIdFromHash(hash: string): string | null {
  const value = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!value.startsWith(PHOTO_HASH_PREFIX)) return null;
  const id = value.slice(PHOTO_HASH_PREFIX.length);
  return id.length > 0 ? id : null;
}

// ─── Asignación por hora ───────────────────────────────────────────────────────

/** "HH:MM" o "HH:MM:SS" → segundos desde la medianoche; `null` si no parsea. */
function clockToSeconds(clock: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(clock.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Hora local de captura, en segundos desde la medianoche, leída del texto ISO
 * sin pasar por `Date`: así da igual la zona horaria de la máquina que corre
 * el pipeline o el navegador que lee el manifest.
 */
export function takenSeconds(taken: string): number | null {
  const match = /T(\d{2}:\d{2}(?::\d{2})?)/.exec(taken);
  return match ? clockToSeconds(match[1]) : null;
}

/**
 * Grupo al que pertenece una foto según su hora de captura: el último grupo
 * cuya hora de salida es igual o anterior a la captura. Lo anterior a la
 * primera salida cae en el grupo sin hora (`start: null`) si lo hay, o en el
 * primero. Sin hora de captura legible, también al primero: es mejor una foto
 * mal clasificada que una foto perdida.
 */
export function assignGroup(taken: string | null, groups: ScheduledGroup[]): string {
  if (groups.length === 0) throw new Error('assignGroup: no hay grupos definidos');

  const fallback = groups.find((group) => group.start === null) ?? groups[0];
  const seconds = taken ? takenSeconds(taken) : null;
  if (seconds === null) return fallback.id;

  const scheduled = groups
    .map((group) => ({
      id: group.id,
      at: group.start === null ? null : clockToSeconds(group.start),
    }))
    .filter((group): group is { id: string; at: number } => group.at !== null)
    .sort((a, b) => a.at - b.at);

  let current: string = fallback.id;
  for (const group of scheduled) {
    if (group.at <= seconds) current = group.id;
    else break;
  }
  return current;
}

/** Nombre de carpeta sin número inicial ni tildes, en minúsculas: la llave de `carpetas.json`. */
export function folderKey(folder: string): string {
  return folder
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\s*\d+\s*-\s*/, '')
    .trim()
    .toLowerCase();
}

/**
 * Grupo según la carpeta con que el fotógrafo entregó la foto (`relativePath` es
 * la ruta dentro de la carpeta de originales). `null` si la carpeta no está en el
 * mapa o apunta a un grupo que no existe: quien llama cae entonces a la hora EXIF.
 */
export function assignGroupByFolder(
  relativePath: string,
  folders: Record<string, string>,
  groups: PhotoGroup[],
): string | null {
  const folder = relativePath.split(/[\\/]/)[0];
  const id = folders[folderKey(folder)];
  return id && groups.some((group) => group.id === id) ? id : null;
}

// ─── Agrupación y textos ───────────────────────────────────────────────────────

export interface GroupedPhotos {
  group: PhotoGroup;
  photos: Photo[];
}

function byTakenThenId(a: Photo, b: Photo): number {
  const ta = takenSeconds(a.taken) ?? Number.MAX_SAFE_INTEGER;
  const tb = takenSeconds(b.taken) ?? Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return ta - tb;
  // Sin hora en ninguna (el pipeline la omite cuando las cámaras no comparten
  // reloj), manda el orden del manifest: el pipeline ya lo dejó por carpeta y nombre.
  if (takenSeconds(a.taken) === null && takenSeconds(b.taken) === null) return 0;
  return a.id.localeCompare(b.id);
}

/**
 * Fotos por grupo, en el orden del manifest y ordenadas por hora dentro de
 * cada uno (si no tienen hora, en el orden del manifest). Los grupos vacíos no se devuelven: un encabezado «Manga 2» sin
 * fotos debajo es peor que ninguno. Una foto cuyo grupo no exista se agrupa
 * bajo un grupo «Otras» al final, para no perderla en silencio.
 */
export function groupPhotos(manifest: PhotoManifest): GroupedPhotos[] {
  const known = new Set(manifest.groups.map((group) => group.id));
  const buckets = new Map<string, Photo[]>();
  for (const photo of manifest.photos) {
    const key = known.has(photo.group) ? photo.group : '__otras__';
    const list = buckets.get(key) ?? [];
    list.push(photo);
    buckets.set(key, list);
  }

  const result: GroupedPhotos[] = [];
  for (const group of manifest.groups) {
    const photos = buckets.get(group.id);
    if (photos && photos.length > 0) {
      result.push({ group, photos: [...photos].sort(byTakenThenId) });
    }
  }
  const orphans = buckets.get('__otras__');
  if (orphans && orphans.length > 0) {
    result.push({
      group: { id: 'otras', label: 'Otras fotos', categories: [], description: '' },
      photos: [...orphans].sort(byTakenThenId),
    });
  }
  return result;
}

export function countPhotos(manifest: PhotoManifest): number {
  return manifest.photos.length;
}

/** «1 foto» / «180 fotos». */
export function photoCount(count: number): string {
  return count === 1 ? '1 foto' : `${count} fotos`;
}

/** Etiqueta corta del grupo: «Manga 3 · Infantil A y B». */
export function groupTitle(group: PhotoGroup): string {
  const cats = joinCategories(group.categories);
  return cats ? `${group.label} · ${cats}` : group.label;
}

/**
 * Texto del chip de filtro: el `chip` del JSON si existe; si no, las categorías
 * («Infantil A y B»); si tampoco, el label («Antes de la salida»). Nunca el
 * número de manga solo: nadie busca a su hijo por «Manga 3».
 */
export function chipLabel(group: PhotoGroup): string {
  const chip = group.chip?.trim();
  if (chip) return chip;
  const cats = joinCategories(group.categories);
  return cats || group.label;
}

/** «Infantil A y B» a partir de ["Infantil A", "Infantil B"]; vacío sin categorías. */
export function joinCategories(categories: string[]): string {
  if (categories.length === 0) return '';
  if (categories.length === 1) return categories[0];
  // Comprime pares «X A» + «X B» → «X A y B».
  const compact: string[] = [];
  for (const category of categories) {
    const previous = compact[compact.length - 1];
    const match = /^(.*\S)\s+([A-Z])$/.exec(category);
    const prevMatch = previous ? /^(.*\S)\s+([A-Z](?: y [A-Z])*)$/.exec(previous) : null;
    if (match && prevMatch && match[1] === prevMatch[1]) {
      compact[compact.length - 1] = `${prevMatch[1]} ${prevMatch[2]} y ${match[2]}`;
    } else {
      compact.push(category);
    }
  }
  if (compact.length === 1) return compact[0];
  return `${compact.slice(0, -1).join(', ')} y ${compact[compact.length - 1]}`;
}

/** Hora de captura legible, «8:41 a. m.», o vacío si no se puede leer. */
export function takenClock(taken: string): string {
  const seconds = takenSeconds(taken);
  if (seconds === null) return '';
  const hours24 = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const suffix = hours24 < 12 ? 'a. m.' : 'p. m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/**
 * Texto alternativo y pie de una foto, sin personas: la manga, sus categorías
 * y la posición dentro del grupo. «Manga 3, Infantil A y B: foto 17 de 180».
 */
export function photoAlt(group: PhotoGroup, index: number, total: number): string {
  const cats = joinCategories(group.categories);
  const where = cats ? `${group.label}, ${cats}` : group.label;
  return `${where}: foto ${index + 1} de ${total}`;
}

// ─── Filtro por placa ──────────────────────────────────────────────────────────

/** Número de placa escrito por una persona: solo dígitos, de 1 a 4 cifras. */
export function parsePlaca(input: string): number | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 4) return null;
  const value = Number(digits);
  return value > 0 ? value : null;
}

export function hasPlacaTags(manifest: PhotoManifest): boolean {
  return manifest.photos.some((photo) => photo.placas.length > 0);
}

export function filterByPlaca(photos: Photo[], placa: number): Photo[] {
  return photos.filter((photo) => photo.placas.includes(placa));
}

/**
 * Filtro inicial que pide la URL: solo `?manga=manga-3`.
 *
 * La placa **no** se lee de la URL a propósito: GA4 recibe la URL completa en
 * cada `page_view`, y una placa en la query, cruzada con los resultados
 * públicos, identifica a un menor. El número solo existe en el campo de la
 * página y nunca se escribe en la dirección.
 */
export function initialFilterFromSearch(
  search: string,
  manifest: PhotoManifest,
): { group: string | null } {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const requestedGroup = params.get('manga');
  const group =
    requestedGroup && manifest.groups.some((candidate) => candidate.id === requestedGroup)
      ? requestedGroup
      : null;
  return { group };
}

/** `?manga=<id>` para compartir un grupo, o la ruta limpia si no hay filtro. */
export function groupSearch(groupId: string | null): string {
  return groupId ? `?manga=${encodeURIComponent(groupId)}` : '';
}

// ─── Aliados ───────────────────────────────────────────────────────────────────

const ALLY_ROLE_LABEL: Record<AllyRole, string> = {
  patrocinio: 'Patrocinador',
  apoyo: 'Apoyo',
};

export function allyRoleLabel(role: AllyRole): string {
  return ALLY_ROLE_LABEL[role];
}

/**
 * El usuario decidió que no hay orden ni niveles: todos entran iguales. El
 * orden alfabético es el único que nadie puede leer como jerarquía.
 */
export function sortAllies(allies: Ally[]): Ally[] {
  return [...allies].sort((a, b) => a.name.localeCompare(b.name, 'es-CO', { sensitivity: 'base' }));
}

/** Enlace de la tarjeta: Instagram confirmado, si no la web, si no nada. */
export function allyHref(ally: Ally): string | null {
  if (ally.instagram) return `https://www.instagram.com/${ally.instagram.replace(/^@/, '')}/`;
  return ally.url;
}

export function allyHandle(ally: Ally): string | null {
  return ally.instagram ? `@${ally.instagram.replace(/^@/, '')}` : null;
}

export interface AllySummary {
  total: number;
  sponsors: number;
  supporters: number;
}

export function summarizeAllies(allies: Ally[]): AllySummary {
  const sponsors = allies.filter((ally) => ally.role === 'patrocinio').length;
  return { total: allies.length, sponsors, supporters: allies.length - sponsors };
}

/** Rótulo de cada grupo del muro: la fórmula del afiche, por rol. */
const ALLY_GROUP_TITLE: Record<AllyRole, string> = {
  patrocinio: 'Con el patrocinio de',
  apoyo: 'Con el apoyo de',
};

/** Orden de los grupos. Ordena roles, no marcas: dentro de cada grupo manda el alfabeto. */
const ALLY_ROLE_ORDER: AllyRole[] = ['patrocinio', 'apoyo'];

export interface AllyGroup {
  role: AllyRole;
  title: string;
  allies: Ally[];
  /**
   * Si las tarjetas del grupo muestran su línea descriptiva: solo cuando todas
   * la tienen. Con unas sí y otras no, las que la tienen se leen como
   * destacadas en un muro donde todas van al mismo nivel.
   */
  taglines: boolean;
}

/**
 * El muro en dos grupos con rótulo («Con el patrocinio de», «Con el apoyo de»),
 * alfabéticos por dentro. El rol lo dice el rótulo y no cada tarjeta, que así
 * quedan todas iguales. Un grupo sin aliados no aparece.
 */
export function groupAlliesByRole(allies: Ally[]): AllyGroup[] {
  return ALLY_ROLE_ORDER.map((role) => {
    const members = sortAllies(allies.filter((ally) => ally.role === role));
    return {
      role,
      title: ALLY_GROUP_TITLE[role],
      allies: members,
      taglines: members.length > 0 && members.every((ally) => Boolean(ally.tagline?.trim())),
    };
  }).filter((group) => group.allies.length > 0);
}

/**
 * La línea que presenta a todos los aliados juntos (franja de la página): nombra
 * los roles que de verdad hay y nada más. Patrocinar y apoyar no son lo mismo
 * —ASCOMY apoya, no patrocina—, así que con los dos roles van los dos.
 */
export function allyCreditLine(allies: Ally[]): string {
  const { sponsors, supporters } = summarizeAllies(allies);
  if (sponsors > 0 && supporters > 0) return 'Con el patrocinio y el apoyo de';
  if (sponsors > 0) return ALLY_GROUP_TITLE.patrocinio;
  if (supporters > 0) return ALLY_GROUP_TITLE.apoyo;
  return '';
}

/** Casillas por fila de la franja desde 640 px, como mínimo: dos filas de ocho, como el afiche. */
export const RIBBON_MIN_COLUMNS = 8;

/**
 * Casillas por fila de la franja de aliados desde 640 px. Con 16 aliados o menos, ocho
 * (dos filas de ocho, como el afiche); con más, las que hagan falta para seguir en **dos**
 * filas. Con 18 y ocho por fila quedaba una tercera fila con dos logos sueltos.
 */
export function ribbonColumns(total: number): number {
  return Math.max(RIBBON_MIN_COLUMNS, Math.ceil(total / 2));
}

/** Casilla donde va un logo, en % de su propio ancho. */
export interface LogoBox {
  /** Lado del logo cuadrado de referencia. */
  side: number;
  /** Ancho máximo: el margen mínimo que deja a los lados. */
  maxWidth: number;
  /** Alto máximo, también en % del **ancho** de la casilla (es lo que admite `width`). */
  maxHeight: number;
}

/**
 * Ancho del logo, en % del ancho de su casilla, para que todos ocupen la misma
 * superficie. En una caja fija con `object-contain`, un logo apaisado (Rapi Wey,
 * 4:1) llena el ancho y uno cuadrado queda chico; en un muro de «todos iguales»
 * el chico se lee como el aliado menor. Con ancho `√r · side` y alto
 * `side / √r`, el área es `side²` para cualquier proporción `r` (ancho ÷ alto,
 * `logoRatio`).
 *
 * Solo una proporción extrema toca los topes (hoy, Coordinadora, 10,85:1, el de
 * ancho: su área queda en el 40 % de la de un cuadrado, es lo que cabe): entonces
 * se encoge lo justo para caber, sin cambiar su forma. Sin proporción conocida se
 * trata como cuadrado y la imagen se contiene en la casilla.
 */
export function equalAreaWidth(ratio: number | null | undefined, box: LogoBox): number {
  const r = ratio && ratio > 0 ? ratio : 1;
  const width = Math.min(Math.sqrt(r) * box.side, box.maxWidth, box.maxHeight * r);
  return Math.round(width * 10) / 10;
}

/** Cajas en las que `scripts/prepare-valida-aliados.mjs` encaja cada logo (sin agrandar). */
export const LOGO_FILE_BOXES = {
  small: { width: 320, height: 200 },
  large: { width: 640, height: 400 },
};

export interface LogoSources {
  src: string;
  /** La versión chica (`<id>-320.webp`) y la grande, o nada si no hay proporción. */
  srcset: string | undefined;
}

/**
 * Las dos versiones del logo para el `srcset`: la franja lo pinta a menos de
 * 130 px CSS y no necesita la de 640. El ancho de cada archivo se deduce de la
 * caja y de la proporción: `min(ancho de la caja, alto de la caja × proporción)`.
 * Si el original era más chico que la caja (Croki Plátano, 146 px), el ancho
 * real queda por debajo del declarado, pero entonces las dos versiones son la
 * misma imagen y da igual cuál elija el navegador.
 */
export function allyLogoSources(ally: Pick<Ally, 'logo' | 'logoRatio'>): LogoSources {
  const ratio = ally.logoRatio;
  if (!ratio || ratio <= 0 || !ally.logo.endsWith('.webp')) {
    return { src: ally.logo, srcset: undefined };
  }
  const width = (box: { width: number; height: number }) =>
    Math.round(Math.min(box.width, box.height * ratio));
  const small = ally.logo.replace(/\.webp$/, '-320.webp');
  return {
    src: ally.logo,
    srcset: `${small} ${width(LOGO_FILE_BOXES.small)}w, ${ally.logo} ${width(LOGO_FILE_BOXES.large)}w`,
  };
}

/** «la Comisión…, la Liga… y Shimano»: lista en prosa para el pie institucional. */
export function listInProse(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

// ─── Cifras ────────────────────────────────────────────────────────────────────

export interface StatItem {
  id: string;
  value: string;
  prefix: string | null;
  suffix: string | null;
  label: string;
  note: string | null;
  icon: string;
}

export function historicStats(data: ValidaData): StatItem[] {
  return data.historico
    .filter((fact) => fact.value.trim().length > 0 && fact.label.trim().length > 0)
    .map((fact) => ({
      id: fact.id,
      value: fact.value,
      prefix: fact.prefix ?? null,
      suffix: fact.suffix ?? null,
      label: fact.label,
      note: fact.note ?? null,
      icon: fact.icon,
    }));
}

export interface EditionFact {
  /** Campo de `edicion2026` del que sale: permite sacar del listado las cifras que van destacadas. */
  id: keyof Edition2026;
  icon: string;
  label: string;
  value: string;
}

const INT = new Intl.NumberFormat('es-CO');

/**
 * Cifras de la edición 2026, solo las que existan. Cada una es opcional a
 * propósito: la regla de `yumbo-en-numeros.md` §8, escrita en código y no en la
 * memoria de quien llena el JSON, es que si el total de corredores queda por
 * debajo del año anterior (`minRunners`, el `totalMinimoPublicable` del JSON) no
 * se publica el total, y municipios, el final más ajustado y los fieles van
 * siempre. Lo que no está en el JSON, no se pinta.
 */
export function editionFacts(
  edition: Edition2026 | null,
  options: { minRunners?: number | null } = {},
): EditionFact[] {
  if (!edition) return [];
  const min = options.minRunners ?? null;
  const runners =
    edition.corredores != null && min !== null && edition.corredores < min
      ? null
      : edition.corredores;
  const facts: (EditionFact | null)[] = [
    numberFact('corredores', runners, 'ph:users-three-bold', 'Corredores en la salida'),
    edition.municipios
      ? {
          id: 'municipios',
          icon: 'ph:map-trifold-bold',
          label: 'De dónde vinieron',
          value: edition.departamentos
            ? `${INT.format(edition.municipios)} municipios de ${INT.format(edition.departamentos)} departamentos`
            : `${INT.format(edition.municipios)} municipios`,
        }
      : null,
    numberFact('clubes', edition.clubes, 'ph:flag-banner-bold', 'Clubes y escuelas'),
    numberFact('categorias', edition.categorias, 'ph:list-numbers-bold', 'Categorías'),
    numberFact('ninosHasta12', edition.ninosHasta12, 'ph:baby-bold', 'Niños hasta 12 años'),
    numberFact('mujeres', edition.mujeres, 'ph:gender-female-bold', 'En las categorías femeninas'),
    numberFact('terminaron', edition.terminaron, 'ph:flag-checkered-bold', 'Terminaron'),
    // «33» es el piso de quienes corrieron 2022, 2024 y 2025 sin faltar; se dice
    // de cuántos volvieron, o el número suelto no significa nada.
    edition.fieles33Volvieron != null
      ? {
          id: 'fieles33Volvieron',
          icon: 'ph:repeat-bold',
          label: 'De los 33 que corrieron las tres, volvieron',
          value: `${INT.format(edition.fieles33Volvieron)} de 33`,
        }
      : null,
    numberFact('podiosClub', edition.podiosClub, 'ph:medal-bold', 'Podios del club en casa'),
    edition.finalMasAjustado
      ? {
          id: 'finalMasAjustado',
          icon: 'ph:timer-bold',
          label: 'El final más ajustado',
          value: edition.finalMasAjustado,
        }
      : null,
  ];
  return facts.filter((fact): fact is EditionFact => fact !== null);
}

function numberFact(
  id: keyof Edition2026,
  value: number | null | undefined,
  icon: string,
  label: string,
): EditionFact | null {
  if (value === null || value === undefined) return null;
  return { id, icon, label, value: INT.format(value) };
}

export interface EditionHighlight {
  id: keyof Edition2026;
  icon: string;
  /** Entero cuando se puede animar el conteo; texto cuando no. */
  value: number | string;
  unit?: string;
  label: string;
}

/**
 * Las tres cifras de 2026 que van grandes, arriba del listado: de dónde
 * llegaron, cuántos niños y el final más ajustado. Son las que una familia
 * repite (y las tres que la regla §8 manda publicar siempre o casi siempre);
 * el resto queda en el listado compacto.
 *
 * «2 segundos en infantil A» se parte en cifra, unidad y frase para que el
 * número tenga el tamaño de las otras dos; si el texto no tiene esa forma, va
 * entero como cifra.
 */
export function editionHighlights(edition: Edition2026 | null): EditionHighlight[] {
  if (!edition) return [];
  const highlights: (EditionHighlight | null)[] = [
    edition.municipios
      ? {
          id: 'municipios',
          icon: 'ph:map-trifold-bold',
          value: edition.municipios,
          label: edition.departamentos
            ? `municipios de ${INT.format(edition.departamentos)} departamentos llegaron a la salida`
            : 'municipios llegaron a la salida',
        }
      : null,
    edition.ninosHasta12
      ? {
          id: 'ninosHasta12',
          icon: 'ph:baby-bold',
          value: edition.ninosHasta12,
          label: 'niños y niñas de hasta 12 años corrieron',
        }
      : null,
    finalHighlight(edition.finalMasAjustado),
  ];
  return highlights.filter((item): item is EditionHighlight => item !== null);
}

function finalHighlight(text: string | null | undefined): EditionHighlight | null {
  const clean = text?.trim();
  if (!clean) return null;
  const match = /^(\d+(?:[.,]\d+)?)\s+(segundos?|décimas?)\s+(?:en\s+)?(.+)$/i.exec(clean);
  if (!match) {
    return {
      id: 'finalMasAjustado',
      icon: 'ph:timer-bold',
      value: clean,
      label: 'el final más ajustado',
    };
  }
  const [, amount, unit, category] = match;
  const value = /^\d+$/.test(amount) ? Number(amount) : amount;
  return {
    id: 'finalMasAjustado',
    icon: 'ph:timer-bold',
    value,
    unit,
    label: `decidieron el final más ajustado, en ${category}`,
  };
}

/**
 * ¿«En cifras» tiene algo que pintar? Cifras históricas, destacadas de la
 * edición o datos de la edición. Es la condición con la que `ValidaNumbers`
 * decide pintarse y con la que el índice flotante decide si lleva «Cifras»: una
 * sola definición, para que la entrada del índice nunca apunte a una sección
 * que no existe.
 *
 * `ValidaNumbers` saca de los datos las cifras que ya van destacadas; eso no
 * cambia la respuesta: sin destacadas no saca nada, y con ellas ya hay algo.
 */
export function numbersAvailable(data: ValidaData): boolean {
  return (
    historicStats(data).length > 0 ||
    editionHighlights(data.edicion2026).length > 0 ||
    editionFacts(data.edicion2026, { minRunners: data.totalMinimoPublicable }).length > 0 ||
    lapRanking(data.vueltas2026, 1).length > 0 ||
    ritmoAvailable(data.ritmo2026) ||
    compositionGroups(data.composicion2026).length > 0 ||
    municipalityLegend(data.municipios2026).length > 0
  );
}

// ─── Ritmo, composición y procedencia ──────────────────────────────────────────

/** ¿El bloque del ritmo tiene todo lo que necesita para pintarse? */
export function ritmoAvailable(ritmo: Ritmo2026 | null | undefined): ritmo is Ritmo2026 {
  return Boolean(ritmo && ritmo.unidad.trim() && ritmo.titulo.trim() && ritmo.texto.trim());
}

export interface CompositionBar {
  label: string;
  /** «4 y 5 años»; vacío si el grupo no se define por edad. */
  age: string;
  n: number;
  /** Ancho de la barra en % de la escala común (parte de cero, el máximo llena el 100 %). */
  percent: number;
}

/**
 * Los grupos de «Quiénes corrieron» con el ancho de su barra: una escala común
 * que parte de cero y llega al mayor, para que ninguna barra exagere. Los
 * grupos en cero se omiten; el orden es el del JSON (por edad).
 */
export function compositionGroups(
  composition: Composicion2026 | null | undefined,
): CompositionBar[] {
  const groups = (composition?.grupos ?? []).filter(
    (group) => group.grupo.trim().length > 0 && group.n > 0,
  );
  const max = Math.max(...groups.map((group) => group.n), 0);
  return groups.map((group) => ({
    label: group.grupo,
    age: group.edad?.trim() ?? '',
    n: group.n,
    percent: max > 0 ? (group.n / max) * 100 : 0,
  }));
}

export interface MunicipalityLegendItem {
  /** Número del marcador del mapa: la posición en `departamentos`, desde 1. */
  number: number;
  name: string;
  municipalities: string[];
  /** «17 municipios», «1 municipio». */
  countLabel: string;
}

/** Cuántos municipios suman los departamentos. */
export function municipalityTotal(places: Municipios2026 | null | undefined): number {
  return (places?.departamentos ?? []).reduce((sum, dep) => sum + dep.municipios.length, 0);
}

/** La leyenda del mapa: un renglón por departamento con municipios, numerado como los marcadores. */
export function municipalityLegend(
  places: Municipios2026 | null | undefined,
): MunicipalityLegendItem[] {
  // El número es la posición en el JSON (la de los marcadores del mapa), aunque un
  // departamento sin municipios se omita de la leyenda.
  return (places?.departamentos ?? [])
    .map((dep, index) => ({
      number: index + 1,
      name: dep.nombre,
      municipalities: dep.municipios,
      countLabel: `${INT.format(dep.municipios.length)} ${dep.municipios.length === 1 ? 'municipio' : 'municipios'}`,
    }))
    .filter((item) => item.municipalities.length > 0);
}

// ─── Mejores promedios por vuelta ──────────────────────────────────────────────

export interface LapRankingRow {
  rank: number;
  categoryLabel: string;
  position: number;
  laps: number;
  totalSeconds: number;
  /** Sin redondear: es el que ordena. */
  perLapSeconds: number;
  /** Diferencia por vuelta con el primero, sin redondear. */
  gapToFirstSeconds: number;
  name: string | null;
  /** «12:42» (segundos enteros). */
  perLap: string;
  /** «1:16:15». */
  total: string;
  /** «+0:16»; el primero lleva «—». */
  gap: string;
}

/** Segundos a reloj: `M:SS`, o `H:MM:SS` desde la hora. Redondea al segundo. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const sec = String(whole % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** `H:MM:SS` o `M:SS` a segundos; `null` si no tiene esa forma. */
function parseClock(clock: string): number | null {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export interface LapRankingOptions {
  /**
   * Solo las categorías marcadas `femenina: true`. La diferencia se mide contra
   * la primera de la lista filtrada, no contra la general.
   */
  onlyFemale?: boolean;
}

/**
 * Los mejores promedios por vuelta del día: tiempo total ÷ vueltas de su
 * categoría, de menor a mayor. Empates: menor tiempo total y luego el orden de
 * `categorias`. Las filas de una categoría desconocida o con tiempo ilegible se
 * ignoran. El promedio se redondea al segundo solo al mostrarlo, y la
 * diferencia con el primero se calcula entre los promedios redondeados. Con
 * `onlyFemale` solo cuentan las categorías femeninas (y el «primero» es la
 * primera de ellas).
 */
export function lapRanking(
  data: Vueltas2026 | null | undefined,
  limit = 20,
  options: LapRankingOptions = {},
): LapRankingRow[] {
  if (!data || limit <= 0) return [];
  const order = new Map(data.categorias.map((cat, index) => [cat.code, index]));
  const cats = new Map(data.categorias.map((cat) => [cat.code, cat]));
  const entries = data.tiempos.flatMap((row) => {
    const cat = cats.get(row.categoria);
    const totalSeconds = parseClock(row.tiempo);
    if (!cat || totalSeconds === null || cat.vueltas < 1) return [];
    if (options.onlyFemale && cat.femenina !== true) return [];
    return [{ row, cat, totalSeconds, perLapSeconds: totalSeconds / cat.vueltas }];
  });
  entries.sort(
    (a, b) =>
      a.perLapSeconds - b.perLapSeconds ||
      a.totalSeconds - b.totalSeconds ||
      (order.get(a.row.categoria) ?? 0) - (order.get(b.row.categoria) ?? 0),
  );
  // La diferencia sale de los promedios ya redondeados, los que se leen: con
  // 12:43 y 12:58 en pantalla, la diferencia tiene que decir 0:15, no 0:16.
  const best = Math.round(entries[0]?.perLapSeconds ?? 0);
  return entries.slice(0, limit).map((entry, index) => {
    const gapToFirstSeconds = Math.round(entry.perLapSeconds) - best;
    return {
      rank: index + 1,
      categoryLabel: entry.cat.label,
      position: entry.row.puesto,
      laps: entry.cat.vueltas,
      totalSeconds: entry.totalSeconds,
      perLapSeconds: entry.perLapSeconds,
      gapToFirstSeconds,
      name: entry.row.nombre?.trim() || null,
      perLap: formatClock(entry.perLapSeconds),
      total: formatClock(entry.totalSeconds),
      gap: index === 0 ? '—' : `+${formatClock(gapToFirstSeconds)}`,
    };
  });
}

// ─── Metadatos de la página ────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
}

/** Google recorta títulos de más de ~60 caracteres y descripciones de más de ~160. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/**
 * Título y descripción cambian con lo que la página de verdad tiene: con fotos
 * publicadas, la búsqueda que importa es «fotos copa valle yumbo»; sin ellas,
 * la página describe la válida y a quienes la hicieron posible. Los dos textos
 * caben en lo que Google muestra; el test lo comprueba.
 */
export function pageMeta(event: ValidaEvent, manifest: PhotoManifest, allies: Ally[]): PageMeta {
  const photos = countPhotos(manifest);
  const { total } = summarizeAllies(allies);
  const year = event.date.slice(0, 4);
  const where = `${event.venue.shortName} de ${event.venue.city}`;
  if (photos > 0) {
    return {
      title: `Fotos de la ${event.edition} Copa Valle ${year} en ${event.venue.city}`,
      // Sin la ciudad: ya va en el título, y con ella la descripción pasa de 160 caracteres.
      description: `${photoCount(photos)} de la ${event.edition} Copa Valle en la ${event.venue.shortName}. Busca su categoría y descarga sus fotos gratis, en calidad original. Gracias a ${total} aliados.`,
    };
  }
  return {
    title: `${event.edition} Copa Valle ${year} en ${event.venue.city}: fotos y aliados`,
    description: `La ${event.edition} Copa Valle se corrió en la ${where}, casa del club. Fotos para descargar gratis, ${total} aliados y las cifras de la jornada.`,
  };
}

export function isPublished(event: ValidaEvent): boolean {
  return event.published === true;
}

/** `AAAA-MM-DD` → medianoche UTC de ese día, más `addDays` días. */
function utcDate(isoDate: string, addDays = 0): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + addDays));
}

/** Fecha larga en español, calculada en UTC como el resto del sitio. */
export function longDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate(isoDate));
}

// ─── Apertura ──────────────────────────────────────────────────────────────────

export interface HeroCopy {
  title: string;
  /** Fragmento del titular que va resaltado. */
  highlight: string;
  lead: string;
  /** Título del mensaje de WhatsApp al compartir la página. */
  shareTitle: string;
}

/**
 * Los textos de la apertura. La promesa es lo que la familia vino a buscar: sus
 * fotos. Sin fotos (antes del lunes, o si se retiraran todas) se narra la
 * jornada.
 */
export function heroCopy(event: ValidaEvent, totalPhotos: number): HeroCopy {
  // `longDate` devuelve «domingo, 18 de octubre de 2026»; en una frase va sin coma.
  const dateText = longDate(event.date).replace(',', '');
  const { edition, host, title } = event;
  const { city, shortName } = event.venue;
  if (totalPhotos > 0) {
    return {
      title: `Tus fotos de la ${edition} en ${city}`,
      highlight: 'Tus fotos',
      lead: `Gratis y en calidad original, ordenadas por categoría. Son del ${dateText} en la ${shortName}, la casa del ${host}.`,
      shareTitle: `Fotos oficiales de la ${title}`,
    };
  }
  return {
    title: `Así se corrió la ${edition} en ${city}`,
    highlight: city,
    lead: `El ${dateText} la Copa Valle se corrió en la ${shortName}, la casa del ${host}. Aquí están los aliados que le apostaron a la válida y lo que dejó la jornada.`,
    shareTitle: title,
  };
}

// ─── Galería sin fotos ─────────────────────────────────────────────────────────

export interface GalleryEmptyCopy {
  title: string;
  body: string;
}

const WEEKDAY_DAY_MONTH = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/**
 * El estado sin fotos promete «el día siguiente» a la válida, no una fecha
 * escrita a mano: si el JSON cambia de día, el texto lo sigue. «Las fotos
 * oficiales estarán aquí el lunes 19 de octubre».
 */
export function galleryEmptyCopy(isoDate: string): GalleryEmptyCopy {
  const dayAfter = WEEKDAY_DAY_MONTH.format(utcDate(isoDate, 1)).replace(',', '');
  return {
    title: `Las fotos oficiales estarán aquí el ${dayAfter}`,
    body: 'Gratis y en calidad original, agrupadas por categoría para que encuentres las tuyas en segundos.',
  };
}

// ─── Resumen de la jornada ─────────────────────────────────────────────────────

export type RecapKey = 'resultados' | 'general' | 'cronica' | 'album';

export interface RecapCard {
  key: RecapKey;
  icon: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  /** El enlace sale del sitio: se abre en otra pestaña. */
  external: boolean;
  /** Evento de GA4, solo para los enlaces que salen del sitio. */
  event?: string;
  contentId?: string;
}

export interface RecapInput {
  /** URL de los resultados oficiales, o `null` si no hay. */
  resultsUrl: string | null;
  /** URL de la clasificación general después de esta válida, o `null`. */
  generalUrl?: string | null;
  /** Quien publica los resultados: se nombra como fuente. */
  organizer: string;
  /** Id de la crónica, ya resuelta contra `news`, o `null`. */
  chronicleId: string | null;
  /** Álbum ya resuelto contra `gallery`, con cuántas fotos trae, o `null`. */
  album: { id: string; imageCount: number } | null;
}

/**
 * Las tarjetas de «Revive la jornada»: resultados, general, crónica y álbum, solo las que
 * existen y en ese orden. La página resuelve la crónica y el álbum contra las
 * colecciones; aquí llegan valores planos.
 *
 * Las descripciones no repiten el título de la crónica ni del álbum: los
 * titulares de una crónica deportiva suelen llevar el nombre de quien subió al
 * podio, y la página no publica nombres de deportistas (casi todos son menores).
 */
export function recapCards(input: RecapInput): RecapCard[] {
  const { resultsUrl, generalUrl, organizer, chronicleId, album } = input;
  const cards: RecapCard[] = [];
  if (resultsUrl) {
    cards.push({
      key: 'resultados',
      icon: 'ph:trophy-bold',
      title: 'Resultados oficiales',
      description: `Las posiciones de la jornada. Fuente: ${organizer}.`,
      cta: 'Ver los resultados',
      href: resultsUrl,
      external: true,
      event: 'race_results_click',
      contentId: 'resultados-oficiales',
    });
  }
  if (generalUrl) {
    cards.push({
      key: 'general',
      icon: 'ph:ranking-bold',
      title: 'Clasificación general',
      description: `La general de la Copa Valle después de esta válida. Fuente: ${organizer}.`,
      cta: 'Ver la general',
      href: generalUrl,
      external: true,
      event: 'race_results_click',
      contentId: 'clasificacion-general',
    });
  }
  if (chronicleId) {
    cards.push({
      key: 'cronica',
      icon: 'ph:newspaper-bold',
      title: 'La crónica de la jornada',
      description: 'Publicada por el club.',
      cta: 'Leer la crónica',
      href: `/noticias/${chronicleId}`,
      external: false,
    });
  }
  if (album) {
    cards.push({
      key: 'album',
      icon: 'ph:images-bold',
      title: 'El álbum del club',
      description:
        album.imageCount > 0
          ? `${photoCount(album.imageCount)} en la galería del club.`
          : 'En la galería del club.',
      cta: 'Ver el álbum',
      href: `/galeria/${album.id}`,
      external: false,
    });
  }
  return cards;
}

/** Cómo se nombra cada tarjeta en la bajada de «Revive la jornada». */
const RECAP_PHRASE: Record<RecapKey, string> = {
  resultados: 'los resultados oficiales',
  general: 'la clasificación general',
  cronica: 'la crónica del club',
  album: 'el álbum de la jornada',
};

/**
 * Bajada de «Revive la jornada», que solo se pinta con dos o tres tarjetas:
 * «Aquí están los resultados oficiales y la crónica del club». Con una sola, la
 * página no pinta sección sino una banda de una fila que se explica sola (su
 * título y su descripción salen de la propia tarjeta), y sin tarjetas no hay
 * nada que decir: en esos dos casos devuelve una cadena vacía.
 */
export function recapLead(cards: RecapCard[]): string {
  if (cards.length < 2) return '';
  return `Aquí están ${listInProse(cards.map((card) => RECAP_PHRASE[card.key]))}.`;
}

// ─── Índice flotante ───────────────────────────────────────────────────────────

/**
 * Igual al `DockItem` que exporta `SectionDock.astro` (`id`, `label`,
 * `shortLabel?`, `icon`, `count?`). Este módulo no puede importar el componente;
 * el tipado estructural de TypeScript los hace compatibles, y `astro check` lo
 * comprueba donde la página pasa los ítems al componente.
 */
export interface ValidaDockItem {
  id: string;
  label: string;
  /** Versión corta para la píldora móvil, donde cada mitad mide 152 px a 360 de ancho. */
  shortLabel?: string;
  icon: string;
  count?: number | null;
}

export interface DockInput {
  totalPhotos: number;
  allyCount: number;
  /** Tarjetas de «Revive la jornada»: sin ninguna no hay `#resultados`. */
  recapCount: number;
  data: ValidaData;
  /** Hitos de la pista que se pintan: sin ninguno no hay `#la-pista`. */
  trackCount: number;
  /** Hay una próxima parada que anunciar en `#siguiente`. */
  hasNextStop: boolean;
}

/**
 * Los ítems del índice flotante: una entrada por sección que de verdad se
 * pinta, en el orden de la página y con las mismas condiciones de la plantilla.
 * Los `id` son los de las secciones (`#cifras`, `#fotos`, `#aliados`, `#resultados`,
 * `#la-pista`, `#siguiente`). «Cifras» abre el índice (sigue a `numbersAvailable`); «Fotos» va siempre, con su cifra solo
 * si hay fotos: sin ellas la galería pinta su estado vacío. El cierre es el único con etiqueta larga («Próxima
 * válida», «Clase de prueba»): lleva `shortLabel` («Próxima», «Clase gratis»)
 * para la píldora móvil, donde a 360 px la etiqueta completa se cortaba.
 */
export function dockItems(input: DockInput): ValidaDockItem[] {
  const { totalPhotos, allyCount, recapCount, data, trackCount, hasNextStop } = input;
  const items: (ValidaDockItem | null)[] = [
    {
      id: 'fotos',
      label: 'Fotos',
      icon: 'ph:camera-bold',
      count: totalPhotos > 0 ? totalPhotos : null,
    },
    allyCount > 0
      ? { id: 'aliados', label: 'Aliados', icon: 'ph:handshake-bold', count: allyCount }
      : null,
    numbersAvailable(data) ? { id: 'cifras', label: 'Cifras', icon: 'ph:chart-bar-bold' } : null,
    recapCount > 0 ? { id: 'resultados', label: 'Resultados', icon: 'ph:trophy-bold' } : null,
    trackCount > 0 ? { id: 'la-pista', label: 'La pista', icon: 'ph:map-pin-bold' } : null,
    {
      id: 'siguiente',
      label: hasNextStop ? 'Próxima válida' : 'Clase de prueba',
      shortLabel: hasNextStop ? 'Próxima' : 'Clase gratis',
      icon: hasNextStop ? 'ph:flag-checkered-bold' : 'ph:bicycle-bold',
    },
  ];
  return items.filter((item): item is ValidaDockItem => item !== null);
}
