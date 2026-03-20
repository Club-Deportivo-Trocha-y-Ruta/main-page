import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  formatShortDate,
  slugify,
  getAge,
  getCategoryLabel,
  getEventStatusLabel,
} from '../utils';

// ============================================================
// slugify
// ============================================================

describe('slugify', () => {
  it('convierte texto a kebab-case', () => {
    expect(slugify('Copa Valle 2026')).toBe('copa-valle-2026');
  });

  it('elimina acentos y diacríticos', () => {
    expect(slugify('Formación Juvenil')).toBe('formacion-juvenil');
    expect(slugify('María José Pérez')).toBe('maria-jose-perez');
  });

  it('reemplaza caracteres especiales con guiones', () => {
    expect(slugify('XCO / Cross Country')).toBe('xco-cross-country');
  });

  it('elimina guiones al inicio y final', () => {
    expect(slugify('  -Copa-  ')).toBe('copa');
  });

  it('maneja strings vacíos', () => {
    expect(slugify('')).toBe('');
  });

  it('colapsa múltiples espacios/separadores en un solo guión', () => {
    expect(slugify('alto   rendimiento')).toBe('alto-rendimiento');
  });

  it('maneja caracteres con ñ', () => {
    expect(slugify('Ciclomontañismo Yumbo')).toBe('ciclomontanismo-yumbo');
  });
});

// ============================================================
// formatDate
// ============================================================

describe('formatDate', () => {
  it('formatea fecha en español colombiano', () => {
    const date = new Date('2026-04-15T00:00:00Z');
    const result = formatDate(date);
    // Intl produce variaciones por runtime, validamos que contiene año y mes
    expect(result).toContain('2026');
    expect(result.toLowerCase()).toMatch(/abril/);
  });

  it('acepta opciones de formato personalizadas', () => {
    const date = new Date('2026-12-25T00:00:00Z');
    const result = formatDate(date, { weekday: 'long' });
    expect(result.toLowerCase()).toMatch(/diciembre/);
  });
});

describe('formatShortDate', () => {
  it('formatea fecha corta con mes abreviado', () => {
    const date = new Date(2026, 2, 20); // 20 de marzo 2026, hora local
    const result = formatShortDate(date);
    expect(result).toContain('20');
    expect(result.toLowerCase()).toMatch(/mar/);
  });
});

// ============================================================
// getAge
// ============================================================

describe('getAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula edad correctamente', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
    expect(getAge(new Date('2016-01-01'))).toBe(10);
  });

  it('no suma año si el cumpleaños no ha pasado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01'));
    expect(getAge(new Date('2016-06-15'))).toBe(9);
  });

  it('suma año si el cumpleaños ya pasó', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01'));
    expect(getAge(new Date('2016-06-15'))).toBe(10);
  });

  it('retorna 0 para bebés nacidos este año', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01'));
    expect(getAge(new Date('2026-01-15'))).toBe(0);
  });
});

// ============================================================
// getCategoryLabel
// ============================================================

describe('getCategoryLabel', () => {
  it('retorna label para categorías conocidas', () => {
    expect(getCategoryLabel('pre-infantil')).toBe('Pre-infantil');
    expect(getCategoryLabel('infantil')).toBe('Infantil');
    expect(getCategoryLabel('juvenil')).toBe('Juvenil');
    expect(getCategoryLabel('sub23')).toBe('Sub-23');
    expect(getCategoryLabel('elite')).toBe('Elite');
    expect(getCategoryLabel('master')).toBe('Master');
  });

  it('retorna el string original si no se reconoce', () => {
    expect(getCategoryLabel('desconocida')).toBe('desconocida');
  });
});

// ============================================================
// getEventStatusLabel
// ============================================================

describe('getEventStatusLabel', () => {
  it('retorna labels en español para cada status', () => {
    expect(getEventStatusLabel('upcoming')).toBe('Proximo');
    expect(getEventStatusLabel('ongoing')).toBe('En curso');
    expect(getEventStatusLabel('past')).toBe('Pasado');
    expect(getEventStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('retorna el string original si no se reconoce', () => {
    expect(getEventStatusLabel('unknown')).toBe('unknown');
  });
});
