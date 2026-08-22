import {
  experimental_AstroContainer as AstroContainer,
  type AstroContainerOptions,
} from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Breadcrumb from '../Breadcrumb.astro';

/**
 * NOTA: El componente Breadcrumb llama a new URL(item.href, Astro.site) para
 * generar las URLs del JSON-LD estructurado. En el Container API, Astro.site
 * solo está disponible si href es una URL absoluta. Los tests de JSON-LD usan
 * URLs absolutas para evitar el error ERR_INVALID_URL.
 */

/** El manifest que acepta el Container API (SSRManifest completo). */
type ContainerManifest = NonNullable<AstroContainerOptions['manifest']>;

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('Breadcrumb', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    // Pasa manifest.site para que Astro.site esté disponible en el componente.
    // Breadcrumb usa new URL(item.href, Astro.site) para generar el JSON-LD.
    // Solo se declara `site`: el resto del SSRManifest no lo toca el render del
    // componente, así que se arma como Partial y se afirma al tipo completo.
    const manifest: Partial<ContainerManifest> = {
      site: 'https://clubdeportivotrochayruta.org',
    };
    container = await AstroContainer.create({
      manifest: manifest as ContainerManifest,
    });
  });

  // ─── JSON-LD (con URLs absolutas para evitar Astro.site undefined) ──

  it('incluye script JSON-LD de tipo BreadcrumbList', async () => {
    const html = await container.renderToString(Breadcrumb, {
      // Sin href en los items → no hay new URL() call en el JSON-LD
      props: { items: [{ label: 'Noticias' }] },
    });
    expect(html).toContain('application/ld+json');
    expect(html).toContain('BreadcrumbList');
  });

  it('el JSON-LD incluye "Inicio" como primer elemento', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Programas' }] },
    });
    expect(html).toContain('"Inicio"');
  });

  it('el JSON-LD incluye los labels de los items pasados', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: {
        items: [
          { label: 'Equipo' },
          { label: 'Juan Pérez' },
        ],
      },
    });
    expect(html).toContain('"Equipo"');
    expect(html).toContain('"Juan Pérez"');
  });

  it('el JSON-LD asigna posiciones correlativas comenzando en 1', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Noticias' }] },
    });
    const doc = parseHtml(html);
    const script = doc.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data.itemListElement[0].position).toBe(1); // Inicio
    expect(data.itemListElement[1].position).toBe(2); // Noticias
  });

  it('el JSON-LD tiene el @type correcto', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Galería' }] },
    });
    const doc = parseHtml(html);
    const script = doc.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('BreadcrumbList');
  });

  // ─── Navegación móvil ─────────────────────────────────────

  it('no muestra nav móvil cuando solo hay un item (raíz)', async () => {
    // Con items: [], allItems solo contiene "Inicio" → parentItem es null
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [] },
    });
    const doc = parseHtml(html);
    const mobileNav = doc.querySelector('nav[aria-label="Volver"]');
    expect(mobileNav).toBeNull();
  });

  it('muestra nav móvil "Volver" al padre cuando hay items anidados', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: {
        items: [
          { label: 'Noticias', href: '/noticias' },
          { label: 'Artículo' },
        ],
      },
    });
    const doc = parseHtml(html);
    const mobileNav = doc.querySelector('nav[aria-label="Volver"]');
    expect(mobileNav).not.toBeNull();
    const backLink = mobileNav!.querySelector('a');
    expect(backLink?.getAttribute('href')).toBe('/noticias');
    expect(backLink?.textContent?.trim()).toBe('Noticias');
  });

  it('no muestra nav móvil de "Volver" cuando el item padre no tiene href', async () => {
    // allItems = [Inicio, Programas(sin href), Item]
    // parentItem = Programas que no tiene href → la condición parentItem?.href falla
    const html = await container.renderToString(Breadcrumb, {
      props: {
        items: [
          { label: 'Programas' }, // sin href
          { label: 'Iniciación' },
        ],
      },
    });
    const doc = parseHtml(html);
    const mobileNav = doc.querySelector('nav[aria-label="Volver"]');
    expect(mobileNav).toBeNull();
  });

  // ─── Navegación desktop ───────────────────────────────────

  it('incluye nav desktop con aria-label="Breadcrumb"', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Programas', href: '/programas' }] },
    });
    const doc = parseHtml(html);
    const desktopNav = doc.querySelector('nav[aria-label="Breadcrumb"]');
    expect(desktopNav).not.toBeNull();
  });

  it('el último item tiene aria-current="page"', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Galería' }] },
    });
    const doc = parseHtml(html);
    const currentSpan = doc.querySelector('span[aria-current="page"]');
    expect(currentSpan).not.toBeNull();
    expect(currentSpan!.textContent?.trim()).toBe('Galería');
  });

  it('los items intermedios con href se renderizan como enlaces', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: {
        items: [
          { label: 'Equipo', href: '/equipo' },
          { label: 'Corredor' },
        ],
      },
    });
    const doc = parseHtml(html);
    const desktopNav = doc.querySelector('nav[aria-label="Breadcrumb"]');
    const links = desktopNav!.querySelectorAll('a');
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/equipo');
  });

  it('incluye "Inicio" visible en el breadcrumb desktop', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Calendario', href: '/calendario' }] },
    });
    const doc = parseHtml(html);
    const desktopNav = doc.querySelector('nav[aria-label="Breadcrumb"]');
    expect(desktopNav?.textContent).toContain('Inicio');
  });

  it('el enlace "Inicio" apunta a "/"', async () => {
    const html = await container.renderToString(Breadcrumb, {
      props: { items: [{ label: 'Galería' }] },
    });
    const doc = parseHtml(html);
    const desktopNav = doc.querySelector('nav[aria-label="Breadcrumb"]');
    const inicioLink = desktopNav!.querySelector('a[href="/"]');
    expect(inicioLink).not.toBeNull();
    expect(inicioLink!.textContent?.trim()).toBe('Inicio');
  });
});
