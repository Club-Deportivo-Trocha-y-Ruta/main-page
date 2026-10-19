import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  exifDateToIso,
  JPEG_MARKER,
  parseJpegSegments,
  readExif,
  stripJpegMetadata,
} from '../jpeg-meta';

// ─── Constructores de JPEG sintéticos ──────────────────────────────────────────
//
// Nada de fotos reales: cada prueba arma los bytes que necesita (SOI + cabecera
// + SOS + datos + EOI) para que quede a la vista qué se está probando.

type Bytes = number[];

const ascii = (text: string): Bytes => Array.from(text, (char) => char.charCodeAt(0));
const zeros = (count: number): Bytes => Array.from({ length: count }, () => 0);

/** FF <código> <longitud de 16 bits, que cuenta sus propios 2 bytes> <cuerpo>. */
function segment(code: number, payload: Bytes): Bytes {
  const size = payload.length + 2;
  return [0xff, code, size >> 8, size & 0xff, ...payload];
}

const SOI: Bytes = [0xff, 0xd8];
const EOI: Bytes = [0xff, 0xd9];
const SOS_HEADER = segment(0xda, [0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]);
// Datos de imagen con relleno de byte (FF 00) y un marcador de reinicio (FF D0).
const SCAN: Bytes = [0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0xff, 0x00, 0x78];
const DQT = segment(0xdb, [0x00, ...Array.from({ length: 64 }, () => 8)]);
const JFIF = segment(0xe0, [...ascii('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
const JFXX = segment(0xe0, [...ascii('JFXX'), 0, 0x10, 0xaa, 0xbb]);
const ICC = segment(0xe2, [...ascii('ICC_PROFILE'), 0, 1, 1, 0xc0, 0xff, 0xee]);
const MPF = segment(0xe2, [...ascii('MPF'), 0, 0x4d, 0x4d, 0x00, 0x2a]);
const XMP = segment(0xe1, [
  ...ascii('http://ns.adobe.com/xap/1.0/'),
  0,
  ...ascii('<x:xmpmeta>autor: alguien</x:xmpmeta>'),
]);
const IPTC = segment(0xed, [...ascii('Photoshop 3.0'), 0, ...ascii('8BIM')]);
const ADOBE = segment(0xee, [...ascii('Adobe'), 0, 100, 0, 0, 0, 0, 1]);
const COMMENT = segment(0xfe, ascii('hecho con una cámara'));

/** Un JPEG mínimo: SOI + segmentos de cabecera + SOS + datos + `tail`. */
function jpeg(header: Bytes[], tail: Bytes = EOI): Uint8Array {
  return Uint8Array.from([...SOI, ...header.flat(), ...SOS_HEADER, ...SCAN, ...tail]);
}

/** Lo que debe quedar después de limpiar: el mismo armado con solo lo que se conserva. */
function expectedAfterStrip(kept: Bytes[], tail: Bytes = EOI): Uint8Array {
  return jpeg(kept, tail);
}

// ─── Constructor de EXIF (un TIFF mínimo armado a mano) ───────────────────────

interface TiffOptions {
  little?: boolean;
  orientation?: number;
  /** Tipo con el que se escribe la orientación: SHORT (el normal) o LONG. */
  orientationType?: 3 | 4;
  dateTime?: string;
  dateTimeOriginal?: string;
  bodySerial?: string;
  lensSerial?: string;
  lensModel?: string;
  /** `completo`: latitud y longitud. `version`: solo GPSVersionID, como algunas cámaras sin señal. */
  gps?: 'completo' | 'version';
}

interface Entry {
  tag: number;
  type: number;
  count: number;
  /** Valor ya codificado en el orden de bytes del TIFF. */
  data: Bytes;
}

function buildTiff(options: TiffOptions = {}): Bytes {
  const little = options.little ?? false;
  const w16 = (value: number): Bytes =>
    little ? [value & 0xff, (value >> 8) & 0xff] : [(value >> 8) & 0xff, value & 0xff];
  const w32 = (value: number): Bytes =>
    little
      ? [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff]
      : [(value >>> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];

  const text = (tag: number, value: string): Entry => ({
    tag,
    type: 2,
    count: value.length + 1,
    data: [...ascii(value), 0],
  });
  const short = (tag: number, value: number): Entry => ({
    tag,
    type: 3,
    count: 1,
    data: w16(value),
  });
  const long = (tag: number, value: number): Entry => ({
    tag,
    type: 4,
    count: 1,
    data: w32(value),
  });
  const rational = (tag: number, values: number[]): Entry => ({
    tag,
    type: 5,
    count: values.length / 2,
    data: values.flatMap((value) => w32(value)),
  });

  // Un IFD ocupa 2 + 12 por entrada + 4; los valores de más de 4 bytes van
  // después, alineados a 2, y la entrada apunta a ellos.
  const sizeOf = (entries: Entry[]): number =>
    2 +
    entries.length * 12 +
    4 +
    entries.reduce(
      (sum, entry) =>
        sum + (entry.data.length > 4 ? entry.data.length + (entry.data.length % 2) : 0),
      0,
    );

  const encode = (entries: Entry[], base: number): Bytes => {
    const sorted = [...entries].sort((a, b) => a.tag - b.tag);
    const head: Bytes = [...w16(sorted.length)];
    const extra: Bytes = [];
    const extraStart = base + 2 + sorted.length * 12 + 4;
    for (const entry of sorted) {
      head.push(...w16(entry.tag), ...w16(entry.type), ...w32(entry.count));
      if (entry.data.length <= 4) {
        head.push(...entry.data, ...zeros(4 - entry.data.length));
      } else {
        head.push(...w32(extraStart + extra.length));
        extra.push(...entry.data, ...(entry.data.length % 2 ? [0] : []));
      }
    }
    head.push(...w32(0)); // sin IFD siguiente
    return [...head, ...extra];
  };

  const exifEntries: Entry[] = [];
  if (options.dateTimeOriginal !== undefined)
    exifEntries.push(text(0x9003, options.dateTimeOriginal));
  if (options.bodySerial !== undefined) exifEntries.push(text(0xa431, options.bodySerial));
  if (options.lensModel !== undefined) exifEntries.push(text(0xa434, options.lensModel));
  if (options.lensSerial !== undefined) exifEntries.push(text(0xa435, options.lensSerial));

  const gpsEntries: Entry[] = [];
  if (options.gps) {
    gpsEntries.push({ tag: 0x0000, type: 1, count: 4, data: [2, 3, 0, 0] });
    if (options.gps === 'completo') {
      gpsEntries.push(
        text(0x0001, 'N'),
        rational(0x0002, [3, 1, 35, 1, 47, 1]),
        text(0x0003, 'W'),
        rational(0x0004, [76, 1, 29, 1, 8, 1]),
      );
    }
  }

  const ifd0 = (exifOffset: number, gpsOffset: number): Entry[] => {
    const entries: Entry[] = [text(0x010f, 'ACME')]; // un valor fuera de la entrada, siempre
    if (options.orientation !== undefined) {
      entries.push(
        options.orientationType === 4
          ? long(0x0112, options.orientation)
          : short(0x0112, options.orientation),
      );
    }
    if (options.dateTime !== undefined) entries.push(text(0x0132, options.dateTime));
    if (exifEntries.length > 0) entries.push(long(0x8769, exifOffset));
    if (gpsEntries.length > 0) entries.push(long(0x8825, gpsOffset));
    return entries;
  };

  // Los punteros ocupan lo mismo valgan lo que valgan: se calcula el tamaño
  // con ceros y luego se vuelve a armar con los desplazamientos reales.
  const exifOffset = 8 + sizeOf(ifd0(0, 0));
  const gpsOffset = exifOffset + (exifEntries.length > 0 ? sizeOf(exifEntries) : 0);
  return [
    ...(little ? [0x49, 0x49] : [0x4d, 0x4d]),
    ...w16(42),
    ...w32(8),
    ...encode(ifd0(exifOffset, gpsOffset), 8),
    ...(exifEntries.length > 0 ? encode(exifEntries, exifOffset) : []),
    ...(gpsEntries.length > 0 ? encode(gpsEntries, gpsOffset) : []),
  ];
}

/** APP1 con «Exif\0\0» y el TIFF dado. */
function exifSegment(tiff: Bytes, padding = 0x00): Bytes {
  return segment(0xe1, [...ascii('Exif'), 0, padding, ...tiff]);
}

const FULL: TiffOptions = {
  orientation: 6,
  dateTime: '2026:10:19 22:01:02',
  dateTimeOriginal: '2026:10:18 08:41:12',
  bodySerial: 'SN-0042',
  gps: 'completo',
};

// ─── parseJpegSegments ─────────────────────────────────────────────────────────

describe('parseJpegSegments', () => {
  it('lista los segmentos de la cabecera, del SOI al SOS inclusive', () => {
    const exif = exifSegment(buildTiff(FULL));
    const bytes = jpeg([JFIF, exif, DQT]);
    const segments = parseJpegSegments(bytes);

    expect(segments.map((s) => s.marker)).toEqual([
      JPEG_MARKER.SOI,
      JPEG_MARKER.APP0,
      JPEG_MARKER.APP1,
      0xffdb,
      JPEG_MARKER.SOS,
    ]);

    // offset + length delimitan exactamente cada segmento, marcador incluido.
    const expected = [SOI, JFIF, exif, DQT, SOS_HEADER];
    let offset = 0;
    segments.forEach((s, index) => {
      expect(s.offset).toBe(offset);
      expect(s.length).toBe(expected[index].length);
      expect(Array.from(bytes.subarray(s.offset, s.offset + s.length))).toEqual(expected[index]);
      offset += expected[index].length;
    });
  });

  it('se detiene en el SOS: no recorre los datos de imagen ni llega al EOI', () => {
    const segments = parseJpegSegments(jpeg([JFIF]));
    expect(segments.at(-1)?.marker).toBe(JPEG_MARKER.SOS);
    expect(segments.some((s) => s.marker === JPEG_MARKER.EOI)).toBe(false);
  });

  it('termina en el EOI si el archivo no trae SOS', () => {
    const segments = parseJpegSegments(Uint8Array.from([...SOI, ...EOI]));
    expect(segments.map((s) => s.marker)).toEqual([JPEG_MARKER.SOI, JPEG_MARKER.EOI]);
  });

  it('admite bytes de relleno 0xFF antes de un marcador', () => {
    const bytes = Uint8Array.from([...SOI, 0xff, 0xff, ...JFIF, ...SOS_HEADER]);
    const [, app0] = parseJpegSegments(bytes);
    expect(app0.marker).toBe(JPEG_MARKER.APP0);
    // `offset` apunta al 0xFF pegado al código, no al primer relleno.
    expect(app0.offset).toBe(4);
    expect(app0.length).toBe(JFIF.length);
  });

  it('reconoce los marcadores sin cuerpo (RSTn, TEM) con 2 bytes de largo', () => {
    const bytes = Uint8Array.from([...SOI, 0xff, 0xd0, 0xff, 0x01, ...JFIF, ...SOS_HEADER]);
    const segments = parseJpegSegments(bytes);
    expect(segments.map((s) => [s.marker, s.length])).toEqual([
      [JPEG_MARKER.SOI, 2],
      [0xffd0, 2],
      [0xff01, 2],
      [JPEG_MARKER.APP0, JFIF.length],
      [JPEG_MARKER.SOS, SOS_HEADER.length],
    ]);
  });

  it('devuelve [] si no empieza por SOI', () => {
    expect(parseJpegSegments(new Uint8Array(0))).toEqual([]);
    expect(parseJpegSegments(Uint8Array.of(0xff, 0xd8))).toEqual([]);
    expect(parseJpegSegments(Uint8Array.from([0x89, ...ascii('PNG'), 0x0d, 0x0a]))).toEqual([]);
  });

  it('devuelve los segmentos completos que alcanzó a leer si el archivo se corta', () => {
    const full = jpeg([JFIF, exifSegment(buildTiff(FULL)), DQT]);
    const cutInsideExif = full.subarray(0, SOI.length + JFIF.length + 20);
    expect(parseJpegSegments(cutInsideExif).map((s) => s.marker)).toEqual([
      JPEG_MARKER.SOI,
      JPEG_MARKER.APP0,
    ]);

    // Cortado justo antes de terminar de leer el campo de longitud.
    const cutInsideLength = Uint8Array.from([...SOI, 0xff, 0xe1, 0x00]);
    expect(parseJpegSegments(cutInsideLength)).toHaveLength(1);
  });

  it('se detiene ante una longitud imposible, un FF 00 suelto o relleno al final', () => {
    expect(parseJpegSegments(Uint8Array.from([...SOI, 0xff, 0xe1, 0x00, 0x01]))).toHaveLength(1);
    expect(parseJpegSegments(Uint8Array.from([...SOI, 0xff, 0x00, 0x00, 0x00]))).toHaveLength(1);
    expect(parseJpegSegments(Uint8Array.from([...SOI, 0xff, 0xff]))).toHaveLength(1);
    expect(parseJpegSegments(Uint8Array.from([...SOI, 0x12, 0x34]))).toHaveLength(1);
  });
});

// ─── readExif ──────────────────────────────────────────────────────────────────

describe('readExif', () => {
  for (const little of [false, true]) {
    it(`lee fecha, orientación, GPS y serie en ${little ? 'little' : 'big'} endian`, () => {
      const bytes = jpeg([JFIF, exifSegment(buildTiff({ ...FULL, little }))]);
      expect(readExif(bytes)).toEqual({
        dateTimeOriginal: '2026:10:18 08:41:12',
        dateTime: '2026:10:19 22:01:02',
        orientation: 6,
        hasGps: true,
        hasSerial: true,
      });
    });
  }

  it('sin EXIF devuelve todo vacío', () => {
    const empty = {
      dateTimeOriginal: null,
      dateTime: null,
      orientation: null,
      hasGps: false,
      hasSerial: false,
    };
    expect(readExif(jpeg([JFIF]))).toEqual(empty);
    expect(readExif(jpeg([JFIF, XMP]))).toEqual(empty);
  });

  it('encuentra el EXIF aunque antes venga otro APP1 (XMP)', () => {
    const bytes = jpeg([XMP, exifSegment(buildTiff({ dateTimeOriginal: '2026:10:18 10:20:00' }))]);
    expect(readExif(bytes).dateTimeOriginal).toBe('2026:10:18 10:20:00');
  });

  it('acepta cualquier byte de relleno después de «Exif\\0»', () => {
    const bytes = jpeg([exifSegment(buildTiff({ orientation: 3 }), 0xff)]);
    expect(readExif(bytes).orientation).toBe(3);
  });

  it('descarta orientaciones fuera de 1 a 8', () => {
    for (const orientation of [0, 9, 300]) {
      expect(readExif(jpeg([exifSegment(buildTiff({ orientation }))])).orientation).toBeNull();
    }
    for (const orientation of [1, 8]) {
      expect(readExif(jpeg([exifSegment(buildTiff({ orientation }))])).orientation).toBe(
        orientation,
      );
    }
  });

  it('lee la orientación aunque venga escrita como LONG', () => {
    const bytes = jpeg([exifSegment(buildTiff({ orientation: 8, orientationType: 4 }))]);
    expect(readExif(bytes).orientation).toBe(8);
  });

  it('un IFD de GPS con solo la versión no cuenta como ubicación', () => {
    expect(readExif(jpeg([exifSegment(buildTiff({ gps: 'version' }))])).hasGps).toBe(false);
    expect(readExif(jpeg([exifSegment(buildTiff({ gps: 'completo' }))])).hasGps).toBe(true);
    expect(readExif(jpeg([exifSegment(buildTiff({ orientation: 1 }))])).hasGps).toBe(false);
  });

  it('el número de serie cuenta (cuerpo o lente) y el modelo del lente no', () => {
    const serial = (options: TiffOptions) =>
      readExif(jpeg([exifSegment(buildTiff(options))])).hasSerial;
    expect(serial({ bodySerial: '0123456789' })).toBe(true);
    expect(serial({ lensSerial: 'L-77' })).toBe(true);
    expect(serial({ bodySerial: 'A1' })).toBe(true); // cabe dentro de la propia entrada
    expect(serial({ lensModel: 'EF 70-200mm f/2.8L' })).toBe(false);
    expect(serial({ bodySerial: '' })).toBe(false);
    expect(serial({ dateTimeOriginal: '2026:10:18 08:00:00' })).toBe(false);
  });

  it('recorta espacios y deja en null las fechas en blanco', () => {
    const date = (value: string) =>
      readExif(jpeg([exifSegment(buildTiff({ dateTimeOriginal: value }))])).dateTimeOriginal;
    expect(date('2026:10:18 08:41:12  ')).toBe('2026:10:18 08:41:12');
    expect(date('      ')).toBeNull();
    expect(date('')).toBeNull();
  });

  it('lo que está en el IFD0 se lee aunque no haya ExifIFD ni GPS', () => {
    const result = readExif(
      jpeg([exifSegment(buildTiff({ dateTime: '2026:10:18 09:00:00', orientation: 2 }))]),
    );
    expect(result).toEqual({
      dateTimeOriginal: null,
      dateTime: '2026:10:18 09:00:00',
      orientation: 2,
      hasGps: false,
      hasSerial: false,
    });
  });

  it('lee bien un EXIF que no está al inicio de un arreglo más grande (byteOffset)', () => {
    const bytes = jpeg([exifSegment(buildTiff(FULL))]);
    const arena = new Uint8Array(bytes.length + 20);
    arena.set(bytes, 13);
    expect(readExif(arena.subarray(13, 13 + bytes.length)).dateTimeOriginal).toBe(
      '2026:10:18 08:41:12',
    );
    expect(readExif(Buffer.from(bytes)).orientation).toBe(6);
  });

  describe('con datos corruptos nunca lanza', () => {
    const empty = {
      dateTimeOriginal: null,
      dateTime: null,
      orientation: null,
      hasGps: false,
      hasSerial: false,
    };

    it('encabezado TIFF inválido', () => {
      const tiff = buildTiff(FULL);
      const badOrder = [...ascii('XX'), ...tiff.slice(2)];
      const badMagic = [...tiff.slice(0, 2), 0x00, 0x2b, ...tiff.slice(4)];
      expect(readExif(jpeg([exifSegment(badOrder)]))).toEqual(empty);
      expect(readExif(jpeg([exifSegment(badMagic)]))).toEqual(empty);
    });

    it('APP1 con «Exif» pero sin lugar para el encabezado TIFF', () => {
      expect(readExif(jpeg([exifSegment([0x4d, 0x4d, 0x00, 0x2a])]))).toEqual(empty);
    });

    it('IFD0 fuera del segmento', () => {
      const tiff = buildTiff(FULL);
      const farAway = [...tiff.slice(0, 4), 0x00, 0x00, 0xff, 0xff, ...tiff.slice(8)];
      expect(readExif(jpeg([exifSegment(farAway)]))).toEqual(empty);
    });

    it('APP1 cortado a la mitad', () => {
      const full = jpeg([exifSegment(buildTiff(FULL))]);
      expect(readExif(full.subarray(0, 40))).toEqual(empty);
    });

    it('valores y punteros que apuntan fuera del segmento', () => {
      // IFD0 con orientación válida, una fecha cuyo desplazamiento se sale y
      // punteros a ExifIFD y GPS imposibles.
      const tiff = [
        ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
        0x00,
        0x04,
        ...[0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00],
        ...[0x01, 0x32, 0x00, 0x02, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x7f, 0xff],
        ...[0x87, 0x69, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x7f, 0xff],
        ...[0x88, 0x25, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x7f, 0xff],
        ...zeros(4),
      ];
      expect(readExif(jpeg([exifSegment(tiff)]))).toEqual({ ...empty, orientation: 6 });
    });

    it('un IFD que declara más entradas de las que caben lee las que hay', () => {
      const tiff = [
        ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
        0x00,
        0x64, // 100 entradas
        ...[0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x03, 0x00, 0x00],
      ];
      expect(readExif(jpeg([exifSegment(tiff)])).orientation).toBe(3);
    });

    it('tipos TIFF que no corresponden al tag', () => {
      const tiff = (orientationType: number, orientationValue: Bytes, dateType: number) => [
        ...[0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
        0x00,
        0x02,
        ...[0x01, 0x12, 0x00, orientationType, 0x00, 0x00, 0x00, 0x01, ...orientationValue],
        ...[0x01, 0x32, 0x00, dateType, 0x00, 0x00, 0x00, 0x04, 0x41, 0x42, 0x43, 0x00],
        ...zeros(4),
      ];
      // BYTE sí es un entero válido para la orientación.
      expect(readExif(jpeg([exifSegment(tiff(1, [0x05, 0x00, 0x00, 0x00], 2))])).orientation).toBe(
        5,
      );
      // Un RATIONAL (8 bytes, fuera de la entrada y fuera del segmento) no.
      expect(
        readExif(jpeg([exifSegment(tiff(5, [0x00, 0x00, 0x00, 0x20], 2))])).orientation,
      ).toBeNull();
      // Un tipo que no existe tampoco, ni un texto que cabe pero no es un número.
      expect(
        readExif(jpeg([exifSegment(tiff(99, [0x00, 0x06, 0x00, 0x00], 2))])).orientation,
      ).toBeNull();
      expect(
        readExif(jpeg([exifSegment(tiff(2, [0x36, 0x00, 0x00, 0x00], 2))])).orientation,
      ).toBeNull();
      // Una fecha escrita como SHORT no es texto.
      expect(
        readExif(jpeg([exifSegment(tiff(3, [0x00, 0x06, 0x00, 0x00], 3))])).dateTime,
      ).toBeNull();
      // Y como ASCII corto, dentro de la entrada, sí.
      expect(readExif(jpeg([exifSegment(tiff(3, [0x00, 0x06, 0x00, 0x00], 2))])).dateTime).toBe(
        'ABC',
      );
    });

    it('entradas absurdas', () => {
      expect(readExif(new Uint8Array(0))).toEqual(empty);
      expect(readExif(Uint8Array.of(1, 2, 3))).toEqual(empty);
      expect(readExif(null as unknown as Uint8Array)).toEqual(empty);
      expect(readExif(undefined as unknown as Uint8Array)).toEqual(empty);
    });
  });
});

// ─── exifDateToIso ─────────────────────────────────────────────────────────────

describe('exifDateToIso', () => {
  it('convierte la fecha EXIF a ISO con el desfase de Colombia por defecto', () => {
    expect(exifDateToIso('2026:10:18 08:41:12')).toBe('2026-10-18T08:41:12-05:00');
  });

  it('usa el desfase que se le pida', () => {
    expect(exifDateToIso('2026:10:18 08:41:12', '+00:00')).toBe('2026-10-18T08:41:12+00:00');
    expect(exifDateToIso('2026:10:18 08:41:12', 'Z')).toBe('2026-10-18T08:41:12Z');
  });

  it('tolera espacios y NUL al final y los separadores con guion o T', () => {
    expect(exifDateToIso('2026:10:18 08:41:12\0')).toBe('2026-10-18T08:41:12-05:00');
    expect(exifDateToIso('  2026:10:18 08:41:12  ')).toBe('2026-10-18T08:41:12-05:00');
    expect(exifDateToIso('2026-10-18 08:41:12')).toBe('2026-10-18T08:41:12-05:00');
    expect(exifDateToIso('2026:10:18T08:41:12')).toBe('2026-10-18T08:41:12-05:00');
  });

  it('devuelve null para lo que no es una fecha', () => {
    const invalid: (string | null | undefined | number)[] = [
      null,
      undefined,
      123,
      '',
      '   ',
      '2026:10:18',
      '2026:10:18 8:41:12',
      '2026/10/18 08:41:12',
      '    :  :     :  :  ',
      'hoy por la mañana',
    ];
    for (const value of invalid) {
      expect(exifDateToIso(value as string | null | undefined)).toBeNull();
    }
  });

  it('devuelve null para fechas con la forma correcta pero sin sentido', () => {
    const impossible = [
      '0000:00:00 00:00:00',
      '2026:00:10 10:00:00', // mes 0
      '2026:13:01 10:00:00', // mes 13
      '2026:10:00 10:00:00', // día 0
      '2026:10:32 10:00:00', // día 32
      '2026:04:31 10:00:00', // abril tiene 30
      '2026:02:29 10:00:00', // 2026 no es bisiesto
      '1900:02:29 10:00:00', // siglo no divisible por 400
      '2026:10:18 24:00:00',
      '2026:10:18 10:60:00',
      '2026:10:18 10:00:60',
    ];
    for (const value of impossible) expect(exifDateToIso(value)).toBeNull();
  });

  it('acepta el 29 de febrero de los años bisiestos y los días 31', () => {
    expect(exifDateToIso('2028:02:29 10:00:00')).toBe('2028-02-29T10:00:00-05:00');
    expect(exifDateToIso('2000:02:29 10:00:00')).toBe('2000-02-29T10:00:00-05:00');
    expect(exifDateToIso('2026:12:31 23:59:59')).toBe('2026-12-31T23:59:59-05:00');
    expect(exifDateToIso('2026:09:30 00:00:00')).toBe('2026-09-30T00:00:00-05:00');
  });
});

// ─── stripJpegMetadata ─────────────────────────────────────────────────────────

describe('stripJpegMetadata', () => {
  const exif = exifSegment(buildTiff(FULL));

  it('quita EXIF, XMP, IPTC y comentarios y deja intacto todo lo demás, byte a byte', () => {
    const dirty = jpeg([JFIF, exif, XMP, IPTC, COMMENT, ICC, DQT]);
    expect(Array.from(stripJpegMetadata(dirty))).toEqual(
      Array.from(expectedAfterStrip([JFIF, ICC, DQT])),
    );
  });

  it('lo que queda ya no tiene EXIF, GPS ni serie', () => {
    const clean = stripJpegMetadata(jpeg([JFIF, exif, XMP, IPTC, COMMENT]));
    expect(readExif(clean)).toEqual({
      dateTimeOriginal: null,
      dateTime: null,
      orientation: null,
      hasGps: false,
      hasSerial: false,
    });
    const markers = parseJpegSegments(clean).map((s) => s.marker);
    for (const removed of [JPEG_MARKER.APP1, JPEG_MARKER.APP13, JPEG_MARKER.COM]) {
      expect(markers).not.toContain(removed);
    }
  });

  it('conserva el perfil ICC por defecto y con keepIcc: true; lo quita con keepIcc: false', () => {
    const dirty = jpeg([JFIF, exif, ICC]);
    const withIcc = expectedAfterStrip([JFIF, ICC]);
    expect(Array.from(stripJpegMetadata(dirty))).toEqual(Array.from(withIcc));
    expect(Array.from(stripJpegMetadata(dirty, { keepIcc: true }))).toEqual(Array.from(withIcc));
    expect(Array.from(stripJpegMetadata(dirty, { keepIcc: false }))).toEqual(
      Array.from(expectedAfterStrip([JFIF])),
    );
  });

  it('conserva el APP14 «Adobe» (espacio de color) y descarta el resto de APPn', () => {
    const app5 = segment(0xe5, ascii('RMETA propietario'));
    const app11 = segment(0xeb, ascii('JUMBF c2pa manifiesto'));
    const app12 = segment(0xec, ascii('Ducky'));
    const app15 = segment(0xef, ascii('Samsung'));
    const dirty = jpeg([JFIF, app5, ADOBE, app11, app12, app15]);
    expect(Array.from(stripJpegMetadata(dirty))).toEqual(
      Array.from(expectedAfterStrip([JFIF, ADOBE])),
    );
  });

  it('descarta el JFXX (lleva una miniatura) pero deja el JFIF', () => {
    const dirty = jpeg([JFIF, JFXX]);
    expect(Array.from(stripJpegMetadata(dirty))).toEqual(Array.from(expectedAfterStrip([JFIF])));
  });

  it('descarta el APP2 del formato MPF aunque se pida conservar el ICC', () => {
    const dirty = jpeg([JFIF, MPF, ICC]);
    expect(Array.from(stripJpegMetadata(dirty, { keepIcc: true }))).toEqual(
      Array.from(expectedAfterStrip([JFIF, ICC])),
    );
  });

  it('descarta un APP0 o APP14 que no son los esperados', () => {
    const odd0 = segment(0xe0, ascii('AVI1'));
    const odd14 = segment(0xee, ascii('Foto'));
    expect(Array.from(stripJpegMetadata(jpeg([odd0, odd14, DQT])))).toEqual(
      Array.from(expectedAfterStrip([DQT])),
    );
  });

  it('corta en el EOI lo que venga después: las imágenes embebidas llevan su propio EXIF', () => {
    const embedded: Bytes = [...SOI, ...exif, ...SOS_HEADER, ...SCAN, ...EOI];
    const dirty = jpeg([JFIF, exif], [...EOI, ...embedded]);
    const clean = stripJpegMetadata(dirty);

    expect(Array.from(clean)).toEqual(Array.from(expectedAfterStrip([JFIF])));
    expect(clean.length).toBeLessThan(dirty.length);
    expect(readExif(clean).hasGps).toBe(false);
  });

  it('copia los datos de imagen sin tocar el relleno FF 00 ni los marcadores RSTn', () => {
    const clean = stripJpegMetadata(jpeg([exif]));
    const start = clean.length - EOI.length - SCAN.length;
    expect(Array.from(clean.subarray(start, start + SCAN.length))).toEqual(SCAN);
  });

  it('respeta los bytes de relleno 0xFF antes del EOI', () => {
    const padded = jpeg([exif], [0xff, ...EOI]);
    const clean = stripJpegMetadata(padded);
    expect(Array.from(clean)).toEqual(Array.from(expectedAfterStrip([], [0xff, ...EOI])));
  });

  it('en un JPEG progresivo recorre todos los escaneos y limpia los segmentos de entre ellos', () => {
    const sof2 = segment(0xc2, [8, 0, 8, 0, 8, 1, 1, 0x11, 0]);
    const dht1 = segment(0xc4, [0x00, ...zeros(16), 0x01]);
    const dht2 = segment(0xc4, [0x10, ...zeros(16), 0x02]);
    const scan2: Bytes = [0x9a, 0xff, 0x00, 0xbc];
    const build = (between: Bytes[]): Uint8Array =>
      Uint8Array.from([
        ...SOI,
        ...JFIF,
        ...exif,
        ...DQT,
        ...sof2,
        ...dht1,
        ...SOS_HEADER,
        ...SCAN,
        ...dht2,
        ...between.flat(),
        ...SOS_HEADER,
        ...scan2,
        ...EOI,
      ]);

    const clean = stripJpegMetadata(build([COMMENT, XMP]));
    expect(Array.from(clean)).toEqual(
      Array.from(
        Uint8Array.from([
          ...SOI,
          ...JFIF,
          ...DQT,
          ...sof2,
          ...dht1,
          ...SOS_HEADER,
          ...SCAN,
          ...dht2,
          ...SOS_HEADER,
          ...scan2,
          ...EOI,
        ]),
      ),
    );
    expect(Array.from(stripJpegMetadata(build([])))).toEqual(
      Array.from(stripJpegMetadata(build([COMMENT, XMP, IPTC]))),
    );
  });

  it('devuelve un arreglo nuevo y no modifica el original', () => {
    const dirty = jpeg([JFIF, exif]);
    const snapshot = Array.from(dirty);
    const clean = stripJpegMetadata(dirty);
    expect(clean).not.toBe(dirty);
    expect(clean.buffer).not.toBe(dirty.buffer);
    expect(Array.from(dirty)).toEqual(snapshot);
  });

  it('acepta un Buffer de Node', () => {
    const clean = stripJpegMetadata(Buffer.from(jpeg([JFIF, exif])));
    expect(Array.from(clean)).toEqual(Array.from(expectedAfterStrip([JFIF])));
  });

  describe('lanza un error claro si el archivo no sirve', () => {
    it('no es un JPEG', () => {
      expect(() => stripJpegMetadata(new Uint8Array(0))).toThrow(/No es un JPEG/);
      expect(() => stripJpegMetadata(Uint8Array.from([0x89, ...ascii('PNG\r\n')]))).toThrow(
        /No es un JPEG/,
      );
    });

    it('se corta a mitad de la cabecera', () => {
      const full = jpeg([JFIF, exif, DQT]);
      expect(() => stripJpegMetadata(full.subarray(0, SOI.length + JFIF.length + 30))).toThrow(
        /incompleto/,
      );
    });

    it('se corta a mitad de los datos de imagen, con o sin 0xFF al final', () => {
      const full = jpeg([JFIF]);
      expect(() => stripJpegMetadata(full.subarray(0, full.length - 4))).toThrow(/incompleto/);
      expect(() => stripJpegMetadata(Uint8Array.from([...SOI, ...SOS_HEADER, 1, 2, 3]))).toThrow(
        /incompleto/,
      );
      expect(() => stripJpegMetadata(Uint8Array.from([...SOI, ...SOS_HEADER, 1, 2, 0xff]))).toThrow(
        /incompleto/,
      );
    });

    it('no tiene datos de imagen', () => {
      expect(() => stripJpegMetadata(Uint8Array.from([...SOI, ...JFIF, ...EOI]))).toThrow(
        /sin datos de imagen/,
      );
    });
  });

  it('funciona con un JPEG real: lee el EXIF de libvips y limpia sin alterar un solo píxel', async () => {
    const original = await sharp({
      create: { width: 64, height: 48, channels: 3, background: { r: 200, g: 80, b: 40 } },
    })
      .withExif({
        IFD0: { Make: 'ACME', DateTime: '2026:10:19 22:01:02' },
        IFD2: { DateTimeOriginal: '2026:10:18 08:41:12', BodySerialNumber: 'SN12345' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '3/1 35/1 47/1' },
      })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 90 })
      .toBuffer();

    expect(readExif(original)).toEqual({
      dateTimeOriginal: '2026:10:18 08:41:12',
      dateTime: '2026:10:19 22:01:02',
      orientation: 6,
      hasGps: true,
      hasSerial: true,
    });

    const clean = stripJpegMetadata(original);
    expect(clean.length).toBeLessThan(original.length);
    expect(readExif(clean).hasGps).toBe(false);
    expect(readExif(clean).dateTimeOriginal).toBeNull();

    // Los datos de imagen son los mismos: decodificados dan idénticos.
    const [pixelsBefore, pixelsAfter] = await Promise.all([
      sharp(original).raw().toBuffer(),
      sharp(clean).raw().toBuffer(),
    ]);
    expect(Buffer.compare(pixelsBefore, pixelsAfter)).toBe(0);

    // El perfil de color sobrevive y el archivo sigue siendo un JPEG válido.
    const metadata = await sharp(clean).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeDefined();
  });
});
