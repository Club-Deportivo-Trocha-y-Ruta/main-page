import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SEOHead from '../SEOHead.astro';
import { SITE } from '../../../lib/constants';

function parseHtml(html: string) {
  // Envuelve en <head> para parsear correctamente etiquetas meta/title
  return new JSDOM(`<html><head>${html}</head></html>`).window.document;
}

describe('SEOHead', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Título ───────────────────────────────────────────────

  it('incluye el título en el elemento <title>', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Noticias' },
    });
    // El Container API renderiza con pathname '/' (isHome=true), sin sufijo
    const doc = parseHtml(html);
    const title = doc.querySelector('title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toContain('Noticias');
  });

  it('el título aparece también en og:title y twitter:title', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Bienvenidos al Club' },
    });
    const doc = parseHtml(html);
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
    expect(ogTitle?.getAttribute('content')).toContain('Bienvenidos al Club');
    expect(twitterTitle?.getAttribute('content')).toContain('Bienvenidos al Club');
  });

  // ─── Meta description ─────────────────────────────────────

  it('incluye meta description con el valor proporcionado', async () => {
    const html = await container.renderToString(SEOHead, {
      props: {
        title: 'Test',
        description: 'Club de ciclomontañismo para niños en Yumbo',
      },
    });
    const doc = parseHtml(html);
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc?.getAttribute('content')).toBe(
      'Club de ciclomontañismo para niños en Yumbo'
    );
  });

  it('usa la descripción del sitio por defecto cuando no se proporciona', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const desc = doc.querySelector('meta[name="description"]');
    expect(desc?.getAttribute('content')).toBe(SITE.description);
  });

  // ─── Canonical ────────────────────────────────────────────

  it('incluye link canonical', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
  });

  it('usa canonicalUrl cuando se proporciona explícitamente', async () => {
    const customUrl = 'https://clubdeportivotrochayruta.org/noticias/copa-2026';
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', canonicalUrl: customUrl },
    });
    const doc = parseHtml(html);
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(customUrl);
  });

  // ─── Open Graph ───────────────────────────────────────────

  it('incluye meta og:type "website" por defecto', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const ogType = doc.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('website');
  });

  it('acepta og:type personalizado', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', ogType: 'article' },
    });
    const doc = parseHtml(html);
    const ogType = doc.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('article');
  });

  it('incluye og:site_name con el nombre del sitio', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const ogSite = doc.querySelector('meta[property="og:site_name"]');
    expect(ogSite?.getAttribute('content')).toBe(SITE.name);
  });

  it('incluye og:locale "es_CO"', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const locale = doc.querySelector('meta[property="og:locale"]');
    expect(locale?.getAttribute('content')).toBe('es_CO');
  });

  it('incluye og:image cuando se proporciona una URL absoluta', async () => {
    const imageUrl = 'https://res.cloudinary.com/example/image.jpg';
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', ogImage: imageUrl },
    });
    const doc = parseHtml(html);
    const ogImage = doc.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe(imageUrl);
  });

  it('no incluye og:image cuando ogImage está vacío', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', ogImage: '' },
    });
    const doc = parseHtml(html);
    const ogImage = doc.querySelector('meta[property="og:image"]');
    expect(ogImage).toBeNull();
  });

  // ─── Twitter Card ─────────────────────────────────────────

  it('incluye twitter:card "summary_large_image"', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const card = doc.querySelector('meta[name="twitter:card"]');
    expect(card?.getAttribute('content')).toBe('summary_large_image');
  });

  it('incluye twitter:title con el mismo valor que el título', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Galería de Fotos' },
    });
    const doc = parseHtml(html);
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
    // El twitter:title debe coincidir con el pageTitle (con sufijo)
    expect(twitterTitle?.getAttribute('content')).toContain('Galería de Fotos');
  });

  // ─── noindex ──────────────────────────────────────────────

  it('incluye max-image-preview:large en meta robots por defecto', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const robots = doc.querySelector('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots?.getAttribute('content')).toBe('max-image-preview:large');
  });

  it('incluye meta robots noindex cuando noindex=true', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', noindex: true },
    });
    const doc = parseHtml(html);
    const robots = doc.querySelector('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
  });

  // ─── RSS autodiscovery ────────────────────────────────────

  it('incluye link de RSS autodiscovery', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const rss = doc.querySelector('link[type="application/rss+xml"]');
    expect(rss).not.toBeNull();
    expect(rss?.getAttribute('href')).toContain('/rss.xml');
  });

  // ─── JSON-LD ──────────────────────────────────────────────

  it('no incluye script JSON-LD cuando no se proporciona jsonLd', async () => {
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(0);
  });

  it('incluye un script JSON-LD cuando se pasa un objeto', async () => {
    const jsonLd = { '@type': 'Organization', name: 'Trocha y Ruta' };
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', jsonLd },
    });
    const doc = parseHtml(html);
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    const parsed = JSON.parse(scripts[0].textContent!);
    expect(parsed['@type']).toBe('Organization');
  });

  it('incluye múltiples scripts JSON-LD cuando se pasa un array', async () => {
    const jsonLd = [
      { '@type': 'Organization', name: 'Trocha y Ruta' },
      { '@type': 'SportsClub', name: 'Trocha y Ruta' },
    ];
    const html = await container.renderToString(SEOHead, {
      props: { title: 'Test', jsonLd },
    });
    const doc = parseHtml(html);
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(2);
  });
});
