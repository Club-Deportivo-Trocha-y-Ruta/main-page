/**
 * Prepara los assets ilustrados de Yumbo para el sitio.
 *
 * Entrada: los PNG originales generados por el estudio (fondo blanco opaco,
 * ilustración centrada). Salida, en `src/assets/images/yumbo/`, un WebP con
 * alfa por variante:
 *
 *   <nombre>.webp      ilustración a color con el fondo recortado ("contenido")
 *   <nombre>-ink.webp  la misma lámina en negro, con alfa proporcional a la
 *                      tinta del dibujo ("fondo"). Se pinta con `mask-image`
 *                      sobre `currentColor`, así el tono lo decide la sección y
 *                      el detalle interno —incluidas las letras YUMBO del
 *                      cerro, que quedan en negativo— se conserva.
 *
 * El fuente es WebP y no PNG por peso: Vite copia a `dist/` el archivo original
 * de toda imagen importada, y en PNG eran ~8 MB muertos. Por lo mismo cada
 * variante se guarda al ancho máximo al que el sitio la muestra y las máscaras
 * bajan de calidad: nadie mira el detalle de un fondo al 14 % de opacidad.
 *
 * El fondo se elimina con un flood fill desde los bordes en vez de por umbral
 * global: así el cielo entre las torres de la iglesia desaparece, pero las
 * zonas claras que están *dentro* del dibujo (letras, brillos) se quedan.
 *
 * Uso:  node scripts/prepare-yumbo-assets.mjs
 * Los originales viven en `illustrations-src/yumbo/` (ver su README).
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('illustrations-src/yumbo');
const OUT_DIR = path.resolve('src/assets/images/yumbo');

/** Umbral de "blanco de fondo": por encima de esto el píxel es papel, no dibujo. */
const WHITE_MIN = 238;

const SOURCES = [
  // El cerro es el único con cielo atrapado (los cables lo encierran), y ese
  // cielo está siempre por encima de la línea de cumbre.
  {
    file: 'ChatGPT Image 9 sept 2026, 12_30_27 p.m..png',
    name: 'cerro-yumbo',
    skyBand: 0.45,
    variants: ['color', 'solid'],
  },
  {
    file: '0334b563-2df9-4c2a-8b2f-cfb4f042f84f.png',
    name: 'monumento-trabajo',
    variants: ['color', 'ink'],
  },
  {
    file: '5c2ae977-8fc4-491b-9c0b-1c4d79058006.png',
    name: 'iglesia-yumbo',
    variants: ['color', 'ink'],
  },
  // Solo `color`: a diferencia de las otras tres, esta lámina no decora
  // ningún fondo (ni el horizonte `pattern="yumbo"`, fijo al cerro con el
  // letrero, ni el par `variant="ink"` de /calendario) — aparece una sola
  // vez, a color, en el tríptico-ahora-cuarteto de /quienes-somos.
  {
    file: 'tres-cruces-yumbo.png',
    name: 'tres-cruces-yumbo',
    variants: ['color'],
  },
];

/**
 * Alfa por regiones de papel: 0 en el fondo, 255 en el dibujo.
 *
 * No basta con inundar desde el borde. En el cerro, los cables de alta tensión
 * encierran un triángulo de cielo que nunca se toca desde afuera, así que
 * también se descartan las bolsas de papel cerradas que sean grandes. El
 * cielo atrapado entre los cables se reconoce por dos vías —es grande, o cae
 * dentro de la franja `skyBand` que declara la fuente— y las letras YUMBO, que
 * también son papel y deben quedarse, no cumplen ninguna de las dos.
 *
 * Devuelve el mismo buffer RGBA con el canal alfa ya escrito.
 */
const ENCLOSED_MIN_AREA = 0.002;

function cutBackground(data, width, height, skyBand = 0) {
  const total = width * height;
  const isPaper = (p) => {
    const i = p * 4;
    return Math.min(data[i], data[i + 1], data[i + 2]) >= WHITE_MIN;
  };

  // 0 = sin visitar, 1 = dibujo, 2 = papel de fondo
  const label = new Uint8Array(total);
  const queue = new Int32Array(total);

  /** Inunda desde `seed` y devuelve los píxeles de papel alcanzados. */
  const flood = (seed) => {
    let head = 0;
    let tail = 0;
    label[seed] = 2;
    queue[tail++] = seed;
    const region = [seed];
    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      const y = (p - x) / width;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || label[n] || !isPaper(n)) continue;
        label[n] = 2;
        queue[tail++] = n;
        region.push(n);
      }
    }
    return region;
  };

  for (let x = 0; x < width; x++) {
    for (const p of [x, (height - 1) * width + x]) if (!label[p] && isPaper(p)) flood(p);
  }
  for (let y = 0; y < height; y++) {
    for (const p of [y * width, y * width + width - 1]) if (!label[p] && isPaper(p)) flood(p);
  }

  // Bolsas de papel que el borde no alcanzó: fondo solo si son grandes.
  for (let p = 0; p < total; p++) {
    if (label[p] || !isPaper(p)) continue;
    const region = flood(p);
    const isSky = region.every((q) => (q - (q % width)) / width < height * skyBand);
    if (!isSky && region.length / total < ENCLOSED_MIN_AREA) {
      for (const q of region) label[q] = 1;
    }
  }

  for (let p = 0; p < total; p++) {
    data[p * 4 + 3] = label[p] === 2 ? 0 : 255;
  }
  return data;
}

/**
 * Versión tinta: negro con alfa proporcional a la tinta del dibujo.
 *
 * La acuarela original es clara, así que la tinta cruda apenas se ve. Se
 * normaliza contra el píxel más oscuro del dibujo y se le aplica una gamma < 1
 * para levantar los medios tonos; el resultado es una máscara con detalle que
 * la sección tiñe con su propio color.
 */
function toInk(data, width, height) {
  const out = Buffer.alloc(width * height * 4);
  let maxInk = 1;
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (255 - luma > maxInk) maxInk = 255 - luma;
  }
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const ink = Math.min(1, Math.max(0, 255 - luma) / maxInk) ** 0.6;
    out[i + 3] = Math.round(ink * 255 * (data[i + 3] / 255));
  }
  return out;
}

/**
 * Versión silueta: la mancha del dibujo, plana, con sus zonas casi blancas
 * caladas. Es la que usa la banda de horizonte, porque conserva las letras
 * YUMBO del cerro en negativo sin arrastrar la textura de los árboles.
 */
function toSolid(data, width, height) {
  const out = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    // Rampa entre 232 y 250: por debajo es dibujo, por encima es hueco.
    const cut = Math.min(1, Math.max(0, (250 - luma) / 18));
    out[i + 3] = Math.round(cut * data[i + 3]);
  }
  return out;
}

await mkdir(OUT_DIR, { recursive: true });

for (const { name, skyBand, variants } of SOURCES) {
  const src = path.join(SRC_DIR, `${name}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  cutBackground(data, width, height, skyBand);

  const raw = { raw: { width, height, channels: 4 } };

  // Un desenfoque mínimo del alfa suaviza el borde dentado del flood fill.
  const alpha = await sharp(data, raw).extractChannel(3).blur(0.6).raw().toBuffer();
  for (let p = 0; p < width * height; p++) data[p * 4 + 3] = alpha[p];

  /** Ancho máximo y calidad por variante: contenido nítido, máscaras livianas. */
  const OUTPUT = {
    // 1040 px = el doble del ancho al que se muestra la lámina más grande.
    color: { width: 1040, quality: 88, suffix: '' },
    ink: { width: 600, quality: 72, suffix: '-ink' },
    solid: { width: 1400, quality: 76, suffix: '-solid' },
  };

  const write = (buffer, variant) => {
    const { width: max, quality, suffix } = OUTPUT[variant];
    return sharp(buffer, raw)
      .trim({ threshold: 1 })
      .resize({ width: max, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 100, effort: 6 })
      .toFile(path.join(OUT_DIR, `${name}${suffix}.webp`));
  };

  const builders = {
    color: () => Buffer.from(data),
    ink: () => toInk(data, width, height),
    solid: () => toSolid(data, width, height),
  };

  for (const variant of variants) {
    await write(builders[variant](), variant);
  }

  console.log(`${name}: ${width}x${height} → ${variants.join(' + ')}`);
}
