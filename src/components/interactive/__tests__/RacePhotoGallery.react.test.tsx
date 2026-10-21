import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import type { Photo, PhotoGroup, PhotoManifest } from '@lib/valida';
import RacePhotoGallery from '../RacePhotoGallery';

// ─── Datos de prueba ───────────────────────────────────────────────────────────
// Tres grupos y 66 fotos. Los ids son opacos (sin nombres de nadie). La manga 1
// tiene 52, más que el tope de «Todas» (12) y que el de una categoría (48): sirve
// para probar «Ver las 52 fotos de …» y «Mostrar las 4 restantes».

const BASE = 'https://media.example.org/valida-2026';
const PAGE_URL = 'https://example.org/copa-valle-yumbo-2026';
const EVENT_SLUG = 'copa-valle-yumbo-2026';
const EVENT_TITLE = 'VI Válida Copa Valle';

const GROUPS: PhotoGroup[] = [
  {
    id: 'previa',
    label: 'Antes de la salida',
    categories: [],
    description: 'Entrega de números y calentamiento',
  },
  { id: 'manga-1', label: 'Manga 1', categories: ['Infantil A', 'Infantil B'], description: '' },
  { id: 'premiacion', label: 'Premiación', categories: [], description: '' },
];

function photo(id: string, group: string, minuteOfDay: number): Photo {
  const hours = String(Math.floor(minuteOfDay / 60)).padStart(2, '0');
  const minutes = String(minuteOfDay % 60).padStart(2, '0');
  return { id, group, w: 1600, h: 1067, taken: `2026-10-18T${hours}:${minutes}:00-05:00` };
}

function series(prefix: string, group: string, count: number, startMinute: number): Photo[] {
  return Array.from({ length: count }, (_, index) =>
    photo(`${prefix}-${String(index + 1).padStart(2, '0')}`, group, startMinute + index),
  );
}

function buildPhotos(): Photo[] {
  const previa = series('previa', 'previa', 6, 8 * 60);
  const manga = series('manga-1', 'manga-1', 52, 9 * 60);
  const premiacion = series('premiacion', 'premiacion', 8, 13 * 60);
  return [...previa, ...manga, ...premiacion];
}

function buildManifest(overrides: Partial<PhotoManifest> = {}): PhotoManifest {
  return { base: BASE, generatedAt: null, groups: GROUPS, photos: buildPhotos(), ...overrides };
}

function renderGallery(
  props: Partial<React.ComponentProps<typeof RacePhotoGallery>> = {},
  manifest: PhotoManifest = buildManifest(),
) {
  return render(
    <RacePhotoGallery
      manifest={manifest}
      pageUrl={PAGE_URL}
      eventSlug={EVENT_SLUG}
      eventTitle={EVENT_TITLE}
      {...props}
    />,
  );
}

const firstPhotoButton = () =>
  screen.getByRole('button', { name: 'Antes de la salida: foto 1 de 6' });

/** La lista de fotos de una manga, por el titular que la nombra (el texto de su chip). */
const groupList = (name: string) => screen.getByRole('list', { name });

/** La barra fija de filtros: el ancla `#filtros`. */
const filterBar = () => document.getElementById('filtros') as HTMLElement;

/** Los resultados van justo después de la barra, dentro de la raíz de la isla. */
const resultsOf = () => filterBar().nextElementSibling as HTMLElement;

type TestWindow = Window & { __trochaEmit?: unknown };

/** Estado del historial como lo deja Astro en la carga: la entrada trae su índice. */
const ASTRO_STATE = { index: 0, scrollX: 0, scrollY: 0 };

/**
 * Fija `window.scrollX/Y` y devuelve cómo dejarlo como estaba. En jsdom son
 * propiedades propias de `window`: borrarlas en vez de restaurarlas rompe los
 * tests que corren después.
 */
function stubScroll(name: 'scrollX' | 'scrollY', value: number): () => void {
  const previous = Object.getOwnPropertyDescriptor(window, name);
  Object.defineProperty(window, name, { value, configurable: true, writable: true });
  return () => {
    if (previous) Object.defineProperty(window, name, previous);
    else Reflect.deleteProperty(window, name);
  };
}

describe('RacePhotoGallery', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete (window as TestWindow).__trochaEmit;
    // `share`, `userAgent` y `maxTouchPoints` se redefinen en la instancia: borrarlos
    // deja visibles los de jsdom (o ninguno, en el caso de `share`).
    Reflect.deleteProperty(navigator, 'share');
    Reflect.deleteProperty(navigator, 'userAgent');
    Reflect.deleteProperty(navigator, 'maxTouchPoints');
  });

  // ─── Rejilla ─────────────────────────────────────────────────────────────────

  describe('rejilla por manga', () => {
    it('pinta un bloque por manga: titular de categoría, detalle, descripción y su lista de fotos', () => {
      renderGallery();

      const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(headings).toEqual([
        'Antes de la salida',
        'Infantil A y B',
        'Premiación',
      ]);

      // Bajo el titular, en pequeño: la manga y el conteo. Lo que el titular ya dice no se repite.
      expect(screen.getByText('6 fotos')).toBeInTheDocument();
      expect(screen.getByText('Manga 1 · 52 fotos')).toBeInTheDocument();
      expect(screen.getByText('8 fotos')).toBeInTheDocument();
      expect(screen.getByText('Entrega de números y calentamiento')).toBeInTheDocument();
      // La lista de fotos lleva el nombre del titular.
      expect(within(groupList('Antes de la salida')).getAllByRole('button')).toHaveLength(6);
      expect(within(groupList('Infantil A y B')).getAllByRole('button')).toHaveLength(12);
    });

    it('el detalle suma la manga y las categorías completas solo cuando dicen algo más que el titular', () => {
      const groups: PhotoGroup[] = [
        { ...GROUPS[1], chip: 'Infantil' },
        {
          id: 'manga-4',
          label: 'Manga 4',
          chip: 'Femeninas',
          categories: ['Élite femenina', 'Junior femenina'],
          description: '',
        },
        GROUPS[2],
      ];
      const photos = [
        ...series('manga-1', 'manga-1', 20, 540),
        ...series('manga-4', 'manga-4', 15, 700),
        ...series('premiacion', 'premiacion', 8, 780),
      ];
      renderGallery({}, buildManifest({ groups, photos }));

      const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(headings.slice(0, 3)).toEqual(['Infantil', 'Femeninas', 'Premiación']);
      expect(screen.getByText('Manga 1 · Infantil A y B · 20 fotos')).toBeInTheDocument();
      expect(
        screen.getByText('Manga 4 · Élite femenina y Junior femenina · 15 fotos'),
      ).toBeInTheDocument();
      // Sin categorías, el titular ya es el nombre de la manga: queda solo el conteo.
      expect(screen.getByText('8 fotos')).toBeInTheDocument();
      // El texto alternativo conserva la manga y las categorías completas.
      expect(
        screen.getByRole('button', {
          name: 'Manga 4, Élite femenina y Junior femenina: foto 1 de 15',
        }),
      ).toBeInTheDocument();
    });

    it('las mangas son div: no hay regiones con nombre que llenen los puntos de referencia', () => {
      const { container } = renderGallery();

      expect(container.querySelectorAll('section')).toHaveLength(0);
      expect(screen.queryAllByRole('region')).toHaveLength(0);
      // Los titulares siguen ahí para quien navega por encabezados.
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    });

    it('cada foto es un botón con el texto alternativo de manga y posición, sin nombres', () => {
      renderGallery();

      expect(
        screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 3 de 52' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Premiación: foto 8 de 8' })).toBeInTheDocument();
    });

    it('en «Todas» cada manga es una rejilla de dos filas, sin desplazamiento horizontal', () => {
      renderGallery();

      const list = groupList('Antes de la salida');
      // La tira horizontal solo se recorría arrastrando la barra en escritorio (16-oct-2026).
      expect(list).toHaveClass('grid', 'grid-cols-3', 'sm:grid-cols-4', 'lg:grid-cols-6');
      expect(list).not.toHaveClass('overflow-x-auto');
      expect(list).not.toHaveClass('flex-wrap');

      // Miniaturas iguales: el `li` lleva la proporción de la rejilla, no la de la foto.
      const item = firstPhotoButton().closest('li') as HTMLElement;
      expect(item).toHaveClass('aspect-[4/3]');
      expect(item.style.aspectRatio).toBe('');
      expect(item.style.flexGrow).toBe('');
      // Dos filas a cada ancho: 6 en el celular, 8 desde `sm`, las 12 desde `lg`.
      expect(item.className).toContain('max-sm:[&:nth-child(n+7)]:hidden');
      expect(item.className).toContain('sm:max-lg:[&:nth-child(n+9)]:hidden');
    });

    it('con una categoría las fotos van en filas justificadas con la proporción real de cada una', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(screen.getByRole('button', { name: 'Antes de la salida: 6 fotos' }));

      const list = groupList('Antes de la salida');
      expect(list).toHaveClass('flex-wrap');
      expect(list).not.toHaveClass('overflow-x-auto');
      const item = firstPhotoButton().closest('li') as HTMLElement;
      expect(item.style.aspectRatio).toBe('1600 / 1067');
      // Proporción 1600/1067: la fila se justifica con el `flex-grow` proporcional a ella.
      expect(item.style.flexGrow).toBe(String((1600 / 1067) * 100));
      expect(item.style.height).toBe('');
      expect(item).not.toHaveClass('aspect-[4/3]');
    });

    it('el alto de fila baja a 6rem en pantallas de 360 px, para que quepan dos horizontales', async () => {
      const user = userEvent.setup();
      renderGallery();

      // Filas justificadas: 6rem, 7rem desde 400 px, 9rem y 10rem.
      const classes = () => groupList('Antes de la salida').className;
      await user.click(screen.getByRole('button', { name: 'Antes de la salida: 6 fotos' }));
      for (const token of [
        '[--row-h:6rem]',
        'min-[400px]:[--row-h:7rem]',
        'sm:[--row-h:9rem]',
        'lg:[--row-h:10rem]',
      ]) {
        expect(classes()).toContain(token);
      }
    });

    it('cada miniatura carga perezosa, con las medidas reales y sin texto alternativo propio', () => {
      renderGallery();

      const button = firstPhotoButton();
      const image = button.querySelector('img') as HTMLImageElement;
      expect(image).toHaveAttribute('src', `${BASE}/thumb/previa-01.webp`);
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('decoding', 'async');
      expect(image).toHaveAttribute('width', '1600');
      expect(image).toHaveAttribute('height', '1067');
      expect(image).toHaveAttribute('alt', '');
    });

    it('una foto con medidas inválidas cae a proporción 3:2 en la fila', async () => {
      const user = userEvent.setup();
      const manifest = buildManifest({
        groups: [GROUPS[0]],
        photos: [{ ...photo('previa-01', 'previa', 480), w: 0, h: 0 }],
      });
      renderGallery({}, manifest);

      // Un `0 / 0` dejaría la miniatura sin ancho.
      await user.click(screen.getByRole('button', { name: 'Antes de la salida: 1 foto' }));
      const inRow = firstPhotoButtonFor('Antes de la salida: foto 1 de 1').closest(
        'li',
      ) as HTMLElement;
      expect(inRow.style.aspectRatio).toBe('3 / 2');
      expect(inRow.style.flexGrow).toBe('150');
    });

    it('una foto de un grupo desconocido cae en «Otras fotos» y no se pierde', () => {
      const manifest = buildManifest();
      manifest.photos.push(photo('suelta-01', 'no-existe', 14 * 60));
      renderGallery({}, manifest);

      expect(screen.getByRole('button', { name: 'Todas las fotos: 67 fotos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Otras fotos: 1 foto' })).toBeInTheDocument();
    });
  });

  // ─── Revelado progresivo ─────────────────────────────────────────────────────
  // «Todas» pinta 12 fotos por manga; con una categoría elegida son 48.
  // La manga 1 (52 fotos) pasa de los dos topes.

  describe('revelado progresivo', () => {
    const ENTER_MANGA = 'Ver las 52 fotos de Infantil A y B';
    const MANGA_CHIP = 'Manga 1 · Infantil A y B: 52 fotos';
    const TODAS_CHIP = 'Todas las fotos: 66 fotos';

    /** Miniaturas pintadas de la manga 1. */
    const mangaTiles = () =>
      within(groupList('Infantil A y B')).getAllByRole('button', { name: /foto \d+ de 52$/ });
    /** Miniatura de la manga 1 por su posición (desde 1). */
    const mangaTile = (position: number) =>
      screen.getByRole('button', { name: `Manga 1, Infantil A y B: foto ${position} de 52` });
    /** Los botones «Ver las N fotos» que hay a la vista (su nombre accesible sigue diciendo «de X»). */
    const enterButtons = () => screen.queryAllByRole('button', { name: /^Ver las \d+ fotos de / });

    describe('vista «Todas»', () => {
      it('pinta 12 fotos por manga y «Ver las N fotos» solo donde hay más', () => {
        renderGallery();

        expect(mangaTiles()).toHaveLength(12);
        // Las mangas de 6 y 8 fotos se ven completas y no piden botón.
        const previa = groupList('Antes de la salida');
        expect(within(previa).getAllByRole('button', { name: /foto \d+ de 6$/ })).toHaveLength(6);
        const premiacion = groupList('Premiación');
        expect(within(premiacion).getAllByRole('button', { name: /foto \d+ de 8$/ })).toHaveLength(
          8,
        );
        expect(enterButtons().map((button) => button.textContent)).toEqual([ENTER_MANGA]);
        // El botón vive en su manga, debajo de la rejilla.
        const manga = groupList('Infantil A y B').parentElement!;
        const enter = within(manga).getByRole('button', { name: ENTER_MANGA });
        expect(enter).toBeInTheDocument();
        // Se ve «Ver las 52 fotos»: la categoría ya la dice el titular de la manga y solo la
        // oye el lector de pantalla. Y el texto se balancea: sin eso, en el teléfono dejaba una
        // letra sola en la segunda línea.
        const hidden = enter.querySelector('.sr-only')!;
        expect(hidden).toHaveTextContent('de Infantil A y B');
        expect(enter.textContent!.replace(hidden.textContent!, '').trim()).toBe('Ver las 52 fotos');
        expect(enter).toHaveClass('text-balance', 'text-center');
        // «Mostrar las N restantes» es de la vista de una categoría.
        expect(screen.queryByRole('button', { name: /Mostrar las/ })).not.toBeInTheDocument();
      });

      it('una manga de 12 fotos no pide botón y una de 13 sí, con su total', () => {
        const photos = [
          ...series('manga-1', 'manga-1', 12, 540),
          ...series('premiacion', 'premiacion', 13, 780),
        ];
        renderGallery({}, buildManifest({ groups: [GROUPS[1], GROUPS[2]], photos }));

        const manga = groupList('Infantil A y B');
        expect(within(manga).getAllByRole('button', { name: /foto \d+ de 12$/ })).toHaveLength(12);
        const premiacion = groupList('Premiación');
        expect(within(premiacion).getAllByRole('button', { name: /foto \d+ de 13$/ })).toHaveLength(
          12,
        );
        expect(enterButtons().map((button) => button.textContent)).toEqual([
          'Ver las 13 fotos de Premiación',
        ]);
      });

      it('el botón nombra la categoría como su chip: el texto corto del manifest o, sin categorías, el nombre', () => {
        const groups = [{ ...GROUPS[1], chip: 'Infantil' }, GROUPS[2]];
        const photos = [
          ...series('manga-1', 'manga-1', 20, 540),
          ...series('premiacion', 'premiacion', 15, 780),
        ];
        renderGallery({}, buildManifest({ groups, photos }));

        expect(enterButtons().map((button) => button.textContent)).toEqual([
          'Ver las 20 fotos de Infantil',
          'Ver las 15 fotos de Premiación',
        ]);
      });

      it('lleva los mismos atributos de analítica que el chip y no emite nada por su cuenta', async () => {
        const user = userEvent.setup();
        const emit = vi.fn();
        (window as TestWindow).__trochaEmit = emit;
        renderGallery();

        const enter = screen.getByRole('button', { name: ENTER_MANGA });
        const chip = screen.getByRole('button', { name: MANGA_CHIP });
        expect(enter).toHaveAttribute('data-analytics-event', 'gallery_filter');
        expect(enter).toHaveAttribute('data-analytics-content-id', 'manga-1');
        expect(enter.getAttribute('data-analytics-event')).toBe(
          chip.getAttribute('data-analytics-event'),
        );
        expect(enter.getAttribute('data-analytics-content-id')).toBe(
          chip.getAttribute('data-analytics-content-id'),
        );

        // Los clics los cuenta la delegación de `Analytics.astro`: emitir aquí duplicaría el evento.
        await user.click(enter);
        expect(emit).not.toHaveBeenCalled();
      });

      it('al pulsarlo aplica el filtro de esa categoría exactamente como su chip', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ASTRO_STATE, '', '/pagina#otro');
        const replace = vi.spyOn(window.history, 'replaceState');
        const push = vi.spyOn(window.history, 'pushState');
        renderGallery();

        await user.click(screen.getByRole('button', { name: ENTER_MANGA }));

        expect(screen.getByRole('button', { name: MANGA_CHIP })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        expect(screen.getByRole('button', { name: TODAS_CHIP })).toHaveAttribute(
          'aria-pressed',
          'false',
        );
        expect(screen.getByText('52 fotos en Manga 1')).toBeInTheDocument();
        expect(
          screen.queryByRole('heading', { name: 'Antes de la salida' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Premiación' })).not.toBeInTheDocument();
        // `?manga=` por replaceState (sin empujar entradas) y con el estado y el hash intactos.
        expect(replace).toHaveBeenCalledWith(ASTRO_STATE, '', '/pagina?manga=manga-1#otro');
        expect(push).not.toHaveBeenCalled();
        expect(window.history.state).toEqual(ASTRO_STATE);
        // Ya es la vista de una categoría: el botón de entrada cede su lugar a «Mostrar las N restantes».
        expect(enterButtons()).toHaveLength(0);
        expect(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        ).toBeInTheDocument();
      });

      it('el foco pasa a la primera foto de la manga, no se pierde con el botón', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: ENTER_MANGA }));

        expect(mangaTile(1)).toHaveFocus();
      });

      it('vuelve al inicio de los resultados si la persona estaba más abajo, como con un chip', async () => {
        const user = userEvent.setup();
        const scrollTo = vi.fn();
        vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
        const restoreScroll = stubScroll('scrollY', 1000);
        try {
          renderGallery();
          const bar = filterBar();
          const results = resultsOf();
          vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
            this: HTMLElement,
          ) {
            if (this === results) return { top: -500, bottom: 900 } as DOMRect;
            if (this === bar) return { top: 80, bottom: 180 } as DOMRect;
            return { top: 0, bottom: 0 } as DOMRect;
          });

          await user.click(screen.getByRole('button', { name: ENTER_MANGA }));

          // Hueco = -500 - 180 = -680 → 1000 - 680 - 8.
          expect(scrollTo).toHaveBeenCalledWith({ top: 312, behavior: 'auto' });
        } finally {
          restoreScroll();
        }
      });
    });

    describe('con una categoría elegida', () => {
      it('pinta 48 por manga y «Mostrar las N restantes» despliega el resto y mueve el foco', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));

        expect(mangaTiles()).toHaveLength(48);
        expect(enterButtons()).toHaveLength(0);

        await user.click(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        );

        expect(mangaTiles()).toHaveLength(52);
        expect(screen.queryByRole('button', { name: /Mostrar las/ })).not.toBeInTheDocument();
        // El botón desapareció: el foco pasa a la primera foto nueva, no se pierde.
        expect(mangaTile(49)).toHaveFocus();
      });

      it('una categoría de 48 fotos se ve completa, sin «Mostrar las N restantes»', async () => {
        const user = userEvent.setup();
        const photos = series('manga-1', 'manga-1', 48, 540);
        renderGallery({}, buildManifest({ groups: [GROUPS[1]], photos }));

        // En «Todas» se pintan 12 y el botón promete las 48.
        expect(screen.getAllByRole('button', { name: /foto \d+ de 48$/ })).toHaveLength(12);
        await user.click(
          screen.getByRole('button', { name: 'Ver las 48 fotos de Infantil A y B' }),
        );

        expect(screen.getAllByRole('button', { name: /foto \d+ de 48$/ })).toHaveLength(48);
        expect(screen.queryByRole('button', { name: /Mostrar las/ })).not.toBeInTheDocument();
      });

      it('con una sola foto por mostrar el botón va en singular y mueve el foco a esa foto', async () => {
        const user = userEvent.setup();
        const photos = series('manga-1', 'manga-1', 49, 540);
        renderGallery({}, buildManifest({ groups: [GROUPS[1]], photos }));
        await user.click(
          screen.getByRole('button', { name: 'Ver las 49 fotos de Infantil A y B' }),
        );

        const more = screen.getByRole('button', { name: 'Mostrar la foto restante de Manga 1' });
        // Lo visible es «Mostrar la foto restante»; la manga va solo para el lector de pantalla.
        expect(more.firstChild?.textContent).toBe('Mostrar la foto restante');
        expect(more.querySelector('.sr-only')).toHaveTextContent('de Manga 1');
        expect(screen.queryByRole('button', { name: /Mostrar las/ })).not.toBeInTheDocument();

        await user.click(more);

        expect(screen.getAllByRole('button', { name: /foto \d+ de 49$/ })).toHaveLength(49);
        expect(screen.queryByRole('button', { name: /Mostrar/ })).not.toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 49 de 49' }),
        ).toHaveFocus();
      });

      it('con dos fotos por mostrar el botón sigue en plural', async () => {
        const user = userEvent.setup();
        const photos = series('manga-1', 'manga-1', 50, 540);
        renderGallery({}, buildManifest({ groups: [GROUPS[1]], photos }));
        await user.click(
          screen.getByRole('button', { name: 'Ver las 50 fotos de Infantil A y B' }),
        );

        const more = screen.getByRole('button', { name: 'Mostrar las 2 restantes de Manga 1' });
        expect(more.firstChild?.textContent).toBe('Mostrar las 2 restantes');
        expect(screen.queryByText(/Mostrar la foto restante/)).not.toBeInTheDocument();
      });

      it('el filtro que llega por ?manga= también arranca en 48', async () => {
        window.history.replaceState(null, '', '/?manga=manga-1');
        renderGallery();

        await waitFor(() => expect(mangaTiles()).toHaveLength(48));
        expect(enterButtons()).toHaveLength(0);
        expect(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        ).toBeInTheDocument();
      });
    });

    describe('lo desplegado vale solo para la vista en que se hizo', () => {
      it('las restantes pedidas en una categoría no alargan «Todas» ni la próxima vez que se entra', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));
        await user.click(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        );
        expect(mangaTiles()).toHaveLength(52);

        await user.click(screen.getByRole('button', { name: TODAS_CHIP }));
        expect(mangaTiles()).toHaveLength(12);
        expect(enterButtons()).toHaveLength(1);

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));
        expect(mangaTiles()).toHaveLength(48);
      });

      it('pulsar otra vez la categoría activa no pliega lo que ya se desplegó', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));
        await user.click(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        );
        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));

        expect(mangaTiles()).toHaveLength(52);
      });

      it('lo que desplegó el visor en «Todas» no alarga la categoría', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(mangaTile(12));
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Escape}');
        expect(mangaTiles()).toHaveLength(52);

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));
        expect(mangaTiles()).toHaveLength(48);
      });
    });

    describe('el visor más allá del tope', () => {
      it('en «Todas» recorre también lo que la rejilla no pinta y, al pasar de la foto 12, despliega la manga', async () => {
        const user = userEvent.setup();
        renderGallery();
        expect(
          screen.queryByRole('button', { name: 'Manga 1, Infantil A y B: foto 13 de 52' }),
        ).not.toBeInTheDocument();

        await user.click(mangaTile(12));
        await user.keyboard('{ArrowRight}');

        // La foto 13 no estaba en la rejilla y el contador sigue contando las 66.
        const dialog = screen.getByRole('dialog');
        expect(
          within(dialog).getByRole('img', { name: 'Manga 1, Infantil A y B: foto 13 de 52' }),
        ).toBeInTheDocument();
        expect(within(dialog).getByText('19 / 66')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        // Existe la miniatura a la que vuelve el foco y la manga ya no pide su botón.
        expect(mangaTile(13)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(52);
        expect(enterButtons()).toHaveLength(0);
        // Desplegada pasa de la rejilla de muestra a filas justificadas; las demás mangas
        // siguen en rejilla.
        expect(groupList('Infantil A y B')).toHaveClass('flex-wrap');
        expect(groupList('Infantil A y B')).not.toHaveClass('grid');
        expect(groupList('Antes de la salida')).toHaveClass('grid');
      });

      it('en «Todas», mientras no pase de la foto 12 la manga sigue plegada', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(mangaTile(1));
        await user.keyboard('{ArrowRight}'.repeat(11));
        expect(within(screen.getByRole('dialog')).getByText('18 / 66')).toBeInTheDocument();
        await user.keyboard('{Escape}');

        expect(mangaTile(12)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(12);
        expect(enterButtons()).toHaveLength(1);
      });

      it('con una categoría elegida, al pasar de la foto 48 despliega la manga: la miniatura existe al cerrar', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));
        await user.click(mangaTile(1));
        await user.keyboard('{ArrowLeft}');
        expect(within(screen.getByRole('dialog')).getByText('52 / 52')).toBeInTheDocument();
        await user.keyboard('{Escape}');

        expect(mangaTile(52)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(52);
        expect(screen.queryByRole('button', { name: /Mostrar las/ })).not.toBeInTheDocument();
      });

      it('con una categoría elegida, la foto 48 todavía no despliega y la 49 sí', async () => {
        const user = userEvent.setup();
        renderGallery();
        await user.click(screen.getByRole('button', { name: MANGA_CHIP }));

        await user.click(mangaTile(1));
        await user.keyboard('{ArrowRight}'.repeat(47));
        await user.keyboard('{Escape}');
        expect(mangaTile(48)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(48);
        expect(
          screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
        ).toBeInTheDocument();

        await user.click(mangaTile(48));
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{Escape}');
        expect(mangaTile(49)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(52);
      });

      it('un enlace directo a una foto más allá del tope despliega su manga para devolverle el foco', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ASTRO_STATE, '', '/#foto-manga-1-30');
        renderGallery();

        await screen.findByRole('dialog');
        await user.keyboard('{Escape}');

        expect(mangaTile(30)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(52);
      });

      it('si el enlace a una foto quita el filtro activo, su manga queda desplegada al cerrar', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(screen.getByRole('button', { name: 'Premiación: 8 fotos' }));
        act(() => {
          window.history.pushState(null, '', '#foto-manga-1-30');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        });

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('36 / 66')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        await waitFor(() => expect(window.location.hash).toBe(''));

        expect(screen.getByRole('button', { name: TODAS_CHIP })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        expect(mangaTile(30)).toHaveFocus();
        expect(mangaTiles()).toHaveLength(52);
      });
    });
  });

  // ─── Barra de filtros ────────────────────────────────────────────────────────

  describe('barra de filtros', () => {
    it('un chip «Todas» y uno por grupo, con conteo; «Todas» arranca activo', () => {
      renderGallery();

      const group = screen.getByRole('group', { name: 'Filtrar por categoría' });
      const chips = within(group)
        .getAllByRole('button')
        .map((chip) => [
          chip.firstChild?.textContent,
          chip.lastElementChild?.textContent,
          chip.getAttribute('aria-label'),
          chip.getAttribute('aria-pressed'),
          (chip as HTMLElement).className.includes('min-h-11'),
        ]);
      // El texto es la categoría (no «Manga 1»); el conteo va en una insignia aparte
      // y el lector de pantalla oye la manga y la categoría completas.
      expect(chips).toEqual([
        ['Todas', '66', 'Todas las fotos: 66 fotos', 'true', true],
        ['Antes de la salida', '6', 'Antes de la salida: 6 fotos', 'false', true],
        ['Infantil A y B', '52', 'Manga 1 · Infantil A y B: 52 fotos', 'false', true],
        ['Premiación', '8', 'Premiación: 8 fotos', 'false', true],
      ]);
      expect(screen.getByText('66 fotos en toda la jornada')).toBeInTheDocument();
    });

    it('el chip usa el texto corto del manifest cuando existe', () => {
      const groups = GROUPS.map((item) =>
        item.id === 'manga-1' ? { ...item, chip: 'Infantil' } : item,
      );
      renderGallery({}, buildManifest({ groups }));

      const chip = screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' });
      expect(chip.firstChild?.textContent).toBe('Infantil');
      expect(chip).toHaveAttribute('title', 'Manga 1 · Infantil A y B');
    });

    it('la barra es el ancla #filtros y respeta la altura del encabezado', () => {
      renderGallery();

      const bar = filterBar();
      expect(bar).toHaveAttribute('id', 'filtros');
      expect(bar).toContainElement(screen.getByRole('group', { name: 'Filtrar por categoría' }));
      expect(bar.className).toContain('scroll-mt-[var(--header-h,4rem)]');
      // Sangra hasta el borde (las fotos pasan por debajo al bajar): si solo cubriera la columna,
      // a los lados asomarían las fotos.
      expect(bar).toHaveClass('sticky', '-mx-4', 'px-4');
    });

    it('la barra es opaca: sin transparencia ni desenfoque que dejen ver las fotos detrás', () => {
      renderGallery();

      const bar = filterBar();
      // El papel de la sección (`--valida-papel`, opaco) y, fuera de ella, la superficie elevada.
      expect(bar).toHaveClass('bg-[var(--valida-papel,var(--color-surface-raised))]');
      expect(bar.className).not.toMatch(/bg-surface-raised\/|backdrop-blur/);
    });

    it('es una sola fila: los chips ocupan la fila entera', () => {
      renderGallery();

      const chips = screen.getByRole('group', { name: 'Filtrar por categoría' });
      const row = chips.parentElement as HTMLElement;
      expect(row).toHaveClass('flex', 'items-center');
      expect(row.children).toHaveLength(1);
      expect(filterBar().firstElementChild).toBe(row);
      // El carrusel ocupa la fila sin ensancharla.
      expect(chips).toHaveClass('min-w-0', 'flex-1', 'overflow-x-auto');
      expect(screen.queryByRole('search')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('al elegir un chip escribe ?manga= en la URL y conserva history.state y el hash', async () => {
      const user = userEvent.setup();
      window.history.replaceState(ASTRO_STATE, '', '/pagina#otro');
      renderGallery();

      await user.click(screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }));
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        '/pagina?manga=manga-1#otro',
      );
      expect(window.history.state).toEqual(ASTRO_STATE);

      await user.click(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' }));
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        '/pagina#otro',
      );
      expect(window.history.state).toEqual(ASTRO_STATE);
    });

    it('los chips son botones con aria-pressed y llevan los atributos de analítica', () => {
      renderGallery();

      const todas = screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' });
      expect(todas).toHaveAttribute('data-analytics-event', 'gallery_filter');
      expect(todas).toHaveAttribute('data-analytics-content-id', 'todas');
      const manga = screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' });
      expect(manga).toHaveAttribute('data-analytics-event', 'gallery_filter');
      expect(manga).toHaveAttribute('data-analytics-content-id', 'manga-1');
      expect(manga).toHaveAttribute('title', 'Manga 1 · Infantil A y B');
    });

    it('un chip filtra la rejilla, marca aria-pressed y actualiza la línea de resultado', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }));

      expect(
        screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.getByText('52 fotos en Manga 1')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Antes de la salida' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Premiación' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' }));
      expect(screen.getByRole('heading', { name: 'Premiación' })).toBeInTheDocument();
    });

    it('vuelve al inicio de los resultados si la persona estaba más abajo', async () => {
      const user = userEvent.setup();
      const scrollTo = vi.fn();
      vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
      const restoreScroll = stubScroll('scrollY', 1000);
      try {
        renderGallery();

        const bar = filterBar();
        const results = resultsOf();
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
          this: HTMLElement,
        ) {
          if (this === results) return { top: -500, bottom: 900 } as DOMRect;
          if (this === bar) return { top: 80, bottom: 180 } as DOMRect;
          return { top: 0, bottom: 0 } as DOMRect;
        });

        await user.click(
          screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }),
        );

        // Hueco = -500 - 180 = -680 → 1000 - 680 - 8.
        expect(scrollTo).toHaveBeenCalledWith({ top: 312, behavior: 'auto' });
      } finally {
        restoreScroll();
      }
    });

    it('no se desplaza si el inicio de los resultados ya está a la vista', async () => {
      const user = userEvent.setup();
      const scrollTo = vi.fn();
      vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
      renderGallery();

      await user.click(screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }));

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('centra el chip activo en el carrusel cuando el filtro cambia', async () => {
      const user = userEvent.setup();
      const scrollTo = vi.fn();
      Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
        value: scrollTo,
        configurable: true,
        writable: true,
      });
      try {
        renderGallery();
        await user.click(screen.getByRole('button', { name: 'Premiación: 8 fotos' }));
        expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
      } finally {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
      }
    });
  });

  // ─── Analítica ───────────────────────────────────────────────────────────────

  describe('analítica de las fotos vistas', () => {
    it('emite photo_view una vez por foto mostrada: miniatura, flechas y cierre/reapertura', async () => {
      const user = userEvent.setup();
      const emit = vi.fn();
      (window as TestWindow).__trochaEmit = emit;
      renderGallery();

      await user.click(firstPhotoButton());
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenLastCalledWith('photo_view', { content_id: 'previa-01' });

      await user.keyboard('{ArrowRight}');
      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenLastCalledWith('photo_view', { content_id: 'previa-02' });

      await user.keyboard('{ArrowLeft}');
      expect(emit).toHaveBeenLastCalledWith('photo_view', { content_id: 'previa-01' });
      expect(emit).toHaveBeenCalledTimes(3);

      await user.keyboard('{Escape}');
      await user.click(firstPhotoButton());
      expect(emit).toHaveBeenCalledTimes(4);
    });

    it('un re-render del visor (aviso de compartir) no repite photo_view', async () => {
      const user = userEvent.setup();
      const emit = vi.fn();
      (window as TestWindow).__trochaEmit = emit;
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      renderGallery();

      await user.click(firstPhotoButton());
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
      );
      expect(await screen.findByText('Enlace copiado')).toBeInTheDocument();

      expect(emit.mock.calls.filter(([name]) => name === 'photo_view')).toHaveLength(1);
    });

    it('una foto pedida por #foto- al cargar también cuenta, y no se emite sin visor', () => {
      const emit = vi.fn();
      (window as TestWindow).__trochaEmit = emit;
      const { unmount } = renderGallery();
      expect(emit).not.toHaveBeenCalled();
      unmount();

      window.history.replaceState(null, '', '/#foto-manga-1-03');
      renderGallery();
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emit).toHaveBeenCalledWith('photo_view', { content_id: 'manga-1-03' });
    });

    it('el botón atrás que reabre una foto por popstate la cuenta', async () => {
      const user = userEvent.setup();
      const emit = vi.fn();
      (window as TestWindow).__trochaEmit = emit;
      renderGallery();

      window.history.pushState(null, '', '#foto-premiacion-02');
      await act(async () => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(emit).toHaveBeenCalledWith('photo_view', { content_id: 'premiacion-02' });
      await user.keyboard('{Escape}');
    });
  });

  // ─── Filtro inicial desde la URL ─────────────────────────────────────────────

  describe('filtro inicial desde la URL', () => {
    it('?manga=… se aplica al montar', async () => {
      window.history.replaceState(null, '', '/?manga=manga-1');
      renderGallery();

      await waitFor(() => expect(screen.getByText('52 fotos en Manga 1')).toBeInTheDocument());
      expect(
        screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }),
      ).toHaveAttribute('aria-pressed', 'true');
    });

    it('ignora una manga que no existe o que no tiene fotos', async () => {
      window.history.replaceState(null, '', '/?manga=manga-9');
      const { unmount } = renderGallery();
      expect(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      unmount();

      // Existe en el manifest pero no tiene fotos: no hay chip para quitar el filtro.
      window.history.replaceState(null, '', '/?manga=vacia');
      renderGallery(
        {},
        buildManifest({
          groups: [
            ...GROUPS,
            { id: 'vacia', label: 'Manga vacía', categories: [], description: '' },
          ],
        }),
      );
      expect(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  // ─── Visor ───────────────────────────────────────────────────────────────────

  describe('visor', () => {
    it('monta el diálogo en document.body, fuera del contenedor de la isla', async () => {
      const user = userEvent.setup();
      const { container } = renderGallery();

      await user.click(firstPhotoButton());

      const dialog = screen.getByRole('dialog', { name: 'Visor de fotos' });
      expect(container.contains(dialog)).toBe(false);
      expect(dialog.parentElement!.parentElement).toBe(document.body);
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('muestra la foto web con su texto alternativo, el contador, el grupo y la hora', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(
        screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 3 de 52' }),
      );

      const dialog = screen.getByRole('dialog');
      const image = within(dialog).getByRole('img', {
        name: 'Manga 1, Infantil A y B: foto 3 de 52',
      });
      expect(image).toHaveAttribute('src', `${BASE}/web/manga-1-03.webp`);
      expect(within(dialog).getByText('9 / 66')).toBeInTheDocument();
      expect(within(dialog).getByText('Manga 1 · Infantil A y B')).toBeInTheDocument();
      expect(within(dialog).getByText(/9:02 a\. m\./)).toBeInTheDocument();
    });

    it('la miniatura ya cargada sirve de fondo mientras llega la versión web, que entra con fundido', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());

      const dialog = screen.getByRole('dialog');
      const web = within(dialog).getByRole('img', { name: 'Antes de la salida: foto 1 de 6' });
      const thumb = web.previousElementSibling as HTMLImageElement;
      expect(thumb).toHaveAttribute('src', `${BASE}/thumb/previa-01.webp`);
      expect(thumb).toHaveAttribute('aria-hidden', 'true');
      expect(web).toHaveClass('opacity-0');

      fireEvent.load(web);
      expect(web).toHaveClass('opacity-100');
    });

    it('si la foto no carga, avisa y deja descargar el original', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      const dialog = screen.getByRole('dialog');
      fireEvent.error(within(dialog).getByRole('img', { name: 'Antes de la salida: foto 1 de 6' }));

      expect(within(dialog).getByText(/No pudimos cargar la foto completa/)).toBeInTheDocument();
      expect(within(dialog).getByRole('link', { name: /Descargar original/ })).toBeInTheDocument();
    });

    it('bloquea el scroll de la página mientras está abierto y lo devuelve al cerrar', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      expect(document.body.style.overflow).toBe('hidden');

      await user.keyboard('{Escape}');
      expect(document.body.style.overflow).toBe('');
    });

    it('compensa el ancho de la barra de scroll para que el contenido no salte', async () => {
      const user = userEvent.setup();
      Object.defineProperty(document.documentElement, 'clientWidth', {
        value: window.innerWidth - 15,
        configurable: true,
      });
      try {
        renderGallery();
        await user.click(firstPhotoButton());
        expect(document.body.style.paddingRight).toBe('15px');

        await user.keyboard('{Escape}');
        expect(document.body.style.paddingRight).toBe('');
      } finally {
        Reflect.deleteProperty(document.documentElement, 'clientWidth');
      }
    });

    it('deja inerte el resto de la isla mientras el visor está abierto', async () => {
      const user = userEvent.setup();
      const { container } = renderGallery();
      const root = container.firstElementChild as HTMLElement;
      expect(root).not.toHaveAttribute('inert');

      await user.click(firstPhotoButton());
      expect(root).toHaveAttribute('inert');

      await user.keyboard('{Escape}');
      expect(root).not.toHaveAttribute('inert');
    });

    it('precarga la versión web de la foto anterior y la siguiente', async () => {
      const user = userEvent.setup();
      const loaded: string[] = [];
      class FakeImage {
        decoding = '';
        set src(value: string) {
          loaded.push(value);
        }
      }
      vi.stubGlobal('Image', FakeImage);
      renderGallery();

      await user.click(firstPhotoButton());

      // La anterior a la primera es la última de todas (el recorrido es circular).
      expect(loaded).toEqual(
        expect.arrayContaining([`${BASE}/web/previa-02.webp`, `${BASE}/web/premiacion-08.webp`]),
      );
    });

    it('con una sola foto no hay anterior ni siguiente y las flechas no hacen nada', async () => {
      const user = userEvent.setup();
      renderGallery(
        {},
        buildManifest({ groups: [GROUPS[0]], photos: [photo('previa-01', 'previa', 480)] }),
      );

      await user.click(screen.getByRole('button', { name: 'Antes de la salida: foto 1 de 1' }));
      const dialog = screen.getByRole('dialog');

      expect(
        within(dialog).queryByRole('button', { name: 'Foto anterior' }),
      ).not.toBeInTheDocument();
      expect(
        within(dialog).queryByRole('button', { name: 'Foto siguiente' }),
      ).not.toBeInTheDocument();
      await user.keyboard('{ArrowRight}');
      expect(within(dialog).getByText('1 / 1')).toBeInTheDocument();
    });

    describe('cierre', () => {
      it('con el botón cerrar', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(screen.getByRole('button', { name: 'Cerrar visor' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('con Escape', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{Escape}');

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('con un clic fuera del diálogo, pero no dentro de él', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        await user.click(within(dialog).getByText('1 / 66'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        await user.click(dialog.parentElement!);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('con un toque en el fondo negro alrededor de la foto, pero no sobre la foto ni sobre un botón', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const web = within(dialog).getByRole('img', { name: 'Antes de la salida: foto 1 de 6' });
        const stage = web.parentElement!.parentElement as HTMLElement;
        // Escenario 400×300 con una foto 3:2 → la foto mide 400×266,7 y deja franjas arriba y abajo.
        stage.getBoundingClientRect = () =>
          ({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300 }) as DOMRect;

        fireEvent.click(stage, { clientX: 200, clientY: 150 });
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Foto siguiente' }), {
          clientX: 5,
          clientY: 5,
        });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(within(dialog).getByText('2 / 66')).toBeInTheDocument();

        fireEvent.click(stage, { clientX: 200, clientY: 4 });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('el foco vuelve a la miniatura que abrió el visor', async () => {
        const user = userEvent.setup();
        renderGallery();

        const opener = screen.getByRole('button', {
          name: 'Manga 1, Infantil A y B: foto 3 de 52',
        });
        await user.click(opener);
        await user.keyboard('{Escape}');

        expect(opener).toHaveFocus();
      });

      it('si se navegó, el foco vuelve a la miniatura de la última foto vista', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{ArrowRight}{ArrowRight}');
        await user.keyboard('{Escape}');

        expect(
          screen.getByRole('button', { name: 'Antes de la salida: foto 3 de 6' }),
        ).toHaveFocus();
      });

      it('si la miniatura de abrir ya no existe, el foco no se pierde en el vacío', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(
          screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }),
        );
        await user.click(
          screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 1 de 52' }),
        );
        await user.keyboard('{Escape}');

        expect(
          screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 1 de 52' }),
        ).toHaveFocus();
      });
    });

    describe('foco', () => {
      it('entra en el botón cerrar y queda atrapado dentro del diálogo', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const close = within(dialog).getByRole('button', { name: 'Cerrar visor' });
        expect(close).toHaveFocus();

        // Shift+Tab desde el primero salta al último; Tab desde el último vuelve al primero.
        await user.tab({ shift: true });
        const last = within(dialog).getByRole('link', { name: /WhatsApp/ });
        expect(last).toHaveFocus();
        await user.tab();
        expect(close).toHaveFocus();
      });

      it('recorre todos los controles en orden', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const order: string[] = [];
        for (let i = 0; i < 6; i += 1) {
          order.push(
            (document.activeElement as HTMLElement).getAttribute('aria-label') ??
              (document.activeElement as HTMLElement).textContent!.trim(),
          );
          await user.tab();
        }
        expect(order).toEqual([
          'Cerrar visor',
          'Foto anterior',
          'Foto siguiente',
          'Descargar original',
          'Compartir',
          'WhatsApp (se abre en una pestaña nueva)',
        ]);
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      it('si el foco se escapó del diálogo, Tab lo devuelve adentro', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        (document.activeElement as HTMLElement).blur();
        await user.tab();

        expect(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar visor' }),
        ).toHaveFocus();
      });
    });

    describe('navegación', () => {
      it('con las flechas del teclado, circular', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');

        await user.keyboard('{ArrowRight}');
        expect(within(dialog).getByText('2 / 66')).toBeInTheDocument();
        await user.keyboard('{ArrowLeft}');
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
        await user.keyboard('{ArrowLeft}');
        expect(within(dialog).getByText('66 / 66')).toBeInTheDocument();
        expect(within(dialog).getByText('Premiación')).toBeInTheDocument();
        await user.keyboard('{ArrowRight}');
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
      });

      it('con los botones anterior y siguiente', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        await user.click(within(dialog).getByRole('button', { name: 'Foto siguiente' }));
        expect(within(dialog).getByText('2 / 66')).toBeInTheDocument();
        await user.click(within(dialog).getByRole('button', { name: 'Foto anterior' }));
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
      });

      it('Alt+← y Cmd+← son «Atrás» del navegador: el visor no los toma', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        await user.keyboard('{Meta>}{ArrowRight}{/Meta}');

        expect(screen.getByText('1 / 66')).toBeInTheDocument();
      });

      it('con swipe horizontal de 50 px o más; menos, o en diagonal, no pasa de foto', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const stage = within(dialog).getByRole('img', { name: /foto 1 de 6/ }).parentElement!
          .parentElement as HTMLElement;
        const swipe = (fromX: number, toX: number, fromY = 100, toY = 100) => {
          fireEvent.touchStart(stage, { touches: [{ clientX: fromX, clientY: fromY }] });
          fireEvent.touchEnd(stage, { changedTouches: [{ clientX: toX, clientY: toY }] });
        };

        swipe(300, 200); // a la izquierda → siguiente
        expect(within(dialog).getByText('2 / 66')).toBeInTheDocument();
        swipe(100, 220); // a la derecha → anterior
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();

        swipe(300, 270); // 30 px: no alcanza
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
        swipe(300, 200, 100, 320); // más vertical que horizontal
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
      });

      it('ignora los gestos de dos dedos (zoom) y los toques cancelados', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const stage = within(dialog).getByRole('img', { name: /foto 1 de 6/ }).parentElement!
          .parentElement as HTMLElement;

        fireEvent.touchStart(stage, {
          touches: [
            { clientX: 300, clientY: 100 },
            { clientX: 100, clientY: 100 },
          ],
        });
        fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100, clientY: 100 }] });
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();

        fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 100 }] });
        fireEvent.touchCancel(stage);
        fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100, clientY: 100 }] });
        expect(within(dialog).getByText('1 / 66')).toBeInTheDocument();
      });

      it('recorre solo el filtro activo, no todas las fotos', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(
          screen.getByRole('button', { name: 'Manga 1 · Infantil A y B: 52 fotos' }),
        );
        await user.click(
          screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 1 de 52' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('1 / 52')).toBeInTheDocument();

        await user.keyboard('{ArrowLeft}');
        // Da la vuelta dentro de la manga 1, no pasa a la «Antes de la salida».
        expect(within(dialog).getByText('52 / 52')).toBeInTheDocument();
        expect(within(dialog).getByText('Manga 1 · Infantil A y B')).toBeInTheDocument();
        await user.keyboard('{ArrowRight}');
        expect(within(dialog).getByText('1 / 52')).toBeInTheDocument();
      });
    });

    describe('acciones', () => {
      it('«Descargar original» es un enlace con download y atributos de analítica', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());

        const link = within(screen.getByRole('dialog')).getByRole('link', {
          name: /Descargar original/,
        });
        expect(link).toHaveAttribute('href', `${BASE}/original/previa-01.jpg`);
        expect(link).toHaveAttribute('download', 'copa-valle-yumbo-2026-previa-01.jpg');
        expect(link).toHaveAttribute('data-analytics-event', 'photo_download');
        expect(link).toHaveAttribute('data-analytics-content-id', 'previa-01');
      });

      it('los dos botones de compartir llevan la foto y el método para la analítica', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = within(screen.getByRole('dialog'));

        const native = dialog.getByRole('button', { name: 'Compartir' });
        expect(native).toHaveAttribute('data-analytics-event', 'photo_share');
        expect(native).toHaveAttribute('data-analytics-content-id', 'previa-01');
        // Sin `navigator.share` el código copia, pero el método sigue siendo «native».
        expect(native).toHaveAttribute('data-analytics-method', 'native');
        const whatsapp = dialog.getByRole('link', { name: /WhatsApp/ });
        expect(whatsapp).toHaveAttribute('data-analytics-content-id', 'previa-01');
        expect(whatsapp).toHaveAttribute('data-analytics-method', 'whatsapp');
      });

      it('el crédito del visor nombra al fotógrafo y a los aliados, sin enlaces', async () => {
        const user = userEvent.setup();
        renderGallery({ photographerName: 'Estudio Ejemplo', allyCount: 5 });

        await user.click(firstPhotoButton());

        const dialog = screen.getByRole('dialog');
        const credit = within(dialog).getByText(
          'Foto: Estudio Ejemplo. Gratis gracias a 5 aliados de la válida.',
        );
        expect(credit.tagName).toBe('P');
        expect(credit.className).toContain('text-white/70');
        expect(credit.querySelector('a')).toBeNull();
      });

      it('el crédito acepta solo fotógrafo, solo aliados (singular) o ninguno', async () => {
        const user = userEvent.setup();
        const { unmount } = renderGallery({ photographerName: 'Estudio Ejemplo', allyCount: 0 });
        await user.click(firstPhotoButton());
        expect(screen.getByText('Foto: Estudio Ejemplo.')).toBeInTheDocument();
        expect(screen.queryByText(/Gratis gracias/)).not.toBeInTheDocument();
        unmount();

        const second = renderGallery({ allyCount: 1 });
        await user.click(firstPhotoButton());
        expect(screen.getByText('Gratis gracias a 1 aliado de la válida.')).toBeInTheDocument();
        second.unmount();

        renderGallery();
        await user.click(firstPhotoButton());
        expect(screen.queryByText(/Gratis gracias|Foto: /)).not.toBeInTheDocument();
      });

      it('el enlace de descarga sigue a la foto que se está viendo', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{ArrowRight}');

        const link = within(screen.getByRole('dialog')).getByRole('link', {
          name: /Descargar original/,
        });
        expect(link).toHaveAttribute('href', `${BASE}/original/previa-02.jpg`);
        expect(link).toHaveAttribute('download', 'copa-valle-yumbo-2026-previa-02.jpg');
        expect(link).toHaveAttribute('data-analytics-content-id', 'previa-02');
      });

      it('compartir sin navigator.share copia el enlace con UTM y avisa «Enlace copiado»', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        renderGallery();

        await user.click(firstPhotoButton());
        const dialog = screen.getByRole('dialog');
        const share = within(dialog).getByRole('button', { name: 'Compartir' });
        expect(share).toHaveAttribute('data-analytics-event', 'photo_share');
        expect(share).toHaveAttribute('data-analytics-content-id', 'previa-01');
        await user.click(share);

        expect(writeText).toHaveBeenCalledTimes(1);
        const copied = new URL(writeText.mock.calls[0][0]);
        expect(copied.origin + copied.pathname).toBe(PAGE_URL);
        expect(copied.hash).toBe('#foto-previa-01');
        expect(copied.searchParams.get('utm_source')).toBe('compartir-nativo');
        expect(copied.searchParams.get('utm_campaign')).toBe('compartir-desde-web');
        expect(await within(dialog).findByText('Enlace copiado')).toBeInTheDocument();
        // El aviso vive en una región de estado para que lo lea el lector de pantalla.
        expect(
          within(dialog)
            .getAllByRole('status')
            .some((r) => r.textContent === 'Enlace copiado'),
        ).toBe(true);
      });

      it('el aviso desaparece solo', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );
        expect(await screen.findByText('Enlace copiado')).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(3000);
        });
        expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument();
      });

      it('el aviso no se queda pegado a la foto siguiente', async () => {
        const user = userEvent.setup();
        vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );
        expect(await screen.findByText('Enlace copiado')).toBeInTheDocument();

        await user.keyboard('{ArrowRight}');
        expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument();
      });

      it('si el portapapeles falla, dice qué hacer en vez de callar', async () => {
        const user = userEvent.setup();
        vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denegado'));
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );

        expect(
          await screen.findByText('No se pudo copiar. Copia el enlace de la barra de direcciones'),
        ).toBeInTheDocument();
      });

      it('con navigator.share lo llama con el título, el texto y la URL #foto-<id>', async () => {
        const user = userEvent.setup();
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'share', {
          value: share,
          configurable: true,
          writable: true,
        });
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{ArrowRight}');
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );

        expect(share).toHaveBeenCalledTimes(1);
        const payload = share.mock.calls[0][0] as { title: string; text: string; url: string };
        expect(payload.title).toBe(EVENT_TITLE);
        expect(payload.text).toBe(`Foto de la ${EVENT_TITLE}`);
        expect(payload.url.startsWith(PAGE_URL)).toBe(true);
        expect(payload.url.endsWith('#foto-previa-02')).toBe(true);
        expect(new URL(payload.url).searchParams.get('utm_source')).toBe('compartir-nativo');
        expect(writeText).not.toHaveBeenCalled();
        expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument();
      });

      it('si la persona cierra la hoja de compartir (AbortError) no se copia nada ni se avisa', async () => {
        const user = userEvent.setup();
        const share = vi.fn().mockRejectedValue(new DOMException('cancelado', 'AbortError'));
        Object.defineProperty(navigator, 'share', {
          value: share,
          configurable: true,
          writable: true,
        });
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );

        expect(share).toHaveBeenCalled();
        expect(writeText).not.toHaveBeenCalled();
        expect(screen.queryByText(/No se pudo copiar/)).not.toBeInTheDocument();
      });

      it('si navigator.share falla por otra razón, cae a copiar el enlace', async () => {
        const user = userEvent.setup();
        const share = vi
          .fn()
          .mockRejectedValue(new DOMException('no permitido', 'NotAllowedError'));
        Object.defineProperty(navigator, 'share', {
          value: share,
          configurable: true,
          writable: true,
        });
        const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
        renderGallery();

        await user.click(firstPhotoButton());
        await user.click(
          within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
        );

        expect(await screen.findByText('Enlace copiado')).toBeInTheDocument();
        expect(writeText).toHaveBeenCalledTimes(1);
      });

      it('el enlace de WhatsApp lleva el título y el enlace de la foto', async () => {
        const user = userEvent.setup();
        renderGallery();

        await user.click(firstPhotoButton());
        const link = within(screen.getByRole('dialog')).getByRole('link', { name: /WhatsApp/ });

        const href = link.getAttribute('href')!;
        expect(href.startsWith('https://wa.me/?text=')).toBe(true);
        const text = decodeURIComponent(href.slice('https://wa.me/?text='.length));
        expect(text.startsWith(`Mira esta foto de la ${EVENT_TITLE}: `)).toBe(true);
        expect(text).toContain(PAGE_URL);
        expect(text.endsWith('#foto-previa-01')).toBe(true);
        expect(text).toContain('utm_source=whatsapp');
        // El `#` viaja codificado: si no, WhatsApp cortaría el enlace antes de la foto.
        expect(href).toContain('%23foto-previa-01');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
        expect(link).toHaveAttribute('data-analytics-event', 'photo_share');
        expect(link).toHaveAttribute('data-analytics-content-id', 'previa-01');
        expect(link).toHaveAttribute('data-analytics-method', 'whatsapp');
      });

      it('la nota de iPhone solo aparece en iOS', async () => {
        const user = userEvent.setup();
        const { unmount } = renderGallery();
        await user.click(firstPhotoButton());
        expect(screen.queryByText(/En iPhone la foto queda en Archivos/)).not.toBeInTheDocument();
        unmount();

        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
          configurable: true,
        });
        renderGallery();
        await user.click(firstPhotoButton());
        expect(
          screen.getByText(
            'En iPhone la foto queda en Archivos; para guardarla en Fotos, mantén presionada la imagen.',
          ),
        ).toBeInTheDocument();
      });

      it('el iPad moderno, que se presenta como Mac, también recibe la nota', async () => {
        const user = userEvent.setup();
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
          configurable: true,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
        renderGallery();

        await user.click(firstPhotoButton());

        expect(screen.getByText(/En iPhone la foto queda en Archivos/)).toBeInTheDocument();
      });

      it('un Mac de verdad (sin pantalla táctil) no recibe la nota', async () => {
        const user = userEvent.setup();
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
          configurable: true,
        });
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
        renderGallery();

        await user.click(firstPhotoButton());

        expect(screen.queryByText(/En iPhone la foto queda en Archivos/)).not.toBeInTheDocument();
      });
    });
  });

  // ─── Historial y enlaces a una foto ──────────────────────────────────────────

  describe('historial y enlaces', () => {
    it('al abrir una foto, el hash queda en #foto-<id> y se agrega una entrada', async () => {
      const user = userEvent.setup();
      renderGallery();
      const before = window.history.length;

      await user.click(firstPhotoButton());

      expect(window.location.hash).toBe('#foto-previa-01');
      expect(window.history.length).toBe(before + 1);
      expect(window.history.state).toBeNull();
    });

    it('navegar entre fotos reemplaza el hash: no llena el historial con una entrada por foto', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      const afterOpen = window.history.length;
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');

      expect(window.location.hash).toBe('#foto-previa-04');
      expect(window.history.length).toBe(afterOpen);
    });

    it('cerrar con Escape devuelve el historial a como estaba (history.back)', async () => {
      const user = userEvent.setup();
      renderGallery();
      const back = vi.spyOn(window.history, 'back');

      await user.click(firstPhotoButton());
      await user.keyboard('{Escape}');

      expect(back).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(window.location.hash).toBe(''));
    });

    it('un doble cierre rápido no retrocede dos entradas', async () => {
      const user = userEvent.setup();
      renderGallery();
      const back = vi.spyOn(window.history, 'back');

      await user.click(firstPhotoButton());
      await user.keyboard('{Escape}');
      await user.keyboard('{Escape}');

      expect(back).toHaveBeenCalledTimes(1);
    });

    it('el botón atrás del navegador cierra el visor en vez de salir de la página', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      act(() => {
        window.history.back();
      });

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(window.location.hash).toBe('');
      expect(firstPhotoButton()).toHaveFocus();
    });

    describe('bajo el router de Astro (ClientRouter)', () => {
      const ROUTER_STATE = { index: 3, scrollX: 0, scrollY: 0 };

      let restoreScroll = () => {};
      afterEach(() => restoreScroll());

      it('la entrada del visor imita el estado del router y se le avisa con un popstate', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ROUTER_STATE, '', '/');
        restoreScroll = stubScroll('scrollY', 480);
        const router = vi.fn();
        window.addEventListener('popstate', router);
        try {
          renderGallery();
          await user.click(firstPhotoButton());

          // Sin esto, «atrás» le parece al router una transición completa de la misma página.
          expect(window.history.state).toEqual({ index: 4, scrollX: 0, scrollY: 480 });
          expect(window.location.hash).toBe('#foto-previa-01');
          expect(router).toHaveBeenCalledTimes(1);
          expect((router.mock.calls[0][0] as PopStateEvent).state).toEqual({
            index: 4,
            scrollX: 0,
            scrollY: 480,
          });
          // El aviso no se confunde con una navegación de la persona.
          expect(screen.getByText('1 / 66')).toBeInTheDocument();
          expect(screen.getAllByRole('dialog')).toHaveLength(1);
        } finally {
          window.removeEventListener('popstate', router);
        }
      });

      it('navegar entre fotos conserva ese estado y no avisa al router otra vez', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ROUTER_STATE, '', '/');
        renderGallery();
        await user.click(firstPhotoButton());
        const router = vi.fn();
        window.addEventListener('popstate', router);
        try {
          await user.keyboard('{ArrowRight}{ArrowRight}');

          expect(window.location.hash).toBe('#foto-previa-03');
          expect(window.history.state).toEqual({ index: 4, scrollX: 0, scrollY: 0 });
          expect(router).not.toHaveBeenCalled();
        } finally {
          window.removeEventListener('popstate', router);
        }
      });

      it('cerrar vuelve a la entrada de la página con su estado intacto', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ROUTER_STATE, '', '/');
        renderGallery();

        await user.click(firstPhotoButton());
        await user.keyboard('{Escape}');

        await waitFor(() => expect(window.location.hash).toBe(''));
        expect(window.history.state).toEqual(ROUTER_STATE);
      });

      it('el botón atrás cierra el visor y deja el estado de la página', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ROUTER_STATE, '', '/');
        renderGallery();
        await user.click(firstPhotoButton());

        act(() => {
          window.history.back();
        });

        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(window.history.state).toEqual(ROUTER_STATE);
        expect(firstPhotoButton()).toHaveFocus();
      });

      it('adelante reabre el visor (la entrada conserva su estado)', async () => {
        const user = userEvent.setup();
        window.history.replaceState(ROUTER_STATE, '', '/');
        renderGallery();
        await user.click(firstPhotoButton());
        await user.keyboard('{Escape}');
        await waitFor(() => expect(window.location.hash).toBe(''));

        act(() => {
          window.history.forward();
        });

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(window.history.state).toEqual({ index: 4, scrollX: 0, scrollY: 0 });
      });

      it('si el estado no es el del router (o no hay router) la entrada va sin estado y no se avisa a nadie', async () => {
        const user = userEvent.setup();
        const router = vi.fn();
        window.addEventListener('popstate', router);
        try {
          window.history.replaceState({ otra: 'cosa' }, '', '/');
          renderGallery();
          await user.click(firstPhotoButton());

          expect(window.history.state).toBeNull();
          expect(router).not.toHaveBeenCalled();
        } finally {
          window.removeEventListener('popstate', router);
        }
      });

      it('con un enlace directo, «atrás» a una URL sin foto cierra el visor aunque la entrada no la haya empujado él', async () => {
        window.history.replaceState(ROUTER_STATE, '', '/#foto-manga-1-03');
        renderGallery();
        await screen.findByRole('dialog');

        // Pasa, por ejemplo, tras recargar con el visor abierto y volver a la entrada de la página.
        window.history.replaceState(ROUTER_STATE, '', '/');
        act(() => {
          window.dispatchEvent(new PopStateEvent('popstate', { state: ROUTER_STATE }));
        });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('un popstate ajeno (otra página del sitio) con el visor cerrado no hace nada', () => {
      renderGallery();

      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: { index: 1 } }));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('adelante rehace el visor con la misma foto', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(
        screen.getByRole('button', { name: 'Manga 1, Infantil A y B: foto 3 de 52' }),
      );
      await user.keyboard('{Escape}');
      await waitFor(() => expect(window.location.hash).toBe(''));

      act(() => {
        window.history.forward();
      });

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('9 / 66')).toBeInTheDocument();
      expect(window.location.hash).toBe('#foto-manga-1-03');

      // La entrada reabierta con «adelante» es del visor: cerrar con la interfaz
      // vuelve atrás en vez de dejar una entrada huérfana con el hash puesto.
      const back = vi.spyOn(window.history, 'back');
      await user.keyboard('{Escape}');
      expect(back).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(window.location.hash).toBe(''));
    });

    it('al cargar con #foto-<id> abre esa foto sin empujar otra entrada', async () => {
      window.history.replaceState(ASTRO_STATE, '', '/#foto-manga-1-03');
      const before = window.history.length;
      renderGallery();

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('9 / 66')).toBeInTheDocument();
      expect(
        within(dialog).getByRole('img', { name: 'Manga 1, Infantil A y B: foto 3 de 52' }),
      ).toBeInTheDocument();
      expect(window.history.length).toBe(before);
    });

    it('al cerrar un enlace directo quita el hash sin borrar el estado de Astro', async () => {
      const user = userEvent.setup();
      window.history.replaceState(ASTRO_STATE, '', '/?utm_source=whatsapp#foto-manga-1-03');
      renderGallery();
      const back = vi.spyOn(window.history, 'back');

      await screen.findByRole('dialog');
      await user.keyboard('{ArrowRight}');
      // Navegar conserva el estado del router…
      expect(window.history.state).toEqual(ASTRO_STATE);
      expect(window.location.hash).toBe('#foto-manga-1-04');

      await user.keyboard('{Escape}');

      // …y cerrar no retrocede (la entrada es la de la carga) ni toca la query.
      expect(back).not.toHaveBeenCalled();
      expect(window.location.hash).toBe('');
      expect(window.location.search).toBe('?utm_source=whatsapp');
      expect(window.history.state).toEqual(ASTRO_STATE);
    });

    it('un enlace directo a una foto que no existe no abre nada', () => {
      window.history.replaceState(ASTRO_STATE, '', '/#foto-no-existe');
      renderGallery();

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('un enlace directo manda sobre ?manga=: la foto compartida es la que se quiso mostrar', async () => {
      window.history.replaceState(ASTRO_STATE, '', '/?manga=premiacion#foto-previa-02');
      renderGallery();

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('2 / 66')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('un enlace #foto-<id> pulsado dentro de la página abre la foto (hashchange)', async () => {
      renderGallery();

      act(() => {
        window.history.pushState(null, '', '#foto-manga-1-02');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('8 / 66')).toBeInTheDocument();
    });

    it('si la foto pedida no está en el filtro activo, se quita el filtro para mostrarla', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(screen.getByRole('button', { name: 'Premiación: 8 fotos' }));
      act(() => {
        window.history.pushState(null, '', '#foto-previa-03');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('3 / 66')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Todas las fotos: 66 fotos' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('un hash que no es de una foto no abre ni cierra nada', async () => {
      const user = userEvent.setup();
      renderGallery();

      act(() => {
        window.history.pushState(null, '', '#fotos');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(firstPhotoButton());
      act(() => {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('un hash editado a mano a otra foto cambia la que se ve', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      act(() => {
        window.history.replaceState(null, '', '#foto-previa-05');
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });

      expect(await screen.findByText('5 / 66')).toBeInTheDocument();
    });

    it('si el navegador rechaza pushState el visor abre igual y cierra sin retroceder', async () => {
      const user = userEvent.setup();
      vi.spyOn(window.history, 'pushState').mockImplementation(() => {
        throw new DOMException('límite excedido', 'SecurityError');
      });
      renderGallery();
      const back = vi.spyOn(window.history, 'back');

      await user.click(firstPhotoButton());
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(back).not.toHaveBeenCalled();
    });

    it('si replaceState lanza (Safari limita las llamadas) se sigue navegando', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());
      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
        throw new DOMException('límite excedido', 'SecurityError');
      });
      await user.keyboard('{ArrowRight}');

      expect(screen.getByText('2 / 66')).toBeInTheDocument();
    });

    it('retira los listeners del historial al desmontar', async () => {
      const user = userEvent.setup();
      const { unmount } = renderGallery();
      await user.click(firstPhotoButton());
      const remove = vi.spyOn(window, 'removeEventListener');

      unmount();

      expect(remove).toHaveBeenCalledWith('popstate', expect.any(Function));
      expect(remove).toHaveBeenCalledWith('hashchange', expect.any(Function));
    });
  });

  // ─── Estado vacío ────────────────────────────────────────────────────────────

  describe('estado vacío', () => {
    it('sin fotos muestra solo el panel: sin barra de filtros', () => {
      renderGallery(
        { emptyTitle: 'Las fotos llegan el martes', emptyBody: 'Estamos curándolas.' },
        buildManifest({ photos: [] }),
      );

      expect(screen.getByText('Las fotos llegan el martes')).toBeInTheDocument();
      expect(screen.getByText('Estamos curándolas.')).toBeInTheDocument();
      expect(
        screen.queryByRole('group', { name: 'Filtrar por categoría' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('usa un título por defecto y omite el cuerpo si no se da', () => {
      const { container } = renderGallery({}, buildManifest({ photos: [] }));

      expect(screen.getByText('Las fotos vienen pronto')).toBeInTheDocument();
      expect(container.querySelectorAll('p')).toHaveLength(1);
    });
  });

  // ─── Accesibilidad ───────────────────────────────────────────────────────────

  describe('accesibilidad', () => {
    it('la rejilla y la barra no tienen violaciones', async () => {
      const { container } = renderGallery();

      expect(await axe(container)).toHaveNoViolations();
    });

    it('la vista de una categoría, con «Mostrar las N restantes», tampoco', async () => {
      const user = userEvent.setup();
      const { container } = renderGallery();

      await user.click(screen.getByRole('button', { name: 'Ver las 52 fotos de Infantil A y B' }));
      expect(
        screen.getByRole('button', { name: 'Mostrar las 4 restantes de Manga 1' }),
      ).toBeInTheDocument();

      expect(await axe(container)).toHaveNoViolations();
    });

    it('el estado vacío no tiene violaciones', async () => {
      const { container } = renderGallery({}, buildManifest({ photos: [] }));

      expect(await axe(container)).toHaveNoViolations();
    });

    it('el visor abierto no tiene violaciones', async () => {
      const user = userEvent.setup();
      renderGallery();

      await user.click(firstPhotoButton());

      expect(await axe(screen.getByRole('dialog'))).toHaveNoViolations();
    });

    it('el visor con la nota de iOS y el aviso de «Enlace copiado» tampoco', async () => {
      const user = userEvent.setup();
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        configurable: true,
      });
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      renderGallery();

      await user.click(firstPhotoButton());
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Compartir' }),
      );
      await screen.findByText('Enlace copiado');

      expect(await axe(screen.getByRole('dialog'))).toHaveNoViolations();
    });
  });
});

/** Botón de una foto por su etiqueta exacta (para manifests de una sola foto). */
function firstPhotoButtonFor(label: string): HTMLElement {
  return screen.getByRole('button', { name: label });
}
