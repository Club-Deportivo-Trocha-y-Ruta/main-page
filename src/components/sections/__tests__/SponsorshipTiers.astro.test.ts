import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SponsorshipTiers from '../SponsorshipTiers.astro';
import { SPONSOR_LEVELS, SPONSOR_LEVEL_ORDER } from '@lib/sponsors';
import { CONTACT } from '@lib/constants';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SponsorshipTiers', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let doc: Document;

  beforeAll(async () => {
    container = await AstroContainer.create();
    const html = await container.renderToString(SponsorshipTiers, { props: {} });
    doc = parseHtml(html);
  });

  it('dibuja los cuatro niveles como una lista, no como cajas sueltas', () => {
    const list = doc.querySelector('ol[role="list"]');
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll(':scope > li')).toHaveLength(4);
  });

  it('los lee en progresión ascendente: de proveedor a principal', () => {
    const headings = [...doc.querySelectorAll('ol[role="list"] > li h3')].map((h) =>
      h.textContent?.trim(),
    );
    expect(headings).toEqual(['Proveedor', 'Aliado', 'Oficial', 'Principal']);
  });

  it('la escalera decorativa crece en el mismo orden que las tarjetas', () => {
    const bars = [...doc.querySelectorAll('.grid.grid-cols-4.items-end > div')];
    expect(bars).toHaveLength(4);
    const heights = bars.map((bar) =>
      parseFloat(bar.getAttribute('style')?.match(/[\d.]+/)?.[0] ?? '0'),
    );
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
  });

  it('la escalera decorativa está oculta a lectores de pantalla', () => {
    const wrapper = doc.querySelector('.grid.grid-cols-4.items-end');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marca "Más popular" (con tilde) una sola vez, sobre el nivel principal', () => {
    const badges = [...doc.querySelectorAll('li')].filter((li) =>
      li.textContent?.includes('Más popular'),
    );
    expect(badges).toHaveLength(1);
    expect(badges[0].querySelector('h3')?.textContent?.trim()).toBe('Principal');
    expect(doc.body.textContent).not.toContain('Mas popular');
  });

  it('no usa emojis como icono de nivel', () => {
    expect(doc.querySelector('[role="img"]')).toBeNull();
    expect(doc.body.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it('cada tarjeta lista exactamente los beneficios definidos en @lib/sponsors', () => {
    for (const levelId of SPONSOR_LEVEL_ORDER) {
      const level = SPONSOR_LEVELS[levelId];
      const heading = [...doc.querySelectorAll('h3')].find(
        (h) => h.textContent?.trim() === level.label,
      );
      const card = heading!.closest('li')!;
      const items = [...card.querySelectorAll('ul[role="list"] li span')].map((s) =>
        s.textContent?.trim(),
      );
      expect(items).toEqual(level.benefits);
    }
  });

  it('no inventa beneficios nuevos (uniforme, banner, sitio, redes, reportes) fuera de los ya definidos', () => {
    const allDefined = new Set(Object.values(SPONSOR_LEVELS).flatMap((l) => l.benefits));
    const rendered = [...doc.querySelectorAll('ul[role="list"] li span')].map((s) =>
      s.textContent?.trim(),
    );
    for (const text of rendered) {
      expect(allDefined.has(text ?? '')).toBe(true);
    }
  });

  it('cada CTA abre WhatsApp con el nombre del nivel prellenado', () => {
    const links = [...doc.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')];
    // CONTACT.whatsapp es la base real usada en todo el sitio.
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const link of links) {
      expect(link.getAttribute('href')).toContain(CONTACT.whatsapp);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('data-analytics-event')).toBe('whatsapp_click');
    }
    const principalLink = links.find((a) => a.textContent?.includes('Principal'));
    expect(principalLink?.getAttribute('href')).toContain(
      encodeURIComponent('patrocinio nivel Principal'),
    );
  });

  it('usa el icono de WhatsApp de Phosphor en el CTA, no un SVG pegado a mano', () => {
    const links = [...doc.querySelectorAll('a[data-analytics-event="whatsapp_click"]')];
    for (const link of links) {
      expect(link.querySelector('svg')).not.toBeNull();
    }
  });

  it('el nivel principal manda visualmente: borde, anillo y elevación propios', () => {
    const heading = [...doc.querySelectorAll('h3')].find(
      (h) => h.textContent?.trim() === 'Principal',
    );
    const card = heading!.closest('li')!;
    expect(card.className).toContain('ring-primary-deep');
    expect(card.className).toContain('border-primary-deep');
  });

  it('los demás niveles no llevan el tratamiento del principal', () => {
    for (const label of ['Proveedor', 'Aliado', 'Oficial']) {
      const heading = [...doc.querySelectorAll('h3')].find((h) => h.textContent?.trim() === label);
      const card = heading!.closest('li')!;
      expect(card.className).not.toContain('ring-primary-deep');
    }
  });
});
