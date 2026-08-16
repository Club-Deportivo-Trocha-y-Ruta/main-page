# 04 - Sistema editorial de secciones

> El punto único desde el que se rediseñan las secciones del sitio. Cuando una página se
> renueva, no se inventa un diseño nuevo: se traduce a este vocabulario.

---

## 1. Por qué existe

El sitio venía creciendo sección por sección: cada una con su propio fondo, su propio
titular centrado, su propia rejilla de tarjetas. El resultado era correcto y olvidable —
tres tarjetas iguales no cuentan que los programas son etapas encadenadas, ni que la
siembra de Trocha Verde lleva 77 árboles.

El sistema editorial define **una forma de contar** y la empaqueta en componentes. La
regla de fondo es una sola:

> Una sección no describe lo que hay. Muestra por qué importa, con un dato del contenido
> que lo respalde y un paso siguiente claro.

---

## 2. Anatomía de una sección

Toda sección se arma con las mismas cuatro piezas, en este orden:

| Pieza | Componente | Qué aporta |
|-------|-----------|------------|
| **Marco** | `SectionShell` | Fondo, aire vertical, ancho, textura |
| **Entrada narrativa** | `SectionIntro` | Antetítulo, titular con promesa, bajada |
| **Dato ilustrado** | `StatFigure`, `FactGrid`, ilustración propia | La prueba de lo que afirma el titular |
| **Paso siguiente** | `Button`, `InscriptionCTA`, enlace | Qué hace quien se convenció |

```astro
<SectionShell tone="muted" pattern="topo" width="wide" labelledby="programas-heading">
  <SectionIntro
    id="programas-heading"
    eyebrow="Programas"
    eyebrowIcon="ph:path-bold"
    title="Del primer equilibrio al primer podio"
    highlight="primer podio"
    lead="Tres etapas de una misma ruta…"
    align="center"
  />

  <ProgramPathway programs={pathwayInput} class="mt-10" />
  <!-- … tarjetas, cifras, ilustración … -->
</SectionShell>
```

### 2.1 El marco — `SectionShell`

| Prop | Valores | Notas |
|------|---------|-------|
| `tone` | `plain`, `muted`, `tinted`, `dark`, `brand` | Alterna `plain`/`muted` entre secciones seguidas |
| `pattern` | `none`, `topo` | Curvas de nivel. Úsalo en secciones de apertura, no en todas |
| `width` | `narrow`, `default`, `wide` | El marco siempre es de ancho completo |
| `spacing` | `none`, `compact`, `default`, `spacious` | |
| `labelledby` / `label` | id del titular / nombre | Una de las dos, siempre |

Los tokens de cada tono viven en `src/lib/editorial.ts`. **No se escriben clases de fondo
a mano en las secciones**: si hace falta un fondo nuevo, se agrega un tono.

### 2.2 La entrada — `SectionIntro`

- **Antetítulo**: de qué habla la sección. Una o dos palabras.
- **Titular**: qué gana quien lee, no cómo se llama la sección. `Nuestros Programas` es una
  etiqueta; `Del primer equilibrio al primer podio` es una promesa.
- `highlight`: el fragmento del titular que lleva el trazo lima. Uno por sección, sobre la
  parte que carga la promesa.
- **Bajada**: aterriza el titular con lo concreto (edades, horarios, cifras).

### 2.3 El dato ilustrado

Es lo que separa una sección informativa de una que convence, y tiene una regla dura:

> **Toda cifra sale del contenido.** Si el dato no existe, el bloque no se pinta.

`summarizePrograms()` devuelve `null` cuando ningún horario es legible, y la página omite
la cifra en vez de inventarla. Lo mismo aplica a cualquier sección nueva: se deriva de las
collections o de `src/lib/constants.ts`, nunca se escribe en la plantilla.

Ilustraciones disponibles en `src/lib/editorial.ts`:

- `elevationProfile()` — perfil de terreno que sube de izquierda a derecha. Sirve para
  cualquier progresión: edades, temporada, crecimiento de una siembra.
- `elevationPointAt()` — posición de un hito sobre ese perfil, en porcentaje.
- `TOPO_PATHS` / `TOPO_TILE` — curvas de nivel del patrón de fondo.
- `Timeline.astro` — recorrido vertical con sendero punteado y marcadores. El
  pariente vertical del perfil: sirve para historias y secuencias con fecha.
- `groupByMonth()` (`src/lib/news.ts`) — parte una colección con fecha en meses
  rotulados. Sirve para cualquier archivo que crezca con el tiempo.
- `SeasonTrack.astro` + `buildSeason()` — riel horizontal con una parada por
  fecha y la barra llena hasta donde va el año. Sirve para cualquier secuencia
  con un "vas aquí".

El SVG se estira con `preserveAspectRatio="none"`, así que **dentro del SVG no va texto ni
círculos**: los marcadores se dibujan en HTML encima del recuadro.

### 2.4 El paso siguiente

Ninguna sección termina en punto muerto. Enlace al detalle, CTA de inscripción o
WhatsApp — pero siempre algo.

---

## 3. Reglas que no se negocian

1. **Contraste antes que color.** El teal `#20b7c9` da 2.4:1 sobre blanco y el lima
   `#8be000`, 1.7:1: como **texto** sobre fondo claro van siempre los tonos `-deep`. Sobre
   fondos de color va texto grafito (`text-surface-dark`), salvo en `primary-deep`, que
   admite blanco. Los tokens `ink` de `LEVEL_STYLES` ya resuelven esto.
2. **Cero JavaScript nuevo.** Las ilustraciones son SVG generado en build. Si una sección
   necesita interactividad real, va a `src/components/interactive/` con `client:visible`.
3. **El texto visible sale del contenido.** Nada de copys en las plantillas: si falta un
   campo, se agrega al schema Zod, al `config.yml` de Sveltia y a los `.md`.
4. **Accesible por construcción.** `<section>` con `labelledby`, gráficos decorativos con
   `aria-hidden`, y el dato equivalente disponible como texto (enlaces con `aria-label`,
   `figcaption` en `sr-only`).
5. **Móvil primero de verdad.** Las etiquetas que no caben en un tramo estrecho no se
   encogen: se ocultan y se recuperan en la lista de abajo.

---

## 4. Cómo migrar una sección

1. Identifica la promesa: ¿qué gana quien lee esta sección?
2. Busca el dato que la respalda en las collections. Si no existe, no la afirmes.
3. Elige el marco (`tone` alternando con la sección anterior) y escribe la entrada.
4. Elige la ilustración: perfil de elevación, rejilla de cifras, o una propia si el tema lo
   pide (el mapa de Trocha Verde, por ejemplo).
5. Cierra con el paso siguiente.
6. Tests: la lógica derivada va a `src/lib/` con su test; el componente, a
   `__tests__/*.astro.test.ts` con el contenedor de Astro.

### Estado de la migración

| Sección / página | Estado |
|------------------|--------|
| Programas (portada + `/programas`) | ✅ Migrada — referencia del sistema |
| Quiénes somos (portada + `/quienes-somos`) | ✅ Migrada |
| Noticias (portada + `/noticias`) | ✅ Migrada |
| Calendario (portada + `/calendario`) | ✅ Migrada |
| Transparencia (`/transparencia`) | ✅ Migrada |
| Patrocinadores (portada + `/patrocinadores`) | ✅ Migrada |
| Inscripciones (`/inscripciones`) | ✅ Migrada |
| Detalle de programa (`/programas/[slug]`) | ✅ Migrada |
| Galería (`/galeria` + álbum) | ✅ Migrada |
| Detalle de noticia (`/noticias/[slug]`) | ⬜ Pendiente |
| Trocha Verde (portada + índice + especie + árbol) | ✅ Migrada |
| 404 (`/404`) | ✅ Migrada |
| Contacto (`/contacto`) | ✅ Migrada |
| Enlaces (`/enlaces`) | ✅ Migrada — marco propio, ver §18 |

---

## 5. Referencia de la sección de programas

Lo que hace de referencia, para copiar el patrón:

- **`ProgramPathway.astro`** — perfil de elevación + regla de edades. Los tramos salen de
  `ageMin`/`ageMax`: si el CMS cambia una edad, el dibujo cambia solo. Responde la primera
  pregunta de toda familia (*¿cuál le corresponde a mi hijo?*) sin hacerla leer tres
  fichas.
- **`countWeeklySessions()`** — lee el `schedule` en texto libre del CMS y cuenta días
  distintos, expandiendo rangos (`Lunes a viernes` → 5). Devuelve `null` si no reconoce
  ninguno.
- **`LEVEL_STYLES`** — la progresión de color acompaña la progresión deportiva: lima en el
  juego, teal en la formación, teal profundo en la competencia.
- **`summary`** (frontmatter) — la promesa de cada programa, editable desde Sveltia. Antes
  vivía como un objeto literal dentro de `ProgramsGrid.astro`, invisible para el club.

### Fechas: siempre en UTC, y "hoy" en la zona del club

Las fechas del frontmatter se parsean como medianoche UTC y Colombia está en
UTC-5. Con los getters locales, una noticia del 1.º de marzo se archiva en
febrero. Todo cálculo de mes o día usa `getUTC*` y los formateadores llevan
`timeZone: 'UTC'` — igual que `formatDate()` en `utils.ts`.

Cuando además hay que comparar con el presente, "hoy" se calcula en
`America/Bogota` (`clubToday()`): a las 2 a.m. UTC del día de la carrera, en
Colombia todavía es la víspera. Comparar días como texto `AAAA-MM-DD` evita
toda la aritmética de husos.

---

## 6. Referencia de Quiénes Somos

Tres movimientos que conviene repetir en las páginas que faltan:

- **Contenido que ya existía y no se veía.** La metodología de cada programa y el detalle de
  la póliza estaban en el frontmatter y en el cuerpo de los `.md` sin que ninguna página los
  mostrara. Antes de escribir texto nuevo, revisa qué hay sin usar en las collections.
- **Afirmar y dejar verificar.** La sección *Respaldo* no solo dice que hay póliza,
  entrenadores certificados o cuentas públicas: cada tarjeta enlaza a la página donde la
  familia puede comprobarlo. Una afirmación sin destino es una afirmación más débil.
- **Fotos vivas, no escogidas a mano.** La banda de comunidad sale de los últimos álbumes de
  `gallery`: la página se actualiza sola cuando el club publica.

---

## 7. Referencia de Noticias

- **Las noticias son la crónica de la temporada**, no avisos sueltos: la página
  abre con la última y ordena el archivo por mes, que es como se lee un año
  deportivo. `groupByMonth()` hace el corte; el rótulo del mes queda fijo al
  costado mientras se recorren sus crónicas.
- **`readingTime()`** deriva los minutos del cuerpo en markdown descontando HTML
  incrustado y URL. Devuelve `null` si no hay cuerpo, y la tarjeta omite el dato.
- **Respetar `imageLayout`.** Las portadas suelen ser afiches verticales de la
  válida: recortarlos a 16:9 se come el nombre de la carrera. Con `contain` la
  tarjeta muestra el afiche completo y rellena el sobrante con el mismo archivo
  desenfocado, que ya está en caché.
- **Ninguna imagen aporta alto propio.** Las `<img>` de las tarjetas van en
  absoluto dentro de un recuadro con proporción fija; si aportaran alto, un
  afiche vertical estiraría la fila entera hasta su tamaño natural.

---

## 8. Referencia del Calendario

- **Una temporada, no una lista de fechas.** `SeasonTrack` responde de un vistazo
  "¿en qué punto vamos?": paradas apagadas para lo corrido, lima para la que
  sigue y la barra llena hasta ahí. Cada parada enlaza al ancla de su fecha.
- **El estado se deriva, no se declara.** `resolveEventStatus()` lo calcula de la
  fecha; del frontmatter solo se respeta `cancelled`, que no se puede deducir.
  El campo manual se quedaba viejo: un evento del sábado pasado seguía
  anunciándose como próximo hasta que alguien editaba el archivo.
- **Las etiquetas del schema no son texto de interfaz.** `category` trae siglas
  (`xco`, `xcm`) y `status`, palabras en inglés. Se traducen en `@lib/calendar`.
  Antes las categorías de evento pasaban por `getCategoryLabel()` de utils, que
  traduce categorías de corredores, y salían crudas y en minúscula.
- **No rotules lo que el contexto ya dice.** Una tarjeta bajo "Ya corrido" no
  necesita un badge que diga "Corrido"; el estado solo se rotula cuando aporta
  (en curso, cancelado).

---

## 9. Referencia de Transparencia

- **Cada categoría explica antes de listar.** Este es el corazón de la página: los
  documentos no son una pila de PDF con nombres burocráticos ("ECF Club Trocha y
  Ruta 2024"), son la respuesta a una pregunta concreta de una familia. El mapa
  `DOCUMENT_CATEGORIES` (`src/lib/transparency.ts`) fija, por categoría, una frase
  —a qué pregunta responde—, un icono y un orden de lectura (de la pregunta más
  amplia, la plata, a la más granular, una firma de acta). `DocumentLedger.astro`
  pinta esa frase antes de la rejilla de fichas, nunca al revés.
- **Las cifras se derivan, nunca se escriben.** `summarizeDocuments()` calcula el
  total, las categorías presentes, la vigencia más reciente (`anio` máximo,
  ignorando `null`) y cuántos años distintos de estados financieros están
  publicados. Sin documentos con año, esos campos quedan en `null` y la página
  omite el `StatFigure` correspondiente — mismo contrato que `summarizePrograms()`
  o `summarizeNews()`.
- **El peso real se lee del disco en build, no en la librería.** `transparency.ts`
  se queda puro (igual que `calendar.ts` o `programs.ts`): ni importa el JSON ni
  toca `node:fs`. La página (`src/pages/transparencia/index.astro`) hace el
  `statSync` en su frontmatter —Astro corre en Node durante el build— y solo le
  pasa el número de bytes a `formatFileSize()`. Si un archivo no aparece bajo
  `public/`, el `try/catch` local deja `sizeLabel` en `null` y la ficha omite el
  peso en vez de romper el build. `formatFileSize()` usa base 1024 (KB/MB, como
  el resto de herramientas de archivos) con coma como separador decimal en el
  tramo de MB — el peso real del club va de 38 KB a ~14,8 MB, un contraste que
  vale la pena mostrar tal cual, sin inventar una cifra más "redonda".
- **Una categoría que el JSON no conoce no desaparece.** Si `categoria` trae un
  valor fuera de las cinco definidas, `getCategoryProfile()` cae en
  `FALLBACK_CATEGORY` (al final del orden de lectura) en vez de perder el
  documento silenciosamente. `groupByCategory()` es genérica sobre el tipo de
  documento para poder recibirlo con o sin `sizeLabel` ya resuelto.
- **El catálogo de analytics es cerrado: se preserva, no se reinterpreta.** Cada
  ficha conserva `data-analytics-event="transparencia_pdf_download"` y
  `data-analytics-pdf-name` exactamente como los lee `Analytics.astro`, más
  `download` y un `aria-label` que ahora incluye el tipo de archivo y el peso
  cuando se conoce.

---

## 10. Referencia de Patrocinadores

- **La evidencia pesa más que el adjetivo.** Un patrocinador no necesita que
  le digan "impulsamos el deporte juvenil": necesita saber dónde aparece su
  marca. `summarizeEvidence()` (`@lib/sponsors`) traduce tres collections
  ajenas a los sponsors —`events`, `news`, `trees`— en las cifras que
  responden esa pregunta: cuántas fechas corre el equipo en la temporada,
  cuántas crónicas se publican y cuántos árboles lleva sembrados Trocha
  Verde. Reutiliza `buildSeason()` de `@lib/calendar` para lo primero en vez
  de recalcular qué año es la temporada en curso.
- **La antigüedad es la prueba de permanencia que no se estaba mostrando.**
  `startDate` existía en el schema y en cada `.md` desde el principio, pero
  ninguna página lo leía. `sponsorSince()` lo convierte en "Con el club desde
  2020"; sin el dato, la tarjeta omite la antigüedad en vez de inventarla.
- **Los niveles son una progresión, no cuatro cajas iguales.**
  `SPONSOR_LEVELS` centraliza etiqueta (singular y plural), icono, jerarquía
  visual (`order`) y beneficios de cada nivel —los mismos beneficios que ya
  estaban redactados, nunca inventados de nuevo— y `SponsorshipTiers.astro`
  los pinta como una escalera que crece de proveedor a principal, igual que
  `ProgramPathway` convirtió tres programas sueltos en una ruta encadenada.
  El nivel principal cierra la fila y lleva el tratamiento visual más
  fuerte: es el que debe mandar sobre los demás.
- **Los aliados actuales se arman con dos reglas, no con lógica suelta en la
  plantilla.** `isPublishableSponsor()` es el filtro de publicación (sin
  `draft`, activo, sin logo placeholder) que antes vivía duplicado en
  `SponsorsBar` y en la página; `groupByLevel()` agrupa lo que pasa ese
  filtro en el orden jerárquico de `SPONSOR_LEVEL_ORDER` y omite el nivel que
  nadie ocupa —hoy no hay ningún `proveedor` real— en vez de dejar un
  encabezado de grupo sin tarjetas debajo.
- **Los logos son proporciones dispares, igual que los afiches de
  noticias.** Van en `object-contain` dentro de una caja de alto fijo y en
  posición absoluta, para que un logo vertical no estire la tarjeta hasta su
  tamaño natural.

---

## 11. Referencia de Inscripciones

- **El proceso como recorrido, no como aviso suelto.** La página traía una sola advertencia
  ("esto no es una inscripción confirmada") sin decir qué seguía ni cuánto demoraba.
  `EnrollmentSteps` envuelve `Timeline` y numera cada hito por su posición en
  `ENROLLMENT_STEPS` (`src/lib/enrollment.ts`), igual que la ruta de programas numera sus
  etapas: si se reordena un paso, la numeración visible y las referencias cruzadas ("es el
  paso 3 del proceso") se recalculan solas en vez de quedar sueltas en el texto.
- **La ruta de edades usa el mismo filtro que el formulario.** `ProgramPathway` ya resolvía
  "¿cuál le corresponde a mi hijo?" en `/programas`; aquí se alimenta con el mismo predicado
  (`!draft && active && enrollmentOpen`) que arma la lista de programas de `InscriptionForm`.
  Dibujar la regla de edades con un criterio distinto al que usa el paso 1 del formulario
  habría mostrado un programa que después no aparece como opción para elegir.
- **No todo dato "real" sale de una collection.** No hay ficha de contenido para "el seguro
  deportivo": es información fija que el club publica y que antes estaba dispersa en dos
  cajas de texto. `src/lib/enrollment.ts` la deja en constantes tipadas (`ENROLLMENT_POLICY`,
  `ENROLLMENT_DOCUMENTS`, `ENROLLMENT_STEPS`), con el mismo patrón que `EVENT_CATEGORIES` en
  `calendar.ts` o `LEVEL_STYLES` en `programs.ts`. La cobertura que no trae un tope en pesos
  ("Ambulancia para eventos") se marca como "Incluida en la póliza" en vez de inventarle un
  monto.
- **El FAQPage JSON-LD tiene que pintarse.** Las preguntas del `schema.org/FAQPage` no
  aparecían en ningún lado de la página; Google penaliza ese desacople. Ahora el mismo array
  `faqs` alimenta `generateFAQPageJsonLd()` y `FaqAccordion` (el mismo componente que ya usa
  `/preguntas-frecuentes`), así que lo que el buscador indexa es lo que la familia lee. Dos de
  las cinco respuestas (edad mínima, costo) interpolan el mismo dato que se ve en la ruta de
  edades y en la póliza — una sola fuente, no una cifra copiada dos veces.

---

## 12. Referencia del detalle de programa

- **El h1 es el nombre, la promesa vive en la bajada.** `SectionIntro` recibe
  `title={program.data.title}` — el nombre propio del programa, obligatorio en
  una página que se genera ×3 y que un lector de pantalla debe poder
  identificar sin ambigüedad — y `lead={program.data.summary ?? program.data.subtitle}`,
  el mismo par campo/`fallback` que `ProgramsGrid.astro` y `/programas` ya usan
  para la promesa redactada. Por eso `highlight` se omite a propósito: el
  nombre de un programa es un sustantivo propio, no una frase con un
  fragmento que "cargue la promesa" — forzar un highlight sobre `Alto
  Rendimiento` o `Escuela de Iniciación` habría sido decorar la marca, no
  resaltar una idea. El antetítulo sí hace ese trabajo: `Etapa {step} ·
  {level.label}` sale de `buildPathway()` + `LEVEL_STYLES`, nunca se escribe
  a mano.
- **La ruta se destaca a sí misma.** `ProgramPathway` ganó un prop opcional
  `activeId` — aditivo y retrocompatible: sin él, ninguna etapa se distingue y
  `/programas` renderiza exactamente igual que antes (tiene su propio test que
  lo comprueba). Con él, la etapa activa gana más grosor de trazo en el
  perfil, un anillo en su marcador y en su tramo de la regla de edades, y
  `aria-current="page"` en sus enlaces — nunca cambiando una clase que ya
  existía por otra (siempre una rama exclusiva por ternario), para no
  depender del orden en que Tailwind genera las utilidades. La página de
  detalle es la primera en pasarlo: `<ProgramPathway programs={pathwayInput}
  activeId={program.id} legend />`.
- **Un programa nunca es un callejón sin salida.** `getAdjacentPrograms()`
  (`@lib/programs`) ordena por `ageMin` — el mismo criterio que
  `buildPathway()` — y devuelve el vecino anterior y siguiente, o `null` en el
  extremo que no exista. `ProgramAdjacentNav.astro` lo pinta como dos enlaces
  al cierre de la página: quien cayó en `Escuela de Iniciación` con un hijo de
  8 años sigue directo a `Formación Juvenil` en vez de devolverse al índice.
- **La frecuencia antes que el horario minuto a minuto.** `countWeeklySessions()`
  ya sabía traducir un `schedule` en texto libre a "N sesiones por semana";
  ahora encabeza las cifras del programa (`StatFigure`, junto a edades,
  duración y cupos) porque es la pregunta que un papá hace primero. El
  `schedule` completo —con días y horas— no desaparece: baja a `FactGrid`,
  junto a dónde entrena y la mensualidad, para quien ya decidió y necesita el
  detalle operativo.
- **Una sola fuente para el seguro.** La página ya no escribe "$60.000/año" ni
  el nombre de la aseguradora a mano: los lee de `ENROLLMENT_POLICY`
  (`@lib/enrollment`), la misma constante que alimenta `/inscripciones`, y
  enlaza a `/inscripciones#seguro-titulo` para la cobertura completa en vez de
  repetir las seis coberturas en las tres páginas de programa. Si el club
  renueva la póliza, se edita un solo archivo.
- **`methodology` y `maxStudents` ya existían y no se veían.** Los tres `.md`
  de `programs` traían la metodología de entrenamiento y el cupo del grupo
  desde que se migró el contenido; ninguna página los mostraba. `methodology`
  se pinta en un bloque "Cómo se entrena" con el color de la etapa (mismo
  tratamiento que ya usa el spread de `/programas`, sin reinventarlo);
  `maxStudents` entra a las cifras de cabecera como "Cupos por grupo".
- **Objetivos, requisitos y equipamiento comparten un solo vocabulario.** Las
  tres listas usan el mismo icono (`ph:check-circle-fill`, teñido con
  `level.text`) en vez de los `&#8226;`/`&#10003;` sueltos que traía la
  versión anterior — una lista de "qué se lleva", "qué hay que traer" y "qué
  hay que llevar puesto" se lee como tres variaciones del mismo gesto
  (marcar una casilla), no como tres widgets distintos.
- **El cuerpo markdown fija el nivel de los encabezados propios de la
  página.** Los tres `.md` de `programs` arrancan su primer encabezado en
  `##`; por eso ningún encabezado que la plantilla agrega antes de
  `<Content />` baja a `h3` — la ruta, la ficha y el cierre (vía el `h2`
  interno de `InscriptionCTA`) se quedan todos en `h2`, hermanos de los que
  trae el markdown, para que la jerarquía no salte.

---

## 13. Referencia de Trocha Verde

- **El corazón de la página es una frase, no una lista de logros.** El club tiene algo
  que ninguna otra iniciativa ambiental de la región tiene: las llantas que gasta
  entrenando terminan protegiendo los árboles que siembra. 71 de 77 árboles crecen dentro
  de una llanta de bicicleta reciclada — 72 de 77 si se cuenta también la única llanta de
  moto. El `h1` abre con esa idea (`highlight` sobre "protegen los árboles que
  sembramos") y el `StatFigure` de "Protegidos con llanta reciclada" la respalda con la
  cifra real de `summarizeRecycling()`. Antes esto se mencionaba de pasada, en un párrafo
  de tres frases junto a otras dos ideas.
- **El ritmo de siembra es la pieza ilustrativa central, no un adorno.** 77 árboles en
  nueve semanas es una campaña, no un goteo — y ese es literalmente el titular que va
  encima del gráfico. `TrochaVerdeTimeline` (ya existía, sin conectar a ninguna página)
  dibuja una escalera acumulada a partir de `buildPlantingTimeline()`, con una parada por
  jornada real de siembra y el eje X respetando el tiempo transcurrido de verdad — dos
  jornadas separadas por dos semanas quedan dos veces más lejos que dos separadas por una.
  Vive dentro del mismo `SectionShell` del hero, igual que `ProgramPathway` en
  `/programas` o `SeasonTrack` en `/calendario`: la ilustración central acompaña la
  entrada, no una sección aparte.
- **El mapa deja de mentir sobre lo que muestra.** Con 2 de 77 árboles geolocalizados,
  montar Leaflet completo (el island más pesado del sitio) para pintar dos alfileres
  sueltos no representaba el inventario y le costaba peso a todo el que visitaba la
  página. `checkMapReadiness()` fija el corte en `MIN_GEOLOCATED_TREES_FOR_MAP` (20) y la
  sección `#mapa` sigue existiendo — la navegación interna sigue resolviendo — pero deja
  de renderizar `<TrochaVerdeMap client:visible>` y en su lugar dice cuántos árboles de
  los 77 ya tienen ubicación. Cuando el club geolocalice más árboles y cruce el umbral, el
  mapa se activa solo, sin tocar la plantilla.
- **La composición del bosque se muestra proporcional, no como cuatro números sueltos.**
  `buildCategoryComposition()` ya existía y no se pintaba en ningún lado. El nuevo
  componente `TrochaVerdeComposition` la traduce en una barra apilada con leyenda —36
  ornamental, 22 frutal, 17 nativo, 2 maderable— usando los mismos tonos de
  `categoryColors` (`@lib/tree-utils`) que ya usan las tarjetas de especie y de árbol, así
  que "ornamental" es el mismo morado en la barra, en el chip y en el mapa cuando exista.
- **Los padrinos pasan de estar solo en cada ficha individual a tener su propia
  sección.** 60 de los 77 árboles tienen un donante nombrado en el frontmatter, pero
  ninguna vista anterior lo agregaba: solo se veía uno por uno, ficha por ficha.
  `summarizeDonors()` agrupa esos 60 en las 7 familias y aliados reales del club (de 1 a
  27 árboles cada uno) y la sección nueva los lista con `FactGrid` — la cifra ("Apadrinó
  27 árboles") como etiqueta y el nombre como el dato que responde.
- **Cuatro `aria-labelledby` que apuntaban a ids inexistentes ya resuelven.** El defecto
  era estructural: `SectionTitle` (el componente que usaba la página antes de migrar)
  nunca exponía el id de su propio `h2` hacia afuera, así que `aria-labelledby` en
  "especies", "mapa", "proceso" y "transformación" apuntaba a nada. Al pasar a
  `SectionShell` + `SectionIntro`, cada sección declara su propio `id` de titular
  (`especies-titulo`, `mapa-titulo`, `proceso-titulo`, `transformacion-titulo`) y
  `SectionShell` lo referencia con `labelledby` — el mismo par de props que ya usan
  `/programas` y `/trocha-verde/[species]`.
- **Lo que ya funcionaba se conserva sin reescribirlo.** La navegación interna por anclas
  (`TrochaVerdeNav`), las siembras agrupadas por jornada (`TrochaVerdeSiembras`, con su
  exclusión temporal del Día de la Tierra mientras se cura ese contenido aparte), el
  bloque de apadrinamiento corporativo (`TrochaVerdeSponsors`) y el antes/después de la
  carretilla reciclada siguen siendo los mismos componentes y las mismas dos imágenes con
  `astro:assets` — solo cambian de marco (`SectionShell`) y de paleta de foco
  (`primary-deep` en vez de `emerald-700` suelto) para hablar el mismo idioma que el resto
  del sistema.
- **Sin CO₂ ni área, con test que lo fija.** `@lib/trocha-verde` nunca calculó esas dos
  cifras — `co2EstimateKg` está vacío en los 77 árboles y el "área" se inventaba a partir
  del protector — y un test de guarda (`sin CO2 ni área estimada en todo el módulo`)
  falla si alguien las reintroduce sin querer.

---

## 14. Referencia de los detalles de Trocha Verde

- **Las dos fichas de detalle —especie (`/trocha-verde/[species]`) y árbol
  (`/trocha-verde/arboles/[slug]`)— son hermanas y comparten protagonista.**
  Cada una abre con el mismo hero (nombre, foto, cifras que respaldan el
  titular) y cierra con el mismo paso siguiente (recorrer el inventario o
  apadrinar), porque en el fondo cuentan la misma historia a dos escalas: la
  especie es el bosque, el árbol es cada ejemplar con su propia fecha y, 60
  de las veces, su propia familia. Los mapas y helpers de los que dependen
  ambas viven en `@lib/tree-utils` (`categoryLabels`/`categoryColors`,
  `statusLabels`/`statusColors`, el protector, el tiempo transcurrido y la
  concordancia de género): cualquier cambio ahí es aditivo o rompe las dos
  páginas a la vez.
- **El id de un árbol y el id de su especie no siempre coinciden, y
  `findSpeciesForTree()`/`treesOfSpecies()` resuelven eso por nombre común,
  no por slug.** El archivo real es `species/lengua-suegra.md`, pero sus
  cuatro árboles traen `species: "Lengua de suegra"` (que slugifica a
  `lengua-de-suegra`, un id distinto). Comparar `slugify(commonName)` en vez
  del id del archivo hace que el emparejamiento sea resistente a esa
  diferencia. Cuando ni así aparece una especie —hoy pasa con "Abano", sin
  `species/abano.md`—, la ficha del árbol no inventa el enlace: muestra el
  nombre en texto plano y omite tanto el breadcrumb enlazado como el botón
  "Ver toda la especie", en vez de apuntar a una ruta que el build nunca
  genera.
- **"Cuánto lleva vivo" es el dato que abre la ficha del árbol, no la fecha
  de siembra sola.** `timeSincePlanted()` la convierte en la unidad más
  legible para su edad (días, semanas, meses, años) reutilizando
  `daysSincePlanted()`, que sigue la misma precaución de husos que ya
  documenta `calendar.ts`: `plantedDate` se parsea en UTC y "hoy" se calcula
  en `America/Bogota` vía `clubToday()`. La fecha exacta no desaparece —baja
  a la letra menuda del `StatFigure` ("Sembrado el…")— pero el titular es la
  frase viva ("Lleva 5 meses creciendo…"), no el registro.
- **El protector se explica dos veces con dos propósitos distintos:
  `protectorDescription()` dice *qué* es (con el color exacto cuando el
  contenido lo trae, "Llanta rosada"; genérico si no) y `protectorStory()`
  dice *por qué* importa** — el hilo central de la iniciativa: 76 de los 77
  protectores de hoy son una llanta que el club deja de usar en los
  entrenamientos, no algo comprado. La ficha del árbol combina ambas frases
  en un mismo párrafo en vez de dejar la explicación solo en una cifra
  suelta, porque es el corazón de por qué existe Trocha Verde.
- **Dos campos del schema de `trees` nunca se pintan, a propósito:
  `co2EstimateKg` y `heightEstimateM` están vacíos en los 77 árboles reales**
  (se calculaban antes con constantes inventadas, no con mediciones del
  club) y el sistema editorial los deja fuera de las dos fichas de detalle
  por la misma regla que ya aplican `trocha-verde.ts` y `[species].astro`: si
  el dato no existe, el bloque no se pinta. Si el club llega a medir CO₂ o
  altura algún día, los campos ya existen en `treesSchema` — no hace falta
  tocar el schema, solo dejar de omitir el bloque.
- **`treeDisplayLabel()` reemplaza el número que antes se leía con una regex
  sobre el id del archivo (`tree.id.match(/-(\d+)$/)`) por la posición real
  dentro de `speciesTrees`, ya ordenada por el campo `order` del CMS.** Con
  un solo árbol de la especie no numera ("Ceiba"); con varios, numera según
  el orden que cura el club ("Mango 3"), el mismo orden en que aparece en la
  rejilla de `[species].astro` y en la rejilla de hermanos de la ficha del
  árbol — el número de una ficha siempre coincide con su posición en ambas
  páginas.
- **La ficha del árbol no repite el inventario completo de su especie: cierra
  con hasta seis árboles hermanos (`TreeCard`, el mismo componente que usa la
  rejilla de la especie) y, si hay más, un enlace "Ver los N…" a
  `/trocha-verde/[species]` para el inventario completo.** Es el mismo
  patrón de "paso siguiente" que ya usa el detalle de programa
  (`ProgramAdjacentNav`): la ficha de un árbol no es un callejón sin salida,
  pero tampoco intenta ser la página de la especie.
- **El breadcrumb visual y el JSON-LD de ambas páginas conviven sin
  compartir mecanismo, como ya hace `trocha-verde/index.astro`.**
  `[species].astro` y la ficha del árbol usan `Breadcrumb.astro` para la
  navegación visible (que emite su propio `BreadcrumbList`), y la ficha del
  árbol además pasa `generateBreadcrumbJsonLd()` (`@lib/seo`) por el prop
  `jsonLd` de `BaseLayout` — el mismo mecanismo que ya traía la versión
  anterior de la página, preservado a propósito en vez de reemplazado.

---

## 15. Referencia de Galería

- **La jerarquía sale de dos señales reales, no de una elegida a dedo.**
  `selectFeaturedAlbum()` respeta primero la curación manual del club (`featured:
  true`, hoy solo en la V válida de Palmira) y, si ningún álbum la trae —o si hay
  más de uno—, cae en el álbum con más fotos. Con los datos reales las dos
  señales no coinciden: Ginebra tiene 45 fotos, el doble que cualquier otro
  álbum, pero no está marcado destacado. Gana la curación manual, y por eso es
  Palmira —con 27 fotos— quien abre la portada, con el resto de la temporada en
  una rejilla secundaria detrás.
- **El hilo álbum → evento → crónica estaba en el contenido y no se usaba en
  ninguna dirección.** `resolveAlbumContext()` (`@lib/gallery`) resuelve
  `relatedEvent` contra la colección `events` y cruza las dos direcciones de la
  relación evento↔noticia —mismo patrón que ya resolvía `chroniclesOf()` en
  `/calendario`— para reunir las crónicas publicadas de ese evento.
  `AlbumEventContext.astro` pinta ese bloque una sola vez y lo reutilizan tanto
  la tarjeta del álbum destacado en `/galeria` como la cabecera de cada álbum:
  es el mismo componente, no una copia con otro nombre.
- **Una referencia rota se omite, no se disimula ni se repara en la
  plantilla.** El álbum más grande de los siete (Copa Valle Ginebra, 45 fotos)
  trae `relatedEvent: "2026-copa-valle-ginebra"`, un id que no existe en la
  colección `events` —el real es `2026-02-copa-valle-ii-ginebra`— y la noticia
  de esa misma válida arrastra exactamente el mismo error en su propio
  `relatedEvent`. `findEventForAlbum()` no intenta adivinar por fecha ni por
  título: si el id no aparece, devuelve `null` y todo el bloque de contexto
  desaparece, tanto en la portada como en el detalle del álbum, aunque el
  evento y su crónica sí existan en el sitio bajo otro id.
- **Cuatro categorías definidas, una sola usada — a propósito.** Los siete
  álbumes reales son los siete `competencia`; un filtro o una agrupación por
  categoría hoy sería una fila de un solo elemento, así que la interfaz no lo
  ofrece. `GALLERY_CATEGORIES` (`@lib/gallery`) define igual las cuatro del
  schema, con el mismo par de tonos teal/lima que ya usan `EVENT_CATEGORIES` y
  `NEWS_CATEGORIES`, lista para cuando el club publique la primera jornada
  social o de entrenamiento sin tener que tocar la plantilla.
- **El periodo cubierto reutiliza el cálculo de "Noticias", no lo repite.**
  `summarizeGallery()` importa `monthKey()`/`monthLabel()` de `@lib/news` para
  el mismo criterio de "mismo mes", "mismo año" o "años distintos" que ya usa
  `summarizeNews()` — igual que `sponsors.ts` reutiliza `buildSeason()` de
  `calendar.ts` en vez de recalcular qué año es la temporada en curso. Con los
  siete álbumes reales el resultado es "marzo – agosto 2026".
- **La portada del álbum es tan dispar como los afiches de noticias, y la
  solución es la misma.** `object-cover` dentro de una caja de alto fijo
  (`aspect-video`) con la imagen en posición absoluta — la resolvió primero
  `NewsCard.astro`; `AlbumCard.astro` la reutiliza en sus dos tallas (`featured`
  y `default`) en vez de reinventarla. La insignia de conteo (`bg-black/60`) ya
  existía en la rejilla anterior, pero escribía "N fotos" a mano y siempre en
  plural; `photoCountLabel()` ahora distingue "1 foto" de "45 fotos".
- **El detalle separa cifras de relaciones: `StatFigure` no lleva enlaces.**
  La cabecera del álbum muestra fotos y fecha como `StatFigure` (el dato) y
  reserva `AlbumEventContext` —con enlaces reales a `/calendario` y
  `/noticias`— para lo que sí se puede seguir. El island `ImageLightbox` sigue
  exactamente igual (`client:visible`, misma forma de `images`): como no admite
  fecha, evento ni crónica, ese contexto se resuelve y se pinta antes de la
  parrilla de fotos, nunca dentro del island. Los siete álbumes reales tienen el
  cuerpo markdown vacío, así que el bloque "Notas adicionales" —nombrado igual
  que el campo `body` en Sveltia— no se pinta hoy, pero queda listo para el día
  en que el club escriba algo ahí.

---

## 16. Referencia del 404

**Qué cambió.** La página era un callejón sin salida: un emoji, un titular y un
botón a la portada. Ahora es una señal de ruta — quien se pierde en un sendero
no necesita que le digan "te perdiste", necesita el siguiente punto de control.

**Estructura.**

| Sección | `tone` | Qué muestra |
|---------|--------|-------------|
| Señal de ruta | `tinted` + `topo` | `h1` y la ilustración del perfil |
| Puntos de control | `plain` | Las cuatro entradas reales del sitio |
| Enlace roto | `muted` | A quién avisarle si la página debería existir |

**La ilustración.** Reutiliza `elevationProfile()` y `elevationPointAt()` de
`@lib/editorial` —las mismas piezas que dibujan la ruta de programas—: el
terreno se pinta apagado, un ciclista queda fuera de la traza unido a ella por
una línea punteada, y el tramo que lleva de vuelta va resaltado en lima hasta
el marcador «Inicio», que es un enlace real y no un adorno. Cero JS: SVG
generado en build, con el detalle narrado en un `figcaption` en `sr-only`.

**Los datos.** `buildControlPoints()` (`@lib/not-found`) arma los cuatro puntos
reutilizando derivaciones que ya existían —`buildSeason()`, `summarizePrograms()`,
`ENROLLMENT_STEPS`— para que el 404 nunca contradiga a `/calendario` ni a
`/programas`. Cada punto lleva un dato del contenido: la próxima fecha con su
ciudad, la última crónica con su fecha, cuántos programas y desde qué edad, y
el primer paso de la inscripción.

**La regla, aquí.** Un punto de control nunca desaparece; lo que desaparece es
su dato. Sin próxima fecha, la tarjeta de calendario se pinta igual con
`fact: null`, y `FactGrid` no dibuja nada — nunca un "próximamente" inventado.

---

## 17. Referencia de Contacto

**Qué cambió.** La página asumía que ya sabías qué querías: soltaba un
formulario al lado de una lista de datos. Y anunciaba, escrito a mano en la
plantilla, un horario que **contradecía la colección `programs`**: decía
"Lunes a Viernes 3:00 PM - 7:00 PM · Sábados 7:00 AM - 12:00 PM" cuando entre
semana se entrena de 4 a 6, el sábado hasta las 9, y los domingos —que sí hay
entrenamiento— no aparecían por ningún lado. Ese bloque se eliminó.

**Estructura.**

| Sección | `tone` | Qué muestra |
|---------|--------|-------------|
| Elige canal | `tinted` + `topo` | `h1` y las cuatro vías de contacto |
| Formulario | `plain` | `ContactForm` + los datos directos |
| La semana del club | `muted` | El ritmo real de entrenamiento |
| Dónde | `plain` | Mapa y el lugar de cada programa |
| Antes de escribir | `tinted` | Las FAQ que aplican, con su JSON-LD |

**Los canales.** `CONTACT_CHANNELS` (`@lib/contact`) es vocabulario editorial,
como `DOCUMENT_CATEGORIES` o `ENROLLMENT_STEPS`: cada canal dice para qué sirve
y **qué tener a mano** antes de usarlo, para que la primera respuesta ya sirva.
Dos de los cuatro son anclas a esta misma página (`#escribir`, `#donde`): quien
no sabe por dónde empezar no tiene que salir del sitio para averiguarlo.

**La semana.** El centro de la página. `buildWeekRhythm()` parte de
`parseSchedule()` (`@lib/programs`), que descompone el texto libre del CMS en
sesiones con día, franja y aclaración. Se pinta dos veces:

- **La rejilla mañana/tarde × siete días** es la ilustración, y va
  `aria-hidden`. Dibuja la forma de la semana de un vistazo —tardes entre
  semana, mañanas el fin de semana— con la intensidad de cada celda marcando
  cuántos programas coinciden (el martes es el día más cargado: tres a la vez).
- **Las filas por día** son el contenido accesible, y el que funciona a 320px.

La `note` de cada tramo ("salida", "gymkanas en pista") se muestra: dice *qué*
se hace ese día, no solo a qué hora.

**La regla, aquí.** Un horario que el parser no entienda **no se descarta**:
cae en `rhythm.unreadable` y se pinta con su texto original. Nada se inventa y
nada desaparece en silencio. Tampoco se promete un tiempo de respuesta: no hay
dato que lo respalde.

**Lo que se dejó fuera.** El bloque de FAQ excluye a propósito las categorías
`entrenamiento` y las preguntas de ubicación: la página ya las responde arriba,
con la semana y el mapa. El JSON-LD declara exactamente las preguntas visibles.

---

## 18. Referencia de Enlaces

**Esta página vive fuera del marco editorial, a propósito.** `/enlaces` es el
linktree del QR impreso en afiches, camisetas y el pendón del club: no es una
sección del sitio, va con `noindex` y fuera del sitemap, y su marco es
`LinktreeLayout` —fondo oscuro, tarjetas apiladas, ancho de móvil—. No usa
`SectionShell` ni `SectionIntro`, y no debe usarlos: el formato linktree es el
correcto para lo que hace. Lo que sí sigue del sistema es la regla de fondo —
**todo dato sale del contenido**—, que es justo lo que le faltaba.

**Qué cambió.** Las cifras de cabecera estaban escritas a mano, y una de las
tres —"Yumbo / Valle del Cauca"— ni siquiera era una cifra: era la dirección
repetida del pie de página. Ahora salen de `linktreeStats()`: años cumplidos
del club (`getYearsActive()`), corredores formados (`CLUB_STATS`) y árboles
sembrados (`summarizeTrees()`).

**Lo que se agregó.** El bloque de más valor y el que no existía: **la próxima
carrera**. Quien escanea ese QR está de pie en una competencia con treinta
segundos, y lo más útil es cuándo es la siguiente. `nextRace()` sale de
`buildSeason()` —la misma derivación de `/calendario`, para que no se
contradigan— y trae día, mes, ciudad y si la carrera **es hoy**, caso en el que
la tarjeta cambia a lima y lo dice. La descripción del enlace al calendario
cuenta además en qué punto va el año (`seasonProgress()`).

**La regla, aquí.** Sin próxima fecha, el bloque no se pinta: nada de
"próximamente". Una cifra que no se pueda calcular se cae y quedan las demás —
la rejilla se ajusta al número de cifras que sobrevivan.

**Lo que no se toca.** El orden de prioridad (WhatsApp primero, preinscripción
después), los parámetros UTM de `withUtm()` en todos los enlaces internos —así
GA4 atribuye los escaneos offline—, los `aria-label` de las redes y el
`noindex`. La página sigue enviando **cero JavaScript**.
