import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import StatsCounter from '../StatsCounter.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

// Renderiza contra las collections reales del repo (mismo criterio que
// TrochaVerdeComposition.astro.test.ts para componentes sin props): no hay
// forma sencilla de inyectar `getCollection` en un test de container, así
// que las cifras vienen del contenido real del club, no de un fixture.
describe('StatsCounter', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let doc: Document;

  beforeAll(async () => {
    container = await AstroContainer.create();
    const html = await container.renderToString(StatsCounter, {});
    doc = parseHtml(html);
  });

  it('pinta cada cifra con la utilidad `.count-up` compartida, no con el script anterior', () => {
    const counters = doc.querySelectorAll('.count-up');
    expect(counters.length).toBeGreaterThan(0);
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.body.innerHTML).not.toContain('data-count-target');
    expect(doc.body.innerHTML).not.toContain('IntersectionObserver');
  });

  it('cada dígito animado es aria-hidden y la cifra real vive en sr-only', () => {
    const digitNodes = doc.querySelectorAll('.count-up__digits');
    expect(digitNodes.length).toBe(doc.querySelectorAll('.count-up').length);
    digitNodes.forEach((node) => expect(node.getAttribute('aria-hidden')).toBe('true'));

    doc.querySelectorAll('.count-up').forEach((wrapper) => {
      expect(wrapper.querySelector('.sr-only')?.textContent?.trim()).not.toBe('');
    });
  });

  it('cada tarjeta dispara el conteo desde un ancestro `.reveal`', () => {
    doc.querySelectorAll('.count-up').forEach((wrapper) => {
      expect(wrapper.closest('.reveal')).not.toBeNull();
    });
  });

  it('escalona la entrada de las tarjetas con `--stagger`', () => {
    const items = [...doc.querySelectorAll('li.reveal')];
    expect(items.length).toBeGreaterThan(1);
    expect(items[0].getAttribute('style')).toContain('--stagger:0ms');
    expect(items[1].getAttribute('style')).toContain('--stagger:80ms');
  });

  it('el fallback sin JS fuerza la cifra final y el `.reveal` visible', () => {
    const noscript = doc.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.textContent).toContain('--count-value:var(--count-target) !important');
    expect(noscript?.textContent).toContain('opacity:1 !important');
  });
});
