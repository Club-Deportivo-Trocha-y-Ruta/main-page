import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ValidaSponsorRibbon from '../ValidaSponsorRibbon.astro';
import aliadosJson from '../../../data/valida-yumbo-2026/aliados.json';
import { sortAllies, type Ally } from '@lib/valida';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const realAllies = aliadosJson as Ally[];

const logo = (id: string) => `/images/valida-yumbo-2026/aliados/${id}.webp`;
const allies: Ally[] = [
  {
    id: 'yumbileta',
    name: 'Yumbileta',
    role: 'patrocinio',
    tagline: null,
    instagram: 'yumbileta',
    url: null,
    logo: logo('yumbileta'),
    logoRatio: 3.2,
  },
  {
    id: 'ascomy',
    name: 'ASCOMY',
    role: 'apoyo',
    tagline: null,
    instagram: null,
    url: null,
    logo: logo('ascomy'),
    logoRatio: 0.79,
  },
  {
    id: 'aguila-roja',
    name: 'Café Águila Roja',
    role: 'patrocinio',
    tagline: null,
    instagram: null,
    url: null,
    logo: logo('aguila-roja'),
    logoRatio: 1,
  },
];

/** Ancho del logo en % de su casilla, leído del `style`. */
function widthOf(img: Element): number {
  return Number(img.getAttribute('style')?.match(/width:([\d.]+)%/)?.[1]);
}

/** Las casillas de la fila (sin el eco de la valla). */
const SLOTS = 'ul[role="list"] > li:not(.valida-ribbon__slot--echo)';
const ECHO = 'ul[role="list"] > li.valida-ribbon__slot--echo';

const PUBLIC_DIR = fileURLToPath(new URL('../../../../public', import.meta.url));

describe('ValidaSponsorRibbon', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  async function render(props: { allies: Ally[]; wallId?: string; photos?: number }) {
    return parseHtml(await container.renderToString(ValidaSponsorRibbon, { props }));
  }

  it('no pinta nada sin aliados', async () => {
    const doc = await render({ allies: [] });
    expect(doc.querySelector('section')).toBeNull();
    expect(doc.querySelector('img')).toBeNull();
  });

  it('pinta todos los logos de los datos reales en orden alfabético, nombrados una sola vez', async () => {
    const doc = await render({ allies: realAllies });
    const named = [...doc.querySelectorAll('img')]
      .map((img) => img.getAttribute('alt'))
      .filter((alt) => alt !== '');
    expect(named).toEqual(sortAllies(realAllies).map((ally) => ally.name));
    expect(new Set(named).size).toBe(realAllies.length);
  });

  it('cada logo se nombra por su marca, dentro de una lista', async () => {
    const doc = await render({ allies });
    const slots = doc.querySelectorAll(SLOTS);
    expect(slots).toHaveLength(3);
    for (const slot of slots) {
      expect(slot.querySelector('img')!.getAttribute('alt')?.trim()).not.toBe('');
      expect(slot.hasAttribute('aria-hidden')).toBe(false);
    }
  });

  it('la lista lleva las casillas por fila: ocho con 16 aliados o menos, nueve con 18', async () => {
    const cols = async (list: Ally[]) =>
      (await render({ allies: list })).querySelector('ul[role="list"]')!.getAttribute('style');
    expect(await cols(allies)).toContain('--ribbon-cols:8'); // pocos: no cambia
    expect(await cols(realAllies.slice(0, 16))).toContain('--ribbon-cols:8');
    expect(await cols(realAllies)).toContain(
      `--ribbon-cols:${Math.max(8, Math.ceil(realAllies.length / 2))}`,
    );
    // El CSS la lee con respaldo en 8: sin la variable, la rejilla es la de siempre.
    const source = readFileSync(
      fileURLToPath(new URL('../ValidaSponsorRibbon.astro', import.meta.url)),
      'utf-8',
    );
    expect(source).toContain('flex-basis: calc(100% / var(--ribbon-cols, 8))');
  });

  it('el eco de la valla repite la fila sin que el lector de pantalla lo oiga', async () => {
    const doc = await render({ allies });
    const echo = [...doc.querySelectorAll(ECHO)];
    // Misma fila, mismo orden, mismos archivos: no pide nada nuevo a la red.
    expect(echo.map((li) => li.querySelector('img')!.getAttribute('src'))).toEqual(
      [...doc.querySelectorAll(SLOTS)].map((li) => li.querySelector('img')!.getAttribute('src')),
    );
    for (const li of echo) {
      expect(li.getAttribute('aria-hidden')).toBe('true');
      expect(li.querySelector('img')!.getAttribute('alt')).toBe('');
    }
  });

  it('la franja se nombra con los roles que hay: patrocinio y apoyo', async () => {
    const doc = await render({ allies });
    const section = doc.querySelector('section');
    const label = doc.getElementById(section!.getAttribute('aria-labelledby')!);
    expect(label?.textContent?.trim()).toBe('Con el patrocinio y el apoyo de');
  });

  it('sin aliados de apoyo no promete un apoyo que no hay', async () => {
    const doc = await render({ allies: allies.filter((ally) => ally.role === 'patrocinio') });
    expect(doc.body.textContent).toContain('Con el patrocinio de');
    expect(doc.body.textContent).not.toContain('apoyo');
  });

  it('la única parada de tabulación es el enlace al muro', async () => {
    const doc = await render({ allies, wallId: 'aliados' });
    const focusable = doc.querySelectorAll('a[href], button, input, [tabindex]');
    expect(focusable).toHaveLength(1);
    const link = focusable[0];
    expect(link.getAttribute('href')).toBe('#aliados');
    // Toda la banda es el enlace: su nombre dice cuántos son, qué hicieron y qué hacer.
    expect(link.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '3 aliados le apostaron a esta válida Conócelos',
    );
    // Un salto dentro de la página, no un clic a una marca: `sponsor_click` queda
    // para los clics que se les reportan a ellas.
    expect(link.getAttribute('data-analytics-event')).toBe('page_nav_click');
    expect(link.getAttribute('data-analytics-content-id')).toBe('aliados');
    expect(link.getAttribute('data-analytics-method')).toBe('franja');
    expect(link.hasAttribute('data-analytics-sponsor-id')).toBe(false);
  });

  it('la franja se marca para medir su vista (sponsor_wall_view, «franja»)', async () => {
    const doc = await render({ allies });
    expect(doc.querySelector('section')!.getAttribute('data-sponsor-wall')).toBe('franja');
  });

  it('los logos bajan apenas carga la página, después de la apertura, en su versión de 320 px', async () => {
    const doc = await render({ allies });
    for (const img of doc.querySelectorAll('img')) {
      expect(img.getAttribute('loading')).toBe('eager');
      expect(img.getAttribute('fetchpriority')).toBe('low');
    }
    const yumbileta = doc.querySelector('img[alt="Yumbileta"]')!;
    expect(yumbileta.getAttribute('srcset')).toBe(
      `${logo('yumbileta').replace('.webp', '-320.webp')} 320w, ${logo('yumbileta')} 640w`,
    );
    // `sizes`: la fracción del logo en cada casilla (6,25 rem en la valla).
    const width = widthOf(yumbileta) / 100;
    expect(yumbileta.getAttribute('sizes')).toBe(
      `(min-width: 1280px) ${Math.round(152 * width * 100) / 100}px, (min-width: 640px) ${Math.round(12.5 * width * 100) / 100}vw, ${Math.round(6.25 * width * 100) / 100}rem`,
    );
  });

  it.each(realAllies.map((ally) => [ally.id, ally.logo] as const))(
    '%s: existe la versión de 320 px que pide el srcset',
    (_id, path) => {
      const small = path.replace(/\.webp$/, '-320.webp');
      expect(existsSync(`${PUBLIC_DIR}${small}`), `no existe public${small}`).toBe(true);
    },
  );

  it('con un solo aliado, la banda habla en singular', async () => {
    const doc = await render({ allies: allies.slice(0, 1), photos: 10 });
    expect(doc.querySelector('a')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 aliado le apostó a esta válida Gracias a este aliado, tus fotos son gratis. Conócelo',
    );
  });

  it('la banda dice que las fotos son gratis solo si hay fotos publicadas', async () => {
    const without = await render({ allies });
    expect(without.body.textContent).not.toContain('tus fotos son gratis');
    const withPhotos = await render({ allies, photos: 420 });
    expect(withPhotos.querySelector('a')?.textContent).toContain(
      'Gracias a ellos, tus fotos son gratis.',
    );
  });

  it('la banda: el dato enorme en lima itálica, el botón lima de la página y el foco en el botón', async () => {
    const doc = await render({ allies, photos: 420 });
    const link = doc.querySelector('a')!;
    const [number, , button] = [...link.children];
    expect(number.textContent?.trim()).toBe('3');
    expect(number.className).toMatch(/\btext-accent\b/);
    expect(number.className).toMatch(/\bitalic\b/);
    expect(number.className).toMatch(/\bfont-extrabold\b/);
    // El botón de la página: fondo lima, texto grafito y la sombra dura «pressable».
    expect(button.className).toMatch(/\bbg-accent\b/);
    expect(button.className).toMatch(/\btext-surface-dark\b/);
    expect(button.className).toMatch(/\bshadow-pressable\b/);
    // El enlace esconde su contorno y el foco se dibuja alrededor del botón.
    expect(link.className).toContain('focus-visible:outline-hidden');
    expect(button.className).toContain('group-focus-visible:outline-2');
    // El filete lima separa la banda de la página también en el tema oscuro.
    expect(link.parentElement!.className).toMatch(/\bborder-accent\b/);
  });

  it('iguala la superficie de los logos: el apaisado es más ancho, el alto más angosto', async () => {
    const doc = await render({ allies });
    const byAlt = (alt: string) => doc.querySelector(`img[alt="${alt}"]`)!;
    const wide = widthOf(byAlt('Yumbileta')); // 3,2:1
    const square = widthOf(byAlt('Café Águila Roja')); // 1:1
    const tall = widthOf(byAlt('ASCOMY')); // 0,79:1
    expect(wide).toBeGreaterThan(square);
    expect(square).toBeGreaterThan(tall);
    // ancho × alto (= ancho² / proporción) es el mismo para los tres
    const area = (width: number, ratio: number) => (width * width) / ratio;
    expect(area(wide, 3.2)).toBeCloseTo(area(square, 1), -1);
    expect(area(tall, 0.79)).toBeCloseTo(area(square, 1), -1);
  });

  it('el papel es blanco en los dos temas y los logos no van sobre ninguna foto', async () => {
    const doc = await render({ allies });
    const section = doc.querySelector('section')!;
    expect(section.className).toContain('bg-white');
    expect(section.className).not.toMatch(/dark:bg-/);
    expect(doc.querySelectorAll(SLOTS)).toHaveLength(allies.length);
  });

  it('la valla solo se mueve con permiso: movimiento reducido y sin soporte la dejan quieta', () => {
    // Los estilos con ámbito no salen en `renderToString`: se lee el componente.
    const source = readFileSync(
      fileURLToPath(new URL('../ValidaSponsorRibbon.astro', import.meta.url)),
      'utf-8',
    );
    const css = source.slice(source.indexOf('<style>'));
    const motion = css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(motion).toContain('@supports (animation-timeline: view())');
    // La animación vive solo dentro de ese bloque; fuera, la rejilla quieta.
    const outside = css.slice(0, css.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(outside).not.toMatch(/animation-name/);
    // Longhands: Lightning CSS rompe el shorthand con `view()` (docs/04 §2.5, trampa 2).
    expect(css).not.toMatch(/animation:\s*[^;]*view\(\)/);
    // Solo `transform` en los fotogramas: una vuelta exacta, la fila y su eco.
    const keyframes = css.slice(css.indexOf('@keyframes'));
    expect(keyframes).toMatch(/transform: translateX\(-50%\)/);
    expect(keyframes).not.toMatch(/\b(left|margin|width|opacity):/);
    // El recorrido no cuenta la cabecera fija y va de mitad a mitad de la fila.
    expect(motion).toContain('animation-timeline: view(block 4rem 0px)');
    expect(motion).toContain('animation-range: entry 50% exit 50%');
    // El eco solo existe dentro de la valla.
    expect(outside).toMatch(/\.valida-ribbon__slot--echo \{\s*display: none;/);
    expect(motion).toMatch(/\.valida-ribbon__slot--echo \{\s*display: grid;/);
  });
});
