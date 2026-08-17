import { describe, it, expect } from 'vitest';
import { ENROLLMENT_STEPS, ENROLLMENT_DOCUMENTS, ENROLLMENT_POLICY } from '../enrollment';

// ============================================================
// El proceso, paso a paso
// ============================================================

describe('ENROLLMENT_STEPS', () => {
  it('recorre el proceso completo, del formulario al primer entrenamiento, en orden', () => {
    expect(ENROLLMENT_STEPS.map((step) => step.title)).toEqual([
      'Envías la preinscripción',
      'El director deportivo te contacta',
      'Clase de prueba gratuita',
      'Entregas los documentos y pagas el seguro',
      'Primer entrenamiento',
    ]);
  });

  it('tiene entre cuatro y cinco pasos, como pide el sistema editorial', () => {
    expect(ENROLLMENT_STEPS.length).toBeGreaterThanOrEqual(4);
    expect(ENROLLMENT_STEPS.length).toBeLessThanOrEqual(5);
  });

  it('no deja pasos sin título, cuerpo o icono — ningún hueco en el recorrido', () => {
    for (const step of ENROLLMENT_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      expect(step.icon.startsWith('ph:')).toBe(true);
    }
  });

  it('no repite el título de un paso', () => {
    const titles = ENROLLMENT_STEPS.map((step) => step.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('la clase de prueba se anuncia gratuita y sin compromiso', () => {
    const trial = ENROLLMENT_STEPS.find((step) => step.title.includes('prueba'));
    expect(trial?.title).toContain('gratuita');
    expect(trial?.body).toContain('costo ni compromiso');
  });
});

// ============================================================
// Documentos requeridos
// ============================================================

describe('ENROLLMENT_DOCUMENTS', () => {
  it('incluye los tres documentos que pide el club para confirmar la inscripción', () => {
    expect(ENROLLMENT_DOCUMENTS.map((doc) => doc.label)).toEqual([
      'Documento de identidad del niño o niña',
      'EPS vigente',
      'Autorización firmada del acudiente',
    ]);
  });

  it('cada documento trae su propio icono Phosphor', () => {
    for (const doc of ENROLLMENT_DOCUMENTS) {
      expect(doc.icon.startsWith('ph:')).toBe(true);
    }
    const icons = new Set(ENROLLMENT_DOCUMENTS.map((doc) => doc.icon));
    expect(icons.size).toBe(ENROLLMENT_DOCUMENTS.length);
  });
});

// ============================================================
// Póliza deportiva
// ============================================================

describe('ENROLLMENT_POLICY', () => {
  it('expone el valor anual, la aseguradora y la vigencia tal como se publican', () => {
    expect(ENROLLMENT_POLICY.annualFee).toBe('$60.000');
    expect(ENROLLMENT_POLICY.insurer).toBe('Aseguradora Solidaria de Colombia');
    expect(ENROLLMENT_POLICY.validity).toBe('Marzo 2026 – marzo 2027');
  });

  it('trae las seis coberturas', () => {
    expect(ENROLLMENT_POLICY.coverages).toHaveLength(6);
  });

  it('expone los montos exactos, sin redondear ni reformular', () => {
    const byLabel = Object.fromEntries(
      ENROLLMENT_POLICY.coverages.map((coverage) => [coverage.label, coverage.amount]),
    );
    expect(byLabel['Gastos médicos']).toBe('Hasta $5.000.000');
    expect(byLabel['Rehabilitación integral']).toBe('$10.000.000');
    expect(byLabel['Traslado en ambulancia']).toBe('$500.000');
    expect(byLabel['Renta hospitalaria']).toBe('$50.000/día (30 días)');
    expect(byLabel['Incapacidad total']).toBe('$10.000.000');
    expect(byLabel['Ambulancia para eventos']).toBeTruthy();
  });

  it('no inventa un monto en pesos para la cobertura que no lo publica', () => {
    const eventCoverage = ENROLLMENT_POLICY.coverages.find(
      (coverage) => coverage.label === 'Ambulancia para eventos',
    );
    expect(eventCoverage?.amount).not.toMatch(/\$/);
  });

  it('no repite etiquetas de cobertura', () => {
    const labels = ENROLLMENT_POLICY.coverages.map((coverage) => coverage.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('cada cobertura trae un icono Phosphor', () => {
    for (const coverage of ENROLLMENT_POLICY.coverages) {
      expect(coverage.icon.startsWith('ph:')).toBe(true);
    }
  });
});
