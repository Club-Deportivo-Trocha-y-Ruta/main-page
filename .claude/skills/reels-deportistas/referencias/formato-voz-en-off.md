# Formato «relato en off»

Aprobado con la III Válida DH de la Copa Cali Bike Park (2026-09-20, 2:18). Una persona
del club (el director deportivo, un entrenador) cuenta la jornada y su voz corre bajo las
escenas de carrera. Script: `scripts/voz_en_off.py`; pieza de referencia:
`ejemplos/cali-bike-park-dh.json`.

Se usa cuando hay **un relato largo y muchas escenas mudas** (salidas, saltos, llegadas).
Si lo que hay son declaraciones a cámara de varios deportistas, el formato es el de
entrevistas (`montage.py`, `estructura-editorial.md`).

## El arco

1. **Arranque con audio original**: un deportista saluda o presenta al equipo. Subtitulado.
2. **El relator en cámara al menos 5 s**, con su rótulo y un **zoom muy sutil 1,00 → 1,07**.
3. **Escenas bajo el relato**, en el orden en que pasan las cosas (alistamiento → calentamiento
   → salidas → pista → llegadas). Cada escena dura lo que dura la idea de la voz que la
   cubre: el corte cae entre frases del relato, no a mitad de palabra.
4. **Vuelta al relator** en cámara para su cierre («Gracias»), otra vez con el zoom sutil.
5. **Cierre con audio original**: podio y conclusiones de un deportista. Un **fundido a
   negro** de 0,5 s marca el cambio de capítulo entre el relato y el podio.
6. **Invitación** a la próxima fecha con la banda del evento. Fundido a negro final.

El orden de las escenas lo dicta el usuario; lo que no se negocia es que el relato ocupe
todo su tiempo con imagen y que el arranque y el cierre conserven su voz.

## Flujo de trabajo: demo primero

1. `voz_en_off.py pieza.json --demo` → `{id}-demo.mp4`: **sin subtítulos, sin banda y con
   rótulos planos**. Sirve para aprobar escenas, orden, tiempos y audio sin pagar el
   render del estilo.
2. Con el demo aprobado, `voz_en_off.py pieza.json` → la versión final, su `.srt` y la
   portada. Antes de rehacer una final aprobada, respaldar la anterior como `.v1.mp4`.
3. Verificar: re-transcribir el máster completo (que la voz esté entera y en orden) y medir
   el nivel de cada voz por frase. **El club reportó dos veces que «no se escucha»**: el
   máster puede estar en −14 LUFS con una voz inaudible adentro.
4. Ver la pieza en el teléfono antes de publicar.

## Audio — donde se rompió todo

| Problema | Qué pasó | Cómo lo resuelve el script |
|---|---|---|
| Pista equivocada | Los `.mov` del iPhone traen una pista APAC (audio espacial, `codec unknown`) que ffmpeg no decodifica, además de la AAC, en posición 1 o 2 | `aac_index()` elige la AAC de cada clip |
| Relato mudo | `amix` del relato dentro del filtergraph de los planos lo perdió sin error | Imagen y audio por separado: el audio se mezcla en numpy y se une al final |
| Voces a distinto nivel | Nivelar el clip entero dejó la invitación 5 dB bajo el relato | Cada frase (tiempos de Whisper) a −16 dB RMS; entre frases, la mediana −3 a −6 dB |
| Voz lejana | Isabel quedó ~20 dB bajo quien preguntaba: el celular estaba junto al entrevistador | `level.mode: fixed` + `afftdn`: ganancia fija de la voz lejana y se atenúan solo las preguntas |
| Volumen que bombea | Subir la voz lejana frase a frase subía y bajaba el ruido de fondo | Ganancia fija para toda la escena; rampas de 0,18 s en las pausas |
| Ambiente | — | Sonido de las escenas, en promedio **20 dB bajo el relato** (`ambient_db`); planos en cámara lenta, mudos |
| Público | El grito del podio tapaba | `level.mode: whole`, 3 dB bajo el objetivo |

Máster: ganancia fija a −14 LUFS + limitador; si el pico real pasa de −1 dBTP se baja y
se repite. Resultado en Cali: −14,4 LUFS, −1,2 dBTP.

## Imagen

- **HLG**: 14 de 19 clips de Cali venían con «Vídeo HDR». Se convierten con la LUT de
  `hlg.py`; mezclados con los SDR nativos no se nota el salto.
- **Transiciones**: todo es fundido, ningún corte seco (el club lo pidió). Encadenado
  0,30–0,45 s por defecto; `smoothleft` 0,35 s en arrancadas y salidas; `fadeblack` 0,5 s
  entre el relato y el podio. Cada plano lleva 0,5 s de cola congelada para que el fundido
  no mueva su inicio y la imagen no se desfase del relato.
- **Cámara lenta** (`slow: 2.0`) para la acción que dura un suspiro (una arrancada).
- **`crop_zoom`** para acercar una acción que quedó lejos en el plano (Samuel en pista, 1,7).
- **Subtítulos arriba** (`captions_top`) en el plano donde la acción ocurre abajo (una
  llegada filmada desde arriba): abajo taparían justo lo que se quiere ver.

## Subtítulos y rótulos

Estilo B de `captions.py` (medidas en `estilo-visual.md`): sin caja, palabra activa en
lima, máximo dos líneas, rótulo compacto por debajo de la cara.

- Subtítulos de **todo** lo que se oye: arranque, relato completo, cierre e invitación.
- Una frase por subtítulo, cortada donde respira el que habla; si pasa de dos líneas, se parte.
- **Errores del que habla**: se escribe lo correcto con asterisco. Oscar dijo «sexta» y era
  la séptima: el subtítulo dice «séptima*» y la banda «*VII Válida».
- Nombres propios contra la lista que dé el usuario; el que Whisper no oye claro («Héctor
  Giraldo» vs «Torquialdo») **se pregunta**.
- Rótulo = nombre + `puesto · categoría` solo con resultado confirmado (tablero de la
  carrera o crónica); sin puesto, solo la categoría. Relator: nombre + cargo.
- Banda del evento en `y = 1440` durante la invitación; los subtítulos de ese tramo suben
  a `CY_STRIP` para no pisarla.

## Descripción para Instagram

Mismo molde que en `estructura-editorial.md`, con dos cambios que salieron de esta pieza:
el gancho es la **frase de un deportista** del cierre («Muy técnica y muchos saltos.»),
y los **agradecimientos del relato** van con nombre propio. Hashtags: **3 a 5**,
específicos, al final: las palabras clave del texto pesan más. Hay reportes de que
Instagram limita a 5 por publicación; si al publicar deja más, ese dato cambió. Ubicación: la sede de la carrera. No etiquetar a los deportistas.

**Menores**: antes de publicar, confirmar con el club o las familias que se pueden mostrar
los planos de los deportistas. Nadie lo había revisado en Cali.
