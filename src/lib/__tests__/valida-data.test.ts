import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import fg from 'fast-glob';
import matter from 'gray-matter';
import {
  validaAliadosSchema,
  validaDatosSchema,
  validaEventoSchema,
  validaFotosSchema,
} from '../schemas';
import { SITE } from '../constants';
import { editionFacts, lapRanking, municipalityTotal, type Edition2026 } from '../valida';

/**
 * Los cuatro JSON de `src/data/valida-yumbo-2026/` alimentan la página
 * `/copa-valle-yumbo-2026`. Se editan a mano el lunes después de la válida
 * (fotos, hero, resultados) y el jueves siguiente (cifras), con prisa y sin
 * gate de tests en producción. Este archivo es la red: valida la forma contra
 * los schemas y, sobre todo, que lo que apuntan exista de verdad —logos,
 * eventos, crónicas, imagen para compartir— antes de que un enlace roto llegue
 * a 250 familias.
 *
 * La forma la revisan los schemas (`schemas.ts`); la coherencia entre archivos,
 * aquí. La página corre `parse()` en el build pero no esto: un grupo de fotos
 * desconocido no debe tumbar un deploy, y sí debe ponerse en rojo en CI.
 */

const DATA_DIR = 'src/data/valida-yumbo-2026';
const PUBLIC_DIR = 'public';
const CONTENT_DIR = 'src/content';

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'));
}

/** Frontmatter de un `.md` de una colección, o `null` si el archivo no existe. */
function frontmatter(collection: string, id: string): Record<string, unknown> | null {
  const path = join(CONTENT_DIR, collection, `${id}.md`);
  if (!existsSync(path)) return null;
  return matter(readFileSync(path, 'utf-8')).data;
}

/** `AAAA-MM-DD` de una fecha de frontmatter, leída en UTC como el resto del sitio. */
function isoDay(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
}

function issues(result: {
  success: boolean;
  error?: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> };
}): string[] {
  if (result.success) return [];
  return (result.error?.issues ?? []).map(
    (issue) => `${issue.path.map(String).join('.')}: ${issue.message}`,
  );
}

/** Lee y valida un JSON; si falla, el error dice cuál archivo y qué campos. */
function load<S extends { parse(data: unknown): unknown }>(file: string, schema: S) {
  try {
    return schema.parse(readJson(file)) as ReturnType<S['parse']>;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${file} no cumple su schema: ${reason}`);
  }
}

const evento = load('evento.json', validaEventoSchema);
const aliados = load('aliados.json', validaAliadosSchema);
const fotos = load('fotos.json', validaFotosSchema);
const datos = load('datos.json', validaDatosSchema);

// ─── Forma ────────────────────────────────────────────────────────────────────

describe('los JSON de la válida cumplen su schema', () => {
  const schemas = {
    'evento.json': validaEventoSchema,
    'aliados.json': validaAliadosSchema,
    'fotos.json': validaFotosSchema,
    'datos.json': validaDatosSchema,
  };

  for (const [file, schema] of Object.entries(schemas)) {
    it(file, () => {
      expect(issues(schema.safeParse(readJson(file))), `${file} no cumple su schema`).toEqual([]);
    });
  }
});

describe('los schemas rechazan lo que rompería la página', () => {
  const eventoBase = readJson('evento.json') as Record<string, unknown>;

  it('evento: fecha imposible, slug con mayúsculas y enlaces que no son http(s)', () => {
    expect(validaEventoSchema.safeParse({ ...eventoBase, date: '2026-02-30' }).success).toBe(false);
    expect(validaEventoSchema.safeParse({ ...eventoBase, date: '18/10/2026' }).success).toBe(false);
    expect(validaEventoSchema.safeParse({ ...eventoBase, slug: 'Copa-Valle' }).success).toBe(false);
    expect(
      validaEventoSchema.safeParse({ ...eventoBase, resultsUrl: 'javascript:alert(1)' }).success,
    ).toBe(false);
    expect(
      validaEventoSchema.safeParse({ ...eventoBase, resultsUrl: 'https://resultados.test/yumbo' })
        .success,
    ).toBe(true);
  });

  it('evento: el usuario de Instagram va sin @ ni espacios', () => {
    const photographer = (instagram: string) => ({
      ...eventoBase,
      photographer: { name: 'Nombre', instagram, url: null },
    });
    expect(validaEventoSchema.safeParse(photographer('@fotografo')).success).toBe(false);
    expect(validaEventoSchema.safeParse(photographer('foto grafo')).success).toBe(false);
    expect(validaEventoSchema.safeParse(photographer('fotografo.yumbo')).success).toBe(true);
  });

  it('acepta el logo del fotógrafo solo como rutas públicas por tema', () => {
    const withLogo = (logo: unknown) => ({
      ...eventoBase,
      photographer: { name: 'Nombre', instagram: null, url: null, logo },
    });
    const ok = { light: '/images/a-negro.webp', dark: '/images/a-blanco.webp' };
    expect(validaEventoSchema.safeParse(withLogo(ok)).success).toBe(true);
    expect(validaEventoSchema.safeParse(withLogo(null)).success).toBe(true);
    expect(
      validaEventoSchema.safeParse(withLogo({ ...ok, dark: 'images/sin-barra.webp' })).success,
    ).toBe(false);
  });

  it('evento: la imagen para compartir es una ruta pública, no una URL ni una ruta relativa', () => {
    expect(validaEventoSchema.safeParse({ ...eventoBase, ogImage: 'og.jpg' }).success).toBe(false);
    expect(validaEventoSchema.safeParse({ ...eventoBase, ogImage: '/images/og.jpg' }).success).toBe(
      true,
    );
  });

  it('aliados: rol desconocido, logo fuera de /images y enlace ftp', () => {
    const [base] = aliados;
    expect(validaAliadosSchema.safeParse([{ ...base, role: 'oro' }]).success).toBe(false);
    expect(validaAliadosSchema.safeParse([{ ...base, logo: 'logo.webp' }]).success).toBe(false);
    expect(validaAliadosSchema.safeParse([{ ...base, url: 'ftp://aliado.test' }]).success).toBe(
      false,
    );
  });

  it('fotos: id con barra y tamaño en cero', () => {
    const photo = {
      id: 'a-0001',
      group: 'manga-1',
      w: 1600,
      h: 1067,
      taken: '2026-10-18T08:41:12-05:00',
    };
    const manifest = (overrides: Record<string, unknown>) => ({
      ...fotos,
      photos: [{ ...photo, ...overrides }],
    });
    expect(validaFotosSchema.safeParse(manifest({})).success).toBe(true);
    expect(validaFotosSchema.safeParse(manifest({ id: 'carpeta/foto' })).success).toBe(false);
    expect(validaFotosSchema.safeParse(manifest({ w: 0 })).success).toBe(false);
  });

  it('datos: icono sin prefijo ph:, conteo negativo; una cifra en blanco se admite (apaga la cifra)', () => {
    const [fact] = datos.historico;
    expect(
      validaDatosSchema.safeParse({ ...datos, historico: [{ ...fact, icon: 'users' }] }).success,
    ).toBe(false);
    expect(validaDatosSchema.safeParse({ ...datos, edicion2026: { corredores: -3 } }).success).toBe(
      false,
    );
    expect(
      validaDatosSchema.safeParse({ ...datos, edicion2026: { corredores: 212 } }).success,
    ).toBe(true);
    expect(
      validaDatosSchema.safeParse({ ...datos, historico: [{ ...fact, value: '' }] }).success,
    ).toBe(true);
  });
});

// ─── Aliados ──────────────────────────────────────────────────────────────────

describe('aliados', () => {
  it('los ids son únicos: cada uno viaja a GA4 como sponsor_id', () => {
    const ids = aliados.map((ally) => ally.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('los nombres son únicos, sin distinguir mayúsculas', () => {
    const names = aliados.map((ally) => ally.name.toLocaleLowerCase('es-CO'));
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('un aliado no se repite en el respaldo institucional del evento', () => {
    // «Con el respaldo de» es prosa con las instituciones del afiche; si una (la
    // Alcaldía de Yumbo) pasa a ser tarjeta de «Con el apoyo de», sale solo allí.
    const names = new Set(aliados.map((ally) => ally.name.toLocaleLowerCase('es-CO')));
    const repeated = evento.institutions.filter((name) =>
      names.has(name.toLocaleLowerCase('es-CO')),
    );
    expect(repeated).toEqual([]);
  });

  it.each(aliados.map((ally) => [ally.id, ally.logo] as const))(
    '%s: el logo existe en public/',
    (_id, logo) => {
      expect(existsSync(join(PUBLIC_DIR, logo)), `no existe public${logo}`).toBe(true);
    },
  );

  it('al menos un aliado: sin ellos la sección de agradecimiento no se pinta', () => {
    expect(aliados.length).toBeGreaterThan(0);
  });
});

// ─── Fotos ────────────────────────────────────────────────────────────────────

describe('fotos', () => {
  it('los ids de los grupos son únicos', () => {
    const ids = fotos.groups.map((group) => group.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('cada foto pertenece a un grupo que existe', () => {
    const known = new Set(fotos.groups.map((group) => group.id));
    const orphans = fotos.photos
      .filter((photo) => !known.has(photo.group))
      .map((photo) => photo.id);
    expect(orphans, 'fotos con grupo desconocido (saldrían bajo «Otras fotos»)').toEqual([]);
  });

  it('los ids de las fotos son únicos', () => {
    const ids = fotos.photos.map((photo) => photo.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('las fotos solo traen los campos del contrato: sin nombres, leyendas ni rostros', () => {
    // El schema descarta lo que no conoce al parsear; esto mira el JSON crudo,
    // que es lo que queda en git y viaja al navegador.
    const raw = readJson('fotos.json') as { photos: Record<string, unknown>[] };
    const allowed = new Set(['id', 'group', 'w', 'h', 'taken']);
    const extras = raw.photos.flatMap((photo) =>
      Object.keys(photo)
        .filter((key) => !allowed.has(key))
        .map((key) => `${String(photo.id)}.${key}`),
    );
    expect(extras).toEqual([]);
  });

  it('se sirven del mismo origen del sitio: la CSP solo permite self y `download` exige mismo origen', () => {
    expect(new URL(fotos.base).origin).toBe(new URL(SITE.url).origin);
  });

  it('viven en la carpeta /media/ de Hostinger, fuera de git y fuera de dist/', () => {
    // Decisión del usuario (6-oct): las fotos del evento no entran al repositorio;
    // el JSON guarda solo la referencia a la carpeta del servidor. `/media/` es
    // lo que el deploy no toca (`mirror` sin `--delete`, docs/10).
    expect(new URL(fotos.base).pathname).toMatch(/^\/media\/[a-z0-9-]+\/?$/);
  });

  it('ninguna foto del evento está en el repositorio', () => {
    // Si alguien copia las fotos a `public/` «mientras tanto», el build las
    // subiría con el sitio y git las guardaría para siempre (el repo ya pesa
    // 249 MB). En `public/` de esta válida solo caben los logos de los aliados y del
    // fotógrafo, la imagen para compartir y el mapa vectorial de los municipios.
    expect(existsSync(join(PUBLIC_DIR, 'media'))).toBe(false);
    const files = fg.sync(`${PUBLIC_DIR}/images/valida-yumbo-2026/**/*`, { onlyFiles: true });
    const strangers = files.filter(
      (file) =>
        !/\/(aliados|fotografo)\/[a-z0-9-]+\.webp$/.test(file) &&
        !file.endsWith('/og.jpg') &&
        !file.endsWith('/mapa-municipios.svg'),
    );
    expect(strangers, 'archivos que no son logos, el mapa ni og.jpg').toEqual([]);
    const totalBytes = files.reduce((sum, file) => sum + statSync(file).size, 0);
    expect(totalBytes, 'public/images/valida-yumbo-2026 pesa más de 1,5 MB').toBeLessThan(
      1.5 * 1024 * 1024,
    );
  });

  it('la foto de la apertura, si se eligió, está en el manifest', () => {
    if (!evento.hero.photoId) return;
    expect(fotos.photos.map((photo) => photo.id)).toContain(evento.hero.photoId);
  });
});

// ─── Coherencia con el resto del sitio ────────────────────────────────────────

describe('evento: lo que apunta existe', () => {
  it('la página vive en src/pages con el slug que declara', () => {
    expect(existsSync(`src/pages/${evento.slug}.astro`)).toBe(true);
  });

  it('eventId corresponde a un archivo de src/content/events/ con la misma fecha', () => {
    const files = fg.sync(`${CONTENT_DIR}/events/*.md`).map((file) => file.split('/').pop());
    expect(files).toContain(`${evento.eventId}.md`);

    const data = frontmatter('events', evento.eventId);
    expect(isoDay(data?.date), 'la fecha del evento y la del JSON no coinciden').toBe(evento.date);
    expect(data?.draft).not.toBe(true);
  });

  it('nextEventId, si existe, corresponde a un evento posterior', () => {
    if (!evento.nextEventId) return;
    const data = frontmatter('events', evento.nextEventId);
    expect(data, `no existe src/content/events/${evento.nextEventId}.md`).not.toBeNull();
    expect(isoDay(data?.date) > evento.date, 'la próxima parada debe ser posterior').toBe(true);
  });

  it('la crónica y el álbum, si se declaran, existen', () => {
    if (evento.chronicle) {
      expect(
        frontmatter('news', evento.chronicle),
        `no existe la crónica ${evento.chronicle}`,
      ).not.toBeNull();
    }
    if (evento.album) {
      expect(
        frontmatter('gallery', evento.album),
        `no existe el álbum ${evento.album}`,
      ).not.toBeNull();
    }
  });

  it('publicada, la página declara su propia imagen para compartir', () => {
    // Sin `ogImage`, la vista previa de WhatsApp —lo primero que ven las
    // familias— caería en una imagen genérica del sitio. La propia es un plano
    // general, sin primeros planos de menores (política de imagen de la válida).
    if (!evento.published) return;
    expect(evento.ogImage, 'falta ogImage en evento.json').toBeTruthy();
    expect(evento.ogImage).not.toMatch(/hero-poster/);
  });

  it('la imagen para compartir, si se declara, existe en public/', () => {
    if (!evento.ogImage) return;
    expect(existsSync(join(PUBLIC_DIR, evento.ogImage)), `no existe public${evento.ogImage}`).toBe(
      true,
    );
  });
});

// ─── Cifras ───────────────────────────────────────────────────────────────────

describe('cifras', () => {
  const phosphor = JSON.parse(
    readFileSync('node_modules/@iconify-json/ph/icons.json', 'utf-8'),
  ) as { icons: Record<string, unknown> };
  const exists = (icon: string) => icon.startsWith('ph:') && icon.slice(3) in phosphor.icons;

  it('los ids de las cifras históricas son únicos', () => {
    const ids = datos.historico.map((fact) => fact.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('todos los iconos de las cifras existen en Phosphor', () => {
    const missing = datos.historico.filter((fact) => !exists(fact.icon)).map((fact) => fact.icon);
    expect(missing).toEqual([]);
  });

  it('los iconos que `editionFacts` pinta con las cifras de 2026 existen en Phosphor', () => {
    const full: Edition2026 = {
      corredores: 1,
      municipios: 1,
      departamentos: 1,
      categorias: 1,
      mujeres: 1,
      terminaron: 1,
      ninosHasta12: 1,
      clubes: 1,
      fieles33Volvieron: 1,
      podiosClub: 1,
      finalMasAjustado: '1 s',
    };
    const missing = editionFacts(full)
      .map((fact) => fact.icon)
      .filter((icon) => !exists(icon));
    expect(missing).toEqual([]);
  });

  it('las cifras de 2026 son coherentes entre sí (un dedo de más en el teclado se nota)', () => {
    const edition = datos.edicion2026;
    if (!edition) return;
    const { corredores } = edition;
    if (corredores != null) {
      for (const key of ['terminaron', 'mujeres', 'ninosHasta12'] as const) {
        const value = edition[key];
        if (value != null)
          expect(value, `${key} no puede superar a los corredores`).toBeLessThanOrEqual(corredores);
      }
    }
    if (edition.fieles33Volvieron != null) {
      expect(
        edition.fieles33Volvieron,
        'de los 33, no pueden volver más de 33',
      ).toBeLessThanOrEqual(33);
    }
    if (edition.departamentos != null && edition.municipios != null) {
      expect(edition.departamentos, 'más departamentos que municipios').toBeLessThanOrEqual(
        edition.municipios,
      );
    }
  });
});

// ─── Iconos de la propia página ───────────────────────────────────────────────

describe('plantillas de la página', () => {
  const phosphor = JSON.parse(
    readFileSync('node_modules/@iconify-json/ph/icons.json', 'utf-8'),
  ) as { icons: Record<string, unknown> };

  const templates = [
    `src/pages/${evento.slug}.astro`,
    'src/components/sections/ValidaAllies.astro',
    'src/components/sections/ValidaNumbers.astro',
  ];

  it.each(templates)('%s: los iconos ph: que escribe existen', (file) => {
    const names = [...readFileSync(file, 'utf-8').matchAll(/['"]ph:([a-z0-9-]+)['"]/g)].map(
      (m) => m[1],
    );
    const missing = names.filter((name) => !(name in phosphor.icons));
    expect(missing).toEqual([]);
  });
});

// ─── Vista previa con datos de prueba ─────────────────────────────────────────

/**
 * `preview/` es lo que lee la página con `VALIDA_PREVIEW=true` (`index.ts`): el
 * ensayo de la galería a escala real con las fotos de `npm run valida:preview`.
 * Los JSON reales nunca llevan datos de prueba (los describe de arriba) y los de
 * prueba nunca pueden publicarse: aquí se vigila el otro lado. El manifest se
 * regenera con `node scripts/valida-preview.mjs --make-manifest 420`.
 */
describe('promedios por vuelta (vueltas2026)', () => {
  const laps = datos.vueltas2026;

  it('cada tiempo apunta a una categoría declarada y los códigos no se repiten', () => {
    if (!laps) return;
    const codes = laps.categorias.map((cat) => cat.code);
    expect(new Set(codes).size).toBe(codes.length);
    const unknown = laps.tiempos.filter((row) => !codes.includes(row.categoria));
    expect(unknown).toEqual([]);
  });

  it('llevan nombre las filas del top 20 general y del top 10 de las mujeres, y ninguna más', () => {
    if (!laps) return;
    const key = (row: { categoria: string; puesto: number }) => `${row.categoria}#${row.puesto}`;
    const catByLabel = new Map(laps.categorias.map((cat) => [cat.label, cat.code]));
    const keysOf = (rows: ReturnType<typeof lapRanking>) =>
      rows.map((row) =>
        key({ categoria: catByLabel.get(row.categoryLabel) ?? '', puesto: row.position }),
      );
    const expected = new Set([
      ...keysOf(lapRanking(laps, 20)),
      ...keysOf(lapRanking(laps, 10, { onlyFemale: true })),
    ]);
    const named = new Set(laps.tiempos.filter((row) => row.nombre).map(key));
    const rankedWithoutName = [
      ...lapRanking(laps, 20),
      ...lapRanking(laps, 10, { onlyFemale: true }),
    ].filter((row) => !row.name);
    expect(rankedWithoutName.map((row) => `${row.categoryLabel} · ${row.position}`)).toEqual([]);
    expect([...expected].filter((k) => !named.has(k))).toEqual([]);
    expect([...named].filter((k) => !expected.has(k))).toEqual([]);
  });

  it('las categorías femeninas existen y el top de ellas no queda vacío', () => {
    if (!laps) return;
    expect(lapRanking(laps, 10, { onlyFemale: true }).length).toBeGreaterThan(0);
  });
});

describe('composición y procedencia (2026)', () => {
  const edition = datos.edicion2026;

  it('los grupos de composición suman los corredores de la edición', () => {
    const composition = datos.composicion2026;
    if (!composition || edition?.corredores == null) return;
    const sum = composition.grupos.reduce((total, group) => total + group.n, 0);
    expect(sum).toBe(edition.corredores);
    if (composition.masNumerosa) {
      expect(composition.masNumerosa.n).toBeLessThanOrEqual(
        Math.max(...composition.grupos.map((group) => group.n)),
      );
    }
  });

  it('cada departamento trae municipios y el total coincide con la edición', () => {
    const places = datos.municipios2026;
    if (!places) return;
    const empty = places.departamentos.filter((dep) => dep.municipios.length === 0);
    expect(empty.map((dep) => dep.nombre)).toEqual([]);
    if (edition?.municipios != null) expect(municipalityTotal(places)).toBe(edition.municipios);
    if (edition?.departamentos != null) {
      expect(places.departamentos).toHaveLength(edition.departamentos);
    }
  });

  it('el mapa, si se declara, existe en public/', () => {
    const map = datos.municipios2026?.mapa;
    if (!map) return;
    expect(existsSync(join(PUBLIC_DIR, map)), map).toBe(true);
  });
});

describe('vista previa con datos de prueba', () => {
  const eventoPrueba = () => load('preview/evento.json', validaEventoSchema);
  const fotosPrueba = () => load('preview/fotos.json', validaFotosSchema);

  const schemas = {
    'preview/evento.json': validaEventoSchema,
    'preview/fotos.json': validaFotosSchema,
    'preview/datos.json': validaDatosSchema,
  };

  for (const [file, schema] of Object.entries(schemas)) {
    it(`${file} cumple su schema`, () => {
      expect(issues(schema.safeParse(readJson(file))), `${file} no cumple su schema`).toEqual([]);
    });
  }

  it('el evento de prueba es `published: false`: copiarlo por error a los reales nunca publica', () => {
    expect(eventoPrueba().published).toBe(false);
  });

  it('los ids de las fotos de prueba son únicos', () => {
    const ids = fotosPrueba().photos.map((photo) => photo.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('cada foto de prueba pertenece a un grupo que existe y cada grupo tiene fotos', () => {
    const { groups, photos } = fotosPrueba();
    const known = new Set(groups.map((group) => group.id));
    const orphans = photos.filter((photo) => !known.has(photo.group)).map((photo) => photo.id);
    expect(orphans, 'fotos con grupo desconocido').toEqual([]);

    const used = new Set(photos.map((photo) => photo.group));
    const empty = groups.filter((group) => !used.has(group.id)).map((group) => group.id);
    expect(empty, 'grupos sin fotos: su chip no saldría en la vista previa').toEqual([]);
  });

  it('la foto de apertura de prueba está en el manifest de prueba', () => {
    const { photoId } = eventoPrueba().hero;
    expect(photoId, 'la vista previa debe ensayar la apertura con foto').toBeTruthy();
    expect(fotosPrueba().photos.map((photo) => photo.id)).toContain(photoId);
  });

  it('las fotos de prueba solo traen los campos del contrato: sin nombres, leyendas ni rostros', () => {
    const raw = readJson('preview/fotos.json') as { photos: Record<string, unknown>[] };
    const allowed = new Set(['id', 'group', 'w', 'h', 'taken']);
    const extras = raw.photos.flatMap((photo) =>
      Object.keys(photo)
        .filter((key) => !allowed.has(key))
        .map((key) => `${String(photo.id)}.${key}`),
    );
    expect(extras).toEqual([]);
  });

  it('se sirven desde localhost: el origen real no tiene estos archivos', () => {
    expect(new URL(fotosPrueba().base).hostname).toBe('localhost');
  });

  it('son cientos de fotos: la vista previa existe para ver la galería a escala real', () => {
    expect(
      fotosPrueba().photos.length,
      'regenera con `node scripts/valida-preview.mjs --make-manifest 420`',
    ).toBeGreaterThanOrEqual(400);
  });

});
