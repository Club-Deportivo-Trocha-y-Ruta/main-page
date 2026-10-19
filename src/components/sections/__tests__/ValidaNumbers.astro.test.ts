import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ValidaNumbers from '../ValidaNumbers.astro';
import datosJson from '../../../data/valida-yumbo-2026/datos.json';
import type { ValidaData } from '@lib/valida';

const realData = datosJson as ValidaData;

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('ValidaNumbers', () => {
  let container: AstroContainer;
  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = async (data: ValidaData) =>
    parseHtml(await container.renderToString(ValidaNumbers, { props: { data } }));

  it('sin edicion2026 pinta el histórico y no «La edición 2026»', async () => {
    const doc = await render({ ...realData, edicion2026: null });
    const text = doc.body.textContent ?? '';
    expect(doc.querySelector('section#cifras')?.getAttribute('aria-labelledby')).toBe(
      'cifras-titulo',
    );
    expect(text).toContain('2022, 2024 y 2025');
    expect(text).not.toContain('La edición 2026');
  });

  it('con edicion2026 pinta las dos planillas', async () => {
    const doc = await render({
      ...realData,
      edicion2026: { municipios: 22, departamentos: 4, ninosHasta12: 104, podiosClub: 3 },
    });
    expect(doc.body.textContent).toContain('La edición 2026');
    expect(doc.body.textContent).toContain('2022, 2024 y 2025');
  });

  it('sin cifras disponibles no pinta nada', async () => {
    const doc = await render({
      ...realData,
      historico: [],
      edicion2026: null,
      vueltas2026: null,
      ritmo2026: null,
      composicion2026: null,
      municipios2026: null,
    });
    expect(doc.querySelector('section')).toBeNull();
  });

  it('conserva los prefijos en el valor y la fuente', async () => {
    const doc = await render(realData);
    const text = doc.body.textContent ?? '';
    expect(text).toContain('más de 600');
    expect(text).toContain('al menos 33');
    expect(text).toContain('96 de cada 100');
    expect(text).toContain(realData.source);
  });

  it('el dato enorme de edades va aria-hidden y fuera de las planillas', async () => {
    const doc = await render(realData);
    const big = [...doc.querySelectorAll('p[aria-hidden="true"]')].find((p) =>
      p.textContent?.includes('4 a 60+'),
    );
    expect(big).toBeTruthy();
    expect(doc.querySelector('ul')?.textContent).not.toContain('4 a 60+');
  });

  it('pinta la matriz de 100 puntos con 96 llenos', async () => {
    const doc = await render(realData);
    const dots = doc.querySelectorAll('i.aspect-square');
    expect(dots).toHaveLength(100);
    expect(doc.querySelectorAll('i.bg-surface-dark')).toHaveLength(96);
  });

  describe('los mejores promedios por vuelta', () => {
    const laps = {
      source: 'Fuente de prueba de los promedios.',
      categorias: [
        { code: 'A', label: 'Categoría A', vueltas: 4 },
        { code: 'B', label: 'Categoría B', vueltas: 2 },
        { code: 'F', label: 'Categoría F', vueltas: 3, femenina: true },
      ],
      tiempos: [
        { categoria: 'A', puesto: 1, tiempo: '1:00:00', nombre: 'Ana Prueba' },
        { categoria: 'B', puesto: 2, tiempo: '0:33:00' },
        { categoria: 'F', puesto: 1, tiempo: '0:48:00', nombre: 'Flor Ejemplo' },
      ],
    };
    // Sin los bloques nuevos, para mirar solo los rankings.
    const base: ValidaData = {
      ...realData,
      ritmo2026: null,
      composicion2026: null,
      municipios2026: null,
    };
    const items = (doc: Document, id: string) =>
      doc.querySelectorAll(`section[aria-labelledby="${id}"] ol > li`);

    it('pinta el top general con nombre, o categoría y puesto si falta, y la fuente una sola vez', async () => {
      const doc = await render({ ...base, vueltas2026: laps });
      const general = items(doc, 'cifras-promedios');
      expect(general).toHaveLength(3);
      expect(general[0].textContent).toContain('Ana Prueba');
      expect(general[1].textContent).toContain('Flor Ejemplo');
      expect(general[2].textContent).toContain('Categoría B · 2.º');
      expect(doc.body.textContent?.split(laps.source)).toHaveLength(2);
      expect(doc.body.textContent).not.toContain('sin nombres');
    });

    it('el top de las mujeres usa solo las categorías femeninas y mide contra la primera de ellas', async () => {
      const doc = await render({ ...base, vueltas2026: laps });
      const section = doc.querySelector('section[aria-labelledby="cifras-promedios-mujeres"]');
      expect(section?.querySelector('h3')?.textContent).toBe('El mejor promedio de las mujeres');
      const women = items(doc, 'cifras-promedios-mujeres');
      expect(women).toHaveLength(1);
      expect(women[0].textContent).toContain('Flor Ejemplo');
      expect(women[0].textContent).toContain('—');
    });

    it('sin categorías femeninas no hay top de mujeres', async () => {
      const noWomen = {
        ...laps,
        categorias: laps.categorias.map(({ femenina: _f, ...cat }) => cat),
      };
      const doc = await render({ ...base, vueltas2026: noWomen });
      expect(doc.querySelector('[aria-labelledby="cifras-promedios-mujeres"]')).toBeNull();
      expect(doc.querySelector('[aria-labelledby="cifras-promedios"]')).not.toBeNull();
    });

    it('las barras son decorativas', async () => {
      const doc = await render({ ...base, vueltas2026: laps });
      const bars = doc.querySelectorAll('ol > li [aria-hidden="true"] > span');
      expect(bars).toHaveLength(4);
    });

    it('sin vueltas2026 no hay bloque y la bajada sigue diciendo «sin nombres»', async () => {
      const doc = await render({ ...base, vueltas2026: null });
      expect(doc.querySelector('ol')).toBeNull();
      expect(doc.body.textContent).toContain('sin nombres');
    });
  });

  describe('con los datos reales', () => {
    it('lleva el total de corredores y los clubes, y ya no el final más ajustado', async () => {
      const doc = await render(realData);
      const text = doc.body.textContent ?? '';
      expect(text).toContain('Corredores en la salida');
      expect(text).toContain('193');
      expect(text).toContain('Clubes y escuelas');
      expect(text).toContain('En las categorías femeninas');
      expect(text).not.toContain('Mujeres en competencia');
      expect(text).not.toContain('final más ajustado');
    });

    it('sigue el orden: dato enorme, ritmo, planillas, quiénes, de dónde, top 20 y top de mujeres', async () => {
      const doc = await render(realData);
      const ids = [...doc.querySelectorAll('section[aria-labelledby]')]
        .map((section) => section.getAttribute('aria-labelledby'))
        .filter((id) => id !== 'cifras-titulo');
      expect(ids).toEqual([
        'cifras-ritmo',
        'cifras-edicion',
        'cifras-historico',
        'cifras-composicion',
        'cifras-procedencia',
        'cifras-promedios',
        'cifras-promedios-mujeres',
      ]);
    });
  });

  describe('el ritmo', () => {
    it('es texto real: el titular, la cifra con su unidad y el texto', async () => {
      const doc = await render(realData);
      const section = doc.querySelector('section[aria-labelledby="cifras-ritmo"]');
      expect(section?.querySelector('h3')?.textContent).toBe(realData.ritmo2026?.titulo);
      expect(section?.textContent).toContain('15');
      expect(section?.textContent).toContain(realData.ritmo2026?.unidad);
      expect(section?.textContent).toContain(realData.ritmo2026?.texto);
      expect(section?.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('sin ritmo2026 no hay bloque', async () => {
      const doc = await render({ ...realData, ritmo2026: null });
      expect(doc.querySelector('[aria-labelledby="cifras-ritmo"]')).toBeNull();
    });
  });

  describe('quiénes corrieron', () => {
    const composicion = {
      nota: 'Nota de prueba.',
      grupos: [
        { grupo: 'Grupo Uno', edad: '4 y 5 años', n: 20 },
        { grupo: 'Grupo Dos', edad: '', n: 40 },
      ],
      masNumerosa: { categoria: 'Categoría Uno', n: 18 },
    };

    it('escribe el conteo de cada grupo, lleva la más numerosa y la nota, y las barras son decorativas', async () => {
      const doc = await render({ ...realData, composicion2026: composicion });
      const section = doc.querySelector('section[aria-labelledby="cifras-composicion"]');
      const rows = section?.querySelectorAll('ul > li') ?? [];
      expect(rows).toHaveLength(3);
      expect(rows[0].textContent).toContain('Grupo Uno');
      expect(rows[0].textContent).toContain('4 y 5 años');
      expect(rows[0].textContent).toContain('20');
      expect(rows[2].textContent).toContain('La categoría más numerosa');
      expect(rows[2].textContent).toContain('Categoría Uno');
      expect(section?.textContent).toContain('Nota de prueba.');
      const bars = section?.querySelectorAll('li > [aria-hidden="true"] > span') ?? [];
      expect(bars).toHaveLength(2);
      expect((bars[0] as HTMLElement).getAttribute('style')).toContain('width:50.0%');
      expect((bars[1] as HTMLElement).getAttribute('style')).toContain('width:100.0%');
    });

    it('sin composicion2026 no hay bloque', async () => {
      const doc = await render({ ...realData, composicion2026: null });
      expect(doc.querySelector('[aria-labelledby="cifras-composicion"]')).toBeNull();
    });
  });

  describe('de dónde vinieron', () => {
    const municipios = {
      mapa: '/images/valida-yumbo-2026/mapa-municipios.svg',
      nota: 'Nota del mapa.',
      departamentos: [
        { nombre: 'Depto Uno', municipios: ['Pueblo A', 'Pueblo B'] },
        { nombre: 'Depto Dos', municipios: ['Pueblo C'] },
      ],
    };

    it('el mapa es decorativo y la leyenda numerada lo dice en texto', async () => {
      const doc = await render({ ...realData, municipios2026: municipios });
      const section = doc.querySelector('section[aria-labelledby="cifras-procedencia"]');
      const img = section?.querySelector('img');
      expect(img?.getAttribute('src')).toBe(municipios.mapa);
      expect(img?.getAttribute('alt')).toBe('');
      expect(img?.getAttribute('aria-hidden')).toBe('true');
      const legend = section?.querySelectorAll('ol > li') ?? [];
      expect(legend).toHaveLength(2);
      expect(legend[0].textContent).toContain('1');
      expect(legend[0].textContent).toContain('Depto Uno');
      expect(legend[0].textContent).toContain('2 municipios');
      expect(legend[0].textContent).toContain('Pueblo A, Pueblo B');
      expect(legend[1].textContent).toContain('1 municipio');
      expect(legend[1].textContent).not.toContain('1 municipios');
      expect(section?.textContent).toContain('Nota del mapa.');
    });

    it('sin mapa queda la leyenda sola, y sin municipios2026 no hay bloque', async () => {
      const noMap = await render({
        ...realData,
        municipios2026: { ...municipios, mapa: null },
      });
      const section = noMap.querySelector('section[aria-labelledby="cifras-procedencia"]');
      expect(section?.querySelector('img')).toBeNull();
      expect(section?.querySelectorAll('ol > li')).toHaveLength(2);
      expect(section?.textContent).not.toContain('Yumbo, sede de la válida');
      const none = await render({ ...realData, municipios2026: null });
      expect(none.querySelector('[aria-labelledby="cifras-procedencia"]')).toBeNull();
    });
  });
});
