#!/usr/bin/env node
/**
 * Procesa las fotos oficiales de la VI Válida Copa Valle (Yumbo, 18-oct-2026):
 * de los JPG que entrega el fotógrafo saca todo lo que necesita la galería.
 *
 * Uso:
 *   node scripts/valida-fotos.mjs --src <carpeta con los originales> [opciones]
 *   npm run valida:fotos -- --src <carpeta> [opciones]
 *
 * Por cada JPG de `--src` (se recorre entera, sin modificarla) escribe en `--out`
 * (por defecto `~/Trocha-media/valida-yumbo-2026`):
 *   thumb/<id>.webp     480 px, para la cuadrícula
 *   web/<id>.webp       1600 px, para el visor
 *   original/<id>.jpg   el original SIN EXIF/XMP/IPTC/GPS y con la orientación ya
 *                       aplicada a los píxeles (sin recomprimir, con `jpegtran`)
 *   manifest.json       lo que lee la página; se copia a src/data/valida-yumbo-2026/fotos.json
 *   .htaccess           sin listado de carpetas, fuera de buscadores, caché de 30 días
 *   original/.htaccess  Content-Disposition: attachment (que «Descargar» descargue
 *                       también en iPhone)
 *
 * Cada foto cae en la manga cuya hora de salida (`src/data/valida-yumbo-2026/
 * mangas.json`) es la última anterior a su hora de captura EXIF. Corrige las
 * horas reales en ese archivo ANTES de correr el script.
 *
 * El id de una foto es `<nombre-del-archivo>-<4 hex del SHA-1 del contenido>`:
 * sobrevive a correr el script de nuevo (los enlaces compartidos siguen
 * sirviendo) y dos cámaras con un `DSC_0001` no chocan. Es idempotente: salta lo
 * que ya existe salvo `--force`, así que se puede interrumpir y repetir.
 *
 * Nivel «por deportista»: con `--familiar <lista.txt>` (un id por línea) esas
 * fotos no entran al manifest ni a thumb/web/original; el original limpio va a
 * `<out>-familiar/<id>.jpg` con su propio `familiar-manifest.json`. Esa carpeta
 * es hermana de `--out` y NO debe subirse al hosting con el resto.
 *
 * Privacidad: ningún archivo de salida lleva EXIF, GPS ni número de serie, y el
 * script lo verifica en cada original antes de darlo por bueno.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, open, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import sharp from 'sharp';

// Node importa los .ts de src/lib directamente (type stripping). Como el
// package.json no declara "type", avisa en cada carga (MODULE_TYPELESS_PACKAGE_JSON):
// ruido para quien solo procesa fotos. Se filtra ese aviso y pasan todos los demás.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.code === 'MODULE_TYPELESS_PACKAGE_JSON') return;
  console.warn(`${warning.name}: ${warning.message}`);
});
let jpegMeta;
let valida;
try {
  jpegMeta = await import('../src/lib/jpeg-meta.ts');
  valida = await import('../src/lib/valida.ts');
} catch (error) {
  if (error.code !== 'ERR_UNKNOWN_FILE_EXTENSION') throw error;
  console.error(
    `Este script importa TypeScript directamente y necesita Node 22.18 o más nuevo (tienes ${process.versions.node}).`,
  );
  process.exit(1);
}
const { JPEG_MARKER, exifDateToIso, parseJpegSegments, readExif, stripJpegMetadata } = jpegMeta;
const { assignGroup, assignGroupByFolder } = valida;

const run = promisify(execFile);

// ─── Configuración ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'data', 'valida-yumbo-2026');
const MANGAS_FILE = path.join(DATA_DIR, 'mangas.json');
const EVENTO_FILE = path.join(DATA_DIR, 'evento.json');
const CARPETAS_FILE = path.join(DATA_DIR, 'carpetas.json');
const FOTOS_FILE = path.join(DATA_DIR, 'fotos.json');
const OG_REPO_FILE = path.join(ROOT, 'public', 'images', 'valida-yumbo-2026', 'og.jpg');
const OG_PUBLIC_PATH = '/images/valida-yumbo-2026/og.jpg';

const MEDIA_BASE = 'https://clubdeportivotrochayruta.org/media/valida-yumbo-2026';
const DEFAULT_OUT = '~/Trocha-media/valida-yumbo-2026';

const THUMB = { dir: 'thumb', size: 480, quality: 70 };
const WEB = { dir: 'web', size: 1600, quality: 78 };
/** WhatsApp no muestra la vista previa si la imagen pesa más de ~300 KB. */
const OG = { width: 1200, height: 630, maxBytes: 300_000, minQuality: 40, maxQuality: 95 };
const CONCURRENCY = Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));
/** Con 2 MB sobra para cualquier cabecera JPEG (el EXIF y el ICC rara vez pasan de 100 KB). */
const HEAD_BYTES = 2 * 1024 * 1024;
const TEMP_ROOTS = ['/tmp', '/private/tmp', '/var/tmp', '/private/var/tmp', os.tmpdir()];

/**
 * Orientación EXIF → operación de `jpegtran` que la aplica a los píxeles sin
 * recomprimir. Comprobado con las 8 orientaciones contra `sharp.rotate()`: la
 * diferencia de píxeles es exactamente cero.
 */
const JPEGTRAN_OPS = {
  1: [],
  2: ['-flip', 'horizontal'],
  3: ['-rotate', '180'],
  4: ['-flip', 'vertical'],
  5: ['-transpose'],
  6: ['-rotate', '90'],
  7: ['-transverse'],
  8: ['-rotate', '270'],
};

const HTACCESS_ROOT = `# Fotos oficiales de la VI Válida Copa Valle (Yumbo, 2026).
# Lo genera scripts/valida-fotos.mjs: no se edita a mano.
Options -Indexes

<IfModule mod_headers.c>
  # Fuera de Google (Imágenes incluido): solo se indexa la página del evento.
  Header set X-Robots-Tag "noindex, noimageindex"

  # Caché de 30 días. Va dentro de FilesMatch a propósito: el .htaccess de la
  # raíz fija max-age=3600 para las imágenes con otro FilesMatch, y Apache
  # aplica los <FilesMatch> de todos los niveles DESPUÉS de las directivas
  # sueltas, de modo que un Header set suelto aquí perdería contra el de la raíz.
  <FilesMatch "\\.(jpe?g|webp)$">
    Header set Cache-Control "public, max-age=2592000, immutable"
  </FilesMatch>
</IfModule>
`;

const HTACCESS_ORIGINAL = `# Los originales se descargan en vez de abrirse: así «Descargar» también
# descarga en iPhone (que de otro modo abre la foto en el navegador).
<IfModule mod_headers.c>
  Header set Content-Disposition "attachment"
</IfModule>
`;

// ─── Línea de comandos ─────────────────────────────────────────────────────────

class UsageError extends Error {}

const HELP = `Uso: node scripts/valida-fotos.mjs --src <carpeta> [opciones]

Genera miniaturas, versiones web y originales limpios de las fotos de la válida,
las asigna a su manga por la hora EXIF y escribe el manifest de la página.

Opciones:
  --src <carpeta>      Carpeta con los JPG originales (se recorre entera; no se modifica).
  --out <carpeta>      Salida. Por defecto ${DEFAULT_OUT}
  --familiar <lista>   Archivo con un id por línea: esas fotos van a <out>-familiar/
                       y no entran al manifest ni a thumb/web/original.
  --og <id>            Escribe public/images/valida-yumbo-2026/og.jpg (1200×630,
                       menos de 300 KB) a partir de esa foto.
  --force              Regenera lo que ya existe (por defecto se salta).
  --dry-run            Solo lista lo que haría; no escribe nada.
  --no-data            No copia el manifest a src/data/valida-yumbo-2026/fotos.json
                       (ni escribe el og en el repo). Se activa solo si --out está en /tmp.
  -h, --help           Muestra esta ayuda.

Antes de correrlo, anota las horas reales de salida en
src/data/valida-yumbo-2026/mangas.json.`;

function parseCli(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        src: { type: 'string' },
        out: { type: 'string' },
        familiar: { type: 'string' },
        og: { type: 'string' },
        force: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        'no-data': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: false,
      strict: true,
    });
  } catch (error) {
    throw new UsageError(`Argumentos no válidos: ${error.message}`);
  }
  const args = parsed.values;
  if (args.help) return args;
  if (!args.src) throw new UsageError('Falta --src <carpeta con los originales>.');
  return args;
}

// ─── Utilidades ────────────────────────────────────────────────────────────────

function expandHome(value) {
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isTemporary(dir) {
  return TEMP_ROOTS.some((root) => isInside(dir, root));
}

function repoRelative(file) {
  return path.relative(ROOT, file);
}

async function nonEmptyFile(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Hora de Colombia (UTC−5, sin horario de verano) como ISO local, sin depender de la zona del Mac. */
function toColombiaIso(date) {
  return `${new Date(date.getTime() - 5 * 3600 * 1000).toISOString().slice(0, 19)}-05:00`;
}

function slugify(fileName) {
  const slug = fileName
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return slug || 'foto';
}

/** Id estable: slug del nombre + 4 hex del SHA-1; si choca con otra foto distinta, alarga el hash. */
function makeUniqueId(fileName, sha1, usedIds) {
  const slug = slugify(fileName);
  for (let length = 4; length <= sha1.length; length += 2) {
    const id = `${slug}-${sha1.slice(0, length)}`;
    if (!usedIds.has(id) || usedIds.get(id) === sha1) {
      usedIds.set(id, sha1);
      return id;
    }
  }
  throw new Error(`No pude armar un id único para ${fileName}`);
}

/** Archivo temporal junto al destino, con la misma extensión (sharp la usa para elegir el formato). */
function tempPath(destination) {
  const { dir, name, ext } = path.parse(destination);
  return path.join(dir, `.${name}.tmp${ext}`);
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

const mb = (bytes) =>
  (bytes / 1048576).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const kb = (bytes) => Math.round(bytes / 1000).toLocaleString('es-CO');
const firstLine = (text) =>
  String(text ?? '')
    .trim()
    .split('\n')[0];

/** Escribe solo si el contenido cambió. Devuelve `true` si escribió. */
async function writeIfChanged(file, content) {
  try {
    if ((await readFile(file, 'utf8')) === content) return false;
  } catch {
    // no existe todavía
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
  return true;
}

// ─── Entradas: datos del evento, herramientas y archivos ──────────────────────

async function readMangas() {
  let data;
  try {
    data = await readJson(MANGAS_FILE);
  } catch (error) {
    throw new Error(`No pude leer ${repoRelative(MANGAS_FILE)}: ${error.message}`);
  }
  const groups = data.groups;
  if (!Array.isArray(groups) || groups.length === 0) {
    throw new Error(`${repoRelative(MANGAS_FILE)} no define ningún grupo.`);
  }
  const seen = new Set();
  for (const group of groups) {
    if (typeof group.id !== 'string' || group.id === '' || typeof group.label !== 'string') {
      throw new Error(`${repoRelative(MANGAS_FILE)}: cada grupo necesita «id» y «label».`);
    }
    if (seen.has(group.id))
      throw new Error(`${repoRelative(MANGAS_FILE)}: el grupo «${group.id}» está repetido.`);
    seen.add(group.id);
    if (group.start !== null && !/^\d{1,2}:\d{2}(:\d{2})?$/.test(group.start ?? '')) {
      throw new Error(
        `El grupo «${group.id}» tiene una hora de salida que no entiendo (${JSON.stringify(group.start)}): usa "HH:MM" o null.`,
      );
    }
  }
  return groups;
}

async function readEventDate() {
  try {
    const { date } = await readJson(EVENTO_FILE);
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * `jpegtran` (libjpeg-turbo): para girar y limpiar sin recomprimir. `null` si no
 * está. `JPEGTRAN=/ruta/a/jpegtran` fija el binario; `JPEGTRAN=none` lo desactiva
 * (sirve para probar el camino de respaldo).
 */
async function findJpegtran() {
  if (process.env.JPEGTRAN === 'none') return null;
  const candidates = [
    process.env.JPEGTRAN,
    'jpegtran',
    '/opt/homebrew/bin/jpegtran',
    '/usr/local/bin/jpegtran',
  ];
  for (const candidate of candidates.filter(Boolean)) {
    try {
      await run(candidate, ['-version']);
      return candidate;
    } catch {
      // no existe o no es la versión que entiende -version: se prueba el siguiente
    }
  }
  return null;
}

async function findJpegs(root) {
  const found = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      // Los `._*` (AppleDouble al copiar a discos externos) y `__MACOSX` (zips de Mac) no son fotos.
      if (entry.name.startsWith('.') || entry.name === '__MACOSX') continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && /\.jpe?g$/i.test(entry.name)) found.push(full);
    }
  }
  await walk(root);
  return found;
}

/**
 * Archivos con el mismo contenido que otro anterior (`copia → ganador`). Gana el
 * primero en orden alfabético, así que el id de la foto no depende de qué copia
 * terminó de leerse antes. Solo se leen los archivos que comparten tamaño en bytes.
 */
async function findDuplicates(files) {
  const bySize = new Map();
  for (const file of files) {
    const { size } = await stat(file);
    bySize.set(size, [...(bySize.get(size) ?? []), file]);
  }
  const losers = new Map();
  for (const group of bySize.values()) {
    if (group.length < 2) continue;
    const winners = new Map();
    for (const file of group) {
      const sha1 = createHash('sha1')
        .update(await readFile(file))
        .digest('hex');
      if (winners.has(sha1)) losers.set(file, winners.get(sha1));
      else winners.set(sha1, file);
    }
  }
  return losers;
}

/** Un id por línea; tolera `# comentarios`, rutas y extensiones (`thumb/dsc-0001-ab12.webp`). */
async function readFamiliarList(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    throw new Error(`No encuentro la lista de --familiar: ${file}`);
  }
  const ids = new Set();
  for (const line of text.split(/\r?\n/)) {
    const content = line
      .replace(/(^|\s)#.*/, '')
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    if (!content) continue;
    // Una ruta (p. ej. pegada desde Finder con ⌥⌘C) vale entera aunque lleve espacios;
    // si no, puede haber varios ids en la misma línea, separados por espacios o comas.
    const tokens = content.includes('/') ? [content] : content.split(/[\s,]+/);
    for (const token of tokens) {
      const id = path
        .basename(token)
        .replace(/\.(webp|jpe?g)$/i, '')
        .toLowerCase();
      if (id) ids.add(id);
    }
  }
  return ids;
}

/** El manifest previo más reciente de los candidatos, para saber qué fotos salieron. */
async function loadPreviousManifest(candidates) {
  let best = null;
  for (const file of candidates) {
    try {
      const [data, info] = await Promise.all([readJson(file), stat(file)]);
      if (!Array.isArray(data.photos)) continue;
      if (!best || info.mtimeMs > best.mtimeMs) best = { file, data, mtimeMs: info.mtimeMs };
    } catch {
      // no existe o no es JSON: se ignora
    }
  }
  if (!best) return null;
  return { file: best.file, ids: new Set(best.data.photos.map((photo) => photo.id)) };
}

// ─── Salidas por foto ──────────────────────────────────────────────────────────

async function writeWebp(buffer, destination, { size, quality }) {
  const temp = tempPath(destination);
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    // `.rotate()` sin argumentos aplica la orientación EXIF; sin `.withMetadata()`
    // el resultado no lleva EXIF, GPS ni perfil (los colores se pasan a sRGB).
    const info = await sharp(buffer, { failOn: 'truncated' })
      .rotate()
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toFile(temp);
    await rename(temp, destination);
    return info;
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}

/** Miniatura y versión web; devuelve el ancho y el alto de la web (los que reserva la página). */
async function ensureWebVariants(buffer, id, ctx) {
  const webFile = path.join(ctx.outDir, WEB.dir, `${id}.webp`);
  const thumbFile = path.join(ctx.outDir, THUMB.dir, `${id}.webp`);
  let dimensions;
  if (ctx.force || !(await nonEmptyFile(webFile))) {
    const info = await writeWebp(buffer, webFile, WEB);
    dimensions = { w: info.width, h: info.height };
  } else {
    const meta = await sharp(webFile).metadata();
    dimensions = { w: meta.width, h: meta.height };
  }
  if (ctx.force || !(await nonEmptyFile(thumbFile))) await writeWebp(buffer, thumbFile, THUMB);
  return dimensions;
}

/** Comprueba que un original quedó entero y sin metadatos personales. Lanza si no. */
async function verifyCleanJpeg(file) {
  const { size } = await stat(file);
  if (size < 4) throw new Error('el original quedó vacío');
  const handle = await open(file, 'r');
  let head;
  const tail = Buffer.alloc(2);
  try {
    head = Buffer.alloc(Math.min(size, HEAD_BYTES));
    await handle.read(head, 0, head.length, 0);
    await handle.read(tail, 0, 2, size - 2);
  } finally {
    await handle.close();
  }
  if (head[0] !== 0xff || head[1] !== 0xd8) throw new Error('el original no empieza por FF D8');
  if (tail[0] !== 0xff || tail[1] !== 0xd9) throw new Error('el original no termina en FF D9');

  let bytes = head;
  let segments = parseJpegSegments(bytes);
  if (segments.at(-1)?.marker !== JPEG_MARKER.SOS && size > head.length) {
    bytes = await readFile(file);
    segments = parseJpegSegments(bytes);
  }
  const forbidden = new Set([JPEG_MARKER.APP1, JPEG_MARKER.APP13, JPEG_MARKER.COM]);
  if (segments.some((segment) => forbidden.has(segment.marker))) {
    throw new Error('al original le quedaron segmentos de metadatos (APP1/APP13/COM)');
  }
  const exif = readExif(bytes);
  if (exif.hasGps || exif.hasSerial || exif.dateTimeOriginal) {
    throw new Error('al original le quedó EXIF');
  }
}

/** ¿`jpegtran -trim` recortó bordes? Compara el tamaño de salida con el que debía tener. */
async function wasTrimmed(buffer, outputFile, orientation) {
  const [source, output] = await Promise.all([
    sharp(buffer).metadata(),
    sharp(outputFile).metadata(),
  ]);
  const swap = orientation >= 5;
  const expected = swap
    ? { w: source.height, h: source.width }
    : { w: source.width, h: source.height };
  return output.width !== expected.w || output.height !== expected.h;
}

/**
 * Copia limpia del original: sin EXIF/XMP/IPTC/GPS y con la orientación aplicada
 * a los píxeles. Con `jpegtran` no se recomprime ni un píxel; sin él, o si falla,
 * se quitan los metadatos byte a byte y, solo si la foto necesitaba girar, se
 * recomprime con sharp a calidad 95.
 */
async function writeCleanOriginal({ file, buffer, destination, orientation, ctx }) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temp = tempPath(destination);
  const rotate = orientation !== null && orientation > 1;
  let method = null;
  let trimmed = false;

  if (ctx.jpegtran) {
    try {
      const operation = JPEGTRAN_OPS[orientation ?? 1];
      // -trim: si el tamaño no es múltiplo del bloque (8 o 16 px), jpegtran no puede
      // girar el borde sin dejar basura; con -trim lo descarta (hasta 15 px).
      const args = [
        '-copy',
        'icc',
        ...operation,
        ...(operation.length > 0 ? ['-trim'] : []),
        '-optimize',
        '-outfile',
        temp,
        file,
      ];
      await run(ctx.jpegtran, args);
      method = rotate ? 'jpegtran-girada' : 'jpegtran';
      if (rotate) trimmed = await wasTrimmed(buffer, temp, orientation);
    } catch (error) {
      ctx.notes.add(
        `jpegtran falló con ${path.basename(file)} (${firstLine(error.stderr || error.message)}): usé el camino de respaldo.`,
      );
      await rm(temp, { force: true });
    }
  }

  if (!method) {
    if (rotate) {
      const output = await sharp(buffer, { failOn: 'truncated' })
        .rotate()
        .keepIccProfile()
        .jpeg({ quality: 95 })
        .toBuffer();
      await writeFile(temp, output);
      method = 'sharp-q95';
    } else {
      await writeFile(temp, stripJpegMetadata(buffer, { keepIcc: true }));
      method = 'strip';
    }
  }

  try {
    await verifyCleanJpeg(temp);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
  await rename(temp, destination);
  return { method, trimmed };
}

/** Quita de thumb/web/original lo que una corrida anterior generó para una foto que ahora es «familiar». */
async function retirePublicFiles(id, ctx) {
  let retired = false;
  for (const file of [
    path.join(ctx.outDir, THUMB.dir, `${id}.webp`),
    path.join(ctx.outDir, WEB.dir, `${id}.webp`),
    path.join(ctx.outDir, 'original', `${id}.jpg`),
  ]) {
    if (await nonEmptyFile(file)) {
      await rm(file, { force: true });
      retired = true;
    }
  }
  return retired;
}

/** Fecha de captura: EXIF original, luego la de modificación del EXIF y, al final, la del archivo. */
async function resolveTaken(file, exif) {
  const original = exifDateToIso(exif.dateTimeOriginal);
  if (original) return { taken: original, source: 'exif' };
  const modified = exifDateToIso(exif.dateTime);
  if (modified) return { taken: modified, source: 'exif-modificacion' };
  return { taken: toColombiaIso((await stat(file)).mtime), source: 'archivo' };
}

async function processPhoto(file, ctx, state) {
  // En los avisos va la ruta relativa a --src: hay `DSC_0001` en más de una carpeta.
  const name = path.relative(ctx.srcDir, file);
  try {
    // Dos copias del mismo archivo (la misma foto en dos carpetas) valen una sola vez.
    const winner = ctx.duplicates.get(file);
    if (winner) return { kind: 'duplicada', name, twin: path.relative(ctx.srcDir, winner) };

    const buffer = await readFile(file);
    const sha1 = createHash('sha1').update(buffer).digest('hex');
    const id = makeUniqueId(path.basename(file), sha1, state.usedIds);
    const exif = readExif(buffer);
    const { taken, source } = await resolveTaken(file, exif);
    const record = {
      kind: 'ok',
      id,
      name,
      size: buffer.length,
      // La carpeta del fotógrafo manda; la hora EXIF solo si la carpeta no está en el mapa.
      group: assignGroupByFolder(name, ctx.folders, ctx.groups) ?? assignGroup(taken, ctx.groups),
      taken,
      source,
      orientation: exif.orientation,
      hasGps: exif.hasGps,
      hasSerial: exif.hasSerial,
      familiar: ctx.familiarIds.has(id),
      w: null,
      h: null,
      method: null,
      trimmed: false,
      retired: false,
    };

    if (!ctx.dryRun) {
      if (record.familiar) {
        record.retired = await retirePublicFiles(id, ctx);
        const destination = path.join(ctx.familiarDir, `${id}.jpg`);
        if (ctx.force || !(await nonEmptyFile(destination))) {
          Object.assign(
            record,
            await writeCleanOriginal({
              file,
              buffer,
              destination,
              orientation: exif.orientation,
              ctx,
            }),
          );
        } else {
          record.method = 'existente';
        }
        const meta = await sharp(destination).metadata();
        record.w = meta.width;
        record.h = meta.height;
      } else {
        const dimensions = await ensureWebVariants(buffer, id, ctx);
        record.w = dimensions.w;
        record.h = dimensions.h;
        const destination = path.join(ctx.outDir, 'original', `${id}.jpg`);
        if (ctx.force || !(await nonEmptyFile(destination))) {
          Object.assign(
            record,
            await writeCleanOriginal({
              file,
              buffer,
              destination,
              orientation: exif.orientation,
              ctx,
            }),
          );
        } else {
          record.method = 'existente';
        }
      }
    }
    return record;
  } catch (error) {
    return { kind: 'fallida', name, error: error.message };
  }
}

// ─── Manifest ──────────────────────────────────────────────────────────────────

const byTakenThenId = (a, b) => {
  if (a.taken !== b.taken) return a.taken < b.taken ? -1 : 1;
  return a.id.localeCompare(b.id);
};

/** Orden del manifest sin hora: por carpeta del fotógrafo y luego por nombre de archivo, con números en orden natural. */
const byFolderThenName = (a, b) =>
  a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' });

/** JSON en una sola línea pero con espacios, como el `fotos.json` escrito a mano. */
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

/** Una línea por grupo y por foto: los diffs de git se leen y el archivo no se infla. */
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

function toManifestPhoto(record) {
  return {
    id: record.id,
    group: record.group,
    w: record.w,
    h: record.h,
    // Sin hora: la Canon va 2-3 h adelantada y sin un desfase fijo, y una hora falsa
    // en el visor es peor que ninguna. La página oculta la hora si `taken` está vacío.
    taken: '',
  };
}

// ─── Imagen para compartir (og:image) ──────────────────────────────────────────

/**
 * 1200×630 con la calidad más alta que quede por debajo de 300 KB (búsqueda
 * binaria). Parte del original limpio si existe (más resolución que la web) y
 * recorta una sola vez: la estrategia `attention` busca lo más llamativo de la
 * foto y es lo más caro del proceso.
 */
async function writeOgImage(id, ctx, target) {
  const candidates = [
    path.join(ctx.outDir, 'original', `${id}.jpg`),
    path.join(ctx.outDir, WEB.dir, `${id}.webp`),
  ];
  let source = null;
  for (const candidate of candidates) {
    if (await nonEmptyFile(candidate)) {
      source = candidate;
      break;
    }
  }
  if (!source) {
    throw new Error(
      `--og: no encuentro la foto «${id}» en ${ctx.outDir} (ni original ni web). Revisa el id.`,
    );
  }
  const { data, info } = await sharp(source, { failOn: 'truncated' })
    .rotate()
    .resize({
      width: OG.width,
      height: OG.height,
      fit: 'cover',
      position: sharp.strategy.attention,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const encode = (quality) =>
    sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

  let low = OG.minQuality;
  let high = OG.maxQuality;
  let best = null;
  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const buffer = await encode(quality);
    if (buffer.length < OG.maxBytes) {
      best = { quality, buffer };
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }
  if (!best) {
    throw new Error(
      `--og: ni con calidad ${OG.minQuality} la imagen baja de ${kb(OG.maxBytes)} KB. Prueba con otra foto.`,
    );
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, best.buffer);
  return { ...best, source };
}

// ─── Programa principal ────────────────────────────────────────────────────────

/** `carpetas.json`: carpeta del fotógrafo → grupo. Si falta, todo cae a la hora EXIF. */
async function readCarpetas() {
  try {
    return (await readJson(CARPETAS_FILE)).carpetas ?? {};
  } catch {
    return {};
  }
}

async function buildContext(args) {
  const srcDir = path.resolve(expandHome(args.src));
  const outDir = path.resolve(expandHome(args.out ?? DEFAULT_OUT));
  const familiarDir = `${outDir}-familiar`;

  let srcInfo;
  try {
    srcInfo = await stat(srcDir);
  } catch {
    throw new Error(`La carpeta --src no existe: ${srcDir}`);
  }
  if (!srcInfo.isDirectory())
    throw new Error(`--src tiene que ser una carpeta, no un archivo: ${srcDir}`);
  for (const target of [outDir, familiarDir]) {
    if (isInside(target, srcDir) || isInside(srcDir, target)) {
      throw new Error(`--src y --out no pueden estar uno dentro del otro (${srcDir} / ${target}).`);
    }
  }

  const familiarIds = args.familiar
    ? await readFamiliarList(path.resolve(expandHome(args.familiar)))
    : new Set();
  const ogId = args.og ? args.og.toLowerCase() : null;
  if (ogId && familiarIds.has(ogId)) {
    throw new Error(
      `--og: «${ogId}» está en la lista --familiar. El og:image es público: usa una foto de la galería abierta.`,
    );
  }

  return {
    srcDir,
    outDir,
    familiarDir,
    force: args.force,
    // `npm run valida:fotos --dry-run` (sin el `--`) se lo come npm: queda en el entorno.
    dryRun: args['dry-run'] || process.env.npm_config_dry_run === 'true',
    // Una corrida de prueba en /tmp nunca toca los archivos del repo.
    noData: args['no-data'] || isTemporary(outDir),
    ogId,
    familiarIds,
    groups: await readMangas(),
    folders: await readCarpetas(),
    eventDate: await readEventDate(),
    jpegtran: await findJpegtran(),
    notes: new Set(),
  };
}

/** Borra los temporales que dejó una corrida interrumpida: se subirían con el resto. */
async function removeStaleTemps(directories) {
  for (const directory of directories) {
    let names;
    try {
      names = await readdir(directory);
    } catch {
      continue;
    }
    for (const name of names) {
      if (/^\..*\.tmp\.(webp|jpg)$/.test(name))
        await rm(path.join(directory, name), { force: true });
    }
  }
}

function printProgress(done, total) {
  if (process.stdout.isTTY) {
    process.stdout.write(`\r  ${done}/${total} fotos…`);
  } else if (done % 50 === 0 || done === total) {
    console.log(`  ${done}/${total} fotos…`);
  }
}

function printSummary({ ctx, records, familiar, failures, duplicates, elapsedMs, removedIds }) {
  const clock = (taken) => taken.slice(11, 16);
  console.log('\nResumen por manga');
  console.log(`${'Manga'.padEnd(34)}${'Fotos'.padStart(7)}${'MB'.padStart(11)}   Desde  Hasta`);
  for (const group of ctx.groups) {
    const members = records.filter((record) => record.group === group.id).sort(byTakenThenId);
    const bytes = members.reduce((sum, record) => sum + record.size, 0);
    const label = `${group.label}${group.start ? ` (${group.start})` : ''}`.slice(0, 33);
    const range =
      members.length > 0
        ? `${clock(members[0].taken)}  ${clock(members.at(-1).taken)}`
        : '—      —';
    console.log(
      `${label.padEnd(34)}${String(members.length).padStart(7)}${mb(bytes).padStart(11)}   ${range}`,
    );
  }
  const totalBytes = records.reduce((sum, record) => sum + record.size, 0);
  console.log(
    `${'Total'.padEnd(34)}${String(records.length).padStart(7)}${mb(totalBytes).padStart(11)}`,
  );

  const all = [...records, ...familiar];
  const noExifDate = all.filter((record) => record.source === 'archivo');
  const modifyDate = all.filter((record) => record.source === 'exif-modificacion');
  const withGps = all.filter((record) => record.hasGps);
  const withSerial = all.filter((record) => record.hasSerial);
  const rotated = all.filter((record) => record.orientation !== null && record.orientation > 1);
  const trimmed = all.filter((record) => record.trimmed);
  const methodCount = (name) => all.filter((record) => record.method === name).length;
  const offDay = ctx.eventDate
    ? all.filter((record) => !record.taken.startsWith(ctx.eventDate))
    : [];

  const cleaned = ctx.dryRun ? 'se eliminará de los originales' : 'eliminado de los originales';
  console.log('\nTotales');
  console.log(`  Fotos en la galería:        ${records.length}`);
  console.log(`  Sin fecha EXIF:             ${noExifDate.length}`);
  console.log(
    `  Con GPS encontrado:         ${withGps.length}${withGps.length > 0 ? ` (${cleaned})` : ''}`,
  );
  console.log(`  Con número de serie EXIF:   ${withSerial.length}`);
  console.log(`  Rotadas por su orientación: ${rotated.length}`);
  console.log(`  Familiares (aparte):        ${familiar.length}`);

  const hints = [...ctx.notes];
  if (noExifDate.length > 0) {
    hints.push(
      `${noExifDate.length} foto(s) sin fecha EXIF: usé la fecha del archivo, que puede ser la de la copia (p. ej. ${noExifDate[0].name}). Revisa su manga.`,
    );
  }
  if (modifyDate.length > 0) {
    hints.push(
      `${modifyDate.length} foto(s) sin DateTimeOriginal: usé la fecha de modificación del EXIF, que en archivos exportados puede ser la hora de la exportación (p. ej. ${modifyDate[0].name}).`,
    );
  }
  if (offDay.length > 0) {
    hints.push(
      `${offDay.length} foto(s) con fecha distinta al ${ctx.eventDate} (p. ej. ${offDay[0].name}: ${offDay[0].taken.slice(0, 10)}): casi seguro el reloj de esa cámara. La manga se asignó solo por la hora del día.`,
    );
  }
  if (!ctx.jpegtran) {
    const install = 'jpegtran no está disponible (instálalo con «brew install jpeg-turbo»)';
    hints.push(
      ctx.dryRun
        ? `${install}: las ${rotated.length} foto(s) que hay que girar se recomprimirían a calidad 95; el resto se limpia sin recomprimir.`
        : `${install}: ${methodCount('strip')} original(es) limpiados byte a byte y ${methodCount('sharp-q95')} recomprimidos a calidad 95 para girarlos. Con jpegtran y --force quedan sin pérdida.`,
    );
  } else if (methodCount('sharp-q95') > 0) {
    hints.push(
      `${methodCount('sharp-q95')} original(es) se recomprimieron a calidad 95 porque jpegtran falló con ellos.`,
    );
  }
  if (trimmed.length > 0) {
    hints.push(
      `${trimmed.length} foto(s) giradas sin pérdida perdieron hasta 15 px de borde (su tamaño no es múltiplo del bloque JPEG).`,
    );
  }
  if (duplicates.length > 0) {
    hints.push(
      `${duplicates.length} archivo(s) repetido(s) (mismo contenido que otro) se saltaron, p. ej. ${duplicates[0].name} = ${duplicates[0].twin}.`,
    );
  }
  if (removedIds.length > 0) {
    hints.push(
      `${removedIds.length} id(s) del manifest anterior ya no están en --src y salieron del manifest (sus archivos siguen en ${ctx.outDir}).`,
    );
  }
  if (hints.length > 0) {
    console.log('\nAvisos');
    for (const hint of hints) console.log(`  · ${hint}`);
  }
  if (failures.length > 0) {
    console.log(
      `\nFallaron ${failures.length} foto(s) (no entran al manifest; arréglalas o quítalas de --src y vuelve a correr):`,
    );
    for (const failure of failures) console.log(`  ✗ ${failure.name}: ${failure.error}`);
  }
  console.log(`\nTiempo: ${(elapsedMs / 1000).toFixed(1)} s`);
}

async function main() {
  const args = parseCli(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }

  const startedAt = Date.now();
  const ctx = await buildContext(args);
  const files = await findJpegs(ctx.srcDir);
  ctx.duplicates = await findDuplicates(files);
  if (files.length === 0) {
    throw new Error(`No encontré ningún JPG (.jpg o .jpeg) en ${ctx.srcDir}.`);
  }

  console.log(`Fotos de la válida: ${files.length} JPG en ${ctx.srcDir}`);
  console.log(`Salida: ${ctx.outDir}${ctx.dryRun ? '  (--dry-run: no se escribe nada)' : ''}`);
  console.log(
    ctx.jpegtran
      ? `Originales: limpios y sin recomprimir (${ctx.jpegtran}).`
      : 'Originales: jpegtran no disponible; se limpian sin recomprimir y solo se recomprimen las que haya que girar.',
  );
  if (ctx.noData && !ctx.dryRun) {
    console.log(
      'No se tocan los archivos del repo (ruta temporal o --no-data): el manifest queda solo en la salida.',
    );
  }

  if (!ctx.dryRun) {
    await Promise.all(
      [THUMB.dir, WEB.dir, 'original'].map((dir) =>
        mkdir(path.join(ctx.outDir, dir), { recursive: true }),
      ),
    );
    await removeStaleTemps([
      path.join(ctx.outDir, THUMB.dir),
      path.join(ctx.outDir, WEB.dir),
      path.join(ctx.outDir, 'original'),
      ctx.familiarDir,
    ]);
  }

  // ── Procesar ──
  const state = { usedIds: new Map(), done: 0 };
  const results = await mapLimit(files, CONCURRENCY, async (file) => {
    const result = await processPhoto(file, ctx, state);
    state.done += 1;
    if (!ctx.dryRun) printProgress(state.done, files.length);
    return result;
  });
  if (!ctx.dryRun && process.stdout.isTTY) process.stdout.write('\n');

  const oks = results.filter((result) => result.kind === 'ok');
  const failures = results.filter((result) => result.kind === 'fallida');
  const duplicates = results.filter((result) => result.kind === 'duplicada');
  const records = oks.filter((record) => !record.familiar).sort(byTakenThenId);
  const familiar = oks.filter((record) => record.familiar).sort(byTakenThenId);

  if (ctx.dryRun) {
    for (const record of [...oks].sort(byTakenThenId)) {
      const flags = [
        record.familiar ? 'FAMILIAR' : null,
        record.source === 'archivo' ? 'sin-fecha-EXIF' : null,
        record.orientation > 1 ? `gira(${record.orientation})` : null,
        record.hasGps ? 'GPS' : null,
      ].filter(Boolean);
      console.log(
        `  ${record.id.padEnd(40)} ${record.group.padEnd(12)} ${record.taken.slice(11, 19)}  ${flags.join(' ')}`,
      );
    }
  }

  const unknownFamiliar = [...ctx.familiarIds].filter(
    (id) => !oks.some((record) => record.id === id),
  );
  for (const id of unknownFamiliar) {
    ctx.notes.add(
      `--familiar: el id «${id}» no corresponde a ninguna foto de --src (¿error de dedo?).`,
    );
  }

  // ── Manifest ──
  let removedIds = [];
  if (!ctx.dryRun) {
    if (oks.length === 0) {
      printSummary({
        ctx,
        records,
        familiar,
        failures,
        duplicates,
        elapsedMs: Date.now() - startedAt,
        removedIds,
      });
      throw new Error('Ninguna foto se procesó bien: no toco el manifest anterior.');
    }

    const manifestFile = path.join(ctx.outDir, 'manifest.json');
    const previous = await loadPreviousManifest(
      ctx.noData ? [manifestFile] : [manifestFile, FOTOS_FILE],
    );
    if (previous) {
      const currentIds = new Set(oks.map((record) => record.id));
      removedIds = [...previous.ids].filter((id) => !currentIds.has(id));
    }

    const manifest = {
      base: MEDIA_BASE,
      generatedAt: toColombiaIso(new Date()),
      // `start` (la hora de salida) se queda fuera: es dato del pipeline, no de
      // la página. `chip` sí viaja: es el texto del filtro por categoría.
      groups: ctx.groups.map(({ id, label, categories, description, chip }) => ({
        id,
        label,
        categories,
        description,
        ...(chip ? { chip } : {}),
      })),
      photos: [...records].sort(byFolderThenName).map(toManifestPhoto),
    };
    const text = formatManifest(manifest);
    await writeFile(manifestFile, text);
    console.log(`Manifest: ${manifestFile} (${manifest.photos.length} fotos)`);

    if (!ctx.noData) {
      await writeFile(FOTOS_FILE, text);
      console.log(`Página: ${repoRelative(FOTOS_FILE)} actualizado.`);
    } else {
      console.log(`Página: ${repoRelative(FOTOS_FILE)} NO se tocó (ruta temporal o --no-data).`);
    }

    if (familiar.length > 0) {
      const familiarManifest = `${ctx.familiarDir}/familiar-manifest.json`;
      await mkdir(ctx.familiarDir, { recursive: true });
      await writeFile(
        familiarManifest,
        formatManifest({
          base: null,
          generatedAt: manifest.generatedAt,
          groups: manifest.groups,
          photos: familiar.map(toManifestPhoto),
        }),
      );
      console.log(
        `Familiares: ${familiar.length} foto(s) en ${ctx.familiarDir} (w y h son los del original). NO subir esa carpeta.`,
      );
    }

    await writeIfChanged(path.join(ctx.outDir, '.htaccess'), HTACCESS_ROOT);
    await writeIfChanged(path.join(ctx.outDir, 'original', '.htaccess'), HTACCESS_ORIGINAL);
  }

  printSummary({
    ctx,
    records,
    familiar,
    failures,
    duplicates,
    elapsedMs: Date.now() - startedAt,
    removedIds,
  });

  // ── og:image ──
  if (ctx.ogId) {
    if (ctx.dryRun) {
      console.log(`\n--og ${ctx.ogId}: con --dry-run no se escribe la imagen.`);
    } else {
      const target = ctx.noData ? path.join(ctx.outDir, 'og.jpg') : OG_REPO_FILE;
      const og = await writeOgImage(ctx.ogId, ctx, target);
      console.log(`\nog:image: ${target}`);
      console.log(
        `  ${OG.width}×${OG.height}, calidad ${og.quality}, ${kb(og.buffer.length)} KB (límite ${kb(OG.maxBytes)} KB), de ${path.basename(og.source)}`,
      );
      if (ctx.noData) {
        console.log('  (ruta temporal o --no-data: no se escribió en el repo)');
      } else {
        console.log(
          `  Ponla en src/data/valida-yumbo-2026/evento.json → "ogImage": "${OG_PUBLIC_PATH}"`,
        );
      }
    }
  }

  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  if (error instanceof UsageError) {
    console.error(`${error.message}\nUsa --help para ver las opciones.`);
    process.exitCode = 2;
  } else {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
  }
});
