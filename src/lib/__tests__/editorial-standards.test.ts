import { describe, it, expect } from 'vitest';
import {
  EDITORIAL_STANDARDS,
  CORRECTION_RESPONSE_HOURS,
  summarizeStandards,
  type EditorialStandard,
} from '../editorial-standards';

// ============================================================
// EDITORIAL_STANDARDS
// ============================================================

describe('EDITORIAL_STANDARDS', () => {
  it('cada estándar trae una frase que responde una pregunta concreta', () => {
    for (const standard of EDITORIAL_STANDARDS) {
      expect(standard.purpose.length).toBeGreaterThan(15);
    }
  });

  it('cada estándar trae contenido: párrafos, lista, o ambos', () => {
    for (const standard of EDITORIAL_STANDARDS) {
      const hasParagraphs = standard.paragraphs.length > 0;
      const hasItems = (standard.items?.length ?? 0) > 0;
      expect(hasParagraphs || hasItems).toBe(true);
    }
  });

  it('el orden de lectura es único y consecutivo desde 1', () => {
    const orders = EDITORIAL_STANDARDS.map((s) => s.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it('ningún id se repite', () => {
    const ids = EDITORIAL_STANDARDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el estándar de correcciones interpola el mismo plazo que la cabecera', () => {
    const correcciones = EDITORIAL_STANDARDS.find((s) => s.id === 'correcciones');
    const mencionaPlazo = correcciones?.paragraphs.some((p) =>
      p.includes(`${CORRECTION_RESPONSE_HOURS} horas hábiles`),
    );
    expect(mencionaPlazo).toBe(true);
  });

  it('el estándar de menores trae el protocolo como lista, no como párrafo suelto', () => {
    const menores = EDITORIAL_STANDARDS.find((s) => s.id === 'menores');
    expect(menores?.items?.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================
// summarizeStandards
// ============================================================

describe('summarizeStandards', () => {
  it('cuenta los estándares reales del club', () => {
    expect(summarizeStandards(EDITORIAL_STANDARDS).standardsCount).toBe(5);
  });

  it('cuenta las fuentes primarias reales', () => {
    expect(summarizeStandards(EDITORIAL_STANDARDS).sourcesCount).toBe(3);
  });

  it('la cifra de fuentes sube sola si se agrega una fuente nueva', () => {
    const conFuenteExtra: EditorialStandard[] = EDITORIAL_STANDARDS.map((s) =>
      s.id === 'fuentes' ? { ...s, items: [...(s.items ?? []), 'Una fuente nueva'] } : s,
    );
    expect(summarizeStandards(conFuenteExtra).sourcesCount).toBe(4);
  });

  it('devuelve 0 fuentes si no hay categoría de fuentes', () => {
    const sinFuentes = EDITORIAL_STANDARDS.filter((s) => s.id !== 'fuentes');
    expect(summarizeStandards(sinFuentes).sourcesCount).toBe(0);
  });

  it('no se cae sin estándares', () => {
    expect(summarizeStandards([])).toEqual({ standardsCount: 0, sourcesCount: 0 });
  });
});
