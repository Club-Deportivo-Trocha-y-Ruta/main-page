/**
 * Lógica compartida de la galería del club.
 *
 * Siete álbumes, todos de competencia, muy desiguales en tamaño (de 3 a 45
 * fotos): aquí se deriva lo que hace falta para darles jerarquía en vez de
 * tratarlos como tarjetas idénticas — el resumen de la colección, cuál álbum
 * manda en la portada y el hilo que conecta cada álbum con su fecha del
 * calendario y su crónica. Ese hilo (`relatedEvent` en el álbum,
 * `relatedNews` en el evento) ya existe en el contenido y no se usaba en
 * ninguna página; el patrón de cruzar las dos direcciones de la relación
 * evento↔noticia es el mismo que ya resuelve `chroniclesOf()` en
 * `/calendario`.
 *
 * Las fechas del frontmatter se parsean como medianoche UTC. Colombia está en
 * UTC-5, así que el cálculo del periodo cubierto usa los getters UTC — mismo
 * cuidado que documentan `news.ts` y `calendar.ts`.
 */
import { monthKey, monthLabel } from './news';

// ─── Categorías ────────────────────────────────────────────────────────────────

export type GalleryCategory = 'competencia' | 'entrenamiento' | 'social' | 'institucional';

export interface CategoryStyle {
  /** Etiqueta legible. El valor del enum va en minúscula. */
  label: string;
  icon: string;
  /** Texto que cumple contraste AA sobre `soft`. */
  text: string;
  soft: string;
}

/**
 * Hoy los siete álbumes reales son `competencia`: un filtro o una agrupación
 * por categoría sería una fila de un solo elemento. Las cuatro se definen
 * igual —como `EVENT_CATEGORIES` o `NEWS_CATEGORIES`— para que la insignia de
 * cada tarjeta esté lista en cuanto el club publique la primera jornada
 * social o de entrenamiento.
 */
export const GALLERY_CATEGORIES: Record<GalleryCategory, CategoryStyle> = {
  competencia: {
    label: 'Competencia',
    icon: 'ph:flag-checkered-bold',
    text: 'text-primary-deep',
    soft: 'bg-primary/12',
  },
  entrenamiento: {
    label: 'Entrenamiento',
    icon: 'ph:barbell-bold',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
  },
  social: {
    label: 'Social',
    icon: 'ph:hand-heart-bold',
    text: 'text-accent-deep',
    soft: 'bg-accent/15',
  },
  institucional: {
    label: 'Institucional',
    icon: 'ph:buildings-bold',
    text: 'text-primary-deep',
    soft: 'bg-primary/12',
  },
};

export function getGalleryCategory(category: string): CategoryStyle {
  return GALLERY_CATEGORIES[category as GalleryCategory] ?? GALLERY_CATEGORIES.competencia;
}

// ─── Fotos ─────────────────────────────────────────────────────────────────────

/** "1 foto" / "45 fotos" — evita repetir el ternario en cada tarjeta. */
export function photoCountLabel(count: number): string {
  return count === 1 ? '1 foto' : `${count} fotos`;
}

// ─── Resumen de la colección ─────────────────────────────────────────────────

export interface GallerySummary {
  totalAlbums: number;
  totalPhotos: number;
  /** Periodo cubierto: "marzo – agosto 2026". `null` si no hay álbumes. */
  span: string | null;
}

const MONTH_NAME = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' });

/** Cifras de cabecera de la portada: cuántos álbumes, cuántas fotos en total
 *  y qué periodo cubren. Mismo criterio de `span` que `summarizeNews()`. */
export function summarizeGallery<T extends { data: { date: Date; images: unknown[] } }>(
  albums: T[]
): GallerySummary {
  if (albums.length === 0) return { totalAlbums: 0, totalPhotos: 0, span: null };

  const totalPhotos = albums.reduce((sum, album) => sum + album.data.images.length, 0);

  const times = albums.map((album) => album.data.date.getTime());
  const from = new Date(Math.min(...times));
  const to = new Date(Math.max(...times));

  const sameMonth = monthKey(from) === monthKey(to);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const span = sameMonth
    ? monthLabel(to)
    : sameYear
      ? `${MONTH_NAME.format(from)} – ${MONTH_NAME.format(to)} ${to.getUTCFullYear()}`
      : `${monthLabel(from)} – ${monthLabel(to)}`;

  return { totalAlbums: albums.length, totalPhotos, span };
}

// ─── Orden y selección ─────────────────────────────────────────────────────────

/** Álbumes del más reciente al más antiguo — la portada se lee como un
 *  archivo de temporada, la última carrera primero. */
export function sortAlbumsByDate<T extends { data: { date: Date } }>(albums: T[]): T[] {
  return [...albums].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * El álbum que manda en la portada: el elemento dominante de la rejilla,
 * frente al resto en tarjetas secundarias — mismo contraste que `/noticias`
 * hace entre su noticia principal y el archivo.
 *
 * `featured` es la curación manual del club (hoy, un solo álbum la trae). Si
 * ninguno la trae, o si más de uno la trae a la vez, el criterio cae en el
 * álbum con más fotos: un dato real y verificable, no una preferencia
 * inventada en la plantilla.
 */
export function selectFeaturedAlbum<T extends { data: { featured: boolean; images: unknown[] } }>(
  albums: T[]
): T | null {
  if (albums.length === 0) return null;

  const flagged = albums.filter((album) => album.data.featured);
  if (flagged.length === 1) return flagged[0];

  return [...albums].sort((a, b) => b.data.images.length - a.data.images.length)[0];
}

// ─── Relación álbum → evento → noticia ────────────────────────────────────────

interface AlbumRelation {
  data: { relatedEvent?: string };
}

interface EventRelation {
  id: string;
  data: { title: string; date: Date; relatedNews: string[] };
}

interface NewsRelation {
  id: string;
  data: { title: string; relatedEvent?: string };
}

export interface EventLink {
  id: string;
  title: string;
  date: Date;
  /** Ancla a la fecha en `/calendario` — mismo id (`evento-{id}`) que usa esa
   *  página para sus anclas de sección. */
  href: string;
}

export interface NewsLink {
  id: string;
  title: string;
  href: string;
}

export interface AlbumContext {
  event: EventLink | null;
  chronicles: NewsLink[];
}

/**
 * Evento del calendario al que pertenece el álbum, o `null` si el álbum no
 * trae `relatedEvent` o si el valor no coincide con ningún id de `events`.
 *
 * Pasa lo segundo hoy con uno de los siete álbumes reales: su `relatedEvent`
 * no coincide con ningún id de la colección de eventos. No es un caso de
 * prueba hipotético — por eso esta función no asume que el campo siempre
 * resuelve.
 */
export function findEventForAlbum<T extends EventRelation>(album: AlbumRelation, events: T[]): T | null {
  if (!album.data.relatedEvent) return null;
  return events.find((event) => event.id === album.data.relatedEvent) ?? null;
}

function toNewsLink(article: NewsRelation): NewsLink {
  return { id: article.id, title: article.data.title, href: `/noticias/${article.id}` };
}

/**
 * Crónicas publicadas de un evento, cruzando las dos direcciones de la
 * relación — igual que `chroniclesOf()` en `/calendario`: la noticia que
 * apunta al evento (`relatedEvent`, el campo que llenan los editores) y el
 * evento que lista sus noticias (`relatedNews`). Un evento puede tener
 * crónicas en una sola dirección: la V válida de Palmira solo declara una en
 * su `relatedNews`, pero una segunda crónica la referencia con
 * `relatedEvent` sin aparecer en esa lista. Deduplicadas por id.
 */
export function chroniclesForEvent<E extends EventRelation, N extends NewsRelation>(
  event: E,
  news: N[]
): NewsLink[] {
  const newsById = new Map(news.map((article) => [article.id, article]));
  const found = new Map<string, NewsLink>();

  for (const article of news) {
    if (article.data.relatedEvent === event.id) {
      found.set(article.id, toNewsLink(article));
    }
  }
  for (const id of event.data.relatedNews) {
    const article = newsById.get(id);
    if (article) found.set(id, toNewsLink(article));
  }

  return [...found.values()];
}

/**
 * Resuelve la cadena completa álbum → evento → noticia en una sola llamada:
 * lo que necesita tanto la portada (para el álbum destacado) como el detalle
 * de cada álbum. Sin evento no hay crónicas que buscar, así que se devuelven
 * ambos vacíos en vez de intentarlo.
 */
export function resolveAlbumContext<A extends AlbumRelation, E extends EventRelation, N extends NewsRelation>(
  album: A,
  events: E[],
  news: N[]
): AlbumContext {
  const event = findEventForAlbum(album, events);
  if (!event) return { event: null, chronicles: [] };

  return {
    event: {
      id: event.id,
      title: event.data.title,
      date: event.data.date,
      href: `/calendario#evento-${event.id}`,
    },
    chronicles: chroniclesForEvent(event, news),
  };
}
