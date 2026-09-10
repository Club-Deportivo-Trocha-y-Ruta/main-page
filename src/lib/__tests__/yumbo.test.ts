import { describe, it, expect } from 'vitest';
import {
  YUMBO_LANDMARKS,
  getYumboLandmark,
  isHomeRace,
  landmarkFile,
  type YumboLandmarkId,
} from '../yumbo';

describe('catálogo de láminas de Yumbo', () => {
  it('tiene los tres hitos, sin ids repetidos', () => {
    const ids = YUMBO_LANDMARKS.map((l) => l.id);
    expect(ids).toEqual(['cerro', 'monumento', 'iglesia']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('describe cada lámina con título, pie y alternativo', () => {
    for (const landmark of YUMBO_LANDMARKS) {
      expect(landmark.title.length).toBeGreaterThan(0);
      expect(landmark.caption.length).toBeGreaterThan(0);
      // El `alt` describe la ilustración, no repite el título.
      expect(landmark.alt.toLowerCase()).toContain('ilustración');
    }
  });

  it('deja dónde comprobar cada pie', () => {
    // Regla del sitio: ninguna cifra ni nombre propio se publica sin fuente.
    for (const landmark of YUMBO_LANDMARKS) {
      expect(landmark.source).toMatch(/^https:\/\//);
    }
  });

  it('no atribuye las láminas al uniforme del club', () => {
    // El uniforme del que salieron fue un prototipo de ensayo que no se adoptó:
    // el uniforme real no lleva estos elementos.
    for (const landmark of YUMBO_LANDMARKS) {
      expect(`${landmark.title} ${landmark.caption} ${landmark.alt}`.toLowerCase()).not.toContain(
        'uniforme',
      );
    }
  });

  it('genera todas las láminas a color: es la variante de contenido', () => {
    for (const landmark of YUMBO_LANDMARKS) {
      expect(landmark.variants).toContain('color');
    }
  });

  it('declara la forma de cada lámina: el tríptico no iguala alturas', () => {
    // Igualar el alto de las tres dejaba al cerro (2.6:1) como una franja
    // diminuta al lado de las dos siluetas verticales.
    const shapes = Object.fromEntries(YUMBO_LANDMARKS.map((l) => [l.id, l.shape]));
    expect(shapes).toEqual({ cerro: 'wide', monumento: 'tall', iglesia: 'tall' });
  });

  it('falla ruidosamente con un hito que no existe', () => {
    expect(() => getYumboLandmark('cerro-de-la-cruz' as YumboLandmarkId)).toThrow(/desconocido/);
  });
});

describe('landmarkFile', () => {
  it('nombra la variante a color sin sufijo', () => {
    expect(landmarkFile('cerro', 'color')).toBe('cerro-yumbo.webp');
  });

  it('sufija las variantes enmascaradas', () => {
    expect(landmarkFile('cerro', 'solid')).toBe('cerro-yumbo-solid.webp');
    expect(landmarkFile('iglesia', 'ink')).toBe('iglesia-yumbo-ink.webp');
  });
});

describe('isHomeRace', () => {
  it('reconoce Yumbo como se escriba', () => {
    expect(isHomeRace('Yumbo')).toBe(true);
    expect(isHomeRace('yumbo')).toBe(true);
    expect(isHomeRace('  YUMBO ')).toBe(true);
  });

  it('no confunde otras sedes de la Copa Valle', () => {
    expect(isHomeRace('Roldanillo')).toBe(false);
    expect(isHomeRace('Cali')).toBe(false);
    expect(isHomeRace('La Cumbre')).toBe(false);
  });

  it('aguanta un evento sin ciudad', () => {
    expect(isHomeRace(undefined)).toBe(false);
    expect(isHomeRace('')).toBe(false);
  });
});
