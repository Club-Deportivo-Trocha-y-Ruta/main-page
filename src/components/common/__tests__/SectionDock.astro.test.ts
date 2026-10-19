import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import { EVENT_NAMES } from '@lib/events';
import SectionDock, { type DockItem } from '../SectionDock.astro';

/**
 * El índice flotante tiene dos formas en el mismo marcado: el riel (desde `lg`)
 * y la píldora con su lista (`<details>`) y el salto a la siguiente sección. Lo
 * que se mueve al bajar —sección actual, salto visible, tramos de avance— lo
 * decide el script en el navegador; aquí se fija lo que tiene que salir del
 * build para que todo eso funcione, y para que sin JS los enlaces sigan
 * llevando a cada sección.
 */

const ITEMS: DockItem[] = [
  { id: 'fotos', label: 'Fotos', icon: 'ph:camera-bold', count: 1980 },
  { id: 'aliados', label: 'Aliados', icon: 'ph:handshake-bold', count: 16 },
  { id: 'resultados', label: 'Resultados', icon: 'ph:trophy-bold' },
  { id: 'siguiente', label: 'Clase de prueba', icon: 'ph:bicycle-bold', count: null },
];

const hrefs = (links: Iterable<Element>) => [...links].map((a) => a.getAttribute('href'));
const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('SectionDock', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  async function render(props: { items: DockItem[]; heroId?: string; label?: string }) {
    const html = await container.renderToString(SectionDock, { props });
    return { html, doc: new JSDOM(html).window.document };
  }

  // ─── Estructura ─────────────────────────────────────────────────

  it('es un nav con nombre propio, «En esta página» si no se le da otro', async () => {
    const { doc } = await render({ items: ITEMS });
    expect(doc.querySelector('nav')?.getAttribute('aria-label')).toBe('En esta página');

    const custom = await render({ items: ITEMS, label: 'Secciones de la válida' });
    expect(custom.doc.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Secciones de la válida',
    );
  });

  it('el riel y la lista llevan un enlace por ítem, en el orden de la página', async () => {
    const { doc } = await render({ items: ITEMS });
    const expected = ITEMS.map((item) => `#${item.id}`);

    const rail = doc.querySelectorAll('[data-sdock-rail] a');
    expect(hrefs(rail)).toEqual(expected);

    const list = doc.querySelectorAll('[data-sdock-menu] ol a');
    expect(hrefs(list)).toEqual(expected);
  });

  it('cada enlace dice su sección con su etiqueta visible', async () => {
    const { doc } = await render({ items: ITEMS });
    for (const item of ITEMS) {
      const link = doc.querySelector(`[data-sdock-rail] a[href="#${item.id}"]`);
      expect(text(link), item.id).toContain(item.label);
    }
  });

  it('la lista móvil es un <details> nativo, sin el triángulo del navegador', async () => {
    const { doc } = await render({ items: ITEMS });
    const summary = doc.querySelector('details[data-sdock-menu] > summary');
    expect(summary).not.toBeNull();
    expect(summary!.className).toContain('list-none');
    expect(summary!.className).toContain('[&::-webkit-details-marker]:hidden');
  });

  // ─── Cifras ─────────────────────────────────────────────────────

  it('escribe las cifras con el separador de miles de Colombia', async () => {
    const { doc } = await render({ items: ITEMS });
    expect(text(doc.querySelector('[data-sdock-rail] a[href="#fotos"]'))).toContain('1.980');
    expect(text(doc.querySelector('[data-sdock-rail] a[href="#aliados"]'))).toContain('16');
  });

  it('sin cifra (ausente, null o cero) no pinta un número', async () => {
    const { doc } = await render({
      items: [...ITEMS, { id: 'cifras', label: 'Cifras', icon: 'ph:chart-bar-bold', count: 0 }],
    });
    for (const id of ['resultados', 'siguiente', 'cifras']) {
      const link = doc.querySelector(`[data-sdock-rail] a[href="#${id}"]`);
      expect(text(link), id).not.toMatch(/\d/);
    }
  });

  it('separa etiqueta y cifra para el lector de pantalla («Fotos, 1.980»)', async () => {
    const { doc } = await render({ items: ITEMS });
    const link = doc.querySelector('[data-sdock-rail] a[href="#fotos"]');
    expect(text(link)).toMatch(/^Fotos\s*,\s*1\.980$/);
    expect(link!.querySelector('.sr-only')?.textContent).toBe(', ');
  });

  // ─── Estado inicial (lo demás lo decide el script) ──────────────

  it('la píldora arranca con la etiqueta del índice y sin sección actual', async () => {
    const { doc } = await render({ items: ITEMS });
    const labels = [...doc.querySelectorAll('[data-sdock-current]')];
    expect(labels).toHaveLength(ITEMS.length + 1);

    const visible = labels.filter((label) => !label.hasAttribute('hidden'));
    expect(visible).toHaveLength(1);
    expect(visible[0].getAttribute('data-sdock-current')).toBe('');
    expect(text(visible[0])).toBe('En esta página');
    expect(doc.querySelector('[aria-current]')).toBeNull();
  });

  it('los saltos de un toque arrancan ocultos y la vuelta apunta a la primera sección', async () => {
    const { doc } = await render({ items: ITEMS });
    const jumps = [...doc.querySelectorAll('[data-sdock-next]')];
    expect(hrefs(jumps)).toEqual(ITEMS.map((item) => `#${item.id}`));
    for (const jump of jumps) expect(jump.hasAttribute('hidden')).toBe(true);

    const wrap = doc.querySelector('[data-sdock-wrap]');
    expect(wrap?.getAttribute('href')).toBe('#fotos');
    expect(wrap?.hasAttribute('hidden')).toBe(true);
    // El nombre accesible dice a dónde lleva, no solo la flecha.
    expect(text(wrap)).toBe('Volver a Fotos');
    expect(text(jumps[1])).toBe('Ir a Aliados');
  });

  it('la píldora ve la etiqueta corta; el riel y la lista, la completa; el lector de pantalla, siempre la completa', async () => {
    const items: DockItem[] = [
      ...ITEMS.slice(0, 3),
      {
        id: 'siguiente',
        label: 'Próxima válida',
        shortLabel: 'Próxima',
        icon: 'ph:flag-checkered-bold',
      },
    ];
    const { doc } = await render({ items });

    // Riel y lista: el nombre completo, sin rastro de la corta.
    for (const selector of ['[data-sdock-rail]', '[data-sdock-menu] ol']) {
      expect(text(doc.querySelector(`${selector} a[href="#siguiente"]`)), selector).toBe(
        'Próxima válida',
      );
    }

    // La mitad de la sección actual y el salto de un toque: ven «Próxima» y oyen «Próxima válida».
    const current = doc.querySelector('[data-sdock-current="siguiente"] .truncate')!;
    expect(current.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('Próxima');
    expect(current.querySelector('.sr-only')?.textContent).toBe('Estás en Próxima válida');

    const jump = doc.querySelector('[data-sdock-next="siguiente"] .truncate')!;
    expect(jump.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('Próxima');
    expect(jump.querySelector('.sr-only')?.textContent).toBe('Ir a Próxima válida');

    // Un ítem sin etiqueta corta queda como estaba: nada oculto al lector de pantalla.
    const plain = doc.querySelector('[data-sdock-next="aliados"] .truncate')!;
    expect(plain.querySelector('[aria-hidden]')).toBeNull();
    expect(text(plain)).toBe('Ir a Aliados');
  });

  it('la vuelta a la primera sección también usa su etiqueta corta', async () => {
    const { doc } = await render({
      items: [
        {
          id: 'inicio',
          label: 'Apertura de la válida',
          shortLabel: 'Inicio',
          icon: 'ph:flag-bold',
        },
        ...ITEMS.slice(1),
      ],
    });
    const wrap = doc.querySelector('[data-sdock-wrap] .truncate')!;
    expect(wrap.querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('Inicio');
    expect(wrap.querySelector('.sr-only')?.textContent).toBe('Volver a Apertura de la válida');
  });

  it('pasa la apertura al script por el DOM: el script es el mismo con cualquier prop', async () => {
    // Con `define:vars` el script cambiaría con cada página y, bajo
    // `ClientRouter`, perdería el re-arranque (ver `ScrollDepth.astro`).
    const { doc } = await render({ items: ITEMS, heroId: 'inicio' });
    expect(doc.querySelector('nav')?.getAttribute('data-sdock-hero')).toBe('inicio');

    const other = await render({ items: ITEMS.slice(1), label: 'Otra página' });
    expect(other.doc.querySelector('nav')?.hasAttribute('data-sdock-hero')).toBe(false);
    expect(other.doc.querySelector('script')?.textContent).toBe(
      doc.querySelector('script')?.textContent,
    );
    expect(doc.querySelector('script')?.textContent).not.toContain('inicio');
  });

  // ─── Analítica ──────────────────────────────────────────────────

  it('todo enlace emite page_nav_click con su sección destino y method «indice»', async () => {
    expect(EVENT_NAMES).toContain('page_nav_click');
    const { doc } = await render({ items: ITEMS });
    const links = [...doc.querySelectorAll('nav a')];
    // riel + lista + un salto por ítem + la vuelta a la primera
    expect(links).toHaveLength(ITEMS.length * 3 + 1);
    for (const link of links) {
      expect(link.getAttribute('data-analytics-event')).toBe('page_nav_click');
      expect(`#${link.getAttribute('data-analytics-content-id')}`).toBe(link.getAttribute('href'));
      // La franja y la apertura emiten el mismo evento con su propio `method`.
      expect(link.getAttribute('data-analytics-method')).toBe('indice');
    }
  });

  it('marca la sección actual con una regla fija, sin tramos de avance', async () => {
    const { doc, html } = await render({ items: ITEMS });
    for (const link of doc.querySelectorAll('[data-sdock-rail] a')) {
      expect(link.className).toContain('aria-[current=location]:after:bg-accent');
    }
    expect(html).not.toMatch(/sdock-(seg|line|fill)|--sdock-progress/);
  });

  // ─── Apilamiento y accesibilidad ────────────────────────────────

  it('flota abajo en z-30, por debajo de la cabecera, el menú y el visor', async () => {
    const { doc } = await render({ items: ITEMS });
    const nav = doc.querySelector('nav')!;
    expect(nav.className).toContain('fixed');
    expect(nav.className).toContain('z-30');
    expect(nav.className).not.toMatch(/\bz-(40|50|\[)/);
  });

  it('el anillo recorta la barra sobre las secciones grafito, que son de su mismo color', async () => {
    const { doc } = await render({ items: ITEMS });
    const bar = doc.querySelector('.sdock-bar')!;
    expect(bar.className).toContain('bg-surface-dark');
    expect(bar.className).toContain('ring-white/30');
    expect(doc.querySelector('.sdock-panel')!.className).toContain('ring-white/30');
  });

  it('los iconos son decorativos', async () => {
    const { doc } = await render({ items: ITEMS });
    const icons = [...doc.querySelectorAll('nav svg')];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  // ─── Cuándo no se pinta ─────────────────────────────────────────

  it('con menos de dos ítems no pinta nada: un índice de una sección no lleva a ningún lado', async () => {
    for (const items of [[], ITEMS.slice(0, 1)]) {
      const { doc } = await render({ items });
      expect(doc.querySelector('nav'), `${items.length} ítems`).toBeNull();
      expect(doc.querySelector('a'), `${items.length} ítems`).toBeNull();
    }
  });
});
