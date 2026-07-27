import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import EventCard from '../EventCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const baseProps = {
  title: 'Copa Valle XCO 2026',
  // Igual que en el frontmatter: medianoche UTC, formateada en UTC por el componente
  date: new Date('2026-04-15'),
  location: 'Ginebra, Valle del Cauca',
  category: 'xco',
  status: 'upcoming',
  href: '/calendario/copa-valle-xco-2026',
};

describe('EventCard', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Estructura básica ────────────────────────────────────

  it('renderiza un enlace <a> apuntando al href del evento', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/calendario/copa-valle-xco-2026');
  });

  it('muestra el título del evento', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    expect(html).toContain('Copa Valle XCO 2026');
  });

  it('muestra la ubicación del evento', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    expect(html).toContain('Ginebra, Valle del Cauca');
  });

  // ─── Renderizado de fecha ─────────────────────────────────

  it('muestra el día del mes de la fecha', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    expect(html).toContain('15');
  });

  it('formatea la fecha en UTC sin corrimiento de día', async () => {
    // Las fechas del frontmatter llegan como medianoche UTC; en zonas horarias
    // negativas (Colombia, UTC-5) formatear en local mostraría el día anterior.
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, date: new Date('2026-08-01') },
    });
    const doc = parseHtml(html);
    const daySpan = doc.querySelector('.font-display.text-xl');
    expect(daySpan?.textContent?.trim()).toBe('1');
  });

  it('muestra el rango de días en eventos de varias jornadas', async () => {
    const html = await container.renderToString(EventCard, {
      props: {
        ...baseProps,
        date: new Date('2026-08-01'),
        endDate: new Date('2026-08-02'),
      },
    });
    const doc = parseHtml(html);
    const daySpan = doc.querySelector('.font-display.text-xl');
    expect(daySpan?.textContent?.trim()).toBe('1-2');
  });

  it('muestra el mes abreviado en español', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    // Abril en es-CO abreviado es "abr"
    const doc = parseHtml(html);
    const monthSpan = doc.querySelector('.text-xs.uppercase');
    expect(monthSpan?.textContent?.toLowerCase()).toContain('abr');
  });

  // ─── Badges de categoría y estado ────────────────────────

  it('renderiza un badge con la etiqueta de categoría', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    // getCategoryLabel('xco') → 'xco' (fallback al valor raw — el mapa es solo para categorías de corredor)
    const doc = parseHtml(html);
    const spans = Array.from(doc.querySelectorAll('span'));
    expect(spans.some((s) => s.textContent?.trim() === 'xco')).toBe(true);
  });

  it('renderiza un badge con la etiqueta de estado "upcoming"', async () => {
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, status: 'upcoming' },
    });
    // getEventStatusLabel('upcoming') → 'Proximo' (sin tilde en la implementación)
    expect(html).toContain('Proximo');
  });

  it('renderiza la etiqueta de estado "past" correctamente', async () => {
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, status: 'past' },
    });
    // getEventStatusLabel('past') → 'Pasado'
    expect(html).toContain('Pasado');
  });

  it('renderiza la etiqueta de estado "cancelled" correctamente', async () => {
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, status: 'cancelled' },
    });
    // getEventStatusLabel('cancelled') → 'Cancelado'
    expect(html).toContain('Cancelado');
  });

  // ─── Clases de la tarjeta ─────────────────────────────────

  it('incluye clases de hover y transición', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const card = doc.querySelector('div')!;
    expect(card.className).toContain('hover:bg-surface-muted');
    expect(card.className).toContain('transition-colors');
  });

  // ─── Categorías múltiples ─────────────────────────────────

  it('maneja la categoría xcm (fallback al valor raw cuando no está en el mapa)', async () => {
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, category: 'xcm' },
    });
    // getCategoryLabel('xcm') → 'xcm' (no está en el mapa, se devuelve el valor raw)
    expect(html).toContain('xcm');
  });
});
