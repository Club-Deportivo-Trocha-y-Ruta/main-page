/**
 * Lógica compartida de la página de Política Editorial.
 *
 * El club es cronista de su propia actividad deportiva: no es un medio
 * independiente, y esta página no pretende que lo sea. Lo que sí puede
 * mostrar es con qué reglas trabaja — de dónde sale cada dato, qué hace si se
 * equivoca, cómo distingue crónica de publicidad y qué protocolo sigue con
 * los menores que aparecen en sus fotos. Ese vocabulario vive aquí una sola
 * vez, igual que `DOCUMENT_CATEGORIES` (`transparency.ts`) o `CONTACT_CHANNELS`
 * (`contact.ts`): cada estándar explica a qué pregunta responde antes de que
 * la plantilla lo desarrolle.
 *
 * El texto es el mismo que ya publicaba la página antes de migrar — no se
 * reescribió, solo se reorganizó en datos.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`.
 */

/**
 * Plazo de respuesta a una solicitud de corrección. Información fija que el
 * club publica, no un dato de collection — mismo patrón que `ENROLLMENT_POLICY`
 * en `enrollment.ts`. Se declara una sola vez: el párrafo de "correcciones" y
 * el `StatFigure` de cabecera la interpolan en vez de repetir "48" a mano en
 * dos sitios.
 */
export const CORRECTION_RESPONSE_HOURS = 48;

export type StandardId = 'estandares' | 'fuentes' | 'correcciones' | 'conflictos' | 'menores';

export interface EditorialStandard {
  id: StandardId;
  label: string;
  /** A qué pregunta responde esta categoría. */
  purpose: string;
  icon: string;
  /** Orden de lectura: de cómo se produce el contenido a cómo se corrige. */
  order: number;
  paragraphs: string[];
  /** Lista opcional, cuando el estándar es un protocolo con pasos concretos. */
  items?: string[];
}

/**
 * Las cinco categorías reales de la política, en el orden en que conviene
 * leerlas: primero cómo se produce el contenido (estándares, fuentes),
 * después qué pasa cuando algo falla (correcciones, conflictos de interés) y
 * por último el protocolo más sensible (menores).
 */
export const EDITORIAL_STANDARDS: EditorialStandard[] = [
  {
    id: 'estandares',
    label: 'Estándares editoriales',
    purpose:
      'Cómo se elabora cada crónica: de dónde sale la información y qué se verifica antes de publicar.',
    icon: 'ph:compass-bold',
    order: 1,
    paragraphs: [
      'Trocha y Ruta actúa como cronista de su propia actividad deportiva. Todo el contenido de la sección de noticias se elabora con observación directa en pista, fuentes propias del club y registros oficiales de competencia.',
      'Verificamos los datos antes de publicar: nombres, categorías, tiempos, posiciones y resultados se contrastan con los reportes de jueces, tablas oficiales y la planilla interna del equipo. Cuando un dato no se puede verificar, lo indicamos expresamente o lo omitimos.',
    ],
  },
  {
    id: 'fuentes',
    label: 'Fuentes',
    purpose: 'De dónde sale cada dato: los tres orígenes que respaldan lo que el club publica.',
    icon: 'ph:database-bold',
    order: 2,
    paragraphs: [],
    items: [
      'Resultados oficiales de la Liga Vallecaucana de Ciclismo, la Copa Valle XCO y otras válidas reconocidas por la federación.',
      'Cronómetros y planillas propias del cuerpo técnico del club durante entrenamientos y simulacros de carrera.',
      'Material fotográfico y de video propio, producido por el equipo del club o por colaboradores debidamente identificados.',
    ],
  },
  {
    id: 'correcciones',
    label: 'Política de correcciones',
    purpose: 'Qué hacer si encuentras un error, y en cuánto tiempo responde el club.',
    icon: 'ph:pencil-simple-line-bold',
    order: 3,
    paragraphs: [
      'Si encuentras un error en alguna de nuestras publicaciones (un dato, un nombre, un resultado, una atribución), comunícalo por escrito indicando la URL del contenido y la corrección sugerida.',
      `Nos comprometemos a responder en un plazo máximo de ${CORRECTION_RESPONSE_HOURS} horas hábiles. Cuando corresponda, dejaremos constancia visible de la corrección al pie del artículo original con su fecha.`,
    ],
  },
  {
    id: 'conflictos',
    label: 'Conflictos de interés',
    purpose: 'Por qué el club no es un medio independiente, y qué sí se compromete a distinguir.',
    icon: 'ph:scales-bold',
    order: 4,
    paragraphs: [
      'El club informa sobre sus propios corredores, eventos y resultados. No pretendemos imparcialidad respecto a otros clubes ni nos presentamos como medio independiente: somos una organización deportiva que comunica su actividad.',
      'Lo que sí nos comprometemos a sostener es la transparencia: distinguimos claramente entre crónica deportiva, comunicado institucional y mensaje publicitario o de patrocinio. Cuando un contenido esté asociado a un patrocinador o convenio, lo identificamos de forma visible.',
    ],
  },
  {
    id: 'menores',
    label: 'Cobertura de menores',
    purpose: 'Qué protocolo sigue el club antes de publicar la imagen de un menor.',
    icon: 'ph:shield-check-bold',
    order: 5,
    paragraphs: [
      'La mayoría de nuestros corredores son menores de edad. Por eso aplicamos un protocolo específico de cobertura:',
    ],
    items: [
      'Toda publicación de imágenes de menores requiere autorización previa por escrito firmada por la madre, padre o representante legal.',
      'Las fotografías se toman en contextos deportivos públicos (entrenamientos, válidas, premiaciones) y siempre con criterio de respeto a la dignidad del menor.',
      'No publicamos datos sensibles de menores (dirección, colegio, rutinas privadas) más allá de la información estrictamente deportiva.',
      'Las familias pueden ejercer el derecho al retiro de contenido en cualquier momento escribiendo al correo del club, sin necesidad de justificar el motivo.',
    ],
  },
];

export interface EditorialStandardsSummary {
  /** Cuántas categorías de la política están publicadas. */
  standardsCount: number;
  /** Cuántas fuentes primarias declara el estándar de "Fuentes". */
  sourcesCount: number;
}

/**
 * Cifras que respaldan la cabecera de la página. Se derivan del propio
 * catálogo en vez de escribirse a mano: si mañana se agrega un estándar o una
 * fuente, la cifra visible se actualiza sola.
 */
export function summarizeStandards(
  standards: Pick<EditorialStandard, 'id' | 'items'>[],
): EditorialStandardsSummary {
  const sourcesCount = standards.find((s) => s.id === 'fuentes')?.items?.length ?? 0;

  return {
    standardsCount: standards.length,
    sourcesCount,
  };
}
