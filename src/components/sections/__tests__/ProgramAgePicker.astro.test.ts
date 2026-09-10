import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ProgramAgePicker from '../ProgramAgePicker.astro';
import ProgramPathway from '../ProgramPathway.astro';
import { buildAgePicker, type PathwayInput } from '@lib/programs';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

// Los tres programas reales del club, igual que en ProgramPathway.astro.test.ts:
// si el contenido cambia de forma, estos tests avisan.
const REAL_PROGRAMS: PathwayInput[] = [
  {
    id: 'escuela-de-iniciacion',
    title: 'Escuela de Iniciación',
    ageRange: '4 a 5 años',
    ageMin: 4,
    ageMax: 5,
    targetLevel: 'iniciación',
  },
  {
    id: 'formacion-juvenil',
    title: 'Formación Juvenil',
    ageRange: '6 a 11 años',
    ageMin: 6,
    ageMax: 11,
    targetLevel: 'formación',
  },
  {
    id: 'alto-rendimiento',
    title: 'Alto Rendimiento',
    ageRange: '12 años en adelante',
    ageMin: 12,
    ageMax: 99,
    targetLevel: 'competición',
  },
];

const COPY = {
  legend: '¿Qué edad tiene tu hijo?',
  hint: 'Elige una edad y te marcamos la etapa que le corresponde.',
  allLabel: 'Todas las edades',
};

describe('ProgramAgePicker', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(ProgramAgePicker, { props }).then(parseHtml);

  const renderReal = () =>
    render({ options: buildAgePicker(REAL_PROGRAMS).options, ...COPY });

  it('pinta un radio por edad más la opción sin filtro', async () => {
    const doc = await renderReal();
    const radios = [...doc.querySelectorAll('input[type="radio"]')];

    expect(radios.map((input) => input.getAttribute('value'))).toEqual([
      'todas',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ]);
    // Un solo grupo: las flechas del teclado recorren todas las edades.
    expect(new Set(radios.map((input) => input.getAttribute('name')))).toEqual(
      new Set(['edad-programa'])
    );
  });

  it('arranca sin filtro: «todas» es el único radio marcado', async () => {
    const doc = await renderReal();
    const checked = [...doc.querySelectorAll('input[type="radio"][checked]')];

    expect(checked).toHaveLength(1);
    expect(checked[0].getAttribute('value')).toBe('todas');
  });

  it('nombra cada edad en voz alta y la abrevia en el chip', async () => {
    const doc = await renderReal();
    const labels = [...doc.querySelectorAll('input[aria-label]')].map((input) => [
      input.getAttribute('value'),
      input.getAttribute('aria-label'),
      input.parentElement?.querySelector('span')?.textContent?.trim(),
    ]);

    expect(labels[0]).toEqual(['4', '4 años', '4']);
    // El tramo sin techo se ofrece una sola vez y se dice completo.
    expect(labels.at(-1)).toEqual(['12', '12 años o más', '12+']);
  });

  it('usa el texto del contenido, no uno escrito en la plantilla', async () => {
    const doc = await render({
      options: buildAgePicker(REAL_PROGRAMS).options,
      legend: '¿Cuántos años tiene?',
      hint: 'Una ayuda visual.',
      allLabel: 'Ver todas',
    });

    expect(doc.querySelector('legend')?.textContent?.trim()).toBe('¿Cuántos años tiene?');
    expect(doc.querySelector('fieldset')?.getAttribute('aria-describedby')).toBe(
      'programa-edad-ayuda'
    );
    expect(doc.getElementById('programa-edad-ayuda')?.textContent?.trim()).toBe(
      'Una ayuda visual.'
    );
    expect(doc.querySelector('input[value="todas"] + span')?.textContent?.trim()).toBe(
      'Ver todas'
    );
  });

  it('da a cada chip un objetivo táctil de 44px y foco visible', async () => {
    const doc = await renderReal();
    const chip = doc.querySelector('input[value="4"] + span')?.getAttribute('class') ?? '';

    expect(chip).toContain('min-h-11');
    expect(chip).toContain('min-w-11');
    // El radio real está en sr-only: el foco tiene que verse en el chip.
    expect(chip).toContain('peer-focus-visible:outline-2');
  });

  it('genera una regla de CSS por edad, no una por año dibujado', async () => {
    const doc = await renderReal();
    const css = doc.querySelector('style')?.textContent ?? '';
    const rules = css.split('\n').filter(Boolean);

    expect(rules).toHaveLength(9);
    expect(rules[0]).toContain('input[name="edad-programa"][value="4"]:checked');
    expect(rules[0]).toContain('[data-ages~="4"]');
    expect(rules[0]).toContain('--age-emphasis:1');
    // «todas» no enciende nada: es el estado normal de la página.
    expect(css).not.toContain('value="todas"');
  });

  it('cada regla generada encuentra el tramo que le toca en la ruta', async () => {
    const picker = await renderReal();
    const pathway = await container
      .renderToString(ProgramPathway, { props: { programs: REAL_PROGRAMS } })
      .then(parseHtml);

    const css = picker.querySelector('style')?.textContent ?? '';
    const ages = [...css.matchAll(/\[data-ages~="(\d+)"\]/g)].map((match) => match[1]);

    // El puente entre las dos mitades: para toda edad con regla, existe un
    // tramo cuyo `data-ages` la contiene. Si se desincronizan, elegir una edad
    // no resaltaría nada.
    for (const age of ages) {
      expect(pathway.querySelector(`li[data-ages~="${age}"]`)).not.toBeNull();
    }
  });

  it('no pinta un selector de una sola edad', async () => {
    const doc = await render({ options: buildAgePicker([REAL_PROGRAMS[2]]).options, ...COPY });
    expect(doc.querySelector('fieldset')).toBeNull();
  });

  it('no pinta nada sin programas', async () => {
    const doc = await render({ options: [], ...COPY });
    expect(doc.querySelector('fieldset')).toBeNull();
  });
});
