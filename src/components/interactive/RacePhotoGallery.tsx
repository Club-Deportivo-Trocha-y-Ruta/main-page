/**
 * Galería oficial de una válida corrida en casa (`/copa-valle-yumbo-2026`):
 * entre 500 y 2.000 fotos, casi todas de niños de otros clubes, que cada
 * familia tiene que encontrar en segundos desde el celular y descargar gratis
 * en calidad original.
 *
 * Decisiones que no se leen en el código:
 *
 * - **Filas justificadas sin JS.** Las fotos mezclan horizontales y verticales:
 *   en una rejilla de columnas iguales hay que recortar las verticales (se
 *   pierde la cabeza o la rueda) o dejar huecos. Cada `<li>` lleva su
 *   proporción real (`aspect-ratio` + `flex-basis` + `flex-grow` proporcionales
 *   a ella), así que todas las fotos de una fila comparten altura, se ven
 *   enteras y el espacio queda reservado antes de que cargue la imagen (CLS 0).
 *   Un `::after` con `flex-grow` enorme evita que la última fila se estire. Es la
 *   rejilla de la vista de una categoría.
 * - **Muestra en rejilla en «Todas».** La vista general no usa filas: cada
 *   manga es una rejilla de miniaturas iguales (4:3, recortadas) de dos filas,
 *   sin desplazamiento horizontal. Las filas justificadas dejaban una foto sola
 *   en la última fila de casi cada manga y alargaban la galería; la tira
 *   horizontal que las reemplazó (hasta el 16-oct-2026) solo se recorría
 *   arrastrando la barra en escritorio y escondía las fotos. Aquí el recorte de
 *   las verticales vale: es una muestra, y el visor las muestra enteras.
 * - **Revelado progresivo.** Con 2.000 fotos la página sería interminable, además
 *   de un DOM de 2.000 nodos. En «Todas» cada manga muestra solo 12 fotos y, si
 *   tiene más, un botón «Ver las N fotos» (la categoría la dice el titular de
 *   arriba; el lector de pantalla oye «… de X») que aplica el filtro de su
 *   categoría (lo mismo que tocar su chip). Con una categoría elegida se pintan
 *   48 por manga y «Mostrar las N restantes» despliega el resto en el sitio. Lo desplegado vale solo para la vista en
 *   que se hizo: al cambiar de categoría cada una arranca en su tope, y «Todas»
 *   no se vuelve a alargar por lo que se abrió en otra. El visor, en cambio,
 *   recorre todas las fotos del filtro activo: no se detiene en el tope, y al
 *   pasarlo despliega la manga (que pasa de rejilla a filas) para que, al cerrar,
 *   exista la miniatura a la que vuelve el foco.
 * - **Encabezados por categoría.** La familia busca por categoría, que es lo que
 *   dice el chip: el `h3` de cada manga es el texto del chip y la manga y las
 *   categorías completas van debajo, en pequeño. Las mangas son `div` y no
 *   `section`: nueve regiones con nombre llenaban la lista de puntos de
 *   referencia del lector de pantalla.
 * - **Una sola fila de filtros.** Los chips ocupan la fila entera: la barra es
 *   fija y, con la cabecera y el índice de la página, no puede tapar media
 *   pantalla.
 * - **Historial.** Abrir una foto empuja `#foto-<id>` (el botón atrás de Android
 *   cierra el visor en vez de sacar de la página) y navegar entre fotos solo lo
 *   reemplaza. Bajo `ClientRouter` la entrada nueva imita el estado del router y
 *   se le avisa con un `popstate` (ver `pushPhotoHash`): sin eso, volver a la
 *   entrada de la página dispara una transición completa de la misma URL
 *   (re-fetch, swap y re-montaje de esta isla, con el filtro y el scroll
 *   perdidos). Interceptar el evento no es una salida: en el navegador los
 *   listeners de `window` corren en orden de registro y el router llega
 *   primero. Reemplazar una entrada nunca pasa `null` como estado, para no
 *   borrarle el índice al router.
 * - **Compartir.** Los enlaces llevan UTM con `shareUrl()` (docs/05): sin ellos,
 *   lo que circula por WhatsApp llega a GA4 como «Direct».
 *
 * Montaje: `sticky` no funciona dentro de un ancestro con `overflow-hidden` (el
 * valor por defecto de `SectionShell`); hay que usar `scrollDriven` (que recorta
 * con `overflow-clip`) o montar la isla fuera de ese marco.
 */
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MouseEvent, RefObject, TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { shareUrl } from '@lib/utm';
import type { GroupedPhotos, Photo, PhotoGroup, PhotoManifest } from '@lib/valida';
import {
  PHOTO_HASH_PREFIX,
  chipLabel,
  downloadFileName,
  groupPhotos,
  groupSearch,
  groupTitle,
  initialFilterFromSearch,
  joinCategories,
  photoAlt,
  photoCount,
  photoIdFromHash,
  photoShareUrl,
  photoUrls,
  takenClock,
} from '@lib/valida';

export interface RacePhotoGalleryProps {
  manifest: PhotoManifest;
  /** URL canónica absoluta de la página, para los enlaces de compartir. */
  pageUrl: string;
  /** Slug del evento: prefijo del nombre de archivo al descargar. */
  eventSlug: string;
  /** Título corto del evento, para el texto de compartir. */
  eventTitle: string;
  /** Nombre de quien tomó las fotos, para el crédito del visor. */
  photographerName?: string | null;
  /** Aliados de la válida (patrocinio y apoyo), para el crédito del visor. */
  allyCount?: number | null;
  /** Textos del estado sin fotos. */
  emptyTitle?: string;
  emptyBody?: string;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

/** Fotos que pinta cada manga en «Todas», antes de ofrecer entrar a su categoría. */
const PREVIEW_PER_GROUP = 12;
/** Fotos que pinta cada manga con una categoría elegida, antes de «Mostrar las N restantes». */
const PAGE_PER_GROUP = 48;
/** Sin despliegues: se comparte entre vistas porque nunca se muta (siempre se copia). */
const NO_EXPANSION: ReadonlySet<string> = new Set();
/** Recorrido horizontal mínimo, en px, para que un gesto cuente como swipe. */
const SWIPE_MIN_PX = 50;
/** Cuánto vive el aviso «Enlace copiado». */
const NOTICE_MS = 2500;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Paths de Phosphor (bold, viewBox 256), los mismos iconos `ph:*` del resto del sitio. */
const ICON_PATHS = {
  close:
    'M208.49 191.51a12 12 0 0 1-17 17L128 145l-63.51 63.49a12 12 0 0 1-17-17L111 128L47.51 64.49a12 12 0 0 1 17-17L128 111l63.51-63.52a12 12 0 0 1 17 17L145 128Z',
  prev: 'M168.49 199.51a12 12 0 0 1-17 17l-80-80a12 12 0 0 1 0-17l80-80a12 12 0 0 1 17 17L97 128Z',
  next: 'm184.49 136.49l-80 80a12 12 0 0 1-17-17L159 128L87.51 56.49a12 12 0 1 1 17-17l80 80a12 12 0 0 1-.02 17',
  download:
    'M228 144v64a12 12 0 0 1-12 12H40a12 12 0 0 1-12-12v-64a12 12 0 0 1 24 0v52h152v-52a12 12 0 0 1 24 0m-108.49 8.49a12 12 0 0 0 17 0l40-40a12 12 0 0 0-17-17L140 115V32a12 12 0 0 0-24 0v83L96.49 95.51a12 12 0 0 0-17 17Z',
  share:
    'M176 156a43.78 43.78 0 0 0-29.09 11l-40.81-26.2a44.07 44.07 0 0 0 0-25.6L146.91 89a43.83 43.83 0 1 0-13-20.17L93.09 95a44 44 0 1 0 0 65.94l40.81 26.26A44 44 0 1 0 176 156m0-120a20 20 0 1 1-20 20a20 20 0 0 1 20-20M64 148a20 20 0 1 1 20-20a20 20 0 0 1-20 20m112 72a20 20 0 1 1 20-20a20 20 0 0 1-20 20',
  whatsapp:
    'M187.3 159.06A36.09 36.09 0 0 1 152 188a84.09 84.09 0 0 1-84-84a36.09 36.09 0 0 1 28.94-35.3A12 12 0 0 1 110 75.1l11.48 23a12 12 0 0 1-.75 12l-8.52 12.78a44.56 44.56 0 0 0 20.91 20.91l12.78-8.52a12 12 0 0 1 12-.75l23 11.48a12 12 0 0 1 6.4 13.06M236 128a108 108 0 0 1-157.23 96.15L46.34 235A20 20 0 0 1 21 209.66l10.81-32.43A108 108 0 1 1 236 128m-24 0a84 84 0 1 0-156.73 42.06a12 12 0 0 1 1 9.81l-9.93 29.79l29.79-9.93a12.1 12.1 0 0 1 3.8-.62a12 12 0 0 1 6 1.62A84 84 0 0 0 212 128',
} as const;

// ─── Utilidades ────────────────────────────────────────────────────────────────

type IconName = keyof typeof ICON_PATHS;

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={`${className} shrink-0`}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

type TrochaEmit = (name: string, params?: Record<string, string>) => void;

/**
 * Emite un evento del catálogo desde código. Los clics no pasan por aquí: los
 * cubre la delegación de `Analytics.astro` con los `data-analytics-*`. Se castea
 * `window` en vez de declarar el global para no chocar con otra declaración.
 */
function emitAnalytics(name: string, params: Record<string, string>): void {
  (window as unknown as { __trochaEmit?: TrochaEmit }).__trochaEmit?.(name, params);
}

/** iPhone, iPad y iPod; el iPad moderno se presenta como Mac y se delata por la pantalla táctil. */
function isIosDevice(): boolean {
  const { userAgent, maxTouchPoints } = window.navigator;
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && (maxTouchPoints ?? 0) > 1;
}

/** Proporción de una foto; una medida inválida cae a 3:2 en vez de romper la fila. */
function ratioOf(photo: Photo): number {
  return photo.w > 0 && photo.h > 0 ? photo.w / photo.h : 1.5;
}

function resultMessage(total: number, group: PhotoGroup | null): string {
  return group === null
    ? `${photoCount(total)} en toda la jornada`
    : `${photoCount(total)} en ${group.label}`;
}

/** Lo que el router de Astro (`ClientRouter`) guarda en cada entrada del historial. */
interface RouterState {
  index: number;
  scrollX: number;
  scrollY: number;
}

function isRouterState(value: unknown): value is RouterState {
  return (
    typeof value === 'object' && value !== null && typeof (value as RouterState).index === 'number'
  );
}

/**
 * Empuja `#foto-<id>`; `false` si el navegador lo rechaza (iframe, límite de Safari).
 *
 * Bajo `ClientRouter` la entrada nueva no puede ir sin estado. El router, al
 * volver a la entrada de la página, compara con la última URL que él mismo
 * conoce; si esa URL no tenía hash hace una transición completa de la misma
 * página (re-fetch, swap y re-montaje de esta isla). Solo toma el camino corto
 * (mover el scroll y nada más) cuando la URL de la que sale tiene hash. Por eso
 * la entrada lleva el estado que el router espera (índice + 1 y la posición
 * del scroll) y se le avisa con un `popstate` de verdad, igual al que recibe al
 * navegar: así actualiza su índice y su última URL, y desde ahí tanto «atrás»
 * como «adelante» le resultan hash-only. En el navegador no se puede adelantar
 * al router (sus listeners de `window` corren en orden de registro, sin
 * importar la fase de captura), por eso se le informa en vez de interceptarlo.
 */
function pushPhotoHash(id: string): boolean {
  try {
    const hash = `#${PHOTO_HASH_PREFIX}${id}`;
    const current: unknown = window.history.state;
    if (!isRouterState(current)) {
      // Sin router (o sin su estado) no hay a quién avisar.
      window.history.pushState(null, '', hash);
      return true;
    }
    const next: RouterState = {
      index: current.index + 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
    window.history.pushState(next, '', hash);
    window.dispatchEvent(new PopStateEvent('popstate', { state: next }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Cambia el hash de la entrada actual sin tocar su estado: la entrada de la
 * carga trae el índice del router de Astro y reemplazarla con `null` se lo borra.
 */
function replacePhotoHash(id: string | null): void {
  try {
    const { pathname, search } = window.location;
    window.history.replaceState(
      window.history.state,
      '',
      id === null ? `${pathname}${search}` : `#${PHOTO_HASH_PREFIX}${id}`,
    );
  } catch {
    // El visor funciona igual sin reflejar la foto en la URL.
  }
}

/**
 * Refleja el filtro de grupo en la URL (`?manga=<id>`) para poder compartirlo,
 * conservando `history.state` (ver `replacePhotoHash`) y el hash.
 */
function replaceGroupSearch(groupId: string | null): void {
  try {
    const { pathname, hash } = window.location;
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${groupSearch(groupId)}${hash}`,
    );
  } catch {
    // El filtro funciona igual sin reflejarse en la URL.
  }
}

/** ¿El punto cae dentro de la foto dibujada con `object-contain` en `rect`? */
function insidePicture(rect: DOMRect, ratio: number, x: number, y: number): boolean {
  if (rect.width <= 0 || rect.height <= 0 || !(ratio > 0)) return true;
  let width = rect.width;
  let height = rect.height;
  if (width / height > ratio) width = height * ratio;
  else height = width / ratio;
  const left = rect.left + (rect.width - width) / 2;
  const top = rect.top + (rect.height - height) / 2;
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

// ─── Miniatura y bloque por manga ──────────────────────────────────────────────

/** `row` es una fila justificada (la vista de una categoría); `grid`, la rejilla de muestra de «Todas». */
type TileLayout = 'row' | 'grid';

interface PhotoTileProps {
  photo: Photo;
  src: string;
  label: string;
  layout: TileLayout;
  onOpen: (id: string, trigger: HTMLButtonElement) => void;
  register: (id: string, node: HTMLButtonElement | null) => void;
}

/**
 * Memoizada: con 400 miniaturas montadas, cada flecha del visor cambia el
 * estado del padre y sin esto se re-renderizarían todas.
 */
const PhotoTile = memo(function PhotoTile({
  photo,
  src,
  label,
  layout,
  onOpen,
  register,
}: PhotoTileProps) {
  const ratio = ratioOf(photo);
  // Una medida inválida cae a 3:2: un `0 / 0` dejaría la miniatura sin ancho.
  const aspectRatio = photo.w > 0 && photo.h > 0 ? `${photo.w} / ${photo.h}` : '3 / 2';
  return (
    <li
      className={layout === 'grid' ? `relative aspect-[4/3] ${GRID_TILE}` : 'relative'}
      style={
        layout === 'grid'
          ? undefined
          : { aspectRatio, flexBasis: `calc(var(--row-h) * ${ratio})`, flexGrow: ratio * 100 }
      }
    >
      {/* El `overflow-hidden` va en el span interior: en el botón recortaría el
          contorno de foco, que se dibuja fuera de la foto. */}
      <button
        ref={(node) => register(photo.id, node)}
        type="button"
        aria-label={label}
        onClick={(event) => onOpen(photo.id, event.currentTarget)}
        className="group focus-visible:outline-primary-deep absolute inset-0 block cursor-pointer scroll-mt-[calc(var(--header-h,4rem)+8rem)] rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="bg-surface-muted block h-full w-full overflow-hidden rounded-lg">
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            width={photo.w}
            height={photo.h}
            className="ease-spring h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-[var(--duration-micro)] motion-safe:group-hover:scale-[1.02]"
          />
        </span>
      </button>
    </li>
  );
});

/**
 * Cuánto se pinta de una manga: `preview` es la vista «Todas» ({@link PREVIEW_PER_GROUP}
 * fotos y la entrada a su categoría), `page` es la de una categoría elegida
 * ({@link PAGE_PER_GROUP} fotos y «Mostrar las N restantes») y `all` es todo el grupo
 * (manga ya desplegada).
 */
type GroupDepth = 'preview' | 'page' | 'all';

/** Fotos que pinta cada manga a esa profundidad; `Infinity` si no hay tope. */
function depthLimit(depth: GroupDepth): number {
  if (depth === 'preview') return PREVIEW_PER_GROUP;
  return depth === 'page' ? PAGE_PER_GROUP : Infinity;
}

/**
 * Alto de las filas justificadas. A 360 px de ancho, 7rem pide 168 + 168 + 8 px para
 * dos horizontales y la fila solo tiene 328: cada horizontal ocupaba una fila entera.
 */
const ROW_HEIGHT = '[--row-h:6rem] min-[400px]:[--row-h:7rem] sm:[--row-h:9rem] lg:[--row-h:10rem]';

/** Filas justificadas: la vista de una categoría. */
const ROWS = `flex flex-wrap items-start gap-2 after:flex-[1000000_1_0] after:content-[''] sm:gap-3 ${ROW_HEIGHT}`;

/**
 * Muestra de cada manga en «Todas»: una rejilla de miniaturas iguales (4:3, `object-cover`) de dos
 * filas, sin desplazamiento horizontal. Antes era una tira con `scroll-snap`: en escritorio solo
 * se recorría arrastrando la barra y escondía las fotos (16-oct-2026). Dos filas de 3 columnas en
 * el celular, de 4 desde `sm` y de 6 desde `lg`: se pintan las {@link PREVIEW_PER_GROUP} y
 * `GRID_TILE` oculta las que no caben en dos filas a ese ancho. Las verticales se recortan solo
 * en la miniatura; el visor las muestra enteras.
 */
const GRID = 'grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6';
const GRID_TILE = 'max-sm:[&:nth-child(n+7)]:hidden sm:max-lg:[&:nth-child(n+9)]:hidden';

/**
 * Botón bajo la rejilla de una manga («Ver las N fotos» y «Mostrar las N restantes»).
 * `text-balance text-center`: con el nombre largo de una categoría en el teléfono el texto
 * cae en dos líneas y sin esto dejaba una «B» sola en la segunda.
 */
const MORE_BUTTON =
  'bg-surface-raised text-text-primary ring-hairline focus-visible:outline-primary-deep ease-spring inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 text-center font-semibold text-balance shadow-[0_2px_0_0_rgb(0_0_0/0.1)] ring-1 transition-[transform,background-color] duration-[var(--duration-micro)] hover:-translate-y-px hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px active:shadow-none motion-reduce:transition-none sm:w-auto';

interface GroupSectionProps {
  group: PhotoGroup;
  photos: Photo[];
  base: string;
  depth: GroupDepth;
  onOpen: PhotoTileProps['onOpen'];
  register: PhotoTileProps['register'];
  /** «Mostrar las N restantes»: despliega la manga en el sitio. */
  onReveal: (groupId: string, firstHiddenId: string) => void;
  /** «Ver las N fotos»: aplica el filtro de la categoría de la manga. */
  onEnter: (groupId: string, firstPhotoId: string) => void;
}

const GroupSection = memo(function GroupSection({
  group,
  photos,
  base,
  depth,
  onOpen,
  register,
  onReveal,
  onEnter,
}: GroupSectionProps) {
  const headingId = useId();
  const visible = photos.slice(0, depthLimit(depth));
  const hidden = photos.length - visible.length;
  const preview = depth === 'preview';

  // La familia busca por categoría, que es lo que dice el chip: el titular es el chip y debajo,
  // en pequeño, la manga y las categorías completas (sin repetir lo que ya dice el titular).
  const chip = chipLabel(group);
  const categories = joinCategories(group.categories);
  const detail = [
    group.label === chip ? null : group.label,
    categories === '' || categories === chip ? null : categories,
    photoCount(photos.length),
  ]
    .filter(Boolean)
    .join(' · ');

  // `div` y no `section`: nueve regiones con nombre en la galería llenaban la lista de puntos
  // de referencia del lector de pantalla. El `h3` sigue siendo navegable y nombra la lista.
  return (
    <div>
      <div className="mb-3">
        <h3 id={headingId} className="font-display text-text-primary text-xl font-bold sm:text-2xl">
          {chip}
        </h3>
        <p className="text-text-secondary mt-0.5 text-sm text-pretty">{detail}</p>
      </div>
      {group.description && <p className="text-text-secondary mb-4">{group.description}</p>}
      <ul role="list" aria-labelledby={headingId} className={preview ? GRID : ROWS}>
        {visible.map((photo, position) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            src={photoUrls(base, photo.id).thumb}
            label={photoAlt(group, position, photos.length)}
            layout={preview ? 'grid' : 'row'}
            onOpen={onOpen}
            register={register}
          />
        ))}
      </ul>
      {hidden > 0 && (
        <div className="mt-5 flex justify-center">
          {depth === 'preview' ? (
            // Mismos atributos de analítica que el chip de la categoría: es el mismo filtro.
            <button
              type="button"
              onClick={() => onEnter(group.id, photos[0].id)}
              data-analytics-event="gallery_filter"
              data-analytics-content-id={group.id}
              className={MORE_BUTTON}
            >
              {`Ver las ${photos.length} fotos`} <span className="sr-only">de {chip}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReveal(group.id, photos[visible.length].id)}
              className={MORE_BUTTON}
            >
              {hidden === 1 ? 'Mostrar la foto restante' : `Mostrar las ${hidden} restantes`}{' '}
              <span className="sr-only">de {group.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Barra de filtros ──────────────────────────────────────────────────────────

interface Chip {
  /** `null` es «Todas». */
  id: string | null;
  /** Texto visible: la categoría que busca la familia, no el número de manga. */
  label: string;
  /** Lo que oye el lector de pantalla: manga, categorías y conteo completos. */
  ariaLabel: string;
  title?: string;
  count: number;
}

interface FilterBarProps {
  barRef: RefObject<HTMLDivElement | null>;
  chips: Chip[];
  selected: string | null;
  message: string;
  onSelect: (id: string | null) => void;
}

function FilterBar({ barRef, chips, selected, message, onSelect }: FilterBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  // Si el filtro viene de la URL (`?manga=manga-6`), el chip puede estar fuera
  // de la pantalla en el carrusel del celular: se centra.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const chip = chipRefs.current.get(selected ?? 'todas');
    if (!scroller || !chip || typeof scroller.scrollTo !== 'function') return;
    scroller.scrollTo({
      left: chip.offsetLeft - (scroller.clientWidth - chip.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [selected]);

  // Una sola fila de chips. Una segunda fila repetía el conteo del chip activo («Todas 420») y
  // sumaba 44 px a una barra fija que, con la cabecera y el índice, ya tapaba casi la tercera
  // parte de la pantalla. El `role="status"` es solo para el lector de pantalla y siempre existe
  // (una región viva que aparece con el texto ya puesto no se anuncia). La barra sangra hasta el
  // borde (`-mx` y `px` iguales): si solo cubriera la columna, las fotos que pasan por debajo
  // asomarían a los lados. Fondo opaco, sin `backdrop-blur`: al 95 % las miniaturas se
  // transparentaban detrás de los chips como fantasmas (vidrio, que la página no usa en ninguna
  // otra parte).
  return (
    <div
      ref={barRef}
      id="filtros"
      className="border-hairline sticky top-[var(--header-h,4rem)] z-30 -mx-4 scroll-mt-[var(--header-h,4rem)] border-b bg-[var(--valida-papel,var(--color-surface-raised))] px-4 py-2 sm:-mx-1.5 sm:px-1.5"
    >
      <div className="flex items-center gap-2 md:items-start md:gap-3">
        <div
          ref={scrollerRef}
          role="group"
          aria-label="Filtrar por categoría"
          className="relative -mx-1 flex min-w-0 flex-1 snap-x snap-proximity scroll-px-1 [scrollbar-width:none] gap-2 overflow-x-auto px-1 py-1 md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((chip) => {
            const key = chip.id ?? 'todas';
            const active = selected === chip.id;
            return (
              <button
                key={key}
                ref={(node) => {
                  if (node) chipRefs.current.set(key, node);
                  else chipRefs.current.delete(key);
                }}
                type="button"
                aria-pressed={active}
                aria-label={chip.ariaLabel}
                title={chip.title}
                data-analytics-event="gallery_filter"
                data-analytics-content-id={key}
                onClick={() => onSelect(chip.id)}
                className={`focus-visible:outline-primary-deep ease-spring inline-flex min-h-11 shrink-0 snap-start items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-transform duration-[var(--duration-micro)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 motion-reduce:transition-none ${
                  active
                    ? 'bg-primary-deep text-on-deep'
                    : 'bg-surface-muted text-text-primary ring-hairline ring-1 [@media(hover:hover)]:hover:bg-[color-mix(in_srgb,var(--color-surface-muted)_85%,var(--color-surface-dark))]'
                }`}
              >
                {chip.label}
                <span className="ml-1.5 text-xs font-medium tabular-nums opacity-75">
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}

// ─── Visor ─────────────────────────────────────────────────────────────────────

interface ViewEntry {
  photo: Photo;
  group: PhotoGroup;
  /** Posición dentro del grupo ya filtrado, para el texto alternativo. */
  position: number;
  groupTotal: number;
}

interface PhotoViewerProps {
  entry: ViewEntry;
  index: number;
  total: number;
  prevPhoto: Photo;
  nextPhoto: Photo;
  base: string;
  pageUrl: string;
  eventSlug: string;
  eventTitle: string;
  photographerName: string | null;
  allyCount: number;
  /** Hacia dónde se movió el usuario, para la entrada de la foto nueva. */
  direction: -1 | 0 | 1;
  ios: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const VIEWER_BUTTON =
  'flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none';

function PhotoViewer({
  entry,
  index,
  total,
  prevPhoto,
  nextPhoto,
  base,
  pageUrl,
  eventSlug,
  eventTitle,
  photographerName,
  allyCount,
  direction,
  ios,
  onClose,
  onPrev,
  onNext,
}: PhotoViewerProps) {
  const { photo, group, position, groupTotal } = entry;
  const urls = photoUrls(base, photo.id);
  const clock = takenClock(photo.taken);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const preloaded = useRef<HTMLImageElement[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  // Foco inicial en «Cerrar»: Enter sobre la miniatura que abrió el visor no
  // dispara ninguna acción por accidente.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Bloqueo del scroll de la página. Se compensa el ancho de la barra de
  // desplazamiento para que el contenido no salte a la derecha en escritorio.
  useEffect(() => {
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (documentElement.clientWidth > 0 && scrollbar > 0)
      body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  // Teclado: Escape, flechas y foco atrapado dentro del diálogo.
  useEffect(() => {
    const trapFocus = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      // El botón «Cerrar» siempre existe: nunca hay cero elementos enfocables.
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;
      if (!dialog.contains(current)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        trapFocus(event);
      } else if (!event.altKey && !event.ctrlKey && !event.metaKey) {
        // Alt+← y Cmd+← son «Atrás» del navegador: no se tocan.
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          onPrev();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          onNext();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, onPrev, onNext]);

  // Precarga de la foto anterior y la siguiente: que la flecha se sienta instantánea.
  useEffect(() => {
    const ids = new Set([prevPhoto.id, nextPhoto.id]);
    ids.delete(photo.id);
    preloaded.current = Array.from(ids, (id) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = photoUrls(base, id).web;
      return image;
    });
  }, [base, photo.id, prevPhoto.id, nextPhoto.id]);

  // El aviso de una foto no se queda pegado a la siguiente.
  useEffect(() => {
    setNotice('');
  }, [photo.id]);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const announce = (message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), NOTICE_MS);
  };

  const handleShare = async () => {
    const link = shareUrl(photoShareUrl(pageUrl, photo.id), 'native');
    if (typeof window.navigator.share === 'function') {
      try {
        await window.navigator.share({
          title: eventTitle,
          text: `Foto de la ${eventTitle}`,
          url: link,
        });
        return;
      } catch (error) {
        // Cerrar la hoja de compartir no es un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await window.navigator.clipboard.writeText(link);
      announce('Enlace copiado');
    } catch {
      announce('No se pudo copiar. Copia el enlace de la barra de direcciones');
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Mira esta foto de la ${eventTitle}: ${shareUrl(photoShareUrl(pageUrl, photo.id), 'whatsapp')}`,
  )}`;

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Solo cuenta un gesto claramente horizontal: un scroll en diagonal no pasa de foto.
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) onPrev();
    else onNext();
  };

  // Tocar el fondo negro alrededor de la foto cierra el visor; tocar la foto o un botón, no.
  const handleStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!insidePicture(rect, ratioOf(photo), event.clientX, event.clientY)) onClose();
  };

  const credit = [
    photographerName ? `Foto: ${photographerName}.` : null,
    allyCount > 0
      ? `Gratis gracias a ${allyCount} ${allyCount === 1 ? 'aliado' : 'aliados'} de la válida.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');
  const loaded = loadedId === photo.id;
  const failed = failedId === photo.id;
  const enter =
    direction === 1 ? 'starting:translate-x-6' : direction === -1 ? 'starting:-translate-x-6' : '';

  return createPortal(
    <div
      className="ease-spring fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/95 transition-opacity duration-[var(--duration-micro)] motion-reduce:transition-none lg:p-6 starting:opacity-0"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Visor de fotos"
        className="relative flex h-full max-h-full w-full max-w-6xl flex-col pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] lg:flex-row [@media(orientation:landscape)_and_(max-height:32rem)]:flex-row"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar visor"
          className="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-2 z-10 flex size-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          <Icon name="close" />
        </button>

        <div
          className="relative min-h-0 min-w-0 flex-1"
          onClick={handleStageClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={() => {
            touchStart.current = null;
          }}
        >
          {/* La miniatura (ya en caché por la rejilla) se ve al instante y la
              versión web aparece encima al terminar de cargar. Las dos ocupan la
              misma caja, así que nada se mueve. */}
          <div
            key={photo.id}
            className={`ease-spring absolute inset-0 transition-[opacity,translate] duration-[var(--duration-micro)] motion-reduce:transition-none starting:opacity-0 ${enter}`}
          >
            <img
              src={urls.thumb}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <img
              src={urls.web}
              alt={photoAlt(group, position, groupTotal)}
              decoding="async"
              onLoad={() => setLoadedId(photo.id)}
              onError={() => setFailedId(photo.id)}
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 motion-reduce:transition-none ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
          {failed && (
            <p
              role="status"
              className="absolute inset-x-4 bottom-3 rounded-lg bg-black/75 p-3 text-center text-sm text-white"
            >
              No pudimos cargar la foto completa. Revisa tu conexión; el original se puede descargar
              igual.
            </p>
          )}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={onPrev}
                aria-label="Foto anterior"
                className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:size-12"
              >
                <Icon name="prev" />
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="Foto siguiente"
                className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none sm:size-12"
              >
                <Icon name="next" />
              </button>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:w-80 lg:justify-end lg:border-l lg:border-white/10 lg:bg-white/5 lg:px-6 lg:pt-16 lg:pb-6 [@media(orientation:landscape)_and_(max-height:32rem)]:w-72 [@media(orientation:landscape)_and_(max-height:32rem)]:justify-center [@media(orientation:landscape)_and_(max-height:32rem)]:border-l [@media(orientation:landscape)_and_(max-height:32rem)]:border-white/10 [@media(orientation:landscape)_and_(max-height:32rem)]:bg-white/5 [@media(orientation:landscape)_and_(max-height:32rem)]:px-5 [@media(orientation:landscape)_and_(max-height:32rem)]:pt-14 [@media(orientation:landscape)_and_(max-height:32rem)]:pb-4">
          <div aria-live="polite" aria-atomic="true">
            <p className="font-display text-base leading-snug font-bold text-white">
              {groupTitle(group)}
            </p>
            <p className="text-sm text-white/75">
              <span className="tabular-nums">{`${index + 1} / ${total}`}</span>
              {clock && <span> · {clock}</span>}
            </p>
          </div>

          <div className="relative flex flex-col gap-2">
            <div
              role="status"
              className="pointer-events-none absolute inset-x-0 bottom-full mb-2 flex justify-center"
            >
              {notice && (
                <p className="bg-surface-raised text-text-primary shadow-overlay ring-hairline rounded-full px-4 py-2 text-sm font-semibold ring-1">
                  {notice}
                </p>
              )}
            </div>

            <a
              href={urls.original}
              download={downloadFileName(eventSlug, photo.id)}
              data-analytics-event="photo_download"
              data-analytics-content-id={photo.id}
              className="bg-accent text-surface-dark shadow-pressable ease-spring flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-bold transition-transform duration-[var(--duration-micro)] [--btn-shadow-color:var(--color-accent-dark)] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-1 active:shadow-none motion-reduce:transition-none"
            >
              <Icon name="download" />
              Descargar original
            </a>
            {ios && (
              <p className="text-xs leading-snug text-white/75">
                En iPhone la foto queda en Archivos; para guardarla en Fotos, mantén presionada la
                imagen.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleShare}
                data-analytics-event="photo_share"
                data-analytics-content-id={photo.id}
                data-analytics-method="native"
                className={VIEWER_BUTTON}
              >
                <Icon name="share" />
                Compartir
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-event="photo_share"
                data-analytics-content-id={photo.id}
                data-analytics-method="whatsapp"
                className={VIEWER_BUTTON}
              >
                <Icon name="whatsapp" />
                WhatsApp <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </div>
            {credit && <p className="text-xs leading-snug text-white/70">{credit}</p>}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Galería ───────────────────────────────────────────────────────────────────

interface ActiveView {
  id: string;
  dir: -1 | 0 | 1;
}

export default function RacePhotoGallery(props: RacePhotoGalleryProps) {
  const { manifest, emptyTitle = 'Las fotos vienen pronto', emptyBody } = props;
  // Las fotos son lo único que se muestra sin filtros: sin ellas no hay barra.
  if (manifest.photos.length === 0) {
    return (
      <div className="border-hairline bg-surface-raised text-text-secondary rounded-2xl border p-6">
        <p className="font-display text-text-primary text-lg font-bold">{emptyTitle}</p>
        {emptyBody && <p className="mt-2">{emptyBody}</p>}
      </div>
    );
  }
  return <Gallery {...props} />;
}

function Gallery({
  manifest,
  pageUrl,
  eventSlug,
  eventTitle,
  photographerName = null,
  allyCount = null,
}: RacePhotoGalleryProps) {
  const groups = useMemo<GroupedPhotos[]>(() => groupPhotos(manifest), [manifest]);
  const groupIdByPhoto = useMemo(
    () =>
      new Map(
        groups.flatMap(({ group, photos }) =>
          photos.map((photo): [string, string] => [photo.id, group.id]),
        ),
      ),
    [groups],
  );

  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  /** Mangas desplegadas (con «Mostrar las N restantes» o por el visor) en la vista actual. */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(NO_EXPANSION);
  /** Filtro de categoría al que pertenece `expanded`. */
  const [expandedFor, setExpandedFor] = useState(groupFilter);
  const [active, setActive] = useState<ActiveView | null>(null);
  const [ios, setIos] = useState(false);
  /** Sube con cada cambio de filtro hecho por la persona, para volver al inicio de los resultados. */
  const [filterTick, setFilterTick] = useState(0);

  // Lo desplegado vale solo para la vista en que se hizo. Si pasara a otra, pedir las
  // restantes de una categoría alargaría «Todas» (12 por manga) con esa manga completa, y lo
  // que abrió el visor en «Todas» alargaría la categoría. Se reinicia al renderizar y no en un
  // efecto, para no depender del orden respecto al efecto del visor, que despliega la manga en
  // la misma pasada en que un enlace a una foto quita el filtro.
  if (expandedFor !== groupFilter) {
    setExpandedFor(groupFilter);
    setExpanded(NO_EXPANSION);
  }

  const barRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  const activeIdRef = useRef<string | null>(null);
  const lastViewedRef = useRef<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  /** La entrada de historial actual la empujó el visor (o el navegador para un `#foto-`). */
  const ownsEntryRef = useRef(false);
  const pendingFocusRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  /** Profundidad de una manga sin desplegar en la vista vigente. */
  const baseDepth: GroupDepth = groupFilter === null ? 'preview' : 'page';

  const visibleGroups = useMemo(
    () =>
      groups.filter(
        ({ group, photos }) =>
          photos.length > 0 && (groupFilter === null || group.id === groupFilter),
      ),
    [groups, groupFilter],
  );
  /** Recorrido del visor: todas las fotos del filtro activo, en el orden de la rejilla. */
  const entries = useMemo<ViewEntry[]>(
    () =>
      visibleGroups.flatMap(({ group, photos }) =>
        photos.map((photo, position) => ({ photo, group, position, groupTotal: photos.length })),
      ),
    [visibleGroups],
  );
  const entryIndex = useMemo(
    () => new Map(entries.map((entry, index): [string, number] => [entry.photo.id, index])),
    [entries],
  );
  const total = entries.length;

  const activeIndex = active === null ? -1 : (entryIndex.get(active.id) ?? -1);
  const activeEntry = activeIndex >= 0 ? entries[activeIndex] : null;

  const chips = useMemo<Chip[]>(() => {
    const totalCount = groups.reduce((sum, { photos }) => sum + photos.length, 0);
    return [
      {
        id: null,
        label: 'Todas',
        ariaLabel: `Todas las fotos: ${photoCount(totalCount)}`,
        count: totalCount,
      },
      ...groups.map(({ group, photos }) => ({
        id: group.id,
        label: chipLabel(group),
        ariaLabel: `${groupTitle(group)}: ${photoCount(photos.length)}`,
        title: groupTitle(group),
        count: photos.length,
      })),
    ];
  }, [groups]);
  const selectedGroup = useMemo(
    () => groups.find(({ group }) => group.id === groupFilter)?.group ?? null,
    [groups, groupFilter],
  );

  // ─── Visor e historial ───────────────────────────────────────────────────────

  const setView = useCallback((next: ActiveView | null) => {
    activeIdRef.current = next?.id ?? null;
    if (next) lastViewedRef.current = next.id;
    setActive(next);
  }, []);

  const handleOpen = useCallback(
    (id: string, trigger: HTMLButtonElement) => {
      triggerRef.current = trigger;
      ownsEntryRef.current = pushPhotoHash(id);
      setView({ id, dir: 0 });
    },
    [setView],
  );

  const closeViewer = useCallback(() => {
    if (activeIdRef.current === null) return;
    setView(null);
    if (ownsEntryRef.current) {
      // El visor empujó su propia entrada: se quita volviendo atrás, así el
      // historial queda como estaba antes de abrirlo.
      ownsEntryRef.current = false;
      window.history.back();
    } else {
      replacePhotoHash(null);
    }
  }, [setView]);

  const step = useCallback(
    (delta: 1 | -1) => {
      const current =
        activeIdRef.current === null ? undefined : entryIndex.get(activeIdRef.current);
      if (current === undefined || entries.length < 2) return;
      const next = entries[(current + delta + entries.length) % entries.length];
      setView({ id: next.photo.id, dir: delta });
      replacePhotoHash(next.photo.id);
    },
    [entries, entryIndex, setView],
  );
  const goPrev = useCallback(() => step(-1), [step]);
  const goNext = useCallback(() => step(1), [step]);

  // Carga: filtro de la URL (`?manga=…`) o foto del hash (`#foto-…`). Si
  // hay una foto pedida manda ella y no se aplica el filtro: es lo que alguien
  // quiso mostrar al compartir el enlace.
  useEffect(() => {
    setIos(isIosDevice());
    const id = photoIdFromHash(window.location.hash);
    if (id !== null && groupIdByPhoto.has(id)) {
      ownsEntryRef.current = false;
      setView({ id, dir: 0 });
      return;
    }
    const initial = initialFilterFromSearch(window.location.search, manifest);
    if (initial.group !== null && groups.some(({ group }) => group.id === initial.group)) {
      setGroupFilter(initial.group);
    }
    // Solo al montar: el filtro inicial se lee de la URL una vez.
  }, []);

  // Botón atrás/adelante, enlaces `#foto-…` dentro de la página y hash editado a mano.
  useEffect(() => {
    const syncFromLocation = () => {
      const id = photoIdFromHash(window.location.hash);
      if (id !== null && groupIdByPhoto.has(id)) {
        if (id !== activeIdRef.current) {
          // Una entrada con `#foto-` que no abrió el visor en esta carga (adelante,
          // un enlace `#foto-…` o un hash escrito a mano) es nueva: cerrar es volver.
          ownsEntryRef.current = true;
          setView({ id, dir: 0 });
        }
      } else if (activeIdRef.current !== null) {
        // La URL ya no pide ninguna foto (botón atrás): el visor se cierra, sea o
        // no de una entrada del visor, y no queda nada que retroceder.
        ownsEntryRef.current = false;
        setView(null);
      }
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [groupIdByPhoto, setView]);

  // La foto pedida por enlace o historial no está en el filtro activo: se quita el filtro.
  useEffect(() => {
    if (active === null || entryIndex.has(active.id)) return;
    setGroupFilter(null);
    replaceGroupSearch(null);
  }, [active, entryIndex]);

  // Si el visor pasó del tope de su manga en la vista vigente (12 en «Todas», 48 con una
  // categoría elegida), se despliega la manga: al cerrar tiene que existir la miniatura a la
  // que devolver el foco.
  useEffect(() => {
    if (activeEntry === null || activeEntry.position < depthLimit(baseDepth)) return;
    const groupId = activeEntry.group.id;
    setExpanded((previous) => (previous.has(groupId) ? previous : new Set(previous).add(groupId)));
  }, [activeEntry, baseDepth]);

  // Una vista por foto mostrada: flechas, miniatura, `#foto-…` y popstate pasan por aquí.
  const viewedId = activeEntry?.photo.id ?? null;
  useEffect(() => {
    if (viewedId !== null) emitAnalytics('photo_view', { content_id: viewedId });
  }, [viewedId]);

  // Al cerrar, el foco vuelve a la miniatura de la última foto vista (la que abrió el
  // visor si no se navegó; si se navegó, la rejilla se acomoda donde se quedó la persona).
  const viewerOpen = activeEntry !== null;
  useEffect(() => {
    if (viewerOpen) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    const lastId = lastViewedRef.current;
    const last = lastId === null ? undefined : tileRefs.current.get(lastId);
    // En la muestra de «Todas» la rejilla oculta con CSS las miniaturas que no caben en dos
    // filas: si la última vista es una de ellas, el foco vuelve a la que abrió el visor.
    const lastShown =
      last?.isConnected && getComputedStyle(last.closest('li') ?? last).display !== 'none'
        ? last
        : undefined;
    const target = lastShown ?? triggerRef.current;
    if (target?.isConnected) target.focus();
  }, [viewerOpen]);

  // ─── Filtros ─────────────────────────────────────────────────────────────────

  const registerTile = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node) tileRefs.current.set(id, node);
    else tileRefs.current.delete(id);
  }, []);

  const handleSelectGroup = useCallback((id: string | null) => {
    setGroupFilter(id);
    setFilterTick((tick) => tick + 1);
    replaceGroupSearch(id);
  }, []);

  // Tras un filtro, los resultados vuelven al inicio si la persona estaba más abajo.
  useEffect(() => {
    if (filterTick === 0) return;
    const results = resultsRef.current;
    const bar = barRef.current;
    if (!results || !bar) return;
    const gap = results.getBoundingClientRect().top - bar.getBoundingClientRect().bottom;
    if (gap < 0) window.scrollTo({ top: window.scrollY + gap - 8, behavior: 'auto' });
  }, [filterTick]);

  // «Mostrar las N restantes»: el foco pasa a la primera foto nueva, no se pierde con el botón.
  const handleReveal = useCallback((groupId: string, firstHiddenId: string) => {
    pendingFocusRef.current = firstHiddenId;
    setExpanded((previous) => new Set(previous).add(groupId));
  }, []);
  // «Ver las N fotos»: es tocar el chip de esa categoría. El botón desaparece con el
  // cambio de vista, así que el foco pasa a la primera foto de la manga.
  const handleEnterGroup = useCallback(
    (groupId: string, firstPhotoId: string) => {
      pendingFocusRef.current = firstPhotoId;
      handleSelectGroup(groupId);
    },
    [handleSelectGroup],
  );
  useEffect(() => {
    const id = pendingFocusRef.current;
    if (id === null) return;
    pendingFocusRef.current = null;
    tileRefs.current.get(id)?.focus();
  }, [expanded, groupFilter]);

  const message = resultMessage(total, selectedGroup);

  return (
    <div inert={viewerOpen || undefined} className="w-full">
      <FilterBar
        barRef={barRef}
        chips={chips}
        selected={groupFilter}
        message={message}
        onSelect={handleSelectGroup}
      />

      <div ref={resultsRef} className="mt-6 space-y-10 sm:mt-8 sm:space-y-12">
        {visibleGroups.map(({ group, photos }) => (
          <GroupSection
            key={group.id}
            group={group}
            photos={photos}
            base={manifest.base}
            depth={expanded.has(group.id) ? 'all' : baseDepth}
            onOpen={handleOpen}
            register={registerTile}
            onReveal={handleReveal}
            onEnter={handleEnterGroup}
          />
        ))}
      </div>

      {activeEntry !== null && active !== null && (
        <PhotoViewer
          entry={activeEntry}
          index={activeIndex}
          total={total}
          prevPhoto={entries[(activeIndex - 1 + total) % total].photo}
          nextPhoto={entries[(activeIndex + 1) % total].photo}
          base={manifest.base}
          pageUrl={pageUrl}
          eventSlug={eventSlug}
          eventTitle={eventTitle}
          photographerName={photographerName}
          allyCount={allyCount ?? 0}
          direction={active.dir}
          ios={ios}
          onClose={closeViewer}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
