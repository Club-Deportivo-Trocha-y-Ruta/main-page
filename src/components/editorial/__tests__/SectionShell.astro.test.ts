import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SectionShell from '../SectionShell.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SectionShell', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SectionShell, { props }).then(parseHtml);

  it('recorta con overflow-hidden por defecto', async () => {
    const doc = await render({});
    const section = doc.querySelector('section');
    expect(section?.className).toContain('overflow-hidden');
    expect(section?.className).not.toContain('overflow-clip');
  });

  it('con scrollDriven recorta con overflow-clip, que no crea contenedor de scroll', async () => {
    // Si volviera a overflow-hidden, `view()` se anclaría a la sección y toda
    // animación ligada al scroll quedaría congelada.
    const doc = await render({ scrollDriven: true });
    const section = doc.querySelector('section');
    expect(section?.className).toContain('overflow-clip');
    expect(section?.className).not.toContain('overflow-hidden');
  });

  it('no pinta textura sin pattern', async () => {
    const doc = await render({ scrollDriven: true });
    expect(doc.querySelector('svg')).toBeNull();
    expect(doc.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('con pattern yumbo ancla el horizonte al pie, sin SVG de por medio', async () => {
    const doc = await render({ pattern: 'yumbo' });
    expect(doc.querySelector('svg')).toBeNull();
    const skyline = doc.querySelector('span[aria-hidden="true"]');
    expect(skyline?.className).toContain('bottom-0');
    expect(skyline?.className).toContain('-z-10');
    expect(skyline?.className).toContain('pointer-events-none');
  });

  it('reserva una banda bajo el contenido en vez de pasarle por detrás', async () => {
    // El horizonte no es una marca de agua: el contenedor del slot termina antes
    // de que empiece la lámina. Sin la reserva, en /quienes-somos el cerro
    // asomaba entre las tarjetas de fotos y en /la-pista tapaba el pie del mapa.
    const doc = await render({ pattern: 'yumbo' });
    const inner = doc.querySelector('section > div');
    expect(inner?.className).toContain('pb-20');
    expect(inner?.className).toContain('lg:pb-36');

    const sinHorizonte = await render({ pattern: 'topo' });
    expect(sinHorizonte.querySelector('section > div')?.className).not.toContain('pb-20');
  });

  it('centra la lámina con su propia proporción y la muestra en todo ancho', async () => {
    // La caja tiene el aspect-ratio del asset y se centra con translate: así el
    // degradado lateral funde los bordes del cerro y no los del viewport, y el
    // centro coincide con el de la columna de contenido a cualquier ancho. En
    // móvil también se ve —el 82 % de las visitas llegan por ahí—.
    const doc = await render({ pattern: 'yumbo' });
    const skyline = doc.querySelector('span[aria-hidden="true"]');
    expect(skyline?.className).toContain('left-1/2');
    expect(skyline?.className).toContain('-translate-x-1/2');
    expect(skyline?.className).toContain('h-24');
    expect(skyline?.className).not.toContain('hidden');
    expect(skyline?.getAttribute('style')).toMatch(/aspect-ratio:1400 \/ 534/);
  });

  it('deja el CSS de la máscara en la hoja, no en el style inline', async () => {
    // El `style` solo lleva la URL del asset. Todo lo demás vive en
    // `.yumbo-mask` / `.yumbo-skyline` (global.css) porque necesita `@supports`
    // —sin soporte de `mask-image` la lámina se esconde en vez de degradar a un
    // rectángulo de color— y una máscara compuesta con el degradado.
    const doc = await render({ pattern: 'yumbo' });
    const skyline = doc.querySelector('span[aria-hidden="true"]');
    expect(skyline?.className).toContain('yumbo-mask');
    expect(skyline?.className).toContain('yumbo-skyline');

    const style = skyline?.getAttribute('style') ?? '';
    expect(style).toMatch(/--yumbo-mask:url\(/);
    // `mask-size: 100% 100%` deformaba el cerro hasta 6.8x en pantallas anchas.
    expect(style).not.toContain('mask-size');
  });

  it('tiñe el horizonte con el token skyline del tono, no con el de topo', async () => {
    // La lámina es una máscara: el color sale de `tokens.skyline`, así que la
    // misma pieza sirve sobre fondo claro, grafito o teal de marca. Es un token
    // aparte de `pattern`: una silueta maciza necesita más opacidad que una
    // trama de líneas, y subir la de `topo` lo volvía ruido en toda la web.
    const claro = await render({ pattern: 'yumbo', tone: 'plain' });
    const oscuro = await render({ pattern: 'yumbo', tone: 'dark' });
    expect(claro.querySelector('span[aria-hidden="true"]')?.className).toContain('text-primary/25');
    expect(oscuro.querySelector('span[aria-hidden="true"]')?.className).toContain('text-white/20');
  });

  it('deja la textura quieta cuando no se pide scrollDriven', async () => {
    const doc = await render({ pattern: 'topo' });
    const svg = doc.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('inset-0');
    expect(svg?.getAttribute('class')).not.toContain('sda-parallax-slow');
  });

  it('da deriva a la textura y la sobredimensiona con scrollDriven', async () => {
    const doc = await render({ pattern: 'topo', scrollDriven: true });
    const svg = doc.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('sda-parallax-slow');
    // Más alta que la sección para que la deriva no descubra una franja vacía
    expect(svg?.getAttribute('class')).toContain('h-[calc(100%+4rem)]');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});
