/**
 * Lógica compartida de las preguntas frecuentes.
 *
 * La página listaba las seis categorías del CMS en el orden en que estaban
 * escritas en un array, con un título y un acordeón cada una. Pero una familia
 * que llega por primera vez no busca "categorías": recorre una secuencia —¿es
 * para mi hijo? ¿cómo entra? ¿qué necesita? ¿cómo es la semana? ¿está seguro?
 * ¿y después?— y sus preguntas caen en ese orden.
 *
 * Aquí vive esa secuencia: qué pregunta de fondo responde cada tema y dónde
 * está el detalle completo. Es el mismo vocabulario editorial que
 * `DOCUMENT_CATEGORIES` en transparencia o `CONTACT_CHANNELS` en contacto:
 * escrito una vez, no repetido en la plantilla.
 *
 * Las preguntas y las respuestas siguen saliendo enteras de la colección
 * `faqs`. Aquí no se escribe ni una.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`.
 */

export type FaqCategory =
  | 'general'
  | 'inscripciones'
  | 'equipamiento'
  | 'entrenamiento'
  | 'seguridad'
  | 'competencias';

export interface TopicDetail {
  href: string;
  label: string;
}

export interface TopicProfile {
  /** Rótulo del tema. */
  label: string;
  /** La pregunta de fondo que responde el grupo, en una frase. */
  purpose: string;
  icon: string;
  /** Orden de lectura: el recorrido de una familia, no el del CMS. */
  order: number;
  /** Dónde se ve el detalle completo, si existe una página que lo desarrolle. */
  detail?: TopicDetail;
}

export const FAQ_TOPICS: Record<FaqCategory, TopicProfile> = {
  general: {
    label: 'Antes de empezar',
    purpose:
      'Lo primero que se pregunta quien nunca ha traído a su hijo: si tiene la edad, qué se hace en el club y si los papás pueden quedarse a mirar.',
    icon: 'ph:compass-bold',
    order: 1,
    detail: { href: '/quienes-somos', label: 'Conocer el club' },
  },
  inscripciones: {
    label: 'Cómo entra',
    purpose:
      'Qué hay que hacer para inscribir a un niño, qué papeles pide el club y qué pasa en cada paso.',
    icon: 'ph:clipboard-text-bold',
    order: 2,
    detail: { href: '/inscripciones', label: 'Ver el proceso paso a paso' },
  },
  equipamiento: {
    label: 'Qué necesita',
    purpose:
      'Con qué tiene que llegar el primer día y qué se puede dejar para más adelante, sin gastar de más al principio.',
    icon: 'ph:backpack-bold',
    order: 3,
    detail: { href: '/programas', label: 'Ver lo que pide cada programa' },
  },
  entrenamiento: {
    label: 'Cómo es la semana',
    purpose: 'Qué días se entrena, a qué horas y en qué se le va el tiempo a cada grupo.',
    icon: 'ph:barbell-bold',
    order: 4,
    detail: { href: '/contacto#semana-titulo', label: 'Ver la semana completa' },
  },
  seguridad: {
    label: 'Cómo se les cuida',
    purpose: 'Quién acompaña a los niños mientras entrenan y qué respaldo hay si alguien se cae.',
    icon: 'ph:shield-check-bold',
    order: 5,
    detail: { href: '/inscripciones', label: 'Ver la póliza y los requisitos' },
  },
  competencias: {
    label: 'Y después, competir',
    purpose:
      'Cuándo empieza a correr un deportista del club, con qué exigencia y si es obligatorio.',
    icon: 'ph:trophy-bold',
    order: 6,
    detail: { href: '/calendario', label: 'Ver el calendario de la temporada' },
  },
};

/** Cae aquí una categoría fuera de las seis conocidas: no desaparece. */
const FALLBACK_TOPIC: TopicProfile = {
  label: 'Otras preguntas',
  purpose: 'Lo que no encaja en los temas anteriores.',
  icon: 'ph:question-bold',
  order: 99,
};

export function getTopicProfile(category: string): TopicProfile {
  return FAQ_TOPICS[category as FaqCategory] ?? FALLBACK_TOPIC;
}

// ─── Agrupación ─────────────────────────────────────────────────────────────

export interface TopicGroup<T> {
  category: string;
  profile: TopicProfile;
  /** Ancla de la sección, para el índice de temas. */
  anchor: string;
  faqs: T[];
}

interface FaqInput {
  id: string;
  data: { question: string; answer: string; category: string; order: number; draft?: boolean };
}

/**
 * Agrupa las preguntas por tema, en el orden de lectura de `FAQ_TOPICS` y, ya
 * dentro de cada tema, por el `order` que les puso el club.
 *
 * Un tema sin preguntas publicadas no aparece: no hay nada que responder
 * todavía. Una categoría que el mapa no conoce tampoco se pierde: cae al final.
 */
export function groupFaqsByTopic<T extends FaqInput>(faqs: T[]): TopicGroup<T>[] {
  const buckets = new Map<string, T[]>();

  for (const faq of faqs) {
    if (faq.data.draft) continue;
    const bucket = buckets.get(faq.data.category);
    if (bucket) bucket.push(faq);
    else buckets.set(faq.data.category, [faq]);
  }

  return [...buckets.entries()]
    .map(([category, entries]) => ({
      category,
      profile: getTopicProfile(category),
      anchor: `tema-${category}`,
      faqs: [...entries].sort((a, b) => a.data.order - b.data.order),
    }))
    .sort((a, b) => a.profile.order - b.profile.order);
}

// ─── Cifras de cabecera ─────────────────────────────────────────────────────

export interface FaqSummary {
  /** Preguntas publicadas. */
  total: number;
  /** Temas con al menos una pregunta. */
  topics: number;
}

/**
 * Solo se cuenta lo publicado. Deliberadamente no se devuelve el número de
 * programas: la respuesta `programas-disponibles` afirma que son cuatro y la
 * colección publica tres, así que una cifra derivada se contradiría con el
 * texto de la propia página.
 */
export function summarizeFaqs<T extends FaqInput>(faqs: T[]): FaqSummary {
  const published = faqs.filter((faq) => !faq.data.draft);
  return {
    total: published.length,
    topics: new Set(published.map((faq) => faq.data.category)).size,
  };
}
