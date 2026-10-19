/**
 * Lectura y limpieza de metadatos de archivos JPEG, sin dependencias.
 *
 * Lo usa `scripts/valida-fotos.mjs` para tres cosas con las fotos que entrega
 * el fotógrafo: leer la hora de captura (EXIF), saber si el original trae GPS y
 * entregar una copia sin metadatos. Recibe `Uint8Array`/`Buffer`: no importa
 * `node:fs`, no tiene imports locales ni alias y evita la sintaxis de
 * TypeScript con semántica en runtime (enums, namespaces, parameter
 * properties), porque Node importa este archivo directamente desde un `.mjs`
 * (type stripping).
 *
 * Reglas que atraviesan el módulo:
 * - `readExif` y `exifDateToIso` nunca lanzan: ante cualquier cosa rara
 *   devuelven `null`/`false`. Un archivo dañado no debe tumbar el lote.
 * - `stripJpegMetadata` sí lanza con un mensaje claro si el archivo no es un
 *   JPEG completo: entregar una foto cortada es peor que avisar.
 * - Nada de esto recomprime: la limpieza copia los bytes tal cual.
 */

// ─── Marcadores ────────────────────────────────────────────────────────────────

export const JPEG_MARKER = {
  SOI: 0xffd8,
  EOI: 0xffd9,
  SOS: 0xffda,
  APP0: 0xffe0,
  APP1: 0xffe1,
  APP2: 0xffe2,
  APP13: 0xffed,
  APP14: 0xffee,
  APP15: 0xffef,
  COM: 0xfffe,
} as const;

export interface JpegSegment {
  /** Marcador completo de 16 bits: `0xffe1` para APP1, `0xffda` para SOS… */
  marker: number;
  /** Posición del `0xFF` que abre el marcador dentro del archivo. */
  offset: number;
  /** Bytes del segmento entero, marcador y campo de longitud incluidos: `bytes.subarray(offset, offset + length)`. */
  length: number;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/** Marcadores sin cuerpo ni campo de longitud: TEM, RSTn, SOI y EOI. */
function isStandalone(marker: number): boolean {
  return marker === 0xff01 || (marker >= 0xffd0 && marker <= 0xffd9);
}

/**
 * Segmento que empieza en `pos`, o `null` si no hay un marcador válido o el
 * segmento se sale del archivo. Admite los bytes de relleno `0xFF` que el
 * estándar permite antes de cualquier marcador; `offset` apunta al último, el
 * que sí va pegado al código.
 */
function nextSegment(bytes: Uint8Array, pos: number): JpegSegment | null {
  if (bytes[pos] !== 0xff) return null;
  let at = pos;
  while (bytes[at] === 0xff) at += 1;
  const code = bytes[at];
  // `undefined`: el relleno llegó al final del archivo. `0x00`: un 0xFF con
  // relleno de byte (`FF 00`) solo existe dentro de los datos de imagen.
  if (code === undefined || code === 0x00) return null;

  const offset = at - 1;
  const marker = 0xff00 | code;
  if (isStandalone(marker)) return { marker, offset, length: 2 };

  const header = at + 1;
  if (header + 2 > bytes.length) return null;
  const size = (bytes[header] << 8) | bytes[header + 1];
  if (size < 2 || header + size > bytes.length) return null;
  return { marker, offset, length: 2 + size };
}

/**
 * Segmentos de la cabecera, en orden, desde el SOI hasta el SOS inclusive (los
 * datos de imagen que siguen al SOS no se recorren). Si el archivo no empieza
 * por SOI devuelve `[]`; si se corta a mitad de un segmento, devuelve los que
 * alcanzó a leer completos.
 */
export function parseJpegSegments(bytes: Uint8Array): JpegSegment[] {
  if (!isJpeg(bytes)) return [];
  const segments: JpegSegment[] = [{ marker: JPEG_MARKER.SOI, offset: 0, length: 2 }];
  let pos = 2;
  for (;;) {
    const segment = nextSegment(bytes, pos);
    if (!segment) break;
    segments.push(segment);
    if (segment.marker === JPEG_MARKER.SOS || segment.marker === JPEG_MARKER.EOI) break;
    pos = segment.offset + segment.length;
  }
  return segments;
}

/** ¿El texto (ASCII, puede llevar `\0`) está en `bytes[at…end)`? */
function matchesAscii(bytes: Uint8Array, at: number, end: number, text: string): boolean {
  if (at + text.length > end) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[at + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

// ─── EXIF ──────────────────────────────────────────────────────────────────────

export interface ExifSummary {
  /** «AAAA:MM:DD HH:MM:SS» tal como lo escribió la cámara (tag 0x9003), o `null`. */
  dateTimeOriginal: string | null;
  /** Fecha de modificación del IFD0 (tag 0x0132). En archivos exportados suele ser la de la exportación. */
  dateTime: string | null;
  /** 1 a 8, o `null` si falta o no es válida. */
  orientation: number | null;
  /** El IFD de GPS trae algo más que su versión: coordenadas, altitud, hora… */
  hasGps: boolean;
  /** Número de serie del cuerpo (0xA431) o del lente (0xA435). */
  hasSerial: boolean;
}

function emptyExif(): ExifSummary {
  return {
    dateTimeOriginal: null,
    dateTime: null,
    orientation: null,
    hasGps: false,
    hasSerial: false,
  };
}

const TAG_GPS_VERSION = 0x0000;
const TAG_ORIENTATION = 0x0112;
const TAG_DATE_TIME = 0x0132;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
// 0xA433 y 0xA434 son LensMake y LensModel: no identifican al equipo. Los
// números de serie son el del cuerpo (0xA431) y el del lente (0xA435).
const TAG_BODY_SERIAL = 0xa431;
const TAG_LENS_SERIAL = 0xa435;

/** Bytes por valor de cada tipo TIFF (BYTE, ASCII, SHORT, LONG, RATIONAL…). */
const TYPE_SIZE: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};
const TYPE_BYTE = 1;
const TYPE_ASCII = 2;
const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_UNDEFINED = 7;

interface TiffContext {
  bytes: Uint8Array;
  view: DataView;
  /** Posición absoluta del encabezado TIFF: los desplazamientos del EXIF se miden desde ahí. */
  tiff: number;
  /** Fin del segmento APP1: nada se lee más allá. */
  limit: number;
  little: boolean;
}

interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** Posición absoluta de los 4 bytes de «valor o desplazamiento» de la entrada. */
  field: number;
}

function u16(ctx: TiffContext, at: number): number | null {
  return at >= 0 && at + 2 <= ctx.limit ? ctx.view.getUint16(at, ctx.little) : null;
}

function u32(ctx: TiffContext, at: number): number | null {
  return at >= 0 && at + 4 <= ctx.limit ? ctx.view.getUint32(at, ctx.little) : null;
}

/** Entradas de un IFD (`offset` desde el encabezado TIFF); recorta lo que se salga del segmento. */
function readIfd(ctx: TiffContext, offset: number): IfdEntry[] {
  const start = ctx.tiff + offset;
  const count = u16(ctx, start);
  if (count === null) return [];
  const entries: IfdEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    const at = start + 2 + i * 12;
    if (at + 12 > ctx.limit) break;
    entries.push({
      tag: ctx.view.getUint16(at, ctx.little),
      type: ctx.view.getUint16(at + 2, ctx.little),
      count: ctx.view.getUint32(at + 4, ctx.little),
      field: at + 8,
    });
  }
  return entries;
}

/** Posición absoluta de los bytes del valor, o `null` si el tipo es raro o el valor se sale del segmento. */
function valueStart(ctx: TiffContext, entry: IfdEntry): number | null {
  const unit = TYPE_SIZE[entry.type];
  if (!unit) return null;
  const size = unit * entry.count;
  // Hasta 4 bytes el valor va dentro de la propia entrada; más, apunta a otro lugar.
  if (size <= 4) return entry.field;
  const offset = u32(ctx, entry.field);
  if (offset === null) return null;
  const start = ctx.tiff + offset;
  return start + size <= ctx.limit ? start : null;
}

/** Primer valor entero (BYTE, SHORT o LONG) de la entrada. */
function readInt(ctx: TiffContext, entry: IfdEntry): number | null {
  if (entry.count < 1) return null;
  const start = valueStart(ctx, entry);
  if (start === null) return null;
  if (entry.type === TYPE_SHORT) return u16(ctx, start);
  if (entry.type === TYPE_LONG) return u32(ctx, start);
  if (entry.type === TYPE_BYTE) return ctx.bytes[start];
  return null;
}

/** Texto de la entrada hasta el primer `\0`, sin espacios en los bordes; `null` si queda vacío. */
function readText(ctx: TiffContext, entry: IfdEntry): string | null {
  if (entry.type !== TYPE_ASCII && entry.type !== TYPE_UNDEFINED && entry.type !== TYPE_BYTE)
    return null;
  const start = valueStart(ctx, entry);
  if (start === null) return null;
  let text = '';
  for (let i = 0; i < entry.count; i += 1) {
    const code = ctx.bytes[start + i];
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Segmento APP1 que trae el EXIF («Exif\0» + un byte de relleno); puede haber otro APP1 con XMP antes. */
function findExifSegment(bytes: Uint8Array): JpegSegment | null {
  for (const segment of parseJpegSegments(bytes)) {
    // 4 de marcador y longitud, 6 de «Exif\0\0» y 8 del encabezado TIFF.
    if (segment.marker !== JPEG_MARKER.APP1 || segment.length < 4 + 6 + 8) continue;
    if (matchesAscii(bytes, segment.offset + 4, segment.offset + segment.length, 'Exif\0'))
      return segment;
  }
  return null;
}

function parseExif(bytes: Uint8Array): ExifSummary {
  const summary = emptyExif();
  const segment = findExifSegment(bytes);
  if (!segment) return summary;

  const tiff = segment.offset + 4 + 6;
  const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49; // «II»
  const big = bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d; // «MM»
  if (!little && !big) return summary;

  const ctx: TiffContext = {
    bytes,
    view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    tiff,
    limit: segment.offset + segment.length,
    little,
  };
  if (u16(ctx, tiff + 2) !== 42) return summary;
  const ifd0 = u32(ctx, tiff + 4);
  if (ifd0 === null) return summary;

  let exifIfd: number | null = null;
  let gpsIfd: number | null = null;
  for (const entry of readIfd(ctx, ifd0)) {
    if (entry.tag === TAG_ORIENTATION) {
      const value = readInt(ctx, entry);
      if (value !== null && value >= 1 && value <= 8) summary.orientation = value;
    } else if (entry.tag === TAG_DATE_TIME) {
      summary.dateTime = readText(ctx, entry);
    } else if (entry.tag === TAG_EXIF_IFD) {
      exifIfd = readInt(ctx, entry);
    } else if (entry.tag === TAG_GPS_IFD) {
      gpsIfd = readInt(ctx, entry);
    }
  }

  if (exifIfd !== null) {
    for (const entry of readIfd(ctx, exifIfd)) {
      if (entry.tag === TAG_DATE_TIME_ORIGINAL) {
        summary.dateTimeOriginal = readText(ctx, entry);
      } else if (entry.tag === TAG_BODY_SERIAL || entry.tag === TAG_LENS_SERIAL) {
        if (readText(ctx, entry) !== null) summary.hasSerial = true;
      }
    }
  }

  // Muchas cámaras escriben el IFD de GPS aunque no haya señal, con solo la
  // versión. Eso no es una ubicación: hay GPS si trae algo más.
  if (gpsIfd !== null) {
    summary.hasGps = readIfd(ctx, gpsIfd).some((entry) => entry.tag !== TAG_GPS_VERSION);
  }
  return summary;
}

/**
 * Lo que interesa del EXIF de una foto: hora de captura, orientación y si trae
 * GPS o número de serie. Entiende big y little endian. Nunca lanza: un EXIF
 * ausente, truncado o corrupto devuelve `null`/`false` en lo que no pudo leer.
 */
export function readExif(bytes: Uint8Array): ExifSummary {
  try {
    return parseExif(bytes);
  } catch {
    return emptyExif();
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/**
 * «2026:10:18 08:41:12» → «2026-10-18T08:41:12-05:00». El EXIF no lleva zona
 * horaria (es la hora del reloj de la cámara), así que se le pone la del lugar;
 * por defecto Colombia, que no tiene horario de verano. `null` si no es una
 * fecha real: vacía, con la forma pero sin sentido («0000:00:00 00:00:00»), o
 * un 30 de febrero.
 */
export function exifDateToIso(value: string | null | undefined, offset = '-05:00'): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(
    value.replace(/\0/g, '').trim(),
  );
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${offset}`;
}

// ─── Limpieza ──────────────────────────────────────────────────────────────────

export interface StripJpegOptions {
  /** Conserva el perfil de color ICC (APP2). Por defecto `true`: sin él los colores cambian. */
  keepIcc?: boolean;
}

/**
 * ¿Este segmento sobrevive a la limpieza? Es una lista de lo que se conserva,
 * no de lo que se quita, para que un metadato que nadie previó no se cuele:
 * - APP1 (Exif y XMP), APP13 (IPTC), COM y cualquier otro APPn se eliminan.
 * - APP0 solo si es el JFIF (la densidad); el JFXX lleva una miniatura.
 * - APP2 solo si es el perfil ICC y `keepIcc`; el otro APP2 habitual es el MPF,
 *   que apunta a imágenes embebidas que la limpieza descarta.
 * - APP14 «Adobe» se conserva siempre: dice si los canales son RGB o YCbCr, y
 *   sin él algunos JPEG exportados por Photoshop cambian de color.
 * - Todo lo que no es APPn ni COM (tablas, SOF, DRI, SOS…) se conserva.
 */
function isKept(bytes: Uint8Array, segment: JpegSegment, keepIcc: boolean): boolean {
  const { marker } = segment;
  if (marker === JPEG_MARKER.COM) return false;
  if (marker < JPEG_MARKER.APP0 || marker > JPEG_MARKER.APP15) return true;

  const start = segment.offset + 4;
  const end = segment.offset + segment.length;
  if (marker === JPEG_MARKER.APP0) return matchesAscii(bytes, start, end, 'JFIF\0');
  if (marker === JPEG_MARKER.APP2)
    return keepIcc && matchesAscii(bytes, start, end, 'ICC_PROFILE\0');
  if (marker === JPEG_MARKER.APP14) return matchesAscii(bytes, start, end, 'Adobe');
  return false;
}

/**
 * Fin de los datos de imagen que empiezan en `from`: la posición del siguiente
 * marcador de verdad. Dentro de esos datos un `0xFF` siempre va seguido de
 * `00` (relleno) o de un RSTn; cualquier otra cosa abre un marcador.
 */
function skipEntropyData(bytes: Uint8Array, from: number): number {
  let at = from;
  for (;;) {
    at = bytes.indexOf(0xff, at);
    if (at === -1 || at + 1 >= bytes.length) return bytes.length;
    const next = bytes[at + 1];
    if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
      at += 2;
    } else if (next === 0xff) {
      at += 1; // relleno antes de un marcador: el marcador es el siguiente
    } else {
      return at;
    }
  }
}

/**
 * Copia del JPEG sin metadatos personales, byte a byte y sin recomprimir:
 * quita EXIF, XMP, IPTC y comentarios (ver `isKept` para el detalle), y corta
 * en el EOI lo que venga después (las imágenes embebidas del formato MPF
 * llevan su propio EXIF, con GPS). Devuelve un arreglo nuevo; no toca el
 * original. Lanza un `Error` si el archivo no es un JPEG o está incompleto.
 *
 * Ojo con la orientación: al quitar el EXIF se pierde la etiqueta que le dice
 * al visor que gire la foto. Si la foto la necesita, hay que girarla antes (con
 * `jpegtran`, sin pérdida) o los visores la mostrarán de lado.
 */
export function stripJpegMetadata(bytes: Uint8Array, options: StripJpegOptions = {}): Uint8Array {
  const keepIcc = options.keepIcc ?? true;
  if (!isJpeg(bytes)) throw new Error('No es un JPEG: no empieza por el marcador SOI (FF D8).');

  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let pos = 2;
  let sawScan = false;
  for (;;) {
    const segment = nextSegment(bytes, pos);
    if (!segment) {
      throw new Error(
        `JPEG incompleto o dañado: no hay un segmento válido en el byte ${pos} de ${bytes.length}.`,
      );
    }
    const end = segment.offset + segment.length;
    if (segment.marker === JPEG_MARKER.EOI) {
      if (!sawScan) throw new Error('JPEG sin datos de imagen: llega al EOI sin pasar por un SOS.');
      kept.push(bytes.subarray(segment.offset, end));
      break;
    }
    if (isKept(bytes, segment, keepIcc)) kept.push(bytes.subarray(segment.offset, end));
    pos = end;

    if (segment.marker === JPEG_MARKER.SOS) {
      // Los datos de imagen se copian enteros. Un JPEG progresivo trae varios
      // escaneos con tablas (y, rara vez, APPn o COM) entre uno y otro: el
      // ciclo los vuelve a recorrer con las mismas reglas.
      const scanEnd = skipEntropyData(bytes, pos);
      kept.push(bytes.subarray(pos, scanEnd));
      pos = scanEnd;
      sawScan = true;
    }
  }

  const output = new Uint8Array(kept.reduce((total, chunk) => total + chunk.length, 0));
  let at = 0;
  for (const chunk of kept) {
    output.set(chunk, at);
    at += chunk.length;
  }
  return output;
}
