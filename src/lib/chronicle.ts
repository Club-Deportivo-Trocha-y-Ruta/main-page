/**
 * Lógica compartida del detalle de una noticia.
 *
 * Una crónica del club no es una entrada de blog suelta: es **un capítulo de la
 * temporada**. Cubre una fecha concreta del calendario, casi siempre tiene un
 * álbum de fotos, a veces comparte carrera con otra crónica, y siempre va
 * detrás de una y delante de otra.
 *
 * Todo eso ya estaba en el frontmatter y no se mostraba: de las diez crónicas,
 * nueve declaran `relatedEvent` y nueve `relatedGallery`, y la página de
 * detalle no usaba ninguno de los dos.
 *
 * Regla que aprendimos por las malas —los enlaces rotos de Trocha Verde y el
 * `relatedEvent` del álbum de Ginebra—: **nunca se arma una URL a partir de un
 * campo sin comprobar que resuelve**. Hoy mismo hay una referencia rota
 * (`2026-09-copa-valle-roldanillo-xco` apunta a un álbum que no existe), así
 * que aquí se resuelve contra la colección real y, si no está, no hay enlace.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`. Recibe los datos por
 * parámetro, igual que `gallery.ts` o `contact.ts`.
 */
import { getEventCategory, getEventLevel, dayLabel, monthShort } from './calendar';
import { chroniclesForEvent, photoCountLabel, type NewsLink } from './gallery';

// ─── Entradas ───────────────────────────────────────────────────────────────

export interface ChronicleInput {
  id: string;
  data: {
    title: string;
    date: Date;
    category: string;
    relatedEvent?: string;
    relatedGallery?: string;
    draft?: boolean;
  };
}

export interface EventInput {
  id: string;
  data: {
    title: string;
    date: Date;
    endDate?: Date;
    location: string;
    city?: string;
    category: string;
    level?: string;
    relatedNews: string[];
  };
}

export interface AlbumInput {
  id: string;
  data: { title: string; images: unknown[]; draft?: boolean };
}

// ─── La carrera que cubre la crónica ────────────────────────────────────────

export interface RaceLink {
  id: string;
  title: string;
  /** "28 de feb". */
  when: string;
  /** La ciudad, que es como se nombra la válida. Cae al lugar si no hay. */
  where: string;
  /** "Cross Country olímpico". */
  discipline: string;
  disciplineIcon: string;
  /** "Departamental". `null` si el evento no declara nivel. */
  level: string | null;
  /** Ancla a la fecha en `/calendario`, el mismo id que usa esa página. */
  href: string;
}

export interface AlbumLink {
  id: string;
  title: string;
  /** "44 fotos". */
  photos: string;
  href: string;
}

export interface ChronicleContext {
  race: RaceLink | null;
  album: AlbumLink | null;
  /** Otras crónicas de la misma carrera. La V válida de Palmira tiene dos. */
  siblings: NewsLink[];
}

/**
 * Resuelve la cadena crónica → carrera → álbum → crónicas hermanas.
 *
 * Cada eslabón se comprueba contra su colección: un `relatedEvent` o un
 * `relatedGallery` que no corresponda a nada publicado devuelve `null` y la
 * plantilla no pinta ese bloque, en vez de enlazar a una página que no existe.
 */
export function resolveChronicleContext(
  article: ChronicleInput,
  events: EventInput[],
  albums: AlbumInput[],
  news: ChronicleInput[]
): ChronicleContext {
  const event = article.data.relatedEvent
    ? (events.find((candidate) => candidate.id === article.data.relatedEvent) ?? null)
    : null;

  const albumEntry = article.data.relatedGallery
    ? (albums.find((candidate) => candidate.id === article.data.relatedGallery) ?? null)
    : null;

  const discipline = event ? getEventCategory(event.data.category) : null;

  return {
    race:
      event && discipline
        ? {
            id: event.id,
            title: event.data.title,
            when: `${dayLabel(event.data.date, event.data.endDate)} de ${monthShort(event.data.date)}`,
            where: event.data.city ?? event.data.location,
            discipline: discipline.label,
            disciplineIcon: discipline.icon,
            level: getEventLevel(event.data.level),
            href: `/calendario#evento-${event.id}`,
          }
        : null,

    album: albumEntry
      ? {
          id: albumEntry.id,
          title: albumEntry.data.title,
          photos: photoCountLabel(albumEntry.data.images.length),
          href: `/galeria/${albumEntry.id}`,
        }
      : null,

    // Las hermanas salen de cruzar las dos direcciones de la relación, igual
    // que en la galería y en el calendario; se descarta la crónica actual.
    siblings: event
      ? chroniclesForEvent(event, news).filter((link) => link.id !== article.id)
      : [],
  };
}

// ─── Dónde va esta crónica dentro de la temporada ───────────────────────────

export interface ChronicleNeighbour {
  id: string;
  title: string;
  /** "28 de feb". */
  when: string;
  href: string;
}

export interface ChroniclePlacement {
  /** La publicada justo antes (más antigua). */
  previous: ChronicleNeighbour | null;
  /** La publicada justo después (más reciente). */
  next: ChronicleNeighbour | null;
  /** Posición en el archivo, 1 = la más antigua. */
  position: number;
  total: number;
}

function toNeighbour(article: ChronicleInput): ChronicleNeighbour {
  return {
    id: article.id,
    title: article.data.title,
    when: `${dayLabel(article.data.date)} de ${monthShort(article.data.date)}`,
    href: `/noticias/${article.id}`,
  };
}

/**
 * Sitúa la crónica en el archivo: la anterior, la siguiente y en qué número va.
 *
 * El orden es cronológico —de la más antigua a la más reciente—, que es como se
 * lee una temporada: "anterior" es la crónica de la fecha pasada, no la que
 * está más arriba en el índice.
 *
 * Si `currentId` no aparece en la lista, devuelve ambos vecinos en `null` y
 * `position` en 0: la plantilla omite el bloque en vez de inventarse un sitio.
 */
export function placeChronicle(
  news: ChronicleInput[],
  currentId: string
): ChroniclePlacement {
  const sorted = [...news].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  const index = sorted.findIndex((article) => article.id === currentId);

  if (index === -1) {
    return { previous: null, next: null, position: 0, total: sorted.length };
  }

  return {
    previous: index > 0 ? toNeighbour(sorted[index - 1]) : null,
    next: index < sorted.length - 1 ? toNeighbour(sorted[index + 1]) : null,
    position: index + 1,
    total: sorted.length,
  };
}
