#!/usr/bin/env node
/**
 * Vista previa de `/copa-valle-yumbo-2026` a escala real, sin tocar los JSON
 * reales y sin llenar el disco: unas 420 fotos de prueba repartidas como una
 * válida de verdad (chips con conteos, filtro por placa, visor, descarga).
 *
 *   npm run valida:preview            # arma el banco (si falta) y sirve las fotos en :8765
 *   VALIDA_PREVIEW=true npm run dev   # en otra terminal: la página lee preview/*.json
 *   node scripts/valida-preview.mjs --make-manifest 420   # reescribe preview/fotos.json y termina
 *
 * Son tres piezas:
 *
 * 1. Manifest. `--make-manifest N` reescribe `src/data/valida-yumbo-2026/
 *    preview/fotos.json`: conserva las fotos de prueba de siempre (cámara
 *    DSC 1000–1034: la foto de apertura y los enlaces dependen de sus ids) y
 *    suma hasta N fotos generadas con semilla fija, así que el mismo comando da
 *    siempre el mismo archivo. Se reparten por manga como en una válida, con
 *    `taken` dentro de la ventana de cada manga (`mangas.json`), proporciones de
 *    cámara (3:2 y 2:3, algo de 4:3) y placas en una de cada cuatro fotos, con
 *    números que se repiten para que el filtro devuelva varias.
 * 2. Banco. Tres archivos por foto serían ~350 MB para 420 fotos: en su lugar se
 *    generan una sola vez unas 70 imágenes a partir de las fotos del chequeo de
 *    Profondos que ya están en `public/images/news/` (sin personas inventadas,
 *    sin descargar nada), cada fuente en sus proporciones y con thumb, web y
 *    original. Viven en `~/Trocha-media/_valida-preview/banco/`; la carpeta
 *    empieza con `_`: no es parte de lo que se sube al hosting.
 * 3. Servidor. Responde `/{thumb|web|original}/<id>.<ext>` de cualquier id del
 *    manifest con una imagen del banco de su misma proporción, elegida con un
 *    hash del id (siempre la misma) y sin repetir la de las fotos vecinas.
 *    Imita lo que importa del de producción: tipos de contenido y
 *    `Content-Disposition: attachment` en los originales (el botón
 *    «Descargar»). Lo que no está en el manifest da 404. Relee el manifest
 *    cuando cambia, sin reiniciar.
 *
 * Banderas: `--make-manifest <n>` solo reescribe el manifest; `--regen` rehace
 * el banco; `--no-serve` solo arma el banco; `--port <n>` cambia el puerto (el
 * manifest de prueba apunta a 8765).
 */
import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join, normalize, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src/data/valida-yumbo-2026');
const MANIFEST = join(DATA_DIR, 'preview/fotos.json');
const EVENTO = join(DATA_DIR, 'preview/evento.json');
const MANGAS = join(DATA_DIR, 'mangas.json');
const SOURCE_DIR = join(ROOT, 'public/images/news/chequeo-profondos-2026');
const OUT = join(homedir(), 'Trocha-media', '_valida-preview');
const BANK = join(OUT, 'banco');

const HELP = `Uso: node scripts/valida-preview.mjs [opciones]

  (sin opciones)       arma el banco de fotos y lo sirve en http://localhost:8765
  --make-manifest <n>  reescribe preview/fotos.json con n fotos y termina
  --regen              rehace el banco aunque ya exista
  --no-serve           arma el banco y termina, sin servidor
  --port <n>           puerto del servidor (el manifest de prueba apunta a 8765)
  -h, --help           muestra esta ayuda`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function parseFlags() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        'make-manifest': { type: 'string' },
        regen: { type: 'boolean' },
        'no-serve': { type: 'boolean' },
        port: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
      strict: true,
    }));
  } catch (error) {
    fail(`${error.message}\nUsa --help para ver las opciones.`);
  }
  const integer = (name, text, max) => {
    const value = Number(text);
    if (!Number.isInteger(value) || value < 1 || value > max) {
      fail(`--${name} pide un entero entre 1 y ${max} (llegó «${text}»).`);
    }
    return value;
  };
  return {
    help: values.help === true,
    regen: values.regen === true,
    serve: values['no-serve'] !== true,
    port: integer('port', values.port ?? '8765', 65535),
    makeManifest:
      values['make-manifest'] === undefined
        ? null
        : integer('make-manifest', values['make-manifest'], 5000),
  };
}

// ─── Manifest de prueba ────────────────────────────────────────────────────────

/** Semilla fija (la fecha de la válida): regenerar da siempre el mismo archivo. */
const SEED = 20261018;
/** Las fotos de prueba de siempre son DSC 1000–1034; las generadas arrancan aquí. */
const FIRST_GENERATED = 2000;
/** Fotos por manga en una válida de 420 (las de siempre cuentan); se escala a N. */
const SHARES = {
  previa: 20,
  'manga-1': 40,
  'manga-2': 60,
  'manga-3': 95,
  'manga-4': 50,
  'manga-5': 70,
  'manga-6': 60,
  premiacion: 25,
};
/** Cuánto antes de la primera salida llega el fotógrafo y cuánto dura el último grupo. */
const PREVIA_MINUTES = 60;
const LAST_GROUP_MINUTES = 90;
/** Proporciones de las fotos generadas: 3:2 y 2:3 de cámara, algo de 4:3 y 3:4. */
const SHAPES = [
  { w: 3, h: 2, weight: 60 },
  { w: 2, h: 3, weight: 28 },
  { w: 4, h: 3, weight: 7 },
  { w: 3, h: 4, weight: 5 },
];
/** Lado largo: el tope de la versión web (1600) en la mayoría; el resto, recortes. */
const LONG_SIDE = { cap: 1600, min: 1280, capShare: 0.7 };
/** Placas: [mínimo, máximo, cuántas]. 45 y 112 ya las usan las fotos de siempre. */
const PLATE_MIX = [
  [1, 9, 4],
  [10, 99, 20],
  [100, 999, 26],
  [1000, 9999, 10],
];
const KNOWN_PLATES = [45, 112];
/** Una de cada cuatro fotos lleva placa; una (82 %), dos (15 %) o tres (3 %). */
const PLATED_SHARE = 0.25;
const PLATES_PER_PHOTO = [82, 15, 3];
const POPULARITY_EXPONENT = 0.9;

/** mulberry32: generador chico y determinista. */
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

function weightedIndex(rng, weights) {
  let roll = rng() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < weights.length; index++) {
    roll -= weights[index];
    if (roll < 0) return index;
  }
  return weights.length - 1;
}

function shuffle(rng, list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = randInt(rng, 0, index);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

const clockToSeconds = (clock) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 3600 + minutes * 60;
};

const pad = (value) => String(value).padStart(2, '0');

/** `2026-10-18T08:41:12-05:00`, el formato que escribe `valida-fotos.mjs`. */
const toIso = (date, seconds) =>
  `${date}T${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}-05:00`;

/**
 * Ventana de captura de cada grupo, en segundos del día: cada manga va desde su
 * salida hasta la de la siguiente; la previa, la hora anterior a la primera
 * salida; el último grupo, 90 minutos.
 */
function groupWindows(mangas) {
  const scheduled = mangas.groups
    .filter((group) => group.start)
    .map((group) => ({ id: group.id, at: clockToSeconds(group.start) }))
    .sort((a, b) => a.at - b.at);
  if (scheduled.length === 0) fail('mangas.json no tiene ninguna hora de salida.');

  const windows = new Map();
  const previa = mangas.groups.find((group) => group.start === null);
  if (previa) windows.set(previa.id, [scheduled[0].at - PREVIA_MINUTES * 60, scheduled[0].at]);
  scheduled.forEach((group, index) => {
    const next = scheduled[index + 1]?.at ?? group.at + LAST_GROUP_MINUTES * 60;
    if (next <= group.at) fail(`mangas.json: «${group.id}» sale a la misma hora que la siguiente.`);
    windows.set(group.id, [group.at, next]);
  });
  return windows;
}

/** Reparte `total` entre los grupos según SHARES (método del mayor resto). */
function quotas(total, groupIds) {
  const weights = groupIds.map((id) => {
    if (!(id in SHARES)) fail(`No hay reparto para el grupo «${id}»: agrégalo a SHARES.`);
    return SHARES[id];
  });
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  const exact = weights.map((weight) => (total * weight) / sum);
  const counts = exact.map(Math.floor);
  const order = exact
    .map((value, index) => ({ rest: value - counts[index], index }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  let left = total - counts.reduce((acc, count) => acc + count, 0);
  for (const { index } of order) {
    if (left-- <= 0) break;
    counts[index] += 1;
  }
  return new Map(groupIds.map((id, index) => [id, counts[index]]));
}

/**
 * Placas de prueba en orden de popularidad (las primeras salen más), cada una
 * con su manga de origen: un corredor aparece en las fotos de su manga, no en
 * las de otras.
 */
function buildPlates(rng, raceIds) {
  const pool = new Set(KNOWN_PLATES);
  for (const [min, max, count] of PLATE_MIX) {
    const bucket = new Set([...pool].filter((plate) => plate >= min && plate <= max));
    while (bucket.size < count) bucket.add(randInt(rng, min, max));
    for (const plate of bucket) pool.add(plate);
  }
  return shuffle(rng, [...pool]).map((number, rank) => ({
    number,
    home: raceIds[rank % raceIds.length],
  }));
}

/** Entre 1 y 3 placas distintas de `candidates`, con las primeras más probables. */
function pickPlates(rng, candidates) {
  const weights = candidates.map((_, rank) => 1 / (rank + 1) ** POPULARITY_EXPONENT);
  const wanted = Math.min(1 + weightedIndex(rng, PLATES_PER_PHOTO), candidates.length);
  const chosen = new Set();
  while (chosen.size < wanted) chosen.add(candidates[weightedIndex(rng, weights)].number);
  return [...chosen].sort((a, b) => a - b);
}

const cameraNumber = (id) => Number(/^dsc-(\d+)-/.exec(id)?.[1] ?? 0);

const byTakenThenId = (a, b) => {
  if (a.taken !== b.taken) return a.taken < b.taken ? -1 : 1;
  return a.id.localeCompare(b.id);
};

/** JSON en una sola línea pero con espacios (igual que `valida-fotos.mjs`). */
function jsonInline(value) {
  if (Array.isArray(value)) return `[${value.map(jsonInline).join(', ')}]`;
  if (value !== null && typeof value === 'object') {
    const fields = Object.entries(value).map(
      ([key, item]) => `${JSON.stringify(key)}: ${jsonInline(item)}`,
    );
    return `{ ${fields.join(', ')} }`;
  }
  return JSON.stringify(value);
}

/** Una línea por grupo y por foto, como el manifest real: el diff se lee. */
function formatManifest(manifest) {
  const list = (items) =>
    items.length === 0
      ? '[]'
      : `[\n${items.map((item) => `    ${jsonInline(item)}`).join(',\n')}\n  ]`;
  const lines = [
    `  "base": ${JSON.stringify(manifest.base)},`,
    `  "generatedAt": ${JSON.stringify(manifest.generatedAt)},`,
    `  "groups": ${list(manifest.groups)},`,
    `  "photos": ${list(manifest.photos)}`,
  ];
  return `{\n${lines.join('\n')}\n}\n`;
}

function makeManifest(total) {
  const current = readJson(MANIFEST);
  const date = readJson(EVENTO).date;
  const groupIds = current.groups.map((group) => group.id);
  const windows = groupWindows(readJson(MANGAS));
  for (const id of groupIds) {
    if (!windows.has(id)) fail(`El grupo «${id}» del manifest no está en mangas.json.`);
  }

  // Las de siempre se conservan tal cual; las generadas se rehacen cada vez.
  const kept = current.photos.filter((photo) => cameraNumber(photo.id) < FIRST_GENERATED);
  if (total < kept.length)
    fail(`--make-manifest ${total}: ya hay ${kept.length} fotos de siempre.`);
  const quota = quotas(total, groupIds);
  const keptIn = (id) => kept.filter((photo) => photo.group === id).length;

  const rng = mulberry32(SEED);
  const raw = [];
  for (const id of groupIds) {
    const [from, to] = windows.get(id);
    const missing = Math.max(0, quota.get(id) - keptIn(id));
    for (let count = 0; count < missing; count++) {
      const shape =
        SHAPES[
          weightedIndex(
            rng,
            SHAPES.map((item) => item.weight),
          )
        ];
      const long =
        rng() < LONG_SIDE.capShare ? LONG_SIDE.cap : randInt(rng, LONG_SIDE.min, LONG_SIDE.cap);
      const short = Math.round((long * Math.min(shape.w, shape.h)) / Math.max(shape.w, shape.h));
      raw.push({
        group: id,
        at: from + Math.floor(rng() * (to - from)),
        w: shape.w > shape.h ? long : short,
        h: shape.w > shape.h ? short : long,
      });
    }
  }

  // El número de cámara sigue a la hora, como en una cámara de verdad.
  raw.sort((a, b) => a.at - b.at || a.group.localeCompare(b.group));
  const raceIds = groupIds.filter((id) => {
    const group = current.groups.find((item) => item.id === id);
    return group.categories.length > 0;
  });
  const plates = buildPlates(rng, raceIds);
  const generated = raw.map((photo, index) => {
    const hex = randInt(rng, 0, 0xffff).toString(16).padStart(4, '0');
    const local = plates.filter((plate) => plate.home === photo.group);
    const pool = local.length > 0 ? local : plates;
    return {
      id: `dsc-${FIRST_GENERATED + index}-${hex}`,
      group: photo.group,
      w: photo.w,
      h: photo.h,
      taken: toIso(date, photo.at),
      placas: rng() < PLATED_SHARE ? pickPlates(rng, pool) : [],
    };
  });

  const photos = [...kept, ...generated].sort(byTakenThenId);
  writeFileSync(MANIFEST, formatManifest({ ...current, photos }));

  const perGroup = groupIds.map((id) => `${id} ${photos.filter((p) => p.group === id).length}`);
  const tagged = photos.filter((photo) => photo.placas.length > 0);
  const uses = new Map();
  for (const number of tagged.flatMap((photo) => photo.placas)) {
    uses.set(number, (uses.get(number) ?? 0) + 1);
  }
  const [topPlate, topCount] = [...uses].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? [0, 0];
  console.log(
    `Manifest de prueba: ${photos.length} fotos (${kept.length} de siempre + ${generated.length} generadas) en ${MANIFEST.replace(`${ROOT}/`, '')}`,
  );
  console.log(`  ${perGroup.join(' · ')}`);
  console.log(
    `  ${tagged.length} con placa, ${uses.size} placas distintas; la más repetida, ${topPlate}, en ${topCount} fotos`,
  );
}

// ─── Banco de fotos ────────────────────────────────────────────────────────────

/** Mismos tamaños y calidades que `valida-fotos.mjs`, para que pesen parecido. */
const THUMB = { dir: 'thumb', ext: 'webp', size: 480, quality: 70, type: 'image/webp' };
const WEB = { dir: 'web', ext: 'webp', size: 1600, quality: 78, type: 'image/webp' };
const ORIGINAL = { dir: 'original', ext: 'jpg', quality: 90, type: 'image/jpeg' };
const KINDS = { thumb: THUMB, web: WEB, original: ORIGINAL };

/**
 * Proporciones del banco. Una foto del manifest toma la más cercana; `max`
 * limita las fuentes de las raras (solo las usan tres fotos de siempre).
 */
const RATIOS = [
  { key: '3x2', w: 3, h: 2 },
  { key: '4x3', w: 4, h: 3 },
  { key: '2x3', w: 2, h: 3 },
  { key: '3x4', w: 3, h: 4 },
  { key: '1200x630', w: 1200, h: 630, max: 3 },
  { key: '9x16', w: 9, h: 16, max: 3 },
];

/** Fotos fuente con su orientación; el nombre del archivo no sale del banco (lleva nombres). */
async function loadSources() {
  const files = readdirSync(SOURCE_DIR)
    .filter((file) => file.endsWith('.webp') && !/^(afiche|og)-/.test(file))
    .sort();
  if (files.length === 0) fail(`No hay fotos fuente en ${SOURCE_DIR}`);
  const sources = [];
  for (const file of files) {
    const path = join(SOURCE_DIR, file);
    const { width, height } = await sharp(path).metadata();
    const name = createHash('sha1').update(file).digest('hex').slice(0, 6);
    sources.push({ name, path, width, height, portrait: height > width });
  }
  return sources;
}

/** Qué fuentes alimentan cada proporción: las horizontales las apaisadas y al revés. */
function planBank(sources) {
  return new Map(
    RATIOS.map((ratio) => {
      const portrait = ratio.h > ratio.w;
      const pool = sources.filter((source) => source.portrait === portrait);
      if (pool.length === 0)
        fail(`No hay fotos fuente ${portrait ? 'verticales' : 'horizontales'}.`);
      return [ratio.key, ratio.max ? pool.slice(0, ratio.max) : pool];
    }),
  );
}

const bankFile = (kind, source, ratio) =>
  join(BANK, kind.dir, `${source.name}-${ratio.key}.${kind.ext}`);

/** Recorte centrado de la fuente a la proporción pedida, el más grande que cabe. */
function cropRect({ width, height }, { w, h }) {
  const wider = width * h > height * w;
  const cropWidth = wider ? Math.round((height * w) / h) : width;
  const cropHeight = wider ? height : Math.round((width * h) / w);
  return {
    left: Math.floor((width - cropWidth) / 2),
    top: Math.floor((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

/** Escribe a un temporal y renombra: una interrupción no deja un archivo a medias. */
async function save(image, file) {
  const temporary = `${file}.tmp`;
  await image.toFile(temporary);
  renameSync(temporary, file);
}

async function ensureBank(plan, regen) {
  for (const kind of Object.values(KINDS)) mkdirSync(join(BANK, kind.dir), { recursive: true });
  const fit = (size) => ({ width: size, height: size, fit: 'inside', withoutEnlargement: true });

  let entries = 0;
  let written = 0;
  let bytes = 0;
  for (const ratio of RATIOS) {
    for (const source of plan.get(ratio.key)) {
      entries += 1;
      const files = Object.values(KINDS).map((kind) => bankFile(kind, source, ratio));
      if (regen || !files.every((file) => existsSync(file))) {
        const base = sharp(source.path).extract(cropRect(source, ratio));
        await save(
          base.clone().resize(fit(WEB.size)).webp({ quality: WEB.quality }),
          bankFile(WEB, source, ratio),
        );
        await save(
          base.clone().resize(fit(THUMB.size)).webp({ quality: THUMB.quality }),
          bankFile(THUMB, source, ratio),
        );
        await save(
          base.clone().jpeg({ quality: ORIGINAL.quality }),
          bankFile(ORIGINAL, source, ratio),
        );
        written += 1;
      }
      bytes += files.reduce((sum, file) => sum + statSync(file).size, 0);
    }
  }
  const mb = (bytes / 1024 / 1024).toFixed(1).replace('.', ',');
  console.log(
    `Banco: ${entries} imágenes (${entries * 3} archivos, ${mb} MB), ${written} generadas ahora, en ${BANK.replace(homedir(), '~')}`,
  );
}

const hash32 = (text) => createHash('sha1').update(text).digest().readUInt32BE(0);

/** Fotos seguidas de una misma orientación que no repiten imagen del banco. */
const NO_REPEAT_WINDOW = 11;

/**
 * Imagen del banco de cada foto del manifest: la proporción más cercana y, en
 * ella, la fuente que marca el hash del id. Con 14 fuentes horizontales para
 * unas 230 fotos, el hash a secas repite imágenes contiguas (se vio en la
 * primera fila), así que se salta la que ya salió en las 11 fotos anteriores
 * de esa orientación, en el orden del manifest (la hora). Sigue siendo
 * determinista: la misma lista de fotos da siempre las mismas imágenes.
 */
function assignBank(photos, plan) {
  const recent = { portrait: [], landscape: [] };
  const assigned = new Map();
  for (const photo of photos) {
    const target = Math.log(photo.w / photo.h);
    const ratio = RATIOS.reduce((best, item) =>
      Math.abs(Math.log(item.w / item.h) - target) < Math.abs(Math.log(best.w / best.h) - target)
        ? item
        : best,
    );
    const pool = plan.get(ratio.key);
    const lately = recent[ratio.h > ratio.w ? 'portrait' : 'landscape'];
    const start = hash32(photo.id) % pool.length;
    let source = pool[start];
    for (let step = 0; step < pool.length; step++) {
      const candidate = pool[(start + step) % pool.length];
      if (!lately.includes(candidate.name)) {
        source = candidate;
        break;
      }
    }
    lately.push(source.name);
    if (lately.length > NO_REPEAT_WINDOW) lately.shift();
    assigned.set(photo.id, { ratio, source });
  }
  return assigned;
}

// ─── Servidor ──────────────────────────────────────────────────────────────────

/** Mismo patrón de id que `PHOTO_ID` de schemas.ts: nunca cabe una ruta ni un `..`. */
const PHOTO_ROUTE = /^\/(thumb|web|original)\/([A-Za-z0-9][A-Za-z0-9_-]*)\.(webp|jpg)$/;

function startServer(plan, port) {
  let cache = { mtimeMs: -1, base: '', entries: new Map() };

  /** Imagen del banco de cada id del manifest; se relee el archivo cuando cambia. */
  function bankEntries() {
    try {
      const { mtimeMs } = statSync(MANIFEST);
      if (mtimeMs !== cache.mtimeMs) {
        const manifest = readJson(MANIFEST);
        cache = { mtimeMs, base: manifest.base, entries: assignBank(manifest.photos, plan) };
      }
    } catch (error) {
      console.warn(`No se pudo leer el manifest de prueba (se usa el anterior): ${error.message}`);
    }
    return cache.entries;
  }

  const server = createServer((req, res) => {
    const send = (status, headers = {}) => {
      res.writeHead(status, headers);
      res.end();
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, { Allow: 'GET, HEAD' });

    // La ruta cruda, sin normalizar: lo que no calce exacto con PHOTO_ROUTE no se sirve.
    let pathname;
    try {
      pathname = decodeURIComponent((req.url ?? '/').split(/[?#]/, 1)[0]);
    } catch {
      return send(400);
    }

    const match = PHOTO_ROUTE.exec(pathname);
    const kind = match ? KINDS[match[1]] : undefined;
    const entry = match ? bankEntries().get(match[2]) : undefined;
    if (!kind || !entry || match[3] !== kind.ext) {
      console.warn(`404 ${pathname}`);
      return send(404);
    }

    const file = normalize(bankFile(kind, entry.source, entry.ratio));
    let size;
    try {
      if (!file.startsWith(BANK + sep)) throw new Error('fuera del banco');
      size = statSync(file).size;
    } catch {
      console.warn(`404 ${pathname} (falta ${file}; corre con --regen)`);
      return send(404);
    }

    const headers = {
      'Content-Type': kind.type,
      'Content-Length': size,
      'Cache-Control': 'no-cache',
    };
    if (kind === ORIGINAL) headers['Content-Disposition'] = 'attachment';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    pipeline(createReadStream(file), res, () => {});
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      fail(
        `El puerto ${port} está ocupado. ¿Ya hay una vista previa corriendo? Páralo con: lsof -ti tcp:${port} -sTCP:LISTEN | xargs kill`,
      );
    }
    throw error;
  });
  server.listen(port, () => {
    const count = bankEntries().size;
    console.log(
      `Fotos de prueba en http://localhost:${port} (${count} del manifest; Ctrl+C para parar)`,
    );
    if (new URL(cache.base).origin !== `http://localhost:${port}`) {
      console.warn(
        `Ojo: el manifest de prueba apunta a ${cache.base}, no a este puerto: la página no verá estas fotos.`,
      );
    }
    console.log('En otra terminal: VALIDA_PREVIEW=true npm run dev');
  });
}

// ─── Programa ──────────────────────────────────────────────────────────────────

const flags = parseFlags();
if (flags.help) {
  console.log(HELP);
} else if (flags.makeManifest !== null) {
  makeManifest(flags.makeManifest);
} else {
  const plan = planBank(await loadSources());
  await ensureBank(plan, flags.regen);
  if (flags.serve) startServer(plan, flags.port);
}
