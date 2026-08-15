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
| Detalle de programa (`/programas/[slug]`) | ⬜ Pendiente |
| Detalle de noticia (`/noticias/[slug]`) | ⬜ Pendiente |
| Trocha Verde | ⬜ Pendiente |
| Calendario | ⬜ Pendiente |
| Patrocinadores | ⬜ Pendiente |
| Testimonios | ⬜ Pendiente |

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

### Fechas: siempre en UTC

Las fechas del frontmatter se parsean como medianoche UTC y Colombia está en
UTC-5. Con los getters locales, una noticia del 1.º de marzo se archiva en
febrero. Todo cálculo de mes o día usa `getUTC*` y los formateadores llevan
`timeZone: 'UTC'` — igual que `formatDate()` en `utils.ts`.

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
  `gallery` y la cita, de `testimonials`: la página se actualiza sola cuando el club publica.

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
