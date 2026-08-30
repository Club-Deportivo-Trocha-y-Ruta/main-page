import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

/**
 * El separador entre el mes y el año.
 *
 * Este fallo no se ve leyendo el código: escrito como dos expresiones seguidas
 * (`{month} {año}`), Prettier las reparte en dos líneas al formatear y el
 * compilador de Astro colapsa el salto, así que el HTML sale «octubre2026» en
 * las diez fichas. Lo introdujo el formateo, no el autor, y por eso hace falta
 * fijarlo: cualquiera puede volver a "arreglar" el template literal.
 */
const PAGINA = fileURLToPath(
  new URL('../pages/calendario/[slug].astro', import.meta.url)
);

const source = readFileSync(PAGINA, 'utf-8');

describe('ficha de válida — mes y año', () => {
  it('compone el mes y el año en una sola expresión', () => {
    expect(source).toContain('{`${month} ${data.date.getUTCFullYear()}`}');
  });

  it('no deja las dos expresiones en líneas separadas', () => {
    expect(source).not.toMatch(/\{month\}\s*\n\s*\{data\.date\.getUTCFullYear\(\)\}/);
  });
});
