---
name: reels-deportistas
description: Arma reels verticales 9:16 para redes con clips de iPhone/GoPro de los deportistas del club. Dos formatos — entrevistas (declaraciones a cámara de varios deportistas, invitaciones a la próxima fecha) y relato en off (la voz del director deportivo o un entrenador contando la jornada sobre escenas de carrera, con arranque y cierre en audio original). Úsalo cuando haya que montar piezas para Instagram/TikTok/WhatsApp después de una válida o carrera. Corta en finales de frase reales, separa lo que se ve de lo que se oye, quema subtítulos y rótulos con los tokens del club, y verifica el resultado re-transcribiéndolo y con espectrogramas. No usa servicios externos - los menores no salen del equipo.
---

# Reels de deportistas

Montaje local con ffmpeg + Pillow + Whisper. Todo corre en la máquina: los clips
muestran menores de edad y no se suben a editores web.

## Dos formatos

| Formato | Cuándo | Script | Guía |
|---|---|---|---|
| **Entrevistas** | Declaraciones a cámara de varios deportistas (Alcalá, 60 s) | `montage.py` | `referencias/estructura-editorial.md` |
| **Relato en off** | Una voz cuenta la jornada sobre escenas de carrera (Cali, 2:18) | `voz_en_off.py` | `referencias/formato-voz-en-off.md` |

El relato en off es el formato que más gustó al club: si el material lo permite (un relato
largo + escenas), es el primero a proponer. Siempre **demo primero** (`--demo`: sin
subtítulos ni estilos) y la versión final solo con el demo aprobado.

Los subtítulos vigentes son los **palabra a palabra** de `captions.py` (estilo B, ver
`referencias/estilo-visual.md`); `montage.py` todavía dibuja la caja de Alcalá.

## Por qué no se edita a ojo (ni con un solo instrumento)

Tres instrumentos, y cada uno miente de una forma distinta:

- **Whisper `small`** marca dónde se *reconoce* la palabra, no dónde suena, y estira
  palabras sobre las pausas («y 19.68–21.32»). Usa **`large-v3-turbo`** (está en caché):
  da inicio y fin por palabra bastante fieles y resolvió frases que `small` inventaba.
- **Whisper autocompleta**: si el corte deja «es muy fuer-», transcribe «es muy fuerte».
  Re-transcribir la salida detecta palabras que faltan, no sílabas que faltan.
- **El nivel de audio** tampoco sirve para hallar las pausas: en premiación hay público y
  la voz queda solo 10–15 dB sobre el ruido, así que `silencedetect` no encuentra nada y
  una envolvente RMS se come las sílabas suaves — la «-te» de «fuerte» o el arranque de
  «Muy bien» caen bajo cualquier umbral y parecen silencio. Se probó y se descartó.

Lo que sí se ve siempre son **los armónicos de la voz en el espectrograma**. Por eso
el borde de cada tramo se confirma con `edges.py` antes de dar el corte por bueno.

## Procedimiento

1. **Transcribir** cada clip con el modelo grande y marcas por palabra (API de Python,
   `whisper.load_model('large-v3-turbo')`, `word_timestamps=True`, con un `initial_prompt`
   que nombre Yumbo, Pista Carlos Castro, Copa Valle, la sede y «Prejuvenil»).
   Para una zona dudosa, `scripts/probe.py '[["0622", 23.4, 25.0]]'` transcribe solo esa ventana.
   Pregunta al usuario cuando la duda cambie el sentido o sea un nombre propio.
2. **Elegir unidades completas, no fragmentos.** Un tramo termina donde el deportista
   *termina de hablar* (final de frase con pausa), no en una micro-pausa entre dos
   cláusulas. Si encadena sin respirar («…es muy fuerte y pues, la verdad, los
   invitamos…») el corte va justo tras la última sílaba y se tapa con tono de sala
   (`patch_tail`). 3–11 s por tramo; bloques de 1,5–2 s se sienten como parpadeos.
3. **Escribir el JSON** con `start`/`end` (lo que se ve) y `say` (lo que se oye).
4. **Confirmar los bordes**: `python3 scripts/edges.py reel.json /tmp/edges.png` y mirar
   la hoja. En cada panel la línea cian es el borde `say`: en un FINAL los armónicos
   deben acabar a la izquierda; en un INICIO, empezar a la derecha. Marcas cada 0,1 s.
5. **Armar**: `python3 scripts/montage.py reel.json`. Imprime el aire de cada tramo y
   recorta cada fundido al aire disponible: un fundido nunca pisa una palabra. Deja junto
   al `.mp4` el `.srt` con los mismos subtítulos y una portada 1080 × 1440 (`cover_at`).
6. **Verificar**: `python3 scripts/verify.py reel.json`. Compara lo que se oye en la
   salida contra los subtítulos (los avisos de BORDE se revisan con el espectrograma),
   mide que cada corte caiga en el piso de ruido y que el máster entregue −14 LUFS con
   pico real bajo −1 dBTP.
7. **Ver la pieza en el teléfono** antes de publicarla: la UI de la app tapa el 20 %
   inferior y ahí vive la banda del evento (ver `referencias/estilo-visual.md`).

## Entrega

Lo que esperan Instagram, TikTok y YouTube Shorts, y que los scripts ya producen:
1080 × 1920, H.264 + AAC 256 kb/s a 48 kHz, etiquetas de color bt709 y **−14 LUFS con pico
real ≤ −1 dBTP** — las tres plataformas normalizan la reproducción a ese nivel, así que una
pieza más floja se oye más floja que el reel de al lado. Los 24 fps se conservan porque es
el fotogramaje nativo de los clips: remuestrear a 30 solo agrega trepidación.

**Clips HDR**: con «Vídeo HDR» activo el iPhone graba en HLG, y este ffmpeg no trae
`zscale` ni `libplacebo` para tonemapear. Los dos montadores aplican la LUT HLG→SDR de
`hlg.py` automáticamente (en Cali, 14 de 19 clips venían así). PQ no tiene LUT: se detiene.

**Audio de iPhone**: los `.mov` traen una pista APAC que ffmpeg no decodifica además de la
AAC; hay que mapear la AAC explícitamente (`voz_en_off.py` lo hace). Antes de entregar,
re-transcribir el máster y medir cada voz por frase: un máster en −14 LUFS puede tener una
voz inaudible adentro, y el club lo reportó dos veces.

## Estilo y estructura

No los reinventes en cada pieza:

- **`referencias/estilo-visual.md`** — medidas y comportamiento del rótulo, los
  subtítulos, la banda del evento, el zoom, las transiciones y las zonas seguras.
- **`referencias/estructura-editorial.md`** — el arco de la pieza, las reglas de montaje
  que el club ya corrigió, el trato de los datos de menores y el molde del copy de
  Instagram.

## Formato del JSON

```json
{
  "id": "nombre-del-archivo-de-salida",
  "xfade_secs": 0.3,
  "segments": [
    {
      "src": "~/Downloads/IMG_0622.MOV",
      "start": 13.80, "end": 25.22, "say": [14.08, 24.97],
      "patch_tail": [13.66, 14.04],
      "name": "Mariana Coronado", "detail": "2.º puesto · Prejuvenil A femenino",
      "name_in": 2.4, "name_secs": 3.6,
      "zoom": [[0, 1.0], [2.2, 1.0], [2.7, 1.12], [11.42, 1.32]],
      "focus": [0.40, 0.33],
      "strip": "18 de octubre · Pista Carlos Castro · Yumbo", "strip_in": 3.5,
      "captions": [[16.16, 18.50, "Hola, la verdad me fue muy bien, gracias a Dios."]],
      "transition": "dissolve", "xfade": 0.3
    }
  ],
  "fade_out": 0.45
}
```

- Todos los tiempos son **absolutos del clip original**.
- `say: [s0, s1]` es obligatorio: primera y última sílaba del tramo. El aire es
  `s0 − start` y `end − s1`; deja 0,2–0,3 s a cada lado para que quepa el fundido.
- `patch_tail: [p0, p1]` / `patch_head`: tramo de **tono de sala del mismo clip** (solo
  público, sin voz) que cubre el plano después de `s1` o antes de `s0`. Se usa cuando lo
  que sigue o antecede es voz que no debe oírse. Debe durar al menos lo que cubre.
- `xfade: 0.042` = corte seco de un fotograma: el **jump cut** para quitar una pausa larga
  dentro de la misma persona. Cambia el `zoom` a cada lado para que se lea como decisión.
- `zoom`, `focus`, `transition`, `strip`: ver `referencias/estilo-visual.md`.
- `fade_out` (0,45 s por defecto): el cierre a negro. No hay placa final.
- `cover_at` (1,0 s por defecto): el instante del que sale la portada 3:4. Elige un
  fotograma con la cara nítida y el rótulo ya puesto.
- La ganancia es **una sola por clip** (medida sobre todo lo que habla esa persona) y
  fija, sin `loudnorm` dinámico: nivelar cada tramo aparte hacía saltar el volumen del
  mismo deportista entre cortes.

## Datos de menores

Los deportistas son menores. En el rótulo va nombre, categoría y posición **solo si la
dio el propio clip o está en la crónica del sitio**; nunca edad, colegio ni barrio.
Verifica la grafía contra `src/content/` y, si algo la contradice, **pregunta antes de
cambiar nada**: el repo manda. Aquí una memoria vieja decía «Quiñónez», se cambió el sitio
en 90 lugares y hubo que revertirlo: el apellido de Isabel es **Quiñones**, como siempre
estuvo en `src/content/`.

## Archivos

```
scripts/montage.py     formato entrevistas: corta, superpone, encadena y exporta
scripts/voz_en_off.py  formato relato en off: planos mudos + mezcla en numpy + subtítulos
scripts/captions.py    subtítulos palabra a palabra (estilo B) y rótulo compacto
scripts/overlays.py    rótulo, subtítulos y banda de Alcalá; curva de zoom   (tokens del club)
scripts/hlg.py         LUT HLG → SDR bt709 para los clips con «Vídeo HDR»
scripts/edges.py       hoja de espectrogramas de cada borde `say`
scripts/verify.py      re-transcribe la salida y mide cortes y sonoridad (formato entrevistas)
scripts/probe.py       transcribe una ventana suelta de un clip
ejemplos/alcala-yumbo-trio.json    entrevistas, la pieza de referencia (60 s)
ejemplos/cali-bike-park-dh.json    relato en off, la pieza de referencia (2:18)
```

Los clips fuente se trabajan desde donde los deje el usuario (`dir` en el JSON) y no se
versionan: pesan cientos de MB y muestran menores. Al terminar una pieza, los temporales
van en `/tmp/tyr-video/{id}/`.

`overlays.py` usa la tipografía de `fonts-src/` y los tokens de `src/styles/global.css`.
Si cambian los tokens, actualiza las constantes al inicio del archivo.
