import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll, vi } from 'vitest';

// `astro:env/client` es un módulo virtual que solo existe en el build de Astro.
// Se stubbea aquí para poder renderizar el componente con un ID de prueba.
vi.mock('astro:env/client', () => ({ PUBLIC_GA4_MEASUREMENT_ID: 'G-TESTID0001' }));

const { default: Analytics } = await import('../Analytics.astro');

/**
 * Regresión del apagón de medición del 12 de agosto de 2026.
 *
 * Astro 7 reescribe todo script con `define:vars` para inyectar las variables y
 * en el proceso descarta sus atributos. Cuando el tag de GA4 vivía en Partytown,
 * eso borró el `type="text/partytown"` del bloque de consentimiento y la
 * medición se apagó durante dos semanas sin ningún error en consola.
 *
 * Estos tests fijan las dos condiciones que hacen que el fallo sea imposible de
 * repetir en silencio: que el script con atributos no pase por `define:vars`, y
 * que el consentimiento se declare antes de que gtag.js se ejecute.
 */
describe('Analytics', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let html: string;
  let doc: Document;

  beforeAll(async () => {
    container = await AstroContainer.create();
    html = await container.renderToString(Analytics);
    doc = new JSDOM(html).window.document;
  });

  it('carga gtag.js conservando src y async (los atributos sobreviven al render)', () => {
    const loader = doc.querySelector<HTMLScriptElement>('script[src*="googletagmanager.com/gtag/js"]');
    expect(loader, 'no se encontró el script de gtag.js').not.toBeNull();
    expect(loader!.getAttribute('src')).toContain('id=G-TESTID0001');
    expect(loader!.hasAttribute('async')).toBe(true);
  });

  it('no queda ningún script en Partytown', () => {
    expect(html).not.toContain('text/partytown');
  });

  it('declara el consentimiento por defecto antes de cargar gtag.js', () => {
    const scripts = [...doc.querySelectorAll('script')];
    const consentIdx = scripts.findIndex((s) => s.textContent?.includes("gtag('consent', 'default'"));
    const loaderIdx = scripts.findIndex((s) => s.getAttribute('src')?.includes('googletagmanager.com/gtag/js'));

    expect(consentIdx).toBeGreaterThanOrEqual(0);
    expect(loaderIdx).toBeGreaterThanOrEqual(0);
    expect(consentIdx).toBeLessThan(loaderIdx);
  });

  it('arranca con analytics_storage denegado (consent mode v2)', () => {
    expect(html).toContain("analytics_storage: 'denied'");
    expect(html).toContain("ad_storage: 'denied'");
  });

  it('configura la propiedad con el measurement ID', () => {
    expect(html).toContain("gtag('config', ga4Id");
    expect(html).toContain('G-TESTID0001');
  });
});
