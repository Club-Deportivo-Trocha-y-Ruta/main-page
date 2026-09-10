import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import WhatsappShareButton from '../WhatsappShareButton.astro';
import { SHARE_WHATSAPP_LABEL } from '@lib/constants';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('WhatsappShareButton', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  async function render(props: Record<string, unknown>, pathname = '/noticias/una-cronica') {
    const html = await container.renderToString(WhatsappShareButton, {
      props,
      request: new Request(`https://clubdeportivotrochayruta.org${pathname}`),
    });
    return parseHtml(html);
  }

  it('arma el enlace de wa.me con el título y la URL etiquetada con UTM', async () => {
    const doc = await render({ title: 'Copa Valle en Roldanillo' });
    const link = doc.querySelector('a');
    expect(link).not.toBeNull();

    const href = link!.getAttribute('href')!;
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);

    const encodedText = href.replace('https://wa.me/?text=', '');
    const text = decodeURIComponent(encodedText);
    expect(text).toContain('Copa Valle en Roldanillo');
    expect(text).toContain('https://clubdeportivotrochayruta.org/noticias/una-cronica');
    expect(text).toContain('utm_source=whatsapp');
    expect(text).toContain('utm_medium=social');
    expect(text).toContain('utm_campaign=compartir-desde-web');
  });

  it('usa la URL explícita en vez de la de la página cuando se pasa `url`', async () => {
    const doc = await render({
      title: 'Copa Valle en Roldanillo',
      url: 'https://clubdeportivotrochayruta.org/noticias/otra-cronica',
    });
    const href = decodeURIComponent(doc.querySelector('a')!.getAttribute('href')!);
    expect(href).toContain('/noticias/otra-cronica');
    expect(href).not.toContain('/noticias/una-cronica');
  });

  it('abre en pestaña nueva de forma segura', async () => {
    const doc = await render({ title: 'Copa Valle en Roldanillo' });
    const link = doc.querySelector('a')!;
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('muestra el ícono de WhatsApp decorativo y la etiqueta del catálogo compartido', async () => {
    const doc = await render({ title: 'Copa Valle en Roldanillo' });
    const link = doc.querySelector('a')!;
    expect(link.textContent).toContain(SHARE_WHATSAPP_LABEL);

    const svg = doc.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('no lleva evento de analítica: no hay ninguno en el catálogo para "compartir", solo para "contactar"', async () => {
    const doc = await render({ title: 'Copa Valle en Roldanillo' });
    expect(doc.querySelector('a')!.getAttribute('data-analytics-event')).toBeNull();
  });

  it('entra con `.reveal`, el mismo scroll-reveal del resto del sitio', async () => {
    const doc = await render({ title: 'Copa Valle en Roldanillo' });
    expect(doc.querySelector('.reveal')).not.toBeNull();
  });
});
