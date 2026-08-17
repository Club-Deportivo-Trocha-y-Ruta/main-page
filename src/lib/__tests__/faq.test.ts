import { describe, it, expect } from 'vitest';
import { groupFaqsByTopic, summarizeFaqs, getTopicProfile, FAQ_TOPICS } from '../faq';

const faq = (id: string, category: string, order: number, draft = false) => ({
  id,
  data: { question: `¿${id}?`, answer: 'Respuesta.', category, order, draft },
});

// Muestra de las trece preguntas reales, con sus categorías y su `order`.
const REALES = [
  faq('edad-minima', 'general', 1),
  faq('experiencia-previa', 'inscripciones', 2),
  faq('que-necesita-traer', 'equipamiento', 3),
  faq('horarios-entrenamiento', 'entrenamiento', 4),
  faq('costo-inscripcion', 'inscripciones', 5),
  faq('seguridad-entrenamientos', 'seguridad', 6),
  faq('competencias', 'competencias', 7),
  faq('tipo-bicicleta', 'equipamiento', 8),
  faq('proceso-inscripcion', 'inscripciones', 9),
  faq('ubicacion', 'general', 10),
  faq('padres-acompanar', 'general', 12),
];

// ============================================================
// groupFaqsByTopic
// ============================================================

describe('groupFaqsByTopic', () => {
  it('ordena los temas por el recorrido de la familia, no por el del CMS', () => {
    expect(groupFaqsByTopic(REALES).map((g) => g.category)).toEqual([
      'general',
      'inscripciones',
      'equipamiento',
      'entrenamiento',
      'seguridad',
      'competencias',
    ]);
  });

  it('ordena las preguntas dentro del tema por su `order`', () => {
    const inscripciones = groupFaqsByTopic(REALES).find((g) => g.category === 'inscripciones')!;
    expect(inscripciones.faqs.map((f) => f.id)).toEqual([
      'experiencia-previa',
      'costo-inscripcion',
      'proceso-inscripcion',
    ]);
  });

  it('no depende del orden en que lleguen las preguntas', () => {
    const revuelto = [...REALES].reverse();
    expect(groupFaqsByTopic(revuelto)).toEqual(groupFaqsByTopic(REALES));
  });

  it('no pinta un tema sin preguntas publicadas', () => {
    const soloGeneral = groupFaqsByTopic([faq('a', 'general', 1)]);
    expect(soloGeneral).toHaveLength(1);
    expect(soloGeneral[0].category).toBe('general');
  });

  it('descarta los borradores', () => {
    const grupos = groupFaqsByTopic([faq('a', 'general', 1), faq('b', 'general', 2, true)]);
    expect(grupos[0].faqs.map((f) => f.id)).toEqual(['a']);
  });

  it('un tema que queda solo con borradores desaparece', () => {
    expect(groupFaqsByTopic([faq('b', 'seguridad', 1, true)])).toEqual([]);
  });

  it('una categoría desconocida cae al final y no se pierde', () => {
    const grupos = groupFaqsByTopic([faq('x', 'inventada', 1), faq('a', 'general', 1)]);
    expect(grupos.map((g) => g.category)).toEqual(['general', 'inventada']);
    expect(grupos[1].profile.label).toBe('Otras preguntas');
  });

  it('da a cada tema un ancla estable para el índice', () => {
    for (const group of groupFaqsByTopic(REALES)) {
      expect(group.anchor).toBe(`tema-${group.category}`);
    }
  });

  it('sobrevive a una colección vacía', () => {
    expect(groupFaqsByTopic([])).toEqual([]);
  });
});

// ============================================================
// FAQ_TOPICS
// ============================================================

describe('FAQ_TOPICS', () => {
  it('cada tema explica qué pregunta responde', () => {
    for (const topic of Object.values(FAQ_TOPICS)) {
      expect(topic.purpose.length).toBeGreaterThan(20);
    }
  });

  it('el orden de lectura no tiene empates', () => {
    const orders = Object.values(FAQ_TOPICS).map((t) => t.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('los enlaces de detalle son rutas internas del sitio', () => {
    for (const topic of Object.values(FAQ_TOPICS)) {
      if (topic.detail) expect(topic.detail.href).toMatch(/^\/[a-z0-9/#-]*$/);
    }
  });

  it('cae en un tema genérico ante una categoría desconocida', () => {
    expect(getTopicProfile('inventada').label).toBe('Otras preguntas');
    expect(getTopicProfile('general').label).toBe('Antes de empezar');
  });
});

// ============================================================
// summarizeFaqs
// ============================================================

describe('summarizeFaqs', () => {
  it('cuenta preguntas y temas publicados', () => {
    expect(summarizeFaqs(REALES)).toEqual({ total: 11, topics: 6 });
  });

  it('no cuenta los borradores', () => {
    expect(summarizeFaqs([faq('a', 'general', 1), faq('b', 'general', 2, true)])).toEqual({
      total: 1,
      topics: 1,
    });
  });

  it('devuelve ceros sin preguntas', () => {
    expect(summarizeFaqs([])).toEqual({ total: 0, topics: 0 });
  });
});
