import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_CATEGORIES,
  getCategoryProfile,
  groupByCategory,
  summarizeDocuments,
  formatFileSize,
  fileType,
  type TransparencyDocument,
} from '../transparency';

const doc = (
  nombre: string,
  categoria: string,
  anio: number | null = null
): TransparencyDocument => ({
  nombre,
  descripcion: `Descripción de ${nombre}`,
  categoria,
  archivo: `/documentos/transparencia/${nombre}.pdf`,
  anio,
});

// Los doce documentos reales del club: si el JSON cambia de forma, este test
// avisa que el agrupamiento o el resumen dejaron de cuadrar.
const REAL_DOCUMENTS: TransparencyDocument[] = [
  doc('EF Club Trocha y Ruta 2024', 'Financieros', 2024),
  doc('ER Club Trocha y Ruta 2024', 'Financieros', 2024),
  doc('ECF Club Trocha y Ruta 2024', 'Financieros', 2024),
  doc('Informe de Gestión 2024', 'Gestión', 2024),
  doc('Estatutos Club Trocha y Ruta', 'Legales', null),
  doc('Reconocimiento Deportivo', 'Legales', null),
  doc('Certificado de Existencia y Representación', 'Legales', null),
  doc('Certificado de No Caducidad', 'Legales', null),
  doc('RUT Actualizado', 'Tributarios', null),
  doc('Certificado de Cumplimiento 2024', 'Tributarios', 2024),
  doc('Acta Marzo 2025', 'Actas', 2025),
  doc('Acta de Autorización Representante Legal', 'Actas', null),
];

// ============================================================
// getCategoryProfile
// ============================================================

describe('getCategoryProfile', () => {
  it('cada categoría conocida trae una frase que responde una pregunta concreta', () => {
    for (const profile of Object.values(DOCUMENT_CATEGORIES)) {
      expect(profile.purpose.length).toBeGreaterThan(15);
    }
  });

  it('devuelve el perfil de la categoría cuando existe', () => {
    expect(getCategoryProfile('Financieros')).toBe(DOCUMENT_CATEGORIES.Financieros);
  });

  it('cae en el perfil de reserva ante una categoría desconocida', () => {
    const perfil = getCategoryProfile('Inexistente');
    expect(perfil.label).toBe('Otros documentos');
    expect(perfil.order).toBeGreaterThan(DOCUMENT_CATEGORIES.Actas.order);
  });
});

// ============================================================
// groupByCategory
// ============================================================

describe('groupByCategory', () => {
  it('agrupa los documentos reales en el orden de lectura definido', () => {
    const groups = groupByCategory(REAL_DOCUMENTS);
    expect(groups.map((g) => g.categoria)).toEqual([
      'Financieros',
      'Legales',
      'Tributarios',
      'Gestión',
      'Actas',
    ]);
  });

  it('cuenta bien cuántos documentos trae cada categoría', () => {
    const groups = groupByCategory(REAL_DOCUMENTS);
    const counts = Object.fromEntries(groups.map((g) => [g.categoria, g.documents.length]));
    expect(counts).toEqual({
      Financieros: 3,
      Legales: 4,
      Tributarios: 2,
      'Gestión': 1,
      Actas: 2,
    });
  });

  it('no muestra una categoría sin documentos', () => {
    const soloFinancieros = REAL_DOCUMENTS.filter((d) => d.categoria === 'Financieros');
    const groups = groupByCategory(soloFinancieros);
    expect(groups).toHaveLength(1);
    expect(groups[0].categoria).toBe('Financieros');
  });

  it('adjunta el perfil (propósito e ícono) de cada categoría', () => {
    const groups = groupByCategory(REAL_DOCUMENTS);
    const financieros = groups.find((g) => g.categoria === 'Financieros');
    expect(financieros?.profile).toBe(DOCUMENT_CATEGORIES.Financieros);
  });

  it('conserva los documentos de cada grupo, sin perder ninguno', () => {
    const groups = groupByCategory(REAL_DOCUMENTS);
    const legales = groups.find((g) => g.categoria === 'Legales');
    expect(legales?.documents.map((d) => d.nombre)).toEqual([
      'Estatutos Club Trocha y Ruta',
      'Reconocimiento Deportivo',
      'Certificado de Existencia y Representación',
      'Certificado de No Caducidad',
    ]);
  });

  it('no descarta una categoría desconocida: cae al final con el perfil de reserva', () => {
    const conCategoriaRara = [
      ...REAL_DOCUMENTS,
      { nombre: 'Otro documento', descripcion: 'x', categoria: 'Varios', archivo: '/x.pdf', anio: null },
    ];
    const groups = groupByCategory(conCategoriaRara);
    expect(groups).toHaveLength(6);
    expect(groups[groups.length - 1].categoria).toBe('Varios');
    expect(groups[groups.length - 1].profile.label).toBe('Otros documentos');
  });

  it('no se cae sin documentos', () => {
    expect(groupByCategory([])).toEqual([]);
  });
});

// ============================================================
// summarizeDocuments
// ============================================================

describe('summarizeDocuments', () => {
  it('cuenta el total y las categorías presentes', () => {
    const summary = summarizeDocuments(REAL_DOCUMENTS);
    expect(summary.total).toBe(12);
    expect(summary.categoryCount).toBe(5);
  });

  it('saca la vigencia más reciente e ignora los documentos sin año', () => {
    expect(summarizeDocuments(REAL_DOCUMENTS).latestYear).toBe(2025);
  });

  it('cuenta los años distintos de estados financieros publicados', () => {
    // Los tres documentos Financieros del club son todos de la vigencia 2024: un solo año.
    expect(summarizeDocuments(REAL_DOCUMENTS).financialYearsCount).toBe(1);
  });

  it('cuenta más de un año financiero cuando el club publica otra vigencia', () => {
    const conDosVigencias = [
      ...REAL_DOCUMENTS,
      doc('EF Club Trocha y Ruta 2023', 'Financieros', 2023),
    ];
    expect(summarizeDocuments(conDosVigencias).financialYearsCount).toBe(2);
  });

  it('deja en null la vigencia más reciente cuando ningún documento trae año', () => {
    const sinAnios = REAL_DOCUMENTS.map((d) => ({ ...d, anio: null }));
    expect(summarizeDocuments(sinAnios).latestYear).toBeNull();
  });

  it('deja en null los años financieros cuando no hay categoría Financieros', () => {
    const sinFinancieros = REAL_DOCUMENTS.filter((d) => d.categoria !== 'Financieros');
    expect(summarizeDocuments(sinFinancieros).financialYearsCount).toBeNull();
  });

  it('deja en null los años financieros cuando los documentos Financieros no traen año', () => {
    const financierosSinAnio = REAL_DOCUMENTS.map((d) =>
      d.categoria === 'Financieros' ? { ...d, anio: null } : d
    );
    expect(summarizeDocuments(financierosSinAnio).financialYearsCount).toBeNull();
  });

  it('no inventa nada sin documentos', () => {
    expect(summarizeDocuments([])).toEqual({
      total: 0,
      categoryCount: 0,
      latestYear: null,
      financialYearsCount: null,
    });
  });
});

// ============================================================
// formatFileSize
// ============================================================

describe('formatFileSize', () => {
  it('muestra los bytes tal cual bajo 1 KB', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('redondea los KB a un entero, sin decimales', () => {
    // El Certificado de Existencia real pesa 38921 bytes en disco.
    expect(formatFileSize(38921)).toBe('38 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('pasa a MB con un decimal y coma, no punto', () => {
    // El Reconocimiento Deportivo real pesa 15500868 bytes en disco.
    expect(formatFileSize(15500868)).toBe('14,8 MB');
    expect(formatFileSize(1024 * 1024)).toBe('1,0 MB');
  });

  it('el corte entre KB y MB queda justo en 1024 KB', () => {
    expect(formatFileSize(1024 * 1024 - 1)).toContain('KB');
    expect(formatFileSize(1024 * 1024)).toContain('MB');
  });
});

// ============================================================
// fileType
// ============================================================

describe('fileType', () => {
  it('lee la extensión real del archivo en mayúsculas', () => {
    expect(fileType('/documentos/transparencia/Acta-Marzo-2025.pdf')).toBe('PDF');
  });

  it('no asume que todo es PDF: respeta otra extensión', () => {
    expect(fileType('/documentos/transparencia/informe.docx')).toBe('DOCX');
  });

  it('cae en un rótulo genérico si no hay extensión reconocible', () => {
    expect(fileType('/documentos/transparencia/sin-extension')).toBe('Archivo');
  });
});
