import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Buscador del sitio (Pagefind).
 *
 * El sitio publica ~146 páginas estáticas —77 árboles, 32 especies, crónicas,
 * programas— y hasta ahora no había forma de buscar nada: quien llegaba
 * buscando "guayacán" tenía que recorrer el índice a mano.
 *
 * Pagefind indexa el HTML ya construido (`pagefind --site dist` corre después
 * de `astro build`), así que no hay servidor ni API: el índice viaja en `dist/`
 * y el deploy por FTP lo sube igual que cualquier otro archivo.
 *
 * Tres decisiones que sostienen el presupuesto de rendimiento:
 *
 * 1. **La isla se hidrata con `client:visible` y no carga Pagefind al hidratar.**
 *    El motor y el índice se piden con `import()` la primera vez que alguien
 *    abre el diálogo. Quien nunca busca no descarga ni un byte del buscador.
 * 2. **`loadPagefind` es un prop.** El módulo vive en `/pagefind/`, que solo
 *    existe después del build: en `astro dev` y en los tests no está. El prop
 *    permite inyectarlo en las pruebas, y cuando el import falla el diálogo
 *    explica por qué en vez de romperse.
 * 3. **Los resultados son enlaces reales**, agrupados por sección del sitio.
 *    El teclado los recorre con flechas y los abre con Enter, pero siguen
 *    siendo `<a href>`: se pueden abrir en pestaña nueva y copiar.
 */

// ─── Tipos del API de Pagefind ────────────────────────────────────────────
// Pagefind no publica tipos; solo declaramos lo que este componente usa.

export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta?: Record<string, string | undefined>;
}

export interface PagefindResult {
  id?: string;
  data: () => Promise<PagefindResultData>;
}

export interface PagefindResponse {
  results: PagefindResult[];
}

export interface PagefindApi {
  init?: () => Promise<void>;
  search: (query: string) => Promise<PagefindResponse | null>;
  /** Presente en Pagefind >= 1.x: descarta las búsquedas ya superadas. */
  debouncedSearch?: (
    query: string,
    options?: unknown,
    debounceTimeoutMs?: number,
  ) => Promise<PagefindResponse | null>;
}

export type LoadPagefind = () => Promise<PagefindApi>;

// La ruta va en una constante para que TypeScript no intente resolver un
// módulo que solo existe en `dist/` después del build, y `@vite-ignore` para
// que Vite no intente empaquetarlo.
const PAGEFIND_ENTRY = '/pagefind/pagefind.js';

const defaultLoadPagefind: LoadPagefind = async () => {
  const mod = await import(/* @vite-ignore */ PAGEFIND_ENTRY);
  return mod as PagefindApi;
};

// ─── Agrupación por sección ───────────────────────────────────────────────
// El orden importa: `/trocha-verde/arboles` tiene que evaluarse antes que
// `/trocha-verde`, y el mismo criterio de prefijo que `isActivePath` evita que
// una futura `/noticias-especiales` caiga en "Noticias".

interface SectionGroup {
  prefix: string;
  label: string;
}

const SECTION_GROUPS: readonly SectionGroup[] = [
  { prefix: '/trocha-verde/arboles', label: 'Trocha Verde · Árboles' },
  { prefix: '/trocha-verde', label: 'Trocha Verde' },
  { prefix: '/noticias', label: 'Noticias' },
  { prefix: '/programas', label: 'Programas' },
  { prefix: '/galeria', label: 'Galería' },
  { prefix: '/calendario', label: 'Calendario' },
];

const FALLBACK_GROUP = 'Páginas';

/** Deja la URL de Pagefind como una ruta absoluta del sitio. */
function toPathname(url: string): string {
  let path = url;
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      /* si no parsea, se usa tal cual */
    }
  }
  path = path.split('#')[0].split('?')[0];
  path = path.replace(/index\.html$/, '').replace(/\.html$/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  return path;
}

export function sectionLabelFor(url: string): string {
  const path = toPathname(url);
  const match = SECTION_GROUPS.find(
    (group) => path === group.prefix || path.startsWith(`${group.prefix}/`),
  );
  return match ? match.label : FALLBACK_GROUP;
}

interface SearchHit {
  url: string;
  title: string;
  excerpt: string;
  section: string;
}

interface HitGroup {
  label: string;
  hits: SearchHit[];
}

/** Agrupa conservando el orden de `SECTION_GROUPS` y la relevancia dentro de cada grupo. */
function groupHits(hits: SearchHit[]): HitGroup[] {
  const order = [...SECTION_GROUPS.map((g) => g.label), FALLBACK_GROUP];
  const groups: HitGroup[] = [];
  for (const label of order) {
    const inGroup = hits.filter((hit) => hit.section === label);
    if (inGroup.length > 0) groups.push({ label, hits: inGroup });
  }
  return groups;
}

function toHit(data: PagefindResultData): SearchHit {
  const url = data.url ?? '';
  return {
    url,
    title: data.meta?.title?.trim() || toPathname(url),
    excerpt: data.excerpt ?? '',
    section: sectionLabelFor(url),
  };
}

// ─── Componente ───────────────────────────────────────────────────────────

type IndexState = 'idle' | 'loading' | 'ready' | 'unavailable';

interface Props {
  /** Inyectable para pruebas; por defecto importa `/pagefind/pagefind.js`. */
  loadPagefind?: LoadPagefind;
  /** Tope de resultados que se piden a Pagefind (cada uno cuesta un `data()`). */
  maxResults?: number;
  /** Espera antes de disparar la búsqueda mientras se escribe. */
  debounceMs?: number;
}

export default function SiteSearch({
  loadPagefind = defaultLoadPagefind,
  maxResults = 12,
  debounceMs = 160,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<HitGroup[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [indexState, setIndexState] = useState<IndexState>('idle');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiRef = useRef<PagefindApi | null>(null);
  const pendingLoadRef = useRef<Promise<PagefindApi | null> | null>(null);

  const baseId = useId();
  const titleId = `${baseId}-title`;
  const inputId = `${baseId}-input`;
  const resultsId = `${baseId}-results`;
  const hintId = `${baseId}-hint`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  // Lista plana en el mismo orden en que se pintan: es la que recorren las flechas.
  const flatHits = useMemo(() => groups.flatMap((group) => group.hits), [groups]);

  // SSR-safe: el portal solo se monta en el cliente.
  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  /** Carga Pagefind una sola vez; devuelve null si el índice no existe. */
  const ensurePagefind = useCallback((): Promise<PagefindApi | null> => {
    if (apiRef.current) return Promise.resolve(apiRef.current);
    if (!pendingLoadRef.current) {
      setIndexState('loading');
      pendingLoadRef.current = (async () => {
        try {
          const api = await loadPagefind();
          try {
            await api.init?.();
          } catch {
            /* `init` es opcional: Pagefind se inicializa solo en la primera búsqueda */
          }
          apiRef.current = api;
          setIndexState('ready');
          return api;
        } catch {
          setIndexState('unavailable');
          return null;
        }
      })();
    }
    return pendingLoadRef.current;
  }, [loadPagefind]);

  // Al abrir: precargar el motor (así el aviso de "sin índice" aparece de una
  // vez en desarrollo) y poner el foco en el campo.
  useEffect(() => {
    if (!isOpen) return;
    void ensurePagefind();
    inputRef.current?.focus();
  }, [isOpen, ensurePagefind]);

  // Bloqueo del scroll del documento mientras el diálogo está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // La cabecera es `transition:persist`: cerrar antes de una View Transition
  // evita que el portal quede huérfano en el documento entrante.
  useEffect(() => {
    const handler = () => setIsOpen(false);
    document.addEventListener('astro:before-preparation', handler);
    return () => document.removeEventListener('astro:before-preparation', handler);
  }, []);

  // Atajos globales: Ctrl/Cmd+K siempre; "/" solo si no se está escribiendo.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!isCommandK && !isSlash) return;

      if (isSlash) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          target?.isContentEditable
        ) {
          return;
        }
      }

      event.preventDefault();
      setIsOpen(true);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Escape cierra y devuelve el foco al disparador.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Trampa de foco: el Tab no sale del panel.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, groups]);

  // Búsqueda con espera corta. `debouncedSearch` descarta por sí solo las
  // consultas superadas (devuelve null); `search` es el respaldo.
  useEffect(() => {
    if (!isOpen) return;
    const term = query.trim();
    if (term.length < 2) {
      setGroups([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(() => {
      void (async () => {
        const api = await ensurePagefind();
        if (cancelled) return;
        if (!api) {
          setIsSearching(false);
          return;
        }
        try {
          const response = api.debouncedSearch
            ? await api.debouncedSearch(term, undefined, debounceMs)
            : await api.search(term);
          if (cancelled) return;
          // `debouncedSearch` devuelve null cuando otra consulta la superó.
          if (!response) return;
          const data = await Promise.all(
            response.results.slice(0, maxResults).map((result) => result.data()),
          );
          if (cancelled) return;
          setGroups(groupHits(data.map(toHit)));
          setActiveIndex(0);
        } catch {
          if (!cancelled) setGroups([]);
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, ensurePagefind, debounceMs, maxResults]);

  // El resultado activo se mantiene a la vista al recorrer con flechas.
  useEffect(() => {
    if (!isOpen || flatHits.length === 0) return;
    const el = document.getElementById(optionId(activeIndex));
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
    // `optionId` depende solo de `baseId`, que es estable.
  }, [activeIndex, isOpen, flatHits.length]);

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (flatHits.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % flatHits.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + flatHits.length) % flatHits.length);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(flatHits.length - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById(optionId(activeIndex))?.click();
      }
    },
    [flatHits.length, activeIndex],
  );

  const term = query.trim();
  const showEmpty =
    indexState !== 'unavailable' && term.length >= 2 && !isSearching && flatHits.length === 0;

  /**
   * Lo que anuncia la región viva. Cubre **todos** los estados del panel, no
   * solo el de "hay resultados": quien busca con lector de pantalla y no
   * encuentra nada tiene que enterarse sin recorrer el panel a mano (WCAG 2.1
   * AA, 4.1.3 Mensajes de estado). El texto visible sigue donde estaba; esta
   * copia en `sr-only` es la que se lee sola al cambiar.
   */
  const statusMessage =
    indexState === 'unavailable'
      ? 'El buscador no está disponible todavía en esta versión del sitio.'
      : isSearching
        ? 'Buscando…'
        : flatHits.length > 0
          ? `${flatHits.length} ${flatHits.length === 1 ? 'resultado' : 'resultados'}`
          : showEmpty
            ? `No encontramos resultados para «${term}».`
            : '';

  let flatIndex = -1;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Buscar en el sitio"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="border-primary-deep/35 text-primary-deep hover:bg-primary/10 focus-visible:outline-primary inline-flex size-10 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] pb-6">
            {/* Estilos del resaltado que devuelve Pagefind (`<mark>` dentro del
                extracto): el mismo trazo lima de `.editorial-mark`. */}
            <style>{`
              .site-search-excerpt mark {
                background-color: transparent;
                background-image: linear-gradient(
                  to top,
                  rgba(139, 224, 0, 0.55) 0.34em,
                  transparent 0.34em
                );
                color: inherit;
                padding-inline: 0.1em;
                border-radius: 0.12em;
              }
            `}</style>

            <div
              className="ease-spring absolute inset-0 bg-black/50 transition-opacity duration-[var(--duration-micro)] motion-reduce:transition-none starting:opacity-0"
              onClick={close}
              aria-hidden="true"
            />

            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="ease-spring relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-[opacity,scale] duration-[var(--duration-micro)] motion-reduce:transition-none starting:scale-95 starting:opacity-0"
            >
              <h2 id={titleId} className="sr-only">
                Buscar en el sitio
              </h2>

              {/* Campo de búsqueda */}
              <div className="flex items-center gap-3 border-b border-black/10 px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary-deep shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>

                <label htmlFor={inputId} className="sr-only">
                  Buscar en el sitio
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Buscar árboles, crónicas, programas…"
                  aria-describedby={hintId}
                  aria-controls={flatHits.length > 0 ? resultsId : undefined}
                  aria-activedescendant={flatHits.length > 0 ? optionId(activeIndex) : undefined}
                  className="text-text-primary placeholder:text-text-secondary/70 min-w-0 flex-1 bg-transparent text-base outline-none"
                />

                <kbd className="bg-surface-muted/30 text-text-secondary hidden shrink-0 rounded-md border border-black/10 px-1.5 py-0.5 text-[11px] font-medium sm:inline-block">
                  esc
                </kbd>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar buscador"
                  className="text-text-secondary hover:text-primary-deep focus-visible:outline-primary shrink-0 rounded-md p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Resultados */}
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                <p id={hintId} className="sr-only">
                  Escribe al menos dos letras. Usa las flechas para recorrer los resultados y Enter
                  para abrirlos.
                </p>

                <p aria-live="polite" className="sr-only">
                  {statusMessage}
                </p>

                {indexState === 'unavailable' && (
                  <p className="text-text-secondary px-3 py-6 text-sm leading-relaxed">
                    El buscador se genera con el build del sitio y todavía no está disponible aquí.
                    Ejecuta <code className="text-primary-deep font-mono">npm run build</code> y
                    abre el sitio con{' '}
                    <code className="text-primary-deep font-mono">npm run preview</code> para
                    probarlo.
                  </p>
                )}

                {indexState !== 'unavailable' && term.length < 2 && (
                  <p className="text-text-secondary px-3 py-6 text-sm">
                    Busca por nombre de árbol, especie, programa o crónica.
                  </p>
                )}

                {showEmpty && (
                  <p className="text-text-secondary px-3 py-6 text-sm">
                    No encontramos resultados para «{term}».
                  </p>
                )}

                {/*
                  El panel es una lista de opciones, no una lista cualquiera:
                  el campo apunta al resultado activo con `aria-activedescendant`,
                  y ese patrón pide que lo apuntado sea un `option` dentro de un
                  `listbox`. Cada sección es un `group` sobre el `<ul>` interno
                  —el rol no es válido sobre un `<li>`— con su rótulo como
                  nombre accesible, por eso el `<p>` visible queda `aria-hidden`;
                  los `<li>` intermedios van como `none` para que el árbol de
                  accesibilidad quede listbox → group → option. Siguen siendo
                  `<a href>` reales: se abren en pestaña nueva y se copian
                  igual que antes.
                */}
                {flatHits.length > 0 && (
                  <ul
                    id={resultsId}
                    role="listbox"
                    aria-label="Resultados de la búsqueda"
                    className="space-y-4"
                  >
                    {groups.map((group) => (
                      <li key={group.label} role="none">
                        <p
                          aria-hidden="true"
                          className="text-primary-deep px-3 pb-1 text-[11px] font-semibold tracking-wide uppercase"
                        >
                          {group.label}
                        </p>
                        <ul role="group" aria-label={group.label}>
                          {group.hits.map((hit) => {
                            flatIndex += 1;
                            const index = flatIndex;
                            const isActive = index === activeIndex;
                            return (
                              <li key={hit.url} role="none">
                                <a
                                  id={optionId(index)}
                                  role="option"
                                  aria-selected={isActive}
                                  href={hit.url}
                                  onMouseEnter={() => setActiveIndex(index)}
                                  className={`focus-visible:outline-primary block rounded-xl px-3 py-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                    isActive ? 'bg-primary/10' : 'hover:bg-surface-muted/25'
                                  }`}
                                >
                                  <span className="text-text-primary block text-sm font-semibold">
                                    {hit.title}
                                  </span>
                                  {hit.excerpt && (
                                    <span
                                      className="site-search-excerpt text-text-secondary mt-0.5 block text-xs leading-relaxed"
                                      // Único uso de HTML sin escapar: el extracto de
                                      // Pagefind, generado en build desde nuestro propio
                                      // HTML, trae <mark> alrededor de las coincidencias.
                                      dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                                    />
                                  )}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pie con ayudas de teclado */}
              <div className="bg-surface-muted/20 text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/10 px-4 py-2 text-[11px]">
                <span>
                  <kbd className="rounded border border-black/10 bg-white px-1">↑</kbd>{' '}
                  <kbd className="rounded border border-black/10 bg-white px-1">↓</kbd> para moverte
                </span>
                <span>
                  <kbd className="rounded border border-black/10 bg-white px-1">Enter</kbd> para
                  abrir
                </span>
                <span>
                  <kbd className="rounded border border-black/10 bg-white px-1">Esc</kbd> para
                  cerrar
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
