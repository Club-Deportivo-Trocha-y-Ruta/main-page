/**
 * Lógica compartida de la página de Transparencia.
 *
 * Los documentos institucionales no son una pila de PDF con nombres
 * burocráticos ("ECF Club Trocha y Ruta 2024"): cada categoría responde una
 * pregunta concreta que se hace una familia antes de confiarle su hijo y su
 * plata al club ("¿a dónde va cada aporte?", "¿el club existe de verdad?").
 * Esa explicación vive aquí una sola vez —no repetida ni inventada en la
 * plantilla— junto con las cifras que respaldan la promesa de la página,
 * siempre derivadas de `src/data/transparencia-documentos.json`.
 *
 * El peso de cada archivo se lee con `node:fs` en el frontmatter de la
 * página (Astro corre en Node durante el build), no aquí: este módulo se
 * queda puro, igual que `calendar.ts` o `programs.ts`, para poder testearlo
 * sin tocar disco.
 */

export type DocumentCategory = 'Financieros' | 'Legales' | 'Tributarios' | 'Gestión' | 'Actas';

export interface TransparencyDocument {
  nombre: string;
  descripcion: string;
  /** Texto libre en el JSON: se valida contra `DOCUMENT_CATEGORIES` al agrupar, no aquí. */
  categoria: string;
  /** Ruta pública del PDF (ej. "/documentos/transparencia/x.pdf"). No se reescribe. */
  archivo: string;
  /** Vigencia del documento. `null` cuando el documento no envejece (estatutos, certificados). */
  anio: number | null;
}

/** Documento con el peso ya leído del disco. `null` cuando el archivo no aparece en `public/`. */
export interface TransparencyDocumentWithSize extends TransparencyDocument {
  sizeLabel: string | null;
}

export interface CategoryProfile {
  /** Nombre de la categoría, igual al valor que trae el JSON. */
  label: string;
  /** Una frase: a qué pregunta de una familia responde esta categoría. */
  purpose: string;
  /** Icono Phosphor de la categoría. */
  icon: string;
  /** Orden de lectura: de la promesa más amplia (la plata) a la más granular (una firma de acta). */
  order: number;
}

/**
 * Las cinco categorías reales del club, en el orden en que conviene leerlas:
 * primero la plata (la pregunta más amplia), después la legitimidad legal y
 * tributaria, y por último el detalle operativo (gestión del año, actas
 * puntuales).
 */
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, CategoryProfile> = {
  'Financieros': {
    label: 'Financieros',
    purpose:
      'De dónde sale la plata del club y en qué se gasta: estados financieros y de resultados de cada vigencia.',
    icon: 'ph:currency-circle-dollar-bold',
    order: 1,
  },
  'Legales': {
    label: 'Legales',
    purpose:
      'La prueba de que el club existe, está reconocido y habilitado para operar como club deportivo.',
    icon: 'ph:seal-check-bold',
    order: 2,
  },
  'Tributarios': {
    label: 'Tributarios',
    purpose: 'La constancia de que el club está al día con sus obligaciones ante la DIAN.',
    icon: 'ph:shield-check-bold',
    order: 3,
  },
  'Gestión': {
    label: 'Gestión',
    purpose:
      'El resumen de lo que hizo el club durante el año: actividades, resultados y alcance de cada programa.',
    icon: 'ph:briefcase-bold',
    order: 4,
  },
  'Actas': {
    label: 'Actas',
    purpose: 'Las decisiones que tomó la asamblea del club, con fecha y quién las autorizó.',
    icon: 'ph:clipboard-text-bold',
    order: 5,
  },
};

/** Cae aquí un documento con una categoría fuera de las cinco conocidas: no desaparece. */
const FALLBACK_CATEGORY: CategoryProfile = {
  label: 'Otros documentos',
  purpose: 'Otra información institucional publicada por el club.',
  icon: 'ph:file-text-bold',
  order: 99,
};

export function getCategoryProfile(categoria: string): CategoryProfile {
  return DOCUMENT_CATEGORIES[categoria as DocumentCategory] ?? FALLBACK_CATEGORY;
}

// ─── Agrupación ────────────────────────────────────────────────────────────

export interface DocumentGroup<T> {
  categoria: string;
  profile: CategoryProfile;
  documents: T[];
}

/**
 * Agrupa los documentos por categoría, en el orden de lectura definido por
 * `DOCUMENT_CATEGORIES`. Una categoría sin documentos no aparece: no hay nada
 * que explicar todavía. Una categoría que el mapa no conoce tampoco se
 * pierde: cae en `FALLBACK_CATEGORY`, al final.
 */
export function groupByCategory<T extends Pick<TransparencyDocument, 'categoria'>>(
  documents: T[]
): DocumentGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const doc of documents) {
    const bucket = buckets.get(doc.categoria);
    if (bucket) bucket.push(doc);
    else buckets.set(doc.categoria, [doc]);
  }

  return [...buckets.entries()]
    .map(([categoria, docs]) => ({
      categoria,
      profile: getCategoryProfile(categoria),
      documents: docs,
    }))
    .sort((a, b) => a.profile.order - b.profile.order);
}

// ─── Cifras de cabecera ────────────────────────────────────────────────────

export interface DocumentSummary {
  total: number;
  /** Categorías distintas presentes en los documentos. */
  categoryCount: number;
  /** Año más reciente entre los documentos que traen `anio`. `null` si ninguno lo trae. */
  latestYear: number | null;
  /** Años distintos de estados financieros publicados. `null` si no hay ninguno con año. */
  financialYearsCount: number | null;
}

/**
 * Cifras que respaldan la promesa de la página. Solo se devuelve lo que el
 * contenido sostiene: sin documentos con año, `latestYear` queda en `null` en
 * vez de mostrar un dato inventado.
 */
export function summarizeDocuments(
  documents: Pick<TransparencyDocument, 'categoria' | 'anio'>[]
): DocumentSummary {
  if (documents.length === 0) {
    return { total: 0, categoryCount: 0, latestYear: null, financialYearsCount: null };
  }

  const categories = new Set(documents.map((d) => d.categoria));

  const years = documents.map((d) => d.anio).filter((anio): anio is number => anio !== null);

  const financialYears = new Set(
    documents
      .filter((d) => d.categoria === 'Financieros')
      .map((d) => d.anio)
      .filter((anio): anio is number => anio !== null)
  );

  return {
    total: documents.length,
    categoryCount: categories.size,
    latestYear: years.length > 0 ? Math.max(...years) : null,
    financialYearsCount: financialYears.size > 0 ? financialYears.size : null,
  };
}

// ─── Peso y tipo de archivo ────────────────────────────────────────────────

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * 1024;

/**
 * Peso de archivo legible en español: bytes, KB o MB, con coma como
 * separador decimal. El KB se redondea a un entero —nadie necesita
 * fracciones de kilobyte—; el MB lleva un decimal porque ahí sí se nota la
 * diferencia entre bajar 3 MB o 15 MB con datos móviles.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_KB) return `${Math.round(bytes)} B`;
  if (bytes < BYTES_PER_MB) return `${Math.round(bytes / BYTES_PER_KB)} KB`;
  return `${(bytes / BYTES_PER_MB).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Extensión del archivo en mayúsculas ("PDF"), a partir de la ruta real en
 * `archivo`. No se asume que todo es PDF: si el club publica otro formato
 * mañana, la ficha lo muestra sin que nadie tenga que tocar la plantilla.
 */
export function fileType(archivo: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(archivo);
  return match ? match[1].toUpperCase() : 'Archivo';
}
