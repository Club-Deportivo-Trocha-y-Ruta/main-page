import { describe, it, expect } from 'vitest';
import {
  slugify,
  getCategoryLabel,
  getEventStatusLabel,
  formatDate,
  formatShortDate,
} from '../utils';

// ─────────────────────────────────────────────────────────────
// slugify
// ─────────────────────────────────────────────────────────────
describe('slugify', () => {
  it('convierte a minúsculas', () => {
    expect(slugify('Copa Valle')).toBe('copa-valle');
  });

  it('elimina acentos y tildes', () => {
    expect(slugify('Cartago–Río Frío')).toBe('cartago-rio-frio');
  });

  it('reemplaza espacios múltiples con un solo guion', () => {
    expect(slugify('copa  del  valle')).toBe('copa-del-valle');
  });

  it('elimina guiones al inicio y al final', () => {
    expect(slugify(' copa del valle ')).toBe('copa-del-valle');
  });

  it('elimina caracteres especiales', () => {
    expect(slugify('Etapa #3: ¡Final!')).toBe('etapa-3-final');
  });

  it('maneja texto con ñ', () => {
    expect(slugify('Montaña y Cañon')).toBe('montana-y-canon');
  });

  it('maneja texto ya limpio sin cambios extra', () => {
    expect(slugify('copa-valle-2026')).toBe('copa-valle-2026');
  });

  it('devuelve cadena vacía si la entrada es vacía', () => {
    expect(slugify('')).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// getCategoryLabel
// ─────────────────────────────────────────────────────────────
describe('getCategoryLabel', () => {
  it('retorna etiqueta correcta para pre-infantil', () => {
    expect(getCategoryLabel('pre-infantil')).toBe('Pre-infantil');
  });

  it('retorna etiqueta correcta para infantil', () => {
    expect(getCategoryLabel('infantil')).toBe('Infantil');
  });

  it('retorna etiqueta correcta para juvenil', () => {
    expect(getCategoryLabel('juvenil')).toBe('Juvenil');
  });

  it('retorna etiqueta correcta para sub23', () => {
    expect(getCategoryLabel('sub23')).toBe('Sub-23');
  });

  it('retorna etiqueta correcta para elite', () => {
    expect(getCategoryLabel('elite')).toBe('Elite');
  });

  it('retorna etiqueta correcta para master', () => {
    expect(getCategoryLabel('master')).toBe('Master');
  });

  it('devuelve la misma cadena si la categoría no existe en el mapa', () => {
    expect(getCategoryLabel('desconocido')).toBe('desconocido');
  });
});

// ─────────────────────────────────────────────────────────────
// getEventStatusLabel
// ─────────────────────────────────────────────────────────────
describe('getEventStatusLabel', () => {
  it('retorna etiqueta correcta para upcoming', () => {
    expect(getEventStatusLabel('upcoming')).toBe('Proximo');
  });

  it('retorna etiqueta correcta para ongoing', () => {
    expect(getEventStatusLabel('ongoing')).toBe('En curso');
  });

  it('retorna etiqueta correcta para past', () => {
    expect(getEventStatusLabel('past')).toBe('Pasado');
  });

  it('retorna etiqueta correcta para cancelled', () => {
    expect(getEventStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('devuelve la misma cadena si el estado no existe en el mapa', () => {
    expect(getEventStatusLabel('unknown')).toBe('unknown');
  });
});

// ─────────────────────────────────────────────────────────────
// formatDate
// ─────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formatea una fecha en español colombiano (es-CO)', () => {
    // 1 de mayo de 2010 — fecha de fundación del club
    const fecha = new Date(2010, 4, 1); // mes 4 = mayo (0-indexed)
    const resultado = formatDate(fecha);
    // El formato es-CO produce "1 de mayo de 2010"
    expect(resultado).toContain('2010');
    expect(resultado).toContain('mayo');
    expect(resultado).toContain('1');
  });

  it('acepta opciones personalizadas de Intl.DateTimeFormatOptions', () => {
    const fecha = new Date(2026, 3, 15); // 15 de abril de 2026
    const resultado = formatDate(fecha, { month: 'short', year: 'numeric' });
    // Con month: 'short', el mes aparece abreviado
    expect(resultado).toContain('2026');
    expect(resultado).toMatch(/abr/i);
  });

  it('retorna un string no vacío para cualquier fecha válida', () => {
    const resultado = formatDate(new Date(2025, 0, 1));
    expect(resultado).toBeTruthy();
    expect(typeof resultado).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
// formatShortDate
// ─────────────────────────────────────────────────────────────
describe('formatShortDate', () => {
  it('incluye el día y el mes abreviado', () => {
    const fecha = new Date(2026, 6, 4); // 4 de julio
    const resultado = formatShortDate(fecha);
    expect(resultado).toContain('4');
    expect(resultado).toMatch(/jul/i);
  });

  it('NO incluye el año', () => {
    const fecha = new Date(2026, 0, 1);
    const resultado = formatShortDate(fecha);
    expect(resultado).not.toContain('2026');
  });

  it('retorna un string no vacío para cualquier fecha válida', () => {
    const resultado = formatShortDate(new Date());
    expect(resultado).toBeTruthy();
    expect(typeof resultado).toBe('string');
  });
});
