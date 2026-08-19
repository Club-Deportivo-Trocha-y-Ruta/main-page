import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Timeline from '../Timeline.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const items = [
  {
    label: '2010',
    title: 'De Ciclo Yumbo a Trocha y Ruta',
    body: 'La reestructuración del antiguo Club Ciclo Yumbo da origen al club.',
    icon: 'ph:flag-bold',
  },
  {
    label: 'La casa',
    title: 'Pista XCO Carlos Castro',
    body: 'Donde los teteros dan sus primeros pedalazos.',
    icon: 'ph:map-pin-bold',
  },
  {
    label: 'Hoy',
    title: 'Del barrio al calendario nacional',
    body: 'El club compite cada válida de la Copa Valle.',
  },
];

describe('Timeline', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(Timeline, { props }).then(parseHtml);

  it('no renderiza nada sin hitos', async () => {
    const doc = await render({ items: [] });
    expect(doc.querySelector('ol')).toBeNull();
  });

  it('renderiza los hitos como lista ordenada', async () => {
    const doc = await render({ items });
    const entries = doc.querySelectorAll('ol > li');
    expect(entries).toHaveLength(3);
    expect(entries[0].textContent).toContain('2010');
    expect(entries[0].textContent).toContain('De Ciclo Yumbo a Trocha y Ruta');
  });

  it('titula cada hito con un h3', async () => {
    const doc = await render({ items });
    expect([...doc.querySelectorAll('ol > li h3')].map((h) => h.textContent?.trim())).toEqual([
      'De Ciclo Yumbo a Trocha y Ruta',
      'Pista XCO Carlos Castro',
      'Del barrio al calendario nacional',
    ]);
  });

  it('alterna el lado de cada hito en escritorio', async () => {
    const doc = await render({ items });
    const blocks = [...doc.querySelectorAll('ol > li > div')];
    expect(blocks[0].className).toContain('md:col-start-1');
    expect(blocks[1].className).toContain('md:col-start-2');
  });

  it('marca el sendero y los marcadores como decorativos', async () => {
    const doc = await render({ items });
    const decorative = [...doc.querySelectorAll('[aria-hidden="true"]')];
    // El sendero + un marcador por hito
    expect(decorative.length).toBeGreaterThanOrEqual(items.length + 1);
    expect(doc.querySelector('ol > div[aria-hidden="true"]')?.className).toContain('border-dashed');
  });

  it('escalona la aparición sin pasarse de retardo', async () => {
    const doc = await render({ items: [...items, ...items] });
    const delays = [...doc.querySelectorAll('ol > li')].map((li) =>
      li.getAttribute('style')
    );
    expect(delays[0]).toContain('--stagger:0ms');
    expect(delays[1]).toContain('--stagger:80ms');
    // Tope: el sexto hito no espera medio segundo para aparecer
    expect(delays[5]).toContain('--stagger:240ms');
  });

  it('adapta el sendero al tono oscuro', async () => {
    const claro = await render({ items });
    expect(claro.querySelector('ol > div')?.className).toContain('border-primary/30');

    const oscuro = await render({ items, tone: 'dark' });
    expect(oscuro.querySelector('ol > div')?.className).toContain('border-white/25');
  });

  it('pinta el trazo de progreso como decorativo y sin capturar el puntero', async () => {
    const doc = await render({ items });
    const trazo = doc.querySelector('.timeline-progress');
    expect(trazo).not.toBeNull();

    const wrapper = trazo?.parentElement;
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper?.className).toContain('pointer-events-none');
  });

  it('deja el trazo sin utilidades de transform, que pisarían la animación', async () => {
    const doc = await render({ items });
    const trazo = doc.querySelector('.timeline-progress');
    expect(trazo?.className).not.toMatch(/translate|scale|rotate/);
    // El desplazamiento horizontal lo carga el wrapper
    expect(trazo?.parentElement?.className).toContain('md:-translate-x-px');
  });

  it('adapta el color del trazo al tono', async () => {
    const claro = await render({ items });
    expect(claro.querySelector('.timeline-progress')?.className).toContain('border-primary');

    const oscuro = await render({ items, tone: 'dark' });
    expect(oscuro.querySelector('.timeline-progress')?.className).toContain('border-accent');
  });
});
