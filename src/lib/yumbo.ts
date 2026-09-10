/**
 * Los hitos ilustrados de Yumbo.
 *
 * Tres ilustraciones de los hitos que la ciudad reconoce de sí misma: el cerro
 * con el letrero, el monumento de la glorieta de Cencar y el santuario del
 * parque Belalcázar. Están en el sitio porque el club es de Yumbo, y su arraigo
 * se muestra en vez de explicarse.
 *
 * (Salieron de un ensayo de diseño de uniforme que el club **no** adoptó. El
 * uniforme no lleva estos elementos y el sitio no puede decir que sí.)
 *
 * Cada hito existe en hasta tres versiones, generadas por
 * `scripts/prepare-yumbo-assets.mjs`. Se genera solo la que el sitio usa —cada
 * PNG importado y no procesado se copiaría entero a `dist/`—, así que `variants`
 * y la lista `SOURCES` del script se cambian juntas:
 *
 *   `color`  la acuarela completa, con el fondo recortado. Se usa cuando la
 *            ilustración **es** el contenido (el tríptico de /quienes-somos).
 *   `ink`    la misma lámina reducida a tinta negra con alfa. Se pinta como
 *            máscara sobre `currentColor`, así que la sección decide el tono.
 *   `solid`  la silueta plana, con sus zonas claras caladas —en el cerro, las
 *            letras YUMBO quedan en negativo—. Es la del horizonte de fondo.
 *
 * Cada pie se apoya en una fuente pública, anotada en `source`: el sitio no
 * publica cifras ni nombres sin dónde comprobarlos. Lo que no aparece es tan
 * deliberado como lo que sí — el nombre propio del cerro, por ejemplo, no está
 * en ninguna de las notas de prensa del letrero, así que no se afirma.
 */

export type YumboLandmarkId = 'cerro' | 'monumento' | 'iglesia';

export type YumboLandmarkVariant = 'color' | 'ink' | 'solid';

export interface YumboLandmark {
  id: YumboLandmarkId;
  /** Nombre del archivo base en `src/assets/images/yumbo/`, sin extensión. */
  file: string;
  /** Titular corto para el pie de la lámina. */
  title: string;
  /** Qué representa para el club. Una frase, en voz del sitio. */
  caption: string;
  /** Texto alternativo cuando la lámina va a color y es contenido. */
  alt: string;
  /** Dónde se comprueba lo que dice `caption`. No se publica: es trazabilidad. */
  source: string;
  /**
   * Forma de la lámina. Decide cómo se le da tamaño cuando va junto a las
   * otras: igualar la altura de las tres deja al cerro —2.6:1— convertido en
   * una franja diminuta al lado de dos siluetas verticales. Se iguala el área
   * que ocupan, no el alto.
   */
  shape: 'wide' | 'tall';
  /** Versiones generadas para esta lámina. */
  variants: readonly YumboLandmarkVariant[];
}

export const YUMBO_LANDMARKS: readonly YumboLandmark[] = [
  {
    id: 'cerro',
    file: 'cerro-yumbo',
    title: 'El cerro con el letrero',
    caption:
      'Desde julio de 2026 el nombre de la ciudad se lee en la montaña: letras de diez metros de alto, instaladas por los 162 años del municipio. Es la cordillera que cierra el valle por el occidente.',
    alt: 'Ilustración del cerro de Yumbo con el letrero blanco «YUMBO» y dos torres de alta tensión en la cima',
    source:
      'https://www.eltiempo.com/colombia/cali/de-la-industria-a-la-cultura-al-estilo-hollywood-yumbo-se-reinventa-con-un-letrero-que-grita-orgullo-desde-las-montanas-3568903',
    shape: 'wide',
    variants: ['color', 'solid'],
  },
  {
    id: 'monumento',
    file: 'monumento-trabajo',
    title: 'Las manos y los piñones',
    caption:
      'El monumento de la glorieta de Cencar, sobre la autopista Cali–Yumbo: dos manos que sostienen dos piñones. Es el emblema de la ciudad que se llama a sí misma capital industrial del Valle.',
    alt: 'Ilustración del monumento de Yumbo: dos manos de piedra sosteniendo dos engranajes sobre una base de mampostería',
    source: 'https://ulianamolano.wixsite.com/artepublico-unad/post/conjunto-escultórico',
    shape: 'tall',
    variants: ['color', 'ink'],
  },
  {
    id: 'iglesia',
    file: 'iglesia-yumbo',
    title: 'El santuario del Buen Consuelo',
    caption:
      'La iglesia del parque Belalcázar, levantada por fray Alfonso de la Concepción Peña y terminada en 1939. Está dedicada al Señor del Buen Consuelo, patrono de Yumbo.',
    alt: 'Ilustración de la fachada de la iglesia de Yumbo, en ladrillo rojo, con dos torres, campanas y un reloj',
    source:
      'https://todosesupo.com/2018/09/15/apuntes-para-una-historia-de-yumbo-2003-ano-de-la-ultima-remodelacion-del-parque-belalcazar/',
    shape: 'tall',
    variants: ['color', 'ink'],
  },
] as const;

export function getYumboLandmark(id: YumboLandmarkId): YumboLandmark {
  const found = YUMBO_LANDMARKS.find((landmark) => landmark.id === id);
  if (!found) throw new Error(`Hito de Yumbo desconocido: ${id}`);
  return found;
}

/**
 * Si una competencia se corre en casa.
 *
 * El club es de Yumbo y su sede es la Pista Carlos Castro: una fecha en la
 * ciudad se anuncia distinto —para el visitante foráneo, que llega de otro
 * municipio, y para las familias, que no tienen que viajar—. La comparación va
 * sin tildes ni mayúsculas porque el dato lo escribe un editor en el CMS.
 */
export function isHomeRace(city?: string): boolean {
  return (
    city
      ?.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase() === 'yumbo'
  );
}

/** Nombre del archivo de una variante: `cerro-yumbo-ink.webp`. */
export function landmarkFile(id: YumboLandmarkId, variant: YumboLandmarkVariant): string {
  const { file } = getYumboLandmark(id);
  return variant === 'color' ? `${file}.webp` : `${file}-${variant}.webp`;
}
