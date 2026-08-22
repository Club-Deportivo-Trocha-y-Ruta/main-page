import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Header from '../Header.astro';
import { CTA_TRIAL_LABEL, CTA_TRIAL_LABEL_SHORT } from '@lib/constants';

/**
 * El CTA de la cabecera vivió meses con `hidden sm:inline-flex`: invisible bajo
 * 640px, es decir para el 82% del tráfico, que llega desde móvil. Como es una
 * clase de utilidad y no un atributo, ningún test lo notó. Estas aserciones
 * miran justamente eso —que no vuelva a esconderse— y que la etiqueta salga de
 * la constante única y no escrita a mano.
 */
function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('Header', () => {
  let doc: Document;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    // La cabecera monta dos islas React (`SiteSearch`, `MobileMenu`). El
    // Container API no lee `astro.config.mjs`, así que el renderer se registra
    // a mano o el render entero falla con `NoMatchingRenderer`.
    const reactRenderer = await import('@astrojs/react/server.js');
    container.addServerRenderer({ name: '@astrojs/react', renderer: reactRenderer.default });
    container.addClientRenderer({
      name: '@astrojs/react',
      entrypoint: '@astrojs/react/client.js',
    });

    const html = await container.renderToString(Header, {
      request: new Request('https://clubdeportivotrochayruta.org/'),
    });
    doc = parseHtml(html);
  });

  function inscriptionCta() {
    const cta = doc.querySelector<HTMLAnchorElement>('header a[href="/inscripciones"]');
    expect(cta).not.toBeNull();
    return cta!;
  }

  it('el CTA de inscripción está instrumentado para analítica', () => {
    expect(inscriptionCta().getAttribute('data-analytics-event')).toBe('cta_inscripcion_click');
  });

  it('el CTA es visible en móvil: no se oculta con `hidden`', () => {
    const classes = inscriptionCta().className.split(/\s+/);
    expect(classes).toContain('inline-flex');
    expect(classes).not.toContain('hidden');
    // Tampoco por una variante de talla, que es como estaba escrito antes.
    expect(classes.some((c) => /^(sm|md|lg):hidden$/.test(c))).toBe(false);
  });

  it('mantiene un objetivo táctil de 44px', () => {
    expect(inscriptionCta().className).toContain('min-h-11');
  });

  it('usa la etiqueta única, recortada solo bajo `sm`', () => {
    const cta = inscriptionCta();
    const spans = [...cta.querySelectorAll('span')];

    const short = spans.find((s) => s.textContent?.trim() === CTA_TRIAL_LABEL_SHORT);
    const full = spans.find((s) => s.textContent?.trim() === CTA_TRIAL_LABEL);
    expect(short).toBeDefined();
    expect(full).toBeDefined();

    // Exactamente una de las dos se ve en cada talla.
    expect(short!.className).toContain('sm:hidden');
    expect(full!.className).toContain('hidden');
    expect(full!.className).toContain('sm:inline');
  });

  it('no queda rastro del texto antiguo del CTA', () => {
    expect(doc.body.textContent).not.toContain('Preinscríbete');
  });
});
