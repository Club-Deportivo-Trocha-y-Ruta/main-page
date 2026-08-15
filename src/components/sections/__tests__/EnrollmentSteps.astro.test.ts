import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import EnrollmentSteps from '../EnrollmentSteps.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const steps = [
  {
    title: 'Envías la preinscripción',
    body: 'Completas el formulario con los datos del programa, el corredor y el acudiente.',
    icon: 'ph:clipboard-text-bold',
  },
  {
    title: 'El director deportivo te contacta',
    body: 'Se comunica contigo en las próximas 24 a 48 horas.',
    icon: 'ph:phone-call-bold',
  },
  {
    title: 'Clase de prueba gratuita',
    body: 'Sin costo ni compromiso.',
    icon: 'ph:bicycle-bold',
  },
];

describe('EnrollmentSteps', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(EnrollmentSteps, { props }).then(parseHtml);

  it('no renderiza nada sin pasos', async () => {
    const doc = await render({ steps: [] });
    expect(doc.querySelector('ol')).toBeNull();
  });

  it('renderiza un paso por cada hito, en orden', async () => {
    const doc = await render({ steps });
    const entries = doc.querySelectorAll('ol > li');
    expect(entries).toHaveLength(3);
  });

  it('numera los pasos por su posición en la lista, no por un dato propio', async () => {
    const doc = await render({ steps });
    const entries = [...doc.querySelectorAll('ol > li')];
    expect(entries[0].textContent).toContain('Paso 1');
    expect(entries[1].textContent).toContain('Paso 2');
    expect(entries[2].textContent).toContain('Paso 3');
  });

  it('titula cada paso con un h3, como el resto del recorrido del sistema editorial', async () => {
    const doc = await render({ steps });
    expect([...doc.querySelectorAll('ol > li h3')].map((h) => h.textContent?.trim())).toEqual([
      'Envías la preinscripción',
      'El director deportivo te contacta',
      'Clase de prueba gratuita',
    ]);
  });

  it('conserva el cuerpo y el icono de cada paso', async () => {
    const doc = await render({ steps });
    expect(doc.body.textContent).toContain('Sin costo ni compromiso.');
    // El icono va dentro del marcador decorativo del hito.
    expect(doc.querySelector('span[aria-hidden="true"] svg')).not.toBeNull();
  });

  it('vuelve a numerar si el orden de los pasos cambia', async () => {
    const doc = await render({ steps: [...steps].reverse() });
    const entries = [...doc.querySelectorAll('ol > li')];
    expect(entries[0].textContent).toContain('Paso 1');
    expect(entries[0].textContent).toContain('Clase de prueba gratuita');
  });
});
