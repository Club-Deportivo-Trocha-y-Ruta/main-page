/**
 * Datos de `/copa-valle-yumbo-2026`: los reales o, en local, los de prueba.
 *
 * Los JSON de esta carpeta son los que se publican y nunca llevan datos de
 * prueba. Para ver la página con fotos antes del lunes de la válida se usa la
 * vista previa: `VALIDA_PREVIEW=true npm run dev` lee `preview/` en lugar de
 * los reales, y `npm run valida:preview` sirve las fotos de prueba en
 * `localhost:8765`. Así los archivos reales no se tocan para probar (antes se
 * reemplazaban y el respaldo vivía en `/tmp`, que el sistema borra al
 * reiniciar).
 *
 * `mangas.json` y `aliados.json` no tienen versión de prueba: son los mismos en
 * los dos casos.
 */
import { VALIDA_PREVIEW } from 'astro:env/server';
import evento from './evento.json';
import fotos from './fotos.json';
import datos from './datos.json';
import aliados from './aliados.json';
import mangas from './mangas.json';
import eventoPrueba from './preview/evento.json';
import fotosPrueba from './preview/fotos.json';
import datosPrueba from './preview/datos.json';

/** `true` cuando la página se arma con los datos de prueba. */
export const isPreview: boolean = VALIDA_PREVIEW;

export const eventoJson = isPreview ? eventoPrueba : evento;
export const fotosJson = isPreview ? fotosPrueba : fotos;
export const datosJson = isPreview ? datosPrueba : datos;
export const aliadosJson = aliados;
export const mangasJson = mangas;
