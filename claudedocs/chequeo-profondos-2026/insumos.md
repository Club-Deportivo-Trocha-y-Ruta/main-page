# Insumos en crudo — 2º Chequeo Pro-Fondos XCO · Yumbo, 5-sep-2026

Material que llega desde la pista **durante la jornada**. Este archivo es el
bloc de notas: aquí se acumula lo que se recibe y se marca qué está
verificado. Nada de aquí pasa a `src/content/` sin que el club lo confirme.

Destino final del material:

- Noticia: `src/content/news/2026-09-chequeo-profondos-yumbo.md` (hoy `draft: true`, con esqueleto y checklist).
- Álbum: `src/content/gallery/chequeo-profondos-2026.md` (hoy `draft: true`, `images: []`).
- Fotos publicables: `public/images/news/chequeo-profondos-2026/` (WebP, máx 1600 px, q76).

> **Esta carpeta se borra** cuando la noticia y el álbum se publiquen. Las fotos
> de `fotos/` son copias de trabajo, ya convertidas a WebP, no las definitivas.

Encabezado impreso de las planillas:

> CONVOCATORIA 2DO CHEQUEO PROFONDOS DE CICLOMONTAÑISMO (XCO)
> MODALIDAD: CROSS COUNTRY OLÍMPICO — YUMBO 05 DE SEPTIEMBRE DE 2026 — RESULTADOS

---

## Fotos recibidas

| Archivo de trabajo                                         | Qué es                                                                                  | Estado                                                             |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `fotos/planilla-prejuvenil.webp`                           | Planilla de jueces, PREJUVENIL                                                          | Transcrita ✅                                                      |
| `fotos/planilla-open.webp`                                 | Planilla de jueces, OPEN                                                                | Transcrita, emparejamiento **confirmado por el club** ✅           |
| `fotos/podio-open.webp`                                    | Podio Open + dos corredores con medalla + juez y adulto del club                        | Identificado por maillot ✅                                        |
| `fotos/podio-prejuvenil-masculino.webp`                    | Podio de dos: 1º y 2º; puesto 3 vacío                                                   | Prejuvenil varones ✅ (la niña de la foto es familiar de Santiago) |
| `fotos/podio-prejuvenil-femenino.webp`                     | Podio de dos corredoras del club; puesto 3 vacío                                        | Prejuvenil damas ✅                                                |
| `fotos/previa-prejuvenil-1859-906-904.webp`                | Santiago Cardona (1859), Isabel Quiñones (906) y Mariana Coronado (904) antes de largar | Identificados por dorsal ✅                                        |
| `fotos/previa-largada-open-251-1907-1950.webp`             | Parrilla del Open: 251, 1907 y 1950 en la línea                                         | Identificados por dorsal ✅                                        |
| `fotos/previa-largada-menores-1253-813-1704-426-1257.webp` | Parrilla de una categoría de menores                                                    | **Sin planilla todavía**                                           |

**Fotos de carrera** (segunda tanda, ya en `public/`): `bernardino-montenegro-salto-teatrino.webp`
(dorsal 251 saltando desde la plataforma del teatrino), `open-bajada-al-teatrino.webp`,
`juan-felipe-circuito.webp` (dorsal 1908), `juan-diego-garcia-ascenso.webp` (dorsal 1950)
y `prejuvenil-paso-de-troncos.webp` (dorsal 90?, ver dudas).

**Tercera tanda de carrera**: `german-recio-bajada.webp` (dorsal 1203),
`mariana-coronado-circuito.webp` (dorsal 904, se lee claro),
`prejuvenil-doble-en-circuito.webp` (dos corredores del club, dorsal delantero
"90?"), `corredor-club-tramo-piedras.webp` (uniforme del club, sin dorsal a la
vista) y `circuito-tres-corredores.webp` (plano abierto del trazado).

**Cuarta tanda de carrera**: `open-circuito-arbol-guayaba.webp`,
`menores-426-curva.webp`, `menores-426-paso-de-troncos.webp`,
`menores-1257-circuito.webp` y `menores-tramo-piedras.webp`. Son las primeras
fotos en carrera de las categorías de menores; las planillas siguen faltando.

**Quinta y última tanda de carrera**: `menores-813-circuito.webp`,
`menores-260-paso-de-troncos.webp`, `menores-1257-paso-de-troncos.webp` y
`german-recio-acompana-menor.webp`.

**Redundancia a resolver en la curaduría**: hay **cuatro** fotos del mismo paso
de troncos (426, 260, 1257 y la del dorsal "90?"). Para el álbum sobran dos.

**Peso del álbum.** El lightbox del sitio (`ImageLightbox.tsx`) pinta la
miniatura con el archivo completo (`src={img.src}`, sin `srcset`), así que cada
foto del álbum se descarga entera al hacer scroll. Con eso, dieciocho fotos a
500 KB eran nueve megas en una sola página, muy por encima del presupuesto del
sitio. Todas se reprocesaron con un tope de 300 KB —lado mayor 1400 px y la
calidad que haga falta— y el álbum quedó en **4,1 MB / 18 fotos** (media de
228 KB, la misma banda que Palmira). **Cualquier foto nueva entra con ese tope.**

Las fotos con autorización ya están en `public/images/news/chequeo-profondos-2026/`
y cargadas en el álbum (`src/content/gallery/chequeo-profondos-2026.md`, todavía en
`draft: true`). Las dos planillas **no se publican**: son documento interno.
| `fotos/previa-teteros-ambiente.webp` | Niños del club jugando en la sombra, con buzo del club | Ambiente; no compiten en la foto |
| `fotos/previa-juan-felipe.webp` | Juan Felipe, casco amarillo, maillot negro y culotte Safetti | Identificado por el club ✅ |

---

## Resultados consolidados

### PREJUVENIL

Las filas 1 y 2 de la planilla están **tachadas** y rehechas en las filas 3 y 4.
En la fila corregida el juez escribió "maria cardona" junto al dorsal 904; **el
club confirma que el 904 es Mariana Coronado**, y así lo respalda el resto del
sitio: la crónica de Palmira ya publica a Mariana Coronado con el 904 y a Isabel
Quiñones con el 906, en Prejuvenil A Femenina. La anotación de la planilla es un
error del juez.

**Damas**

| Puesto | Dorsal | Corredora                        | Club          | Vuelta 1 | Total     |
| ------ | ------ | -------------------------------- | ------------- | -------- | --------- |
| 1ª     | 904    | Mariana Coronado Delgado         | Trocha y Ruta | 18:52    | **37:59** |
| 2ª     | 906    | Isabel Cristhina Quiñones Batero | Trocha y Ruta | 20:04    | **41:55** |

**Varones**

| Puesto | Dorsal | Corredor                        | Club          | Vuelta 1 | Total     |
| ------ | ------ | ------------------------------- | ------------- | -------- | --------- |
| 1º     | 1859   | Santiago Cardona Chate          | Trocha y Ruta | 19:32    | **40:25** |
| 2º     | 1860   | Johan Samuel Palacios Canizales | Trocha y Ruta | 20:30    | **45:10** |

Los cuatro son de Yumbo y del club. Los dos podios tienen el puesto 3 vacío, que
cuadra con que solo hubo dos corredores por sexo.

### OPEN

Emparejamiento dorsal ↔ nombre **confirmado por el club**. El orden de llegada
sale de los tiempos finales y lo respalda la foto del podio: el 1º lleva el
maillot rojo-negro del club (el mismo del 1907 en la parrilla), el 2º el
rojo-azul con "YUMBO" (el del 1950) y el 3º el uniforme de la Escuela Olguita
García.

| Puesto | Dorsal | Corredor                    | Ciudad | Club                   | V1       | V2    | V3    | Total               |
| ------ | ------ | --------------------------- | ------ | ---------------------- | -------- | ----- | ----- | ------------------- |
| 1º     | 1907   | Samuel Ortiz Valencia       | Yumbo  | Trocha y Ruta          | 14:28:91 | 29:23 | 44:55 | **1:00:11**         |
| 2º     | 1950   | Juan Diego García Bohórquez | Yumbo  | Trocha y Ruta          | 15:12    | 30:26 | 46:20 | **1:03:15**         |
| 3º     | 1120   | Jorge Lasso                 | Cali   | Escuela Olguita García | 14:29:83 | 30:19 | 47:50 | **1:05**            |
| 4º     | 1906   | Samuel Rodríguez            | Cali   | Independiente          | 17:14    | 35:53 | 54:53 | **1:13:46**         |
| —      | 251    | Bernardino Montenegro Urrea | Yumbo  | Independiente          | 14:47    | 31:20 | 48:36 | DNF                 |
| —      | 1908   | Felipe Maya                 | Cali   | ¿"Invelavia"?          | 18:46    | 40:23 | DNF   | DNF                 |
| —      | 1203   | Germán Recio                | Cali   | ¿"Bombombún"?          | 19:53    | —     | —     | **1 vuelta: 19:53** |
| —      | DNP    | Anderson Cárdenas Guaca     | Yumbo  | Trocha y Ruta          | —        | —     | —     | DNP                 |

**El titular está aquí:** Samuel Ortiz Valencia corre **Prejuvenil A** en la Copa
Valle (así lo publica la crónica de Palmira, donde fue segundo de su categoría
con el dorsal 609). En el chequeo se subió al Open y ganó la general de la
categoría, por delante de adultos y de corredores de Cali. Juan Diego García
Bohórquez, también del club, fue segundo.

---

## Dorsales vistos sin planilla todavía

De la parrilla de menores: **1253** (maillot Colombina), **813**, **1704**
(Trocha y Ruta), **426** (Trocha y Ruta) y **1257** (Trocha y Ruta). Faltan las
planillas de Teteros sin pedales, Teteros con pedales, Preinfantiles e
Infantiles para saber a qué categoría corresponde esa largada y cómo terminó.

---

## Cruce con la lista de categorías del sitio

El evento publicado anuncia cinco categorías: Teteros sin pedales, Teteros con
pedales, Preinfantiles, Infantiles y Prejuveniles.

| Categoría anunciada       | Planilla recibida | Fotos                                |
| ------------------------- | ----------------- | ------------------------------------ |
| Teteros sin pedales       | —                 | ambiente                             |
| Teteros con pedales       | —                 | ambiente                             |
| Preinfantiles             | —                 | ¿parrilla de menores?                |
| Infantiles                | —                 | ¿parrilla de menores?                |
| Prejuveniles              | ✅ PREJUVENIL     | podio damas + podio varones + previa |
| _(no anunciada)_ **OPEN** | ✅ OPEN           | podio + parrilla                     |

**Aquí no cuadra la información**: hay una planilla de OPEN, con ocho inscritos,
adultos y corredores de Cali de otros clubes (Bernardino Montenegro, Jorge
Lasso, Germán Recio, Felipe Maya). Eso no encaja en ninguna de las cinco
categorías anunciadas. O el chequeo abrió una categoría Open que no estaba en el
afiche, o el Open es otra cosa. Ver duda 1.

---

## Relato del club (dictado el 5-sep, fuente primaria de la crónica)

- **Open: cuatro vueltas, temperatura promedio de 34 °C.**
- **Samuel Ortiz** manejó la carrera: dos vueltas con el grupo de punta y las
  dos últimas en solitario.
- **Juan Diego García** salió controlado y remontó, pero no fue capaz de
  alcanzar a **Samuel Ortiz** (el club corrigió: había dicho "Juan Esteban").
- **Bernardino Montenegro**, "otro de la casa", buen arranque y el clima muy
  fuerte (el club corrigió después: no fue el clima, fue un problema mecánico
  con los cambios — ver más abajo).
- Deportistas de otras ciudades le subieron el nivel a la categoría.
- **Isabel y Mariana** lo tomaron como superentrenamiento, preparadas como para
  una carrera normal, para agarrar ritmo de cara a **Alcalá**.
- **Jostin** se probó contra un contrincante de su categoría de la Copa Valle,
  se fogueó en su propia pista, mostró fortaleza y faltando poco se le acabó el
  gas.

Faltan por pasar: cuántos corrieron y los datos de las demás categorías.

## Datos que pasó el club (segunda tanda)

- **Alrededor de 30 inscritos** entre todas las categorías. Es una **estimación
  del club**: va en el texto como "alrededor de treinta" y NO se usa para
  calcular un recaudo exacto.
- **Destino confirmado**: adecuar la pista por ser la siguiente parada de la
  Copa Valle XCO (la semifinal del 18 de octubre).
- **Jostin Villamizar**: **Infantil A masculino, segundo**, con un tiempo
  estimado de 45 minutos. El puesto va en la tabla; el tiempo, solo en el
  cuerpo y como aproximado.
- **Visto bueno para publicar los nombres nuevos**: concedido.
- **Anderson Cárdenas Guaca no participó** (no alcanzó a llegar). Sale de la
  tabla publicada: no hay nada que reportar de una carrera que no corrió.
- **Horarios**: la primera categoría largó a las **8:45 a. m.** y la última, a
  las **10:34 a. m.** Falta la hora de cierre.
- **Bernardino Montenegro** es **independiente, de Yumbo**. El texto y la tabla
  ya lo decían así.

## Datos de jornada cerrados por el club

- **Recaudo**: el club decidió **no publicar valores exactos**. Queda el
  aproximado de inscritos (alrededor de 30) y el destino (adecuar la pista
  para la semifinal de la Copa Valle del 18 de octubre). El bloque `.ledger`
  no se pinta.
- **Tiempo de Jostin**: 45 minutos **aproximados**, confirmado como tal. Va en
  el cuerpo, no en la tabla.
- **Vueltas por categoría**: Open, 4 vueltas al circuito completo; Prejuvenil,
  2 vueltas completas; Infantil A, 2 vueltas al 70% del trazado. Faltan
  Teteros (las dos) y Preinfantiles.
- **Horario**: primera largada 8:45 a. m., última 10:34 a. m., cierre a las
  12 del mediodía.

Lo de las vueltas es el dato que le faltaba al texto: explica por qué los
tiempos de una categoría no se comparan con los de otra.

## Revisión de producción (5-sep, noche)

Lectura completa como editor + render real con Chromium (escritorio 1280 px y
móvil 412 px, con scroll para disparar el lazy-loading: 31/31 imágenes cargan).

Corregido antes de publicar:

- **Anderson seguía en la tabla**: una edición anterior no aplicó porque
  Prettier había rellenado las columnas y el texto ya no coincidía. Fuera.
- Misma causa: faltaba la etiqueta `trocha-verde`. Puesta.
- Dos párrafos seguidos repetían el destino de la plata y el 18 de octubre.
  Fundidos.
- "con 1:05" en prosa se leía como un minuto y cinco segundos → "una hora y
  cinco minutos". En la tabla se queda "1:05" (el club no dio los segundos).
- La tabla de Infantil A con una sola fila (2º) parecía rota → una línea de
  prosa.
- "veterano de Cali" (Veteranos es una categoría; Germán corrió Open) →
  "corredor de Cali".
- Celdas DNF ("abandonó en la 4ª vuelta") se partían en móvil → "4ª vuelta" +
  nota al pie de la tabla.
- Comentarios PENDIENTE → registro de lo que se publicó incompleto.
- `og-chequeo-profondos.webp` 1200×630 recortado del podio de la Open (misma
  convención que Palmira). Hero sigue siendo el afiche, como en Palmira.
- Evento: `status: past` + `relatedNews` + `relatedGallery`, como los demás
  eventos pasados.
- `NewsGallery.astro`: el botón "Ver álbum completo (N fotos)" contaba las
  fotos de la rejilla del pie (20), no las del álbum (27). Ahora lee el álbum.

Publicada con dos huecos que el club decidió no esperar: planillas de Teteros
y Preinfantiles, y el ganador de Infantil A.

## Aclaración del club (tras publicar) — Bernardino, mecánica y no calor

**Bernardino Montenegro no abandonó por el calor**: fue un problema mecánico,
los cambios no le estaban funcionando correctamente. Se corrige en dos sitios
de la crónica —el párrafo de la Open y el "Se vio" de la `.check-sheet`—, que
decían "las cuatro vueltas al sol le pasaron factura" / "el calor le cobró a
Bernardino". Ahora dicen que un problema mecánico con los cambios lo fue
sacando de ritmo. La tabla de resultados no cambia: seguía siendo DNF en la
4ª vuelta.

## Aclaración del club (tras publicar)

**Germán Recio no se retiró**: solo le tocaba hacer **una vuelta**. Los "DNF"
de la planilla en las vueltas 2-4 no son un abandono sino que no las corría.
Corregido en la tabla de la Open (fila propia, fuera de la clasificación de
cuatro vueltas, con su 19:53) y en el párrafo de los más pequeños, que decía
que había abandonado.

## Sexta tanda: los más pequeños (llegada tarde, tras publicar)

Cinco fotos que por fin cubren las categorías menores, que hasta ahora solo
tenían parrilla y ninguna imagen en el cuerpo de la crónica:

- `teteros-1758-circuito.webp` y `teteros-1706-circuito.webp`: dos corredores
  del club en bicicleta de balance (sin pedales a la vista), con un familiar
  acompañando a pie. **Van embebidas en "Los más pequeños"**, en `.figure-grid`:
  esa sección era la única de la crónica sin foto.
- `podio-menores-varones.webp`: podio de tres, con **un corredor del club en el
  segundo puesto**. Ver duda nueva.
- `podio-menores-damas.webp`: podio de tres, con **una corredora del club en el
  tercer puesto**.
- `podio-menores-mas-pequenos.webp`: podio de solo dos, ninguno del club,
  presentado por un adulto del club con micrófono.

Los tres podios van al pie, en la galería. Ninguno se nombra: no hay planilla
que diga de qué categoría es cada uno ni quién es cada corredor.

## Séptima tanda: última, cierra el material fotográfico

El club confirma que **ya no llegan más fotos**. Las dos últimas:

- `premiacion-mas-pequenos.webp`: una decena de niños de las categorías más
  pequeñas con medalla y bolsa de premio junto al podio, con dos adultos del
  club repartiendo. **Va embebida** al cierre de "Los más pequeños": es la foto
  que resume el sentido del chequeo para esa edad, medalla para todos los que
  largaron.
- `podio-menores-damas-b.webp`: podio de dos corredoras, ambas de la Escuela
  Olguita García de Cali. Va al pie, en la galería.

**Total del material**: 34 fotos en el álbum, 9 embebidas en el cuerpo de la
crónica y 24 en la galería del pie. Ninguna supera los 300 KB.

## Dudas abiertas

0b. **¿El podio de `podio-menores-varones.webp` es el de Infantil A?** El
segundo puesto lo ocupa un corredor con uniforme del club, y el único
segundo puesto del club en las categorías menores que conocemos es el de
**Jostin Villamizar en Infantil A masculino**. Si es él, ese podio identifica
además al **ganador de la categoría** (el del maillot azul y blanco con
gorra), que es uno de los dos pendientes que quedan. No lo doy por hecho:
no identifico a un menor por parecido, hace falta que el club lo confirme.
0c. **¿De qué categorías son los otros dos podios**, y quiénes son la corredora
del club que fue tercera y los dos pequeños del podio de dos?
0d. **Menores de otros clubes en los podios.** Las fotos de podio incluyen
niños de otros clubes (maillot tricolor de Colombia, azul y blanco,
morado y amarillo). La autorización que dio el club cubre a sus deportistas;
como organizador del evento debería tener también la de los inscritos
visitantes, pero conviene confirmarlo antes de dejarlas publicadas.

1. **La categoría Open.** ¿Se abrió sobre la marcha? Si corrió de verdad —y la
   planilla, el podio y la parrilla dicen que sí—, hay que sumarla a la lista de
   categorías del evento en el sitio o dejar sus resultados fuera de la noticia.
   Dime cuál de las dos.
2. **Planillas que faltan**: Teteros sin pedales, Teteros con pedales,
   Preinfantiles e Infantiles.
3. **Juan Felipe = Felipe Maya (1908), casi seguro.** En la foto de carrera el
   dorsal 1908 lleva el mismo casco amarillo, el mismo maillot negro y el mismo
   culotte vinotinto Safetti que la foto de la previa. Si es él, corrió en Open
   y fue DNF en la tercera vuelta. Confírmalo y dime el apellido completo, que el
   sitio publica nombre y apellido.
4. **Dorsales "90?" sin resolver.** En `prejuvenil-paso-de-troncos.webp` y en
   `prejuvenil-doble-en-circuito.webp` la placa se lee "90" y el tercer dígito
   no. Por el uniforme son del club: Mariana Coronado (904) o Isabel Quiñones
   (906). Los pies de foto por ahora no las nombran. (El 904 sí se lee claro en
   `mariana-coronado-circuito.webp`.)
   4d. **Dorsal del corredor de maillot blanco de Colombia** en el paso de troncos:
   leo **260**, pero podría ser 250. El pie de foto no lo nombra.
   4c. **Dorsal del corredor junto al letrero de guayaba**: la foto venía girada y
   la placa no la leo con certeza; parece **1906** (Samuel Rodríguez, Cali). El
   pie de foto no lo nombra. ¿Lo confirmas?
   4b. **Corredor sin identificar**: `corredor-club-tramo-piedras.webp`, uniforme
   del club, culotte con "YUMBO", casco verde y bicicleta Specialized verde
   lima. No se le ve el dorsal. ¿Quién es?
5. **¿Corrieron juntas la Prejuvenil y la Open?** En esa misma foto hay un
   corredor al fondo con uniforme rojo y azul, que parece el 1950. Si las
   categorías largaron mezcladas, es un dato que cambia cómo se cuenta la
   carrera.
6. **Qué significa "N Pt"** en las dos planillas: ¿puesto, vueltas completadas,
   orden de paso? En Open va 1 a 7 pero no cuadra con los tiempos (14:28:91 del
   1907 lleva "2 Pt" y 14:29:83 del 1120 lleva "1 Pt").
7. **Clubes del Open**: no leo bien dos. ¿"Invelavia" (Felipe Maya) y
   "Bombombún" (Germán Recio) están bien escritos?
8. **Nombres publicables.** Ya salen con nombre en el sitio: Mariana Coronado,
   Isabel Quiñones, Samuel Ortiz, Juan Diego García. **Nuevos**: Santiago Cardona
   Chate, Johan Samuel Palacios Canizales y Anderson Cárdenas Guaca. La
   autorización de imagen está confirmada; falta el visto bueno para publicar
   estos tres nombres en la tabla de resultados.
9. **PENDIENTE — recaudo y destino.** Inscritos totales, plata recogida y en qué
   se va. El club lo confirma después. Mientras tanto el bloque `.ledger` de la
   noticia no se puede escribir: o llega el dato, o ese bloque se borra.
10. **Logística del día**: hora real de inicio y cierre, clima, vueltas y
    longitud por categoría, voluntarios y roles (solo adultos, con permiso).
    Lo que falta de aquí es justo lo que le falta al **muro de placas** de la
    crónica (ver abajo): **qué entes y qué personas naturales ayudaron, con
    nombre y con rol**. Sin esa lista solo se publican las placas que el
    material del día respalda por sí solo.

### Los árboles de la pista son los de Trocha Verde

En dos fotos se ven los letreros de madera que identifican los árboles del
circuito: **GUAYABA** en el tramo llano y **MANGO** junto al paso de troncos.
Las dos especies están en el inventario del sitio (`src/content/species/`:
guayaba, guayaba pera, mango, mango tommy, mango manzana), con fichas propias
en `/trocha-verde`. Es un enlace natural para la crónica y para el álbum: el
chequeo se corrió entre los árboles que el propio club sembró y catalogó, y la
plata de las inscripciones va a mantener ese mismo terreno. **El club confirmó** que los letreros del circuito son los del inventario de
Trocha Verde, así que el dato ya está escrito en la crónica, con enlaces a
`/trocha-verde/guayaba`, `/trocha-verde/mango` y al índice.

### Dos cosas que da la última tanda

- **Germán Recio (1203) rueda al lado de un corredor pequeño.** En la planilla
  de Open figura con DNF después de la primera vuelta, y aparece además en la
  parrilla de menores. Parece que dejó su carrera y se puso a acompañar a los
  chiquitos, pero eso **no lo digo sin que el club lo confirme**: por ahora el
  pie de foto solo describe lo que se ve.
- **Un letrero en el circuito dice "Cree en ti y todo será posible"**, colgado
  junto al paso de troncos. Va con banderas de varios países como banderines
  sobre la loma. Sirve para el cold open de la noticia.

### Detalle del trazado visto en las fotos

Sirve para escribir "lo que se chequeó" sin inventar: rampas de madera y una
plataforma de concreto en el teatrino (el 251 la salta), un paso de troncos
atravesados en el descenso, señal amarilla de **"OPCIONAL"** con flecha —o sea,
línea B para quien no quiera el obstáculo—, delimitación con cinta amarilla de
"peligro no pase" y estacas verdes. Terreno seco y polvoriento, monte bajo,
cielo despejado con nubes altas.

### Resueltas

- Dorsal 904 es **Mariana Coronado Delgado** (el "maria cardona" de la planilla
  es un error del juez).
- Emparejamiento dorsal ↔ nombre de la planilla Open: **correcto**.
- Tiempo final de Jorge Lasso: **1:05**.
- El podio de dos corredores es **Prejuvenil varones**; la niña que aparece es
  familiar de Santiago Cardona, el ganador.
- **Hay autorización para publicar las fotos.**
- **Los letreros del circuito son los del inventario de Trocha Verde.**
- El "Juan Esteban" del relato era **Samuel Ortiz**: Juan Diego lo persiguió y
  no lo alcanzó. Coincide con la planilla, donde Juan Diego es segundo con solo
  Samuel por delante.
- Dorsal 1203 identificado en carrera: **Germán Recio**, el corredor veterano
  del maillot Colombina (es también el adulto que aparece en la parrilla de
  menores).

---

## Decisión técnica pendiente de tu visto bueno

Los resultados del chequeo **no deberían ir a `src/content/results/`**. Esa
carpeta alimenta el tablero de la general de la temporada que se pinta en
`/noticias` (`buildStandings()` suma todos los archivos que encuentra, sin
filtrar por competencia). Hoy la carpeta está vacía; si se llena solo con el
chequeo —que no reparte puntos de Copa Valle— el sitio pintaría una "general
Temporada 2026" hecha únicamente con esta jornada.

Propuesta: los resultados del chequeo van en la **tabla de la noticia**
("Cómo terminó cada categoría"), y `src/content/results/` se reserva para las
válidas de Copa Valle.

## Agradecimientos: el muro de placas (6-sep, tras publicar)

La crónica cerraba con una línea suelta —«Gracias a las familias que se
inscribieron y a los corredores de Cali»— que no nombraba a nadie. Se
reemplaza por una sección propia, **«Las placas que no salieron a correr»**,
con una pieza nueva del formato v5 (`.thanks-wall`, CSS en `global.css`,
markup en `.claude/agents/content-marketer.md`): una pared de dorsales donde
el nombre va en el lugar del número. Modificador `--org` para los entes;
sin modificador, personas naturales.

**Las cinco placas publicadas son las que el material ya respalda**, ninguna
inventada:

| Placa                                        | Qué la respalda                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Escuela Olguita García (`--org`)             | Jorge Lasso, 3º de la Open, y las dos corredoras de `podio-menores-damas-b.webp`                         |
| Samuel Rodríguez, Felipe Maya y Germán Recio | Planilla de la Open: los tres figuran como Cali                                                          |
| La mesa de jueces                            | Las dos planillas manuscritas, con sus tachones                                                          |
| Los adultos del club                         | `podio-menores-mas-pequenos.webp` (micrófono) y `premiacion-mas-pequenos.webp` (dos adultos repartiendo) |
| Las familias del club                        | Inscripciones y los acompañantes a pie de `teteros-1758-circuito.webp` / `teteros-1706-circuito.webp`    |

**Falta la lista del club** (duda 10). Para cada agradecimiento hacen falta
tres cosas: **nombre** tal como debe publicarse, **rol** en la jornada (dos o
tres palabras, va en la placa) y **visto bueno** para publicarlo. De menores no
se publica ningún nombre. Caben **hasta ocho placas** en total: el escalonado
de la entrada llega hasta ahí, así que si la lista es más larga hay que
agrupar por rol o partirla en dos muros.

Dos que están a un dato de poder entrar:

- **Germán Recio acompañando a los menores** (`german-recio-acompana-menor.webp`).
  Si el club confirma que se quedó rodando con los chiquitos después de su
  vuelta, esa es una placa propia y no una línea compartida con los otros
  caleños.
- **Los entes**: hoy no hay ninguno más que la Escuela Olguita García. Si
  IMDERTY, la Alcaldía o algún patrocinador puso algo en esta jornada
  concreta, va con lo que puso; el patrocinio general del club no basta para
  aparecer en la crónica de un día.
