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
| Detalle de noticia (`/noticias/[slug]`) | ⬜ Pendiente |
| Trocha Verde | ⬜ Pendiente |

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
