import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import StatFigure from '../StatFigure.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('StatFigure', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(StatFigure, { props }).then(parseHtml);

  it('sin countUp, pinta la cifra tal cual, sin marcado de conteo', async () => {
    const doc = await render({ value: 77, label: 'Árboles sembrados' });
    expect(doc.body.textContent).toContain('77');
    expect(doc.querySelector('.count-up')).toBeNull();
    expect(doc.querySelector('noscript')).toBeNull();
  });

  it('con countUp y un entero, separa el dígito animado (aria-hidden) de la cifra real (sr-only)', async () => {
    const doc = await render({ value: 77, label: 'Árboles sembrados', countUp: true });
    const wrapper = doc.querySelector('.count-up');
    expect(wrapper).not.toBeNull();

    const digits = doc.querySelector('.count-up__digits');
    expect(digits?.getAttribute('aria-hidden')).toBe('true');
    expect(digits?.textContent?.trim()).toBe('');

    const srOnly = doc.querySelector('.count-up .sr-only');
    expect(srOnly?.textContent?.trim()).toBe('77');
  });

  it('el ancho reservado (--count-digits) coincide con los dígitos del valor final', async () => {
    const doc = await render({ value: 1234, label: 'Cifra grande', countUp: true });
    const wrapper = doc.querySelector('.count-up');
    expect(wrapper?.getAttribute('style')).toContain('--count-target:1234');
    expect(wrapper?.getAttribute('style')).toContain('--count-digits:4');
  });

  it('emite el fallback sin JS que fuerza la cifra final y el `.reveal` visible', async () => {
    const doc = await render({ value: 5, label: 'Cifra', countUp: true });
    const noscript = doc.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.textContent).toContain('--count-value:var(--count-target) !important');
    expect(noscript?.textContent).toContain('opacity:1 !important');
  });

  it('ignora countUp si el valor no es un entero (texto libre)', async () => {
    const doc = await render({ value: 'marzo – agosto 2026', label: 'Temporada', countUp: true });
    expect(doc.querySelector('.count-up')).toBeNull();
    expect(doc.body.textContent).toContain('marzo – agosto 2026');
  });

  it('ignora countUp si el valor es un número no entero', async () => {
    const doc = await render({ value: 4.5, label: 'Promedio', countUp: true });
    expect(doc.querySelector('.count-up')).toBeNull();
    expect(doc.body.textContent).toContain('4.5');
  });

  it('con unit, el sufijo queda fuera del conteo y no anima', async () => {
    const doc = await render({ value: 12, label: 'Sedes', unit: '+', countUp: true });
    const wrapper = doc.querySelector('.count-up');
    expect(wrapper).not.toBeNull();
    // El unit vive en su propio <span>, hermano del que envuelve la cifra.
    const unitSpan = [...doc.querySelectorAll('span')].find((s) => s.textContent?.trim() === '+');
    expect(unitSpan).not.toBeUndefined();
    expect(unitSpan?.closest('.count-up')).toBeNull();
  });
});
