import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import EventCard from '../EventCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const baseProps = {
  title: 'Copa Valle XCO 2026',
  // Fecha local explícita (new Date('YYYY-MM-DD') parsea como UTC y puede desfasarse en Node.js)
  date: new Date(2026, 3, 15), // abril = mes 3 (0-indexed)
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
    // Usa fecha local explícita para evitar desfases UTC en Node.js
    const localDate = new Date(2026, 3, 15); // mes 3 = abril (0-indexed)
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, date: localDate },
    });
    // date.getDate() → 15 en zona horaria local
    expect(html).toContain('15');
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
    const anchor = doc.querySelector('a')!;
    expect(anchor.className).toContain('hover:bg-surface-muted');
    expect(anchor.className).toContain('transition-colors');
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
