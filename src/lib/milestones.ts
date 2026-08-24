/**
 * Hitos de la historia del club: de la collection `milestones` al formato que
 * consume `Timeline.astro`.
 *
 * El texto de cada hito vive en la collection, pero algunas cifras (los años
 * activos, los árboles sembrados) cambian solas con el tiempo o con el
 * contenido. Para no congelarlas dentro de la frase, el `body` admite
 * marcadores `{{clave}}` que se sustituyen en build.
 */
import { getRefreshImage } from './refresh-images';

/** Forma que espera `TimelineItem` de `Timeline.astro`. */
export interface MilestoneItem {
  label: string;
  title: string;
  body: string;
  icon?: string;
  image?: ImageMetadata;
  imageAlt?: string;
}

/** Datos crudos de un hito, tal como salen del frontmatter. */
export interface MilestoneData {
  label: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  imageAlt?: string;
  order: number;
  draft: boolean;
}

/** Cifras vivas disponibles para los marcadores del `body`. */
export type MilestoneVars = Record<string, string | number>;

const PLACEHOLDER = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Sustituye los marcadores `{{clave}}` por su valor.
 *
 * Un marcador sin valor se deja tal cual: es preferible que salte a la vista en
 * QA a que la frase quede coja o con un hueco silencioso.
 */
export function renderMilestoneText(text: string, vars: MilestoneVars): string {
  return text.replace(PLACEHOLDER, (match, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Ordena, filtra borradores y resuelve textos e imágenes de los hitos.
 */
export function buildMilestoneItems(
  entries: MilestoneData[],
  vars: MilestoneVars = {}
): MilestoneItem[] {
  return entries
    .filter((entry) => !entry.draft)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((entry) => ({
      label: renderMilestoneText(entry.label, vars),
      title: renderMilestoneText(entry.title, vars),
      body: renderMilestoneText(entry.body, vars),
      icon: entry.icon,
      image: getRefreshImage(entry.image),
      imageAlt: entry.imageAlt,
    }));
}
