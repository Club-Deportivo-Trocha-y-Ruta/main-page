import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
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
 * sitio, o escribe mal el nombre en una plantilla, el pipeline lo dice.
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
    // funciona. Se comprueba también el destino: que cada atributo termine en el
    // parámetro correcto y no en otro del catálogo.
    const delegated: Record<string, string> = {
      'pdf-name': 'pdf_name',
      'sponsor-id': 'sponsor_id',
      'program-id': 'program_id',
      'content-id': 'content_id',
      method: 'method',
    };
    for (const [attr, param] of Object.entries(delegated)) {
      expect(source, `falta la lectura de data-analytics-${attr}`).toContain(
        `data-analytics-${attr}`,
      );
      expect(source, `data-analytics-${attr} no llega a params.${param}`).toMatch(
        new RegExp(`params\\.${param}\\s*=`),
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
      'content_id', // destino del clic, id de una foto o de un grupo; nunca un número de placa
      'method', // canal con el que se compartió una foto (`native`, `whatsapp`)
    ]);

    for (const key of ALLOWED_PARAM_KEYS) {
      expect(
        revisados.has(key),
        `${key} no está en la allowlist revisada: confirma que no puede identificar a nadie y agrégalo`,
      ).toBe(true);
    }
  });
});

describe('uso del catálogo en las plantillas', () => {
  /*
   * El otro lado de la paridad: que lo que las plantillas y los islands piden
   * emitir exista en el catálogo. Un `data-analytics-event="gallery_filtr"` no
   * rompe nada: `emit()` lo descarta y la métrica queda en cero sin ningún
   * error. Se leen tres formas de emitir, las únicas que hay hoy:
   *   1. `data-analytics-event="nombre"` (o con llaves y un ternario) en `.astro`/`.tsx`.
   *   2. `trackEvent({ name: 'nombre', ... })` en islands.
   *   3. `__trochaEmit('nombre', ...)` en scripts.
   */
  const files = fg.sync(['src/**/*.{astro,tsx,ts}'], {
    ignore: ['**/__tests__/**', '**/*.test.*', 'src/lib/events.ts', 'src/lib/analytics.ts'],
  });

  const catalog = new Set<string>(EVENT_NAMES);

  function emittedNames(text: string): string[] {
    const names: string[] = [];
    for (const match of text.matchAll(/data-analytics-event=(?:"([^"]+)"|\{([^}]*)\})/g)) {
      if (match[1]) names.push(match[1]);
      // Con llaves, solo cuentan los literales que son resultado de la expresión
      // (al inicio o tras `?` / `:`): en `id === 'x' ? 'evento' : undefined` el
      // `'x'` es una comparación, no un evento.
      else
        for (const literal of match[2].matchAll(/(?:^|[?:])\s*'([a-z_]+)'/g))
          names.push(literal[1]);
    }
    for (const match of text.matchAll(/trackEvent\(\s*\{\s*name:\s*'([a-z_]+)'/g)) {
      names.push(match[1]);
    }
    for (const match of text.matchAll(/__trochaEmit\??\.?\(\s*'([a-z_]+)'/g)) {
      names.push(match[1]);
    }
    return names;
  }

  it('encuentra archivos que revisar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('todo evento que piden las plantillas está en el catálogo', () => {
    const unknown: string[] = [];
    for (const file of files) {
      for (const name of emittedNames(readFileSync(file, 'utf-8'))) {
        if (!catalog.has(name)) unknown.push(`${file}: ${name}`);
      }
    }
    expect(unknown, 'eventos fuera del catálogo: se descartan en silencio').toEqual([]);
  });
});
