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

  it('renderiza la sigla de la disciplina, no el valor crudo del schema', async () => {
    const html = await container.renderToString(EventCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const spans = Array.from(doc.querySelectorAll('span'));
    expect(spans.some((s) => s.textContent?.trim() === 'XCO')).toBe(true);
    // Antes se pasaba por getCategoryLabel(), que traduce categorías de
    // corredores, y las de evento salían en minúscula tal cual.
    expect(spans.some((s) => s.textContent?.trim() === 'xco')).toBe(false);
  });

  it('renderiza el nivel del evento cuando viene', async () => {
    const html = await container.renderToString(EventCard, {
      props: { ...baseProps, level: 'nacional' },
    });
    expect(html).toContain('Nacional');
  });

  it('no rotula el estado cuando la sección ya lo dice', async () => {
    // Un "Próximo" en la lista de próximos o un "Corrido" en la de corridos es
    // ruido: el titular de la sección ya lo dijo.
    for (const status of ['upcoming', 'past']) {
      const html = await container.renderToString(EventCard, {
        props: { ...baseProps, status },
      });
      expect(html).not.toContain('Próximo');
      expect(html).not.toContain('Corrido');
    }
  });

  it('sí rotula el estado cuando no se puede deducir del contexto', async () => {
    const enCurso = await container.renderToString(EventCard, {
      props: { ...baseProps, status: 'ongoing' },
    });
    expect(enCurso).toContain('En curso');

    const cancelado = await container.renderToString(EventCard, {
      props: { ...baseProps, status: 'cancelled' },
    });
    expect(cancelado).toContain('Cancelado');
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

  it('traduce también las demás disciplinas', async () => {
    const xcm = await container.renderToString(EventCard, {
      props: { ...baseProps, category: 'xcm' },
    });
    expect(xcm).toContain('XCM');

    const ruta = await container.renderToString(EventCard, {
      props: { ...baseProps, category: 'ruta' },
    });
    expect(ruta).toContain('Ruta');
  });
});
