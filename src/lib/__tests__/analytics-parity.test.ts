import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { EVENT_NAMES, ALLOWED_PARAM_KEYS } from '../events';

/**
 * El catálogo de analítica vive escrito dos veces, y tiene que seguir así.
 *
 * `Analytics.astro` no importa de `events.ts` a propósito: su bloque es JS plano
 * dentro de un `<script is:inline>` que corre antes de que exista cualquier
 * bundle. El precio de esa decisión es que las dos listas se pueden separar, y
 * cuando se separan **no falla nada**: el evento simplemente se descarta en
 * silencio en `emit()` y la métrica marca cero. Ya pasó —`cta_inscripcion_click`
 * estuvo tres meses en cero por un problema del mismo tipo— y nadie se enteró
 * hasta revisar el informe.
 *
 * Este test es la red que faltaba: si alguien declara un evento en un solo
 * sitio, el pipeline lo dice.
 */

const ANALYTICS = fileURLToPath(
  new URL('../../components/common/Analytics.astro', import.meta.url),
);

const source = readFileSync(ANALYTICS, 'utf-8');

/** Extrae los literales de un arreglo `const NOMBRE = [ ... ]` del script inline. */
function arrayLiteral(name: string): string[] {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\]`));
  if (!match) throw new Error(`No se encontró el arreglo ${name} en Analytics.astro`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('paridad del catálogo de analítica', () => {
  it('ALLOWED_EVENTS de Analytics.astro coincide con EVENT_NAMES', () => {
    expect(arrayLiteral('ALLOWED_EVENTS').sort()).toEqual([...EVENT_NAMES].sort());
  });

  it('ALLOWED_PARAMS de Analytics.astro coincide con ALLOWED_PARAM_KEYS', () => {
    expect(arrayLiteral('ALLOWED_PARAMS').sort()).toEqual([...ALLOWED_PARAM_KEYS].sort());
  });

  it('la delegación por data-* lee todos los parámetros que puede traer un clic', () => {
    // Un `data-analytics-*` sin su línea en `handleDelegatedClick` deja pasar el
    // evento con los params vacíos: el peor fallo posible, porque parece que
    // funciona.
    const delegated = ['pdf-name', 'sponsor-id', 'program-id', 'race-id', 'content-id'];
    for (const attr of delegated) {
      expect(source, `falta la lectura de data-analytics-${attr}`).toContain(
        `data-analytics-${attr}`,
      );
    }
  });

  it('todo parámetro del catálogo pasó por revisión de PII', () => {
    /*
     * Allowlist explícita en vez de una heurística de substrings: `pdf_name` es
     * el nombre de un archivo y `sponsor_id` el de una empresa, así que buscar
     * "name" o "id" da falsos positivos y enseña a ignorar el test.
     *
     * La regla real es de proceso: para que un parámetro llegue aquí, alguien
     * tuvo que escribirlo en esta lista, y ese es el momento de preguntarse si
     * puede identificar a un menor. Los deportistas del club lo son (Ley 1581 y
     * Ley 1098): nunca nombre, correo, teléfono, EPS, dirección ni fecha de
     * nacimiento — para la edad existe `age_bucket`, que agrupa.
     */
    const revisados = new Set([
      'program_id', // slug del programa
      'age_bucket', // rango de edad, nunca la fecha de nacimiento
      'step', // paso del formulario
      'depth', // % de scroll
      'pdf_name', // nombre del archivo publicado en transparencia
      'sponsor_id', // slug del patrocinador (una empresa)
      'race_id', // slug de la válida
      'content_id', // destino del clic o slug de una categoría
    ]);

    for (const key of ALLOWED_PARAM_KEYS) {
      expect(
        revisados.has(key),
        `${key} no está en la allowlist revisada: confirma que no puede identificar a nadie y agrégalo`,
      ).toBe(true);
    }
  });
});
