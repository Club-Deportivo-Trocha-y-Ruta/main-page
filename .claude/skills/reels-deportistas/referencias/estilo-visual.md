# Estilo visual de los reels

Lo aprobado en la pieza de Alcalá (2026-09-18). Todo se dibuja con Pillow en
`scripts/overlays.py`; los valores están en píxeles sobre un lienzo de **1080 × 1920**.

## Marco

| Qué | Valor |
|---|---|
| Lienzo | 1080 × 1920 (9:16), 24 fps |
| Zona segura superior | primeros **270 px** vacíos (14 % — perfil y menú de la app) |
| Zona segura inferior | últimos **384 px** vacíos (20 % — pie, botones y audio) |
| Tipografía | `fonts-src/PlusJakartaSans[wght].ttf`, eje de peso variable |
| Colores | teal `#20B7C9`, lima `#8BE000`, grafito `#2F2F2F`, blanco `#FFFFFF` |
| Exportación | H.264 CRF 20 (~12 Mb/s), `yuv420p`, perfil high, etiquetas bt709, AAC 256 kb/s a 48 kHz, `+faststart` |
| Audio de entrega | **−14 LUFS integrados, pico real ≤ −1 dBTP** (lo que normalizan Instagram, TikTok y YouTube) |
| Junto al `.mp4` | `{id}.srt` (mismos subtítulos) y `{id}-portada.jpg` (1080 × 1440, el recorte 3:4 de la cuadrícula del perfil; instante con `cover_at`) |

Meta pide dejar libre el **14 % de arriba y el 35 % de abajo** en anuncios; en orgánico la UI
tapa cerca del 20 % inferior. Por eso en la pieza de Cali la banda del evento subió a
`y = 1440`. En `montage.py` sigue en `y = 1560`, dentro de ese 20 %: si se vuelve a usar el
formato de entrevistas, subirla igual. Revisar cada pieza en el teléfono antes de publicar.

El grafito nunca va opaco sobre la imagen: se usa a **225–238 de alfa**, para que se
adivine el fondo y la pieza no parezca una diapositiva pegada encima del video.

## Subtítulos palabra a palabra y rótulo compacto (`captions.py`) — estilo vigente

Aprobado en la pieza de Cali (2026-09-20) frente a tres maquetas: A (la caja grafito de
Alcalá), **B (sin caja, palabra en lima)** y C (caja + palabra en lima). Es el estilo para
las piezas nuevas; `voz_en_off.py` lo usa siempre. `montage.py` conserva el de Alcalá.

- Blanco peso 800, **contorno grafito de 7 px** y sombra difuminada (8 px, alfa 170);
  sin caja. **La palabra que suena, en lima.** 64 px, baja hasta 50 px para no pasar de
  **dos líneas**; ancho máximo 880 px.
- Banda inferior `y = 1150–1600`, centro en `y = 1420`; con la banda del evento en
  pantalla el centro sube a `y = 1300`. En planos con la acción abajo, banda superior
  `y = 280–700`, centro en `y = 450` (`captions_top`).
- **Rótulo compacto**: tarjeta grafito del ancho del texto (nombre 54 px/800, dato 34 px/600
  en lima), barra lima a la izquierda, `y = 1170`, **por debajo de la cara**. El rótulo ancho
  de abajo le tapó la cara a Oscar en un plano medio. Entra deslizándose en 0,4 s y dura 3,6 s.
- **Banda del evento en `y = 1440`** (no 1560): fuera del 20 % inferior que tapa la app.

## Rótulo del deportista (`lower_third_png`) — estilo de Alcalá

Tarjeta grafito de borde redondo (radio 32) con una **barra lima a la izquierda**, que es
la firma del club. Nombre en blanco, dato en lima.

- Caja: `x` de 60 a 1020, `y` de 1010, alto 190 con dato o 118 sin él.
- Nombre: 68 px, peso 800. Dato: 40 px, peso 600.
- Entra **deslizándose desde la izquierda** en 0,4 s con salida cúbica y se mantiene
  ~3,2 s. En la primera aparición de cada persona, no en sus reapariciones.
- Aparece cuando la persona **ya está hablando**, no en el fotograma del corte.

## Subtítulos (`caption_png`) — estilo de Alcalá

- 62 px, peso 800, blanco sobre caja grafito de radio 28, centrados en `y ≈ 1330`.
- Ancho máximo de línea 900 px; el texto se parte solo por palabras.
- Una caja por línea, no un bloque: las líneas cortas no arrastran fondo vacío.
- **Van pegados a la voz**, no al plano: cada subtítulo entra con su frase y sale con ella.
- Llevan los puntos suspensivos de continuidad («…y también por el calor») cuando la
  frase viene de antes, para que se lea como habla continua y no como frases sueltas.

## Banda del evento (`strip_png`)

Para el dato que debe quedar aunque vean sin sonido. Formato del texto: `fecha · resto`.

- Ficha **lima** con la fecha en versalitas grafito + resto en blanco, todo sobre tarjeta
  grafito con sombra suave. Radio = mitad del alto (píldora real).
- `y = 1560`, alto ≈ 96 en `montage.py`: cae dentro del 20 % que tapa la app (ver arriba);
  `voz_en_off.py` la sube a `y = 1440`.
- Tamaño de letra automático de 40 px hacia abajo hasta que quepa en 980 px.
- **Sube desde abajo** (70 px en 0,45 s) la primera vez; después queda fija.
- Solo durante el bloque al que pertenece (la invitación), no todo el video.

## Zoom

- Se aplica sobre el **4K original** (`zoompan` antes de escalar): acercar no pierde nitidez.
- El clip se **supersamplea a 4320 px de ancho** (lanczos) antes del `zoompan`. El filtro
  trunca la ventana de recorte a píxeles enteros de la fuente: en un banco con una línea
  de 2 px, el empuje que debía avanzar +0,19 px por fotograma avanzaba entre −0,58 y
  +1,07 px, o sea a tirones y con retrocesos; con la fuente al cuádruple del ancho de
  salida el paso queda entre 0,00 y +0,50 px. Cuesta ~15 % más de render y la nitidez
  medida no cambia (laplaciano 8,37 contra 8,33). En un plano con zoom rápido la
  diferencia no se aprecia; donde paga es en el empuje lento de 10 s, que es la regla.
- **Un solo empuje largo por plano**, típicamente 1,00 → 1,20 repartido en toda su
  duración. Los golpes de zoom de medio segundo se sienten bruscos.
- Interpolación **quíntica** (`smootherstep`): velocidad y aceleración cero en los
  extremos, así que ni arranca ni frena con tirón.
- `focus` siempre **en la cara**. Un foco bajo centra el zoom en el torso: mal plano,
  y peor tratándose de menores.
- Excepción: en un corte seco dentro de la misma persona, el zoom **sí** cambia de golpe
  (p. ej. 1,06 → 1,16). Es lo que hace que el salto se lea como decisión.

## Transiciones

| Uso | Transición | Duración |
|---|---|---|
| Entre deportistas distintos | `dissolve` | 0,16–0,30 s |
| Eco temático (el calor, la pista) | `hblur` | 0,16–0,20 s |
| Entre invitaciones | `slideleft` | 0,20–0,25 s |
| Salto dentro de la misma persona | corte seco (`xfade: 0.042`) | 1 fotograma |
| Cierre | `fade` a negro | 0,45 s |

La duración pedida es un techo: `montage.py` la recorta al aire real del corte. Si hay
que elegir entre un fundido bonito y una sílaba, gana la sílaba.

## Cierre

El último plano se funde a negro dentro de su propio aire. **Sin placa final**: se probó
con una lámina del cerro de Yumbo y el club la descartó — la pieza cierra con la cara y
la voz del deportista, y el dato ya viaja en la banda.
