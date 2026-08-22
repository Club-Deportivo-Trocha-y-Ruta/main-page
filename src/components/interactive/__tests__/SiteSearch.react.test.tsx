import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import SiteSearch, {
  sectionLabelFor,
  type PagefindApi,
  type PagefindResultData,
} from '../SiteSearch';

// ─── Dobles de Pagefind ──────────────────────────────────────────────────
// Contenido ficticio: ningún nombre real de riders del club.

const FAKE_DATA: PagefindResultData[] = [
  {
    url: '/trocha-verde/arboles/guayacan-de-prueba/',
    excerpt: 'Un <mark>guayacán</mark> sembrado en el sendero de prueba.',
    meta: { title: 'Guayacán del sendero (ficticio)' },
  },
  {
    url: '/trocha-verde/especies/guayacan/',
    excerpt: 'Ficha de la especie <mark>guayacán</mark>.',
    meta: { title: 'Especie: guayacán' },
  },
  {
    url: '/noticias/salida-de-prueba/',
    excerpt: 'Crónica de una salida <mark>de prueba</mark>.',
    meta: { title: 'Crónica de prueba' },
  },
  {
    url: '/contacto/',
    excerpt: 'Escríbenos para <mark>saber</mark> más.',
    meta: { title: 'Contacto' },
  },
];

function makeApi(
  data: PagefindResultData[] = FAKE_DATA,
  options: { withDebounced?: boolean } = {},
) {
  const toResults = () => ({ results: data.map((d) => ({ data: () => Promise.resolve(d) })) });
  const search = vi.fn(async () => toResults());
  const api: PagefindApi = { search };
  if (options.withDebounced) {
    api.debouncedSearch = vi.fn(async () => toResults());
  }
  return { api, search };
}

/** El componente sin espera: los tests no dependen del reloj. */
function renderSearch(loadPagefind: () => Promise<PagefindApi>) {
  return render(<SiteSearch loadPagefind={loadPagefind} debounceMs={0} />);
}

async function openWithClick(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Buscar en el sitio' }));
  return screen.findByRole('dialog');
}

describe('SiteSearch', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  // ─── Disparador y apertura ─────────────────────────────────────────────

  it('renderiza el disparador y no monta el diálogo hasta abrirlo', () => {
    const { api } = makeApi();
    renderSearch(async () => api);

    const trigger = screen.getByRole('button', { name: 'Buscar en el sitio' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no carga Pagefind hasta que se abre el diálogo', async () => {
    const { api } = makeApi();
    const loadPagefind = vi.fn(async () => api);
    const user = userEvent.setup();
    renderSearch(loadPagefind);

    expect(loadPagefind).not.toHaveBeenCalled();

    await openWithClick(user);
    await waitFor(() => expect(loadPagefind).toHaveBeenCalledTimes(1));
  });

  it('abre el diálogo con el clic y deja el foco en el campo', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    const dialog = await openWithClick(user);
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('searchbox', { name: 'Buscar en el sitio' })).toHaveFocus();
  });

  // ─── Atajos de teclado globales ────────────────────────────────────────

  it('abre con Ctrl+K', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('abre con Meta+K', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('abre con "/" cuando el foco no está en un campo de texto', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await user.keyboard('/');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('ignora "/" mientras se escribe en otro campo', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Otro campo" />
        <SiteSearch loadPagefind={async () => api} debounceMs={0} />
      </>,
    );

    await user.click(screen.getByLabelText('Otro campo'));
    await user.keyboard('/');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ─── Cierre ────────────────────────────────────────────────────────────

  it('cierra con Escape y devuelve el foco al disparador', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Buscar en el sitio' })).toHaveFocus();
  });

  it('cierra al pulsar el botón de cerrar', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar buscador' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('bloquea el scroll del documento mientras está abierto', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });

  // ─── Trampa de foco ────────────────────────────────────────────────────

  it('mantiene el foco dentro del diálogo al tabular', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    const dialog = await openWithClick(user);

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await user.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  // ─── Búsqueda y agrupación ─────────────────────────────────────────────

  it('busca y agrupa los resultados por sección del sitio', async () => {
    const { api, search } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    expect(await screen.findByText('Trocha Verde · Árboles')).toBeInTheDocument();
    expect(screen.getByText('Trocha Verde')).toBeInTheDocument();
    expect(screen.getByText('Noticias')).toBeInTheDocument();
    expect(screen.getByText('Páginas')).toBeInTheDocument();

    expect(search).toHaveBeenCalledWith('guayacan');

    const link = screen.getByRole('option', { name: /Guayacán del sendero/ });
    expect(link).toHaveAttribute('href', '/trocha-verde/arboles/guayacan-de-prueba/');
  });

  it('pinta los grupos en el orden del sitio', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    await screen.findByText('Trocha Verde · Árboles');
    const labels = screen
      .getAllByText(/^(Trocha Verde · Árboles|Trocha Verde|Noticias|Páginas)$/)
      .map((el) => el.textContent);
    expect(labels).toEqual(['Trocha Verde · Árboles', 'Trocha Verde', 'Noticias', 'Páginas']);
  });

  it('usa debouncedSearch cuando el API la expone', async () => {
    const { api, search } = makeApi(FAKE_DATA, { withDebounced: true });
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    await waitFor(() => expect(api.debouncedSearch).toHaveBeenCalled());
    expect(search).not.toHaveBeenCalled();
  });

  it('no busca con menos de dos caracteres', async () => {
    const { api, search } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'g');

    expect(
      screen.getByText('Busca por nombre de árbol, especie, programa o crónica.'),
    ).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it('muestra el vacío cuando no hay coincidencias', async () => {
    const { api } = makeApi([]);
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'zzzz');

    // El mensaje sale dos veces: el visible y la copia de la región viva.
    const matches = await screen.findAllByText(/No encontramos resultados para «zzzz»/);
    const visible = matches.find((el) => !el.hasAttribute('aria-live'));
    expect(visible).toBeInTheDocument();
  });

  it('anuncia el vacío en la región viva, no solo en pantalla', async () => {
    const { api } = makeApi([]);
    const user = userEvent.setup();
    const { baseElement } = renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'zzzz');

    const live = baseElement.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    await waitFor(() => expect(live!.textContent).toMatch(/No encontramos resultados para «zzzz»/));
  });

  it('pinta el resaltado <mark> del extracto de Pagefind', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    const { baseElement } = renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    await screen.findByText('Trocha Verde · Árboles');
    expect(baseElement.querySelectorAll('.site-search-excerpt mark').length).toBeGreaterThan(0);
  });

  it('cae al título derivado de la URL cuando falta el metadato', async () => {
    const { api } = makeApi([{ url: '/programas/iniciacion/', excerpt: 'Programa de prueba.' }]);
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'programa');

    expect(await screen.findByText('/programas/iniciacion/')).toBeInTheDocument();
  });

  // ─── Navegación con teclado dentro de los resultados ───────────────────

  it('recorre los resultados con las flechas y los abre con Enter', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    const input = screen.getByRole('searchbox', { name: 'Buscar en el sitio' });
    await user.type(input, 'guayacan');

    const firstLink = await screen.findByRole('option', { name: /Guayacán del sendero/ });
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', firstLink.id));
    expect(firstLink.className).toContain('bg-primary/10');

    await user.keyboard('{ArrowDown}');
    const secondLink = screen.getByRole('option', { name: /Especie: guayacán/ });
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', secondLink.id));
    expect(secondLink.className).toContain('bg-primary/10');

    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', firstLink.id));

    const onClick = vi.fn((event: Event) => event.preventDefault());
    firstLink.addEventListener('click', onClick);
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('expone los resultados como listbox y marca la opción activa', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    const listbox = await screen.findByRole('listbox', { name: 'Resultados de la búsqueda' });
    const options = within(listbox).getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');

    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(options[1]).toHaveAttribute('aria-selected', 'true'));
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    // Siguen siendo enlaces reales: se abren en pestaña nueva y se copian.
    expect(options[0]).toHaveAttribute('href', '/trocha-verde/arboles/guayacan-de-prueba/');
  });

  it('lleva el foco al último y al primer resultado con End y Home', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    const input = screen.getByRole('searchbox', { name: 'Buscar en el sitio' });
    await user.type(input, 'guayacan');

    await screen.findByRole('option', { name: /Guayacán del sendero/ });
    const lastLink = screen.getByRole('option', { name: /Contacto/ });

    await user.keyboard('{End}');
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', lastLink.id));

    await user.keyboard('{Home}');
    const firstLink = screen.getByRole('option', { name: /Guayacán del sendero/ });
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', firstLink.id));
  });

  // ─── Sin índice (dev o build sin pagefind) ─────────────────────────────

  it('avisa cuando el índice no existe en vez de romperse', async () => {
    const user = userEvent.setup();
    render(
      <SiteSearch
        loadPagefind={async () => {
          throw new Error('404');
        }}
        debounceMs={0}
      />,
    );

    const dialog = await openWithClick(user);
    expect(
      await within(dialog).findByText(/El buscador se genera con el build del sitio/),
    ).toBeInTheDocument();

    // Y sigue usable: escribir no revienta ni muestra resultados fantasma.
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');
    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
  });

  it('no rompe si la búsqueda falla', async () => {
    const api: PagefindApi = {
      search: vi.fn(async () => {
        throw new Error('índice corrupto');
      }),
    };
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');

    const matches = await screen.findAllByText(/No encontramos resultados/);
    expect(matches.find((el) => !el.hasAttribute('aria-live'))).toBeInTheDocument();
  });

  // ─── Agrupación pura ───────────────────────────────────────────────────

  it('sectionLabelFor mapea cada prefijo a su rótulo', () => {
    expect(sectionLabelFor('/trocha-verde/arboles/uno/')).toBe('Trocha Verde · Árboles');
    expect(sectionLabelFor('/trocha-verde/')).toBe('Trocha Verde');
    expect(sectionLabelFor('/trocha-verde/especies/ceiba/')).toBe('Trocha Verde');
    expect(sectionLabelFor('/noticias/una-cronica/')).toBe('Noticias');
    expect(sectionLabelFor('/programas/')).toBe('Programas');
    expect(sectionLabelFor('/galeria/album/')).toBe('Galería');
    expect(sectionLabelFor('/calendario/')).toBe('Calendario');
    expect(sectionLabelFor('/quienes-somos/')).toBe('Páginas');
    // Prefijo estricto: una futura sección con el mismo comienzo no se cuela.
    expect(sectionLabelFor('/noticias-especiales/')).toBe('Páginas');
    // URL absoluta y .html también se normalizan.
    expect(sectionLabelFor('https://trochayruta.com/noticias/index.html')).toBe('Noticias');
  });

  // ─── Accesibilidad ─────────────────────────────────────────────────────

  it('no tiene violaciones de accesibilidad con resultados en pantalla', async () => {
    const { api } = makeApi();
    const user = userEvent.setup();
    renderSearch(async () => api);

    await openWithClick(user);
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en el sitio' }), 'guayacan');
    await screen.findByText('Trocha Verde · Árboles');

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
