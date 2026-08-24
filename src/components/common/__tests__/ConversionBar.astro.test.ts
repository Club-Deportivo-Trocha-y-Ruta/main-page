import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ConversionBar from '../ConversionBar.astro';
import { CONTACT } from '@lib/constants';

/**
 * La barra decide qué pinta a partir de `Astro.url.pathname`, así que cada
 * caso se renderiza con su propia `Request`: es la forma de darle una ruta al
 * Container API.
 */
function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('ConversionBar', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  async function renderAt(pathname: string) {
    const html = await container.renderToString(ConversionBar, {
      request: new Request(`https://clubdeportivotrochayruta.org${pathname}`),
    });
    return parseHtml(html);
  }

  // ─── Dónde se pinta y dónde no ──────────────────────────────────

  it('pinta la barra móvil y el FAB de escritorio en una ruta cualquiera', async () => {
    const doc = await renderAt('/');
    expect(doc.querySelector('.conversion-bar')).not.toBeNull();
    // El FAB es el enlace de WhatsApp que no vive dentro de la barra.
    const fab = doc.querySelector('a.fixed:not(.conversion-bar a)');
    expect(fab).not.toBeNull();
    expect(fab!.className).toContain('md:flex');
  });

  it('se pinta en las rutas de contenido', async () => {
    for (const path of ['/noticias/', '/programas/', '/trocha-verde/']) {
      const doc = await renderAt(path);
      expect(doc.querySelector('.conversion-bar'), path).not.toBeNull();
    }
  });

  it('no se pinta en /contacto ni en /inscripciones', async () => {
    for (const path of ['/contacto', '/inscripciones']) {
      const doc = await renderAt(path);
      expect(doc.querySelector('.conversion-bar'), path).toBeNull();
      expect(doc.querySelector('a'), path).toBeNull();
    }
  });

  it('trata la ruta con y sin barra final como la misma', async () => {
    const doc = await renderAt('/inscripciones/');
    expect(doc.querySelector('.conversion-bar')).toBeNull();
  });

  it('no confunde una ruta que solo empieza igual', async () => {
    const doc = await renderAt('/inscripciones-abiertas');
    expect(doc.querySelector('.conversion-bar')).not.toBeNull();
  });

  // ─── Acciones de la barra ───────────────────────────────────────

  it('la acción primaria lleva a inscripciones con su evento de analítica', async () => {
    const doc = await renderAt('/');
    const cta = doc.querySelector('.conversion-bar a[href="/inscripciones"]');
    expect(cta).not.toBeNull();
    expect(cta!.getAttribute('data-analytics-event')).toBe('cta_inscripcion_click');
    expect(cta!.textContent).toContain('Clase de prueba gratis');
  });

  it('los dos enlaces de WhatsApp usan el número del club y se abren seguros', async () => {
    const doc = await renderAt('/');
    const links = [...doc.querySelectorAll(`a[href^="${CONTACT.whatsapp}"]`)];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.getAttribute('href')).toContain('?text=');
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.getAttribute('data-analytics-event')).toBe('whatsapp_click');
      // Solo llevan un icono: el nombre accesible tiene que ser explícito.
      expect(link.getAttribute('aria-label')).toBe('Escríbenos por WhatsApp');
      expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // ─── Presentación ───────────────────────────────────────────────

  it('la barra es fija abajo, solo bajo md y respeta el área segura', async () => {
    const doc = await renderAt('/');
    const bar = doc.querySelector('.conversion-bar')!;
    expect(bar.className).toContain('fixed');
    expect(bar.className).toContain('bottom-0');
    expect(bar.className).toContain('md:hidden');
    expect(bar.getAttribute('style')).toContain('env(safe-area-inset-bottom)');
  });
});
