import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Cimientos del tema claro/oscuro (ver theme-brief y CLAUDE.md).
 *
 * El tema se decide con el atributo `data-theme` de `<html>`, no con
 * `prefers-color-scheme` directamente, para poder forzarlo con un toggle y
 * hacerlo persistir en `localStorage`. Este archivo no renderiza nada: lee
 * `global.css` y los layouts como texto (mismo estilo que `fonts.test.ts`)
 * y comprueba tres cosas que, si se rompen, rompen el tema entero sin que
 * ningún test de componente lo note:
 *
 *   1. Que el remapeo de tokens (`:root[data-theme='dark']`) exista y
 *      redefina los doce tokens que dependen del tema.
 *   2. Que esos tokens sigan cumpliendo contraste WCAG AA (4.5:1) en los
 *      pares de texto/fondo que el sitio realmente usa, en LOS DOS temas —
 *      los valores hex se parsean del propio CSS, no se copian a mano aquí.
 *   3. Que el script de tema viva en `BaseLayout.astro` (y solo ahí, nunca
 *      en `LinktreeLayout.astro`) con el contrato mínimo del brief.
 */

const GLOBAL_CSS_PATH = 'src/styles/global.css';
const BASE_LAYOUT_PATH = 'src/layouts/BaseLayout.astro';
const LINKTREE_LAYOUT_PATH = 'src/layouts/LinktreeLayout.astro';

const css = readFileSync(GLOBAL_CSS_PATH, 'utf-8');
const baseLayout = readFileSync(BASE_LAYOUT_PATH, 'utf-8');
const linktreeLayout = readFileSync(LINKTREE_LAYOUT_PATH, 'utf-8');

/**
 * Extrae el contenido de un bloque `selector { ... }` contando llaves, para
 * no depender de que el bloque no tenga a su vez llaves anidadas (no es el
 * caso aquí, pero así el test no se rompe si algún día las tiene).
 */
function extractBlock(source: string, selector: string): string {
  const start = source.indexOf(selector);
  if (start === -1) {
    throw new Error(`No se encontró el bloque "${selector}" en el archivo`);
  }
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return source.slice(braceStart + 1, i);
}

/** Mapa `nombre-de-token → valor` a partir de las declaraciones `--color-*` de un bloque. */
function parseColorTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  const re = /--color-([a-z-]+):\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block))) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const themeBlock = extractBlock(css, '@theme {');
const darkBlock = extractBlock(css, ":root[data-theme='dark'] {");

const lightTokens = parseColorTokens(themeBlock);
const darkOverrides = parseColorTokens(darkBlock);
// En dark, un token no redefinido conserva su valor de light (p. ej. --color-primary).
const darkTokens = { ...lightTokens, ...darkOverrides };

// ============================================================
// 1. El remapeo existe y cubre los doce tokens del brief
// ============================================================

describe('tema claro/oscuro — tokens', () => {
  it('declara `@custom-variant dark` apuntando a [data-theme="dark"] con :where()', () => {
    expect(css).toMatch(
      /@custom-variant\s+dark\s*\(\s*&:where\(\s*\[data-theme='dark'\]\s*,\s*\[data-theme='dark'\]\s*\*\s*\)\s*\)/,
    );
  });

  it('`:root[data-theme="dark"]` declara color-scheme: dark', () => {
    expect(darkBlock).toMatch(/color-scheme:\s*dark/);
  });

  it('`:root` (light) declara color-scheme: light', () => {
    const rootLightBlock = extractBlock(css, ':root {');
    expect(rootLightBlock).toMatch(/color-scheme:\s*light/);
  });

  const DARK_TOKEN_NAMES = [
    'surface',
    'surface-tint',
    'surface-muted',
    'surface-raised',
    'text-primary',
    'text-secondary',
    'primary-deep',
    'accent-deep',
    'on-deep',
    'hairline',
    'danger',
    'info',
  ];

  it('redefine exactamente los doce tokens que dependen del tema', () => {
    for (const name of DARK_TOKEN_NAMES) {
      expect(darkOverrides, `--color-${name} no se redefine en dark`).toHaveProperty(name);
    }
  });

  it('los valores light y dark de cada token son distintos (si no, no hace falta el override)', () => {
    for (const name of DARK_TOKEN_NAMES) {
      expect(darkOverrides[name], name).not.toBe(lightTokens[name]);
    }
  });
});

// ============================================================
// 2. Contraste WCAG AA en ambos temas
// ============================================================

/** Convierte `#rgb` o `#rrggbb` a componentes 0-255. Lanza si el valor no es hex sólido. */
function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim();
  const match = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) {
    throw new Error(`"${hex}" no es un color hex sólido — no se puede calcular contraste`);
  }
  const value = match[1];
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Luminancia relativa (WCAG 2.x, https://www.w3.org/TR/WCAG21/#dfn-relative-luminance). */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [toLinear(r), toLinear(g), toLinear(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Ratio de contraste WCAG entre dos colores hex sólidos. */
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA)) + 0.05;
  const lB = relativeLuminance(hexToRgb(hexB)) + 0.05;
  return lA > lB ? lA / lB : lB / lA;
}

const AA_TEXT_MIN = 4.5;

/** Pares [texto, fondo] (nombres de token, sin `--color-`) que el sitio usa como texto real. */
const CONTRAST_PAIRS: [string, string][] = [
  ['text-primary', 'surface'],
  ['text-secondary', 'surface'],
  ['text-secondary', 'surface-raised'],
  ['primary-deep', 'surface'],
  ['accent-deep', 'surface'],
  ['on-deep', 'primary-deep'],
  ['danger', 'surface'],
];

describe.each([
  ['light', lightTokens],
  ['dark', darkTokens],
])('contraste WCAG AA — tema %s', (themeName, tokens) => {
  it.each(CONTRAST_PAIRS)('%s sobre %s cumple 4.5:1', (fg, bg) => {
    const ratio = contrastRatio(tokens[fg], tokens[bg]);
    expect(
      ratio,
      `${fg} (${tokens[fg]}) / ${bg} (${tokens[bg]}) en ${themeName} = ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_TEXT_MIN);
  });
});

// ============================================================
// 3. Script de tema: solo en BaseLayout, nunca en LinktreeLayout
// ============================================================

describe('script de tema', () => {
  it('BaseLayout.astro monta un <script is:inline> con el contrato del tema', () => {
    const scripts = [...baseLayout.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
    const themeScript = scripts.find(
      ([, attrs, body]) => /is:inline/.test(attrs) && /trocha-theme/.test(body),
    );

    expect(
      themeScript,
      'no se encontró un <script is:inline> que mencione trocha-theme',
    ).toBeDefined();

    const [, attrs, body] = themeScript!;
    expect(attrs).toMatch(/is:inline/);
    expect(body).toContain('trocha-theme');
    expect(body).toContain('prefers-color-scheme');
    expect(body).toContain('astro:after-swap');
    expect(body).toContain('data-theme-toggle');
    // Astro 7 reescribe los scripts con `define:vars` y les quita atributos
    // como `src`/`async` (ver Analytics.astro / CLAUDE.md): el script de
    // tema no puede usarlo.
    expect(attrs).not.toMatch(/define:vars/);
    expect(body).not.toMatch(/define:vars/);
  });

  it('BaseLayout.astro expone window.__trochaTheme para tests/otros scripts', () => {
    expect(baseLayout).toContain('window.__trochaTheme');
  });

  it('el script de tema va antes que <ClientRouter /> en <head> (evita FOUC)', () => {
    const scriptIndex = baseLayout.indexOf('trocha-theme');
    const clientRouterIndex = baseLayout.indexOf('<ClientRouter');
    expect(scriptIndex).toBeGreaterThan(-1);
    expect(clientRouterIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeLessThan(clientRouterIndex);
  });

  it('LinktreeLayout.astro NO monta el script de tema (paleta oscura fija propia)', () => {
    expect(linktreeLayout).not.toContain('trocha-theme');
  });
});
