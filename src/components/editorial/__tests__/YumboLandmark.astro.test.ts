import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import YumboLandmark from '../YumboLandmark.astro';
import { getYumboLandmark } from '@lib/yumbo';

describe('YumboLandmark', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container
      .renderToString(YumboLandmark, { props })
      .then((html) => new JSDOM(html).window.document);

  it('a color es contenido: sale como <img> con el alternativo del catálogo', async () => {
    const doc = await render({ landmark: 'iglesia' });
    const img = doc.querySelector('img');
    expect(img?.getAttribute('alt')).toBe(getYumboLandmark('iglesia').alt);
    expect(img?.getAttribute('aria-hidden')).toBeNull();
  });

  it('deja sobreescribir el alternativo cuando el contexto ya lo dice', async () => {
    const doc = await render({ landmark: 'cerro', alt: 'El cerro visto desde la pista' });
    expect(doc.querySelector('img')?.getAttribute('alt')).toBe('El cerro visto desde la pista');
  });

  it('enmascarada es decoración: ni imagen, ni texto, ni nombre accesible', async () => {
    const doc = await render({ landmark: 'monumento', variant: 'ink' });
    expect(doc.querySelector('img')).toBeNull();
    const span = doc.querySelector('span');
    expect(span?.getAttribute('aria-hidden')).toBe('true');
    expect(span?.textContent).toBe('');
  });

  it('la máscara reserva su proporción y toma el CSS de la hoja', async () => {
    const doc = await render({ landmark: 'monumento', variant: 'ink' });
    const span = doc.querySelector('span');
    // `.yumbo-mask` (global.css) pone el color y los prefijos, bajo `@supports`:
    // sin soporte de `mask-image` la lámina se esconde en vez de quedar como un
    // rectángulo sólido de color.
    expect(span?.className).toContain('yumbo-mask');

    const style = span?.getAttribute('style') ?? '';
    expect(style).toMatch(/aspect-ratio:\d+ \/ \d+/);
    expect(style).toContain('--yumbo-mask:url(');
  });

  it('falla en build si se pide una variante que nadie generó', async () => {
    await expect(render({ landmark: 'cerro', variant: 'ink' })).rejects.toThrow(/variante/);
  });

  it('a color pide `fit=contain` explícito: la lámina es contenido y no se recorta', async () => {
    // Hotfix 2026-09-10 (docs/04 §29): sin `fit` explícito, el `layout`
    // global del sitio («constrained») hace que Astro asuma `fit: 'cover'`
    // y emita `data-astro-image-fit="cover"` — su CSS (`@layer
    // astro.images`, declarada después que `@layer utilities` de Tailwind
    // en el bundle) le gana a la clase `object-contain` sin importar el
    // orden. Este test fija el atributo real que produce Astro, no la
    // clase Tailwind, que es justo lo que la capa puede pisar.
    const doc = await render({ landmark: 'monumento' });
    expect(doc.querySelector('img')?.getAttribute('data-astro-image-fit')).toBe('contain');
  });
});
