# Plan — VII válida Copa Valle, Yumbo (18 de octubre de 2026)

> Generado el 29 de agosto de 2026 mediante ideación multi-agente (4 lentes + 2 críticos + síntesis).
> Objetivo definido por el club: **servir al visitante foráneo**. Presupuesto: 1 island React (no gastada).
> Todas las afirmaciones sobre el repo fueron verificadas contra el código.


## 1. La apuesta

Construimos **la página que el corredor y el padre de otro club buscan la semana anterior y no encuentran en ninguna parte**: una URL propia para la VII válida con fecha, sede, circuito, categorías, cómo llegar, dónde parquear y dónde ver, más el enlace instrumentado a la inscripción oficial de la Comisión. Gana porque hoy ese contenido ya existe —está escrito en el frontmatter de `src/content/events/2026-10-copa-valle-vii-yumbo.md`— y ninguna página del sitio lo renderiza: el evento vive como un `<article id="evento-...">` dentro de `/calendario`, sin URL, sin JSON-LD `SportsEvent` y sin medición individual. La variable que decide el resultado no es la calidad de la página sino **la fecha de publicación**: con 2 backlinks y 81 impresiones de ciclismo en tres meses, una URL nueva necesita semanas para rastrearse e indexarse, así que todo lo que quiera tráfico orgánico el 18 de octubre tiene que estar en producción antes del **sábado 12 de septiembre**.

Sobrevive al 18 de octubre por tres mecanismos, no por buena voluntad: la ruta `/calendario/[slug]` le da URL propia a las diez válidas ya publicadas y a todas las de 2027; `/la-pista` describe **un lugar** —la Pista Carlos Castro, con 230 reseñas acumuladas en una ficha de Google sin reclamar— y no una fecha; y el estado de la temporada sale siempre de `resolveEventStatus()`/`buildSeason()`, nunca de una frase escrita a mano, así que la página no puede quedar desmentida si Roldanillo se reagenda.

---

## 2. Las 5 ideas ganadoras

### 1. La válida por fin tiene URL

**Qué es** — La ruta de detalle de evento que el sitio nunca tuvo: `src/pages/calendario/[slug].astro`, con la VII válida en `/calendario/copa-valle-yumbo-2026`. Cabecera, ficha de datos duros (fecha, sede, circuito 3,8 km, 24 categorías, inscripción $70.000 / $50.000 teteros, cupos 350, cierre 15-oct), bloque de estado de la Copa Valle derivado del contenido, CTA instrumentado hacia la inscripción oficial, botones de agendar y compartir, y `SportsEvent` en JSON-LD. Es el chasis: las cuatro ideas siguientes son secciones o vecinas de esta página.

**Para quién** — Corredor y padre foráneo del Valle que busca «copa valle yumbo 18 de octubre», «válida copa valle yumbo inscripciones» o «copa valle xco 2026 calendario». Secundariamente prensa y la Comisión Vallecaucana, que hoy no tienen ninguna URL nuestra que citar.

**Por qué gana** — Es la única pieza que no depende de ningún insumo externo: todo lo que necesita ya está escrito en el `.md`. Cubre nueve de las veinticinco consultas del visitante foráneo que hoy el sitio no responde. Y es infraestructura: `generateEventJsonLd()` existe en `src/lib/seo.ts` y hoy solo se ejecuta en un test.

**Cómo se construye**
- **Paso 0, hoy mismo**: el cuerpo de `src/content/events/2026-10-copa-valle-vii-yumbo.md` dice literalmente «Séptima y **última** válida de la Copa Valle». Eso ya está publicado y es exactamente lo que no se puede afirmar. Cambiar a «Séptima válida». Es una palabra y bloquea todo lo demás.
- `src/pages/calendario/[slug].astro` nueva, con `getStaticPaths()` sobre `getCollection('events')` filtrando `draft`. Armada con `SectionShell` + `SectionIntro` + `Breadcrumb` + `FactGrid` + `StatFigure` + `AddToCalendar` + `ShareButtons`, todos existentes.
- `eventsSchema` (`src/lib/schemas.ts:136-175`) gana campos **opcionales**: `slug`, `circuit: {distanceKm, laps?, surface?}`, `categories: [{name, group, ageMin?, ageMax?, laps?}]`, `updatedAt`. Espejar en `public/admin/config.yml` y en el `.md` — la regla de los tres sitios. El bloque de categorías solo se pinta si el campo existe.
- Rellenar `mapUrl` y `registrationUrl` en el `.md`. **Ojo**: `src/pages/calendario.astro:203-221` ya pinta los botones «Cómo llegar» e «Inscríbete» cuando esos campos existen, **sin instrumentar y sin UTM** — si se llenan antes del arnés de medición (§6), se despliegan dos CTA salientes ciegos.
- Cambiar `generateEventsListJsonLd()` en `calendario.astro` para que cada ítem apunte al detalle en vez de a la lista, y que las tarjetas enlacen al detalle en vez del ancla `#evento-{id}`.
- Envolver `<Content />` en `.prose` (mismo patrón de `src/pages/noticias/[...slug].astro`), porque el mapa del circuito de la idea 3 vive ahí.
- Bloque «Cómo va la Copa Valle» con `buildSeason()`/`cancelledAhead()` de `src/lib/calendar.ts` — la VI válida aparece como cancelada, sin reprogramación anunciada, y la página nunca dice «final».
- `<ScrollDepth target="main" />` desde el primer despliegue.
- `data-analytics-event="race_registration_outbound"` en el CTA saliente, con `withUtm()` de `src/lib/utm.ts` (`source: 'clubtrochayruta'`, `campaign: 'copa-valle-yumbo-2026'`). El JSON-LD recibe la URL limpia; el anchor la lleva con UTM.
- `seo.ogImage` con una imagen real: hoy `image` es `/images/placeholder-event.jpg` y una URL compartida en WhatsApp sale sin previsualización.

**Insumos que debe dar el club** — URL exacta de inscripción en ciclomontañismovalle.com (dominio punycode `xn--ciclomontaismovalle-43b.com`); foto real de la pista en horizontal para `image`/`og:image`; confirmación de que 3,8 km / 24 categorías / 350 cupos / $70.000-$50.000 siguen vigentes tras la cancelación de Roldanillo.

**Medición GA4** — `race_registration_outbound` (sin params); `race_calendar_add` (sin params); `scroll_depth` (`depth`). Umbral: ≥10 usuarios con `race_registration_outbound` entre el 12 de septiembre y el 15 de octubre (piso), ≥25 (objetivo).

**Esfuerzo** — Medio (1½–2 días).

**Fecha de corte** — **Viernes 11 de septiembre en producción.** Es la única fecha realmente dura del plan. Publicar el 1 de octubre significa que la página existe pero no rankea el 18.

---

### 2. Una sola coordenada, y que Google sepa dónde queda la pista

**Qué es** — Dos movimientos que son el mismo problema. Dentro del repo: unificar las **tres** coordenadas contradictorias que hoy conviven (`src/lib/seo.ts:258` = 3.5965919/-76.4855763, `src/lib/seo.ts:606` = 3.4572/-76.495 —unos 16 km de diferencia—, `src/components/interactive/TrochaVerdeMap.tsx:143` = 3.598056/-76.484944) en una constante `TRACK` en `src/lib/constants.ts`, blindada con test. Fuera del repo: **empezar el 1 de septiembre el trámite de la ficha de Google** del club y la gestión de la ficha del lugar. Encima de esa base, el bloque logístico de la página: dirección, botones a Google Maps y Waze, tiempos de viaje verificados desde las ciudades de donde vienen los clubes, parqueo y dónde ver la carrera.

**Para quién** — El adulto que conduce de madrugada desde Cali, Palmira, Buga, Sevilla o Ginebra, y el acompañante que llega con una nevera y un niño a un sitio que no conoce. Y todo el que el 18 de octubre escriba «Pista Carlos Castro» en Maps, que es donde de verdad va a buscar.

**Por qué gana** — El clic a navegación es la mejor señal de intención de viaje que existe sin geolocalizar a nadie: quien vive en Yumbo no pide indicaciones a una pista que tiene a diez minutos. Y la ficha del lugar acumula 4,3★ con 230 reseñas que hoy no son de nadie: probablemente mueve más gente el 18 de octubre que cualquier página que escribamos. La coherencia NAP es el prerrequisito silencioso de las dos cosas.

**Cómo se construye**
- `TRACK` en `src/lib/constants.ts` con `name`, `address`, `lat`, `lng`, `mapUrl` y `mapEmbed`. La pista correcta es la de `CONTACT.mapEmbed`, que ya apunta literalmente a «Pista de Ciclomontañismo "Carlos Castro"» en 3.5965919/-76.4855763 y coincide con `seo.ts:258`. `CONTACT.mapUrl` es la dirección del club (CL 8 Norte 2 N° 55), no la pista: son dos lugares distintos y no se pueden mezclar.
- Reemplazar los tres pares hardcodeados; `TrochaVerdeMap.tsx` recibe el centro por prop. Test en `src/lib/__tests__/seo.test.ts` que falle si aparece un par distinto de `TRACK`.
- Sección «Cómo llegar y dónde verla» en la página de la válida: `SectionShell` + `SectionIntro` + `FactGrid`, anchors a `google.com/maps/dir/?api=1&destination=<lat,lng>` y `waze.com/ul?ll=<lat,lng>&navigate=yes`, cada uno con `data-analytics-event="race_directions_click"` y `data-analytics-content-id` (`google-maps` | `waze` | `parqueo`). Nada de Google Maps JS API: la CSP de `public/.htaccess` permite el iframe de embed pero no la API, y no hace falta tocarla.
- Tabla de tiempos de viaje como `FactGrid`, **cada fila con su fuente y fecha de consulta** («sin tráfico, según Google Maps el DD-MM»).
- Separar visualmente lo que el club afirma de su casa (dirección, referencias, dónde hay sombra) de lo que decide el organizador (parqueo oficial, cierres). Cada afirmación con fecha.
- Fuera del repo: reclamar/crear la ficha del **club** como organización deportiva y solicitar la gestión de la del lugar; publicar una entrada tipo Evento para el 18 de octubre con `utm_source=gbp&utm_medium=organic&utm_campaign=copa-valle-yumbo-2026`.

**Insumos que debe dar el club** — Decisión sobre quién es el titular de la ficha del lugar (la pista es infraestructura pública: conversar con Alcaldía/IMDERTY antes de reclamar); un correo del club para la verificación; qué puede afirmar sobre parqueo y acceso; tiempos de viaje medidos una vez desde 5-6 ciudades.

**Medición GA4** — `race_directions_click` con `content_id`. Umbral: ≥12 usuarios únicos entre el 12 de septiembre y el 18 de octubre (piso), ≥30 (objetivo), con ≥50% en ciudades distintas de Yumbo. Ficha de Google: sesiones con `utm_source=gbp` ≥10 en octubre.

**Esfuerzo** — Bajo en código, alto en latencia externa (la verificación de Google puede tardar semanas).

**Fecha de corte** — Coordenada única y test: **martes 1 de septiembre**. Trámite de la ficha iniciado: **martes 1 de septiembre**. Bloque logístico publicado con el resto de la página: 11 de septiembre.

---

### 3. Reconocer el circuito sin viajar

**Qué es** — Tres piezas que responden la pregunta que ningún organizador de la Copa Valle publica: cómo es la pista. (a) El mapa del circuito con seis puntos con nombre propio, usando `.circuit-map`, que **ya está escrito y probado en `src/styles/global.css:1124-1207` y hoy no tiene un solo consumidor en el sitio**. (b) El GPX descargable en `public/gpx/`. (c) Un video POV de una vuelta completa en YouTube, enlazado con fachada (imagen póster + botón), nunca con iframe.

**Para quién** — Corredor foráneo y su entrenador, que deciden categoría y estrategia antes de subirse al carro. La corredora juvenil de Palmira que nunca ha pisado Yumbo.

**Por qué gana** — Cero JavaScript, cero island, cero riesgo de LCP, y el CSS ya está escrito: lo único que falta es contenido. El GPX es el único artefacto del sitio que el visitante se lleva consigo y que un tercero puede citar y enlazar —relevante cuando el club tiene 2 backlinks en total—. Y bautizar los tramos («El Cajón», «La Bajada del Samán») le da a la prensa de la Copa Valle algo concreto que copiar, que es como se consiguen enlaces.

**Cómo se construye**
- `<figure class="circuit-map">` incrustado en el cuerpo markdown del evento, con SVG de `viewBox="0 0 480 300"`, `<title>` y `<desc>` accesibles, `path` de terreno y de línea de carrera, pines numerados y `<ol class="circuit-map__legend">` que se numera sola con `counter()`. **El `path` se dibuja a mano sobre el GPX o la ortofoto**: `.circuit-map` no proyecta nada, y `elevationProfile()` de `src/lib/editorial.ts` es una curva procedural decorativa — presentarla como el perfil de Yumbo sería fabricar un dato.
- Publicar la distancia medida (3,8 km) sí; **el desnivel acumulado de un GPX de celular en 3,8 km, no**, salvo que el club lo valide y se declare el dispositivo.
- GPX recortado (un archivo de reloj puede empezar en la casa de alguien) en `public/gpx/pista-carlos-castro-xco-2026.gpx`, con anchor `download` + `data-analytics-event="race_asset_download"` + `data-analytics-content-id="gpx-circuito"`. Opcional: `AddType application/gpx+xml .gpx` en `public/.htaccess`.
- Video en el canal @clubtrochayruta (puede ser no listado). Fachada con `<Image>` de `astro:assets` sobre el póster local + anchor con `withUtm()` y `data-analytics-event="track_video_click"` + `data-analytics-content-id`. El protocolo de grabación y la extracción del fotograma-póster sin ffmpeg están en `docs/07-plan-la-pista.md` §6 y Apéndice A.
- Los nombres de los seis tramos los pone el club en una sesión de 30 minutos, no la plantilla. Ese vocabulario se reusa después en la crónica, en los pies de foto y en `/la-pista`.

**Insumos que debe dar el club** — GPX o trazado de una vuelta, con nota de qué dispositivo lo grabó y si es el trazado oficial de la válida o una vuelta de entrenamiento (rotularlo por lo que es); video POV horizontal de una vuelta, sin cortes; seis nombres de tramo con una frase cada uno, dictados por el entrenador; consentimiento de imagen si algún menor es identificable en el video.

**Medición GA4** — `race_asset_download` (`content_id: gpx-circuito`) y `track_video_click` (`content_id`). Umbral combinado: ≥8 usuarios únicos (piso), ≥25 (objetivo). Es un número pequeño a propósito: son corredores con GPS, no público general. Menos de 3 significa que el botón no se ve a 360px — revisar eso antes de concluir otra cosa.

**Esfuerzo** — Bajo en código, medio en contenido.

**Fecha de corte** — Insumos en mano: **lunes 14 de septiembre**. Publicado: **viernes 18 de septiembre**.

---

### 4. `/la-pista`: el activo que sobrevive al 18 de octubre

**Qué es** — Ejecutar la Fase 1 de `docs/07-plan-la-pista.md`, sin flipbook y sin mapa programático: una página permanente sobre la Pista Carlos Castro con apertura de cifras derivadas, fichas de obstáculo con foto póster estática, `FactGrid` de habilidades, `WeekRhythm` filtrado a sesiones en la pista y CTA. Más `generateTrackJsonLd()` (`SportsActivityLocation`), la sección de competencias que se actualiza sola, y el cruce desde Trocha Verde.

**Para quién** — Antes del 18: el foráneo que reconoce la sede. Después: quien busque «pista carlos castro yumbo», «dónde entrenar XCO cerca de Cali», y la prensa o las instituciones que necesitan describir el lugar.

**Por qué gana** — Es la página con más demanda latente del sitio, según el diagnóstico de tráfico orgánico: la ficha de Google del lugar tiene 230 reseñas y el sitio no captura nada de esa consulta. La página no menciona ninguna fecha en su estructura, así que el 19 de octubre sigue respondiendo lo mismo. Y el crosslink botánico la apalanca sobre el único tráfico real que el sitio tiene hoy: 8.690 impresiones de búsquedas de árboles, cuyo campo `location` dice literalmente «Pista de Ciclomontañismo Carlos Castro» y que hoy no llevan a ninguna parte.

**Cómo se construye**
- Tareas 1, 2, 4, 5 y 6 de `docs/07-plan-la-pista.md`: `obstaculosSchema` + colección `obstaculos` en `src/content.config.ts` + tests; `src/lib/la-pista.ts` (`summarizeTrack`, `skillsByFrequency`, `programsUsingTrack`) con tests; colección espejo en `public/admin/config.yml`; `src/pages/la-pista.astro` + `src/components/sections/ObstacleCard.astro`; `generateTrackJsonLd()` en `src/lib/seo.ts` con test.
- El JSON-LD toma `geo` de `TRACK` (idea 2 — **no se marca un lugar mientras el repo afirme tres puntos**) y los horarios de `buildWeekRhythm()`/`trainingPlaces()` de `src/lib/contact.ts` sobre `programs` filtrados por la pista: cero horarios a mano.
- Campo opcional `venueSlug: 'pista-carlos-castro'` en `eventsSchema` (mejor que filtrar por substring de `location`). La página lista sus propias competencias con `resolveEventStatus()`/`buildSeason()`: hoy anuncia la VII válida, el 19 de octubre la archiva con su crónica. Cambiar `status` a `cancelled` en el `.md` no debe dejar ninguna afirmación falsa en el HTML.
- `TrackCrossLink.astro` en el «paso siguiente» de `src/pages/trocha-verde/[species].astro` y `trocha-verde/arboles/[slug].astro`, usando `commonPlace()` de `src/lib/tree-utils.ts` para que solo aparezca cuando esa especie sí está en la pista. Enlace interno, **sin UTM** (regla dura de `docs/05`). Tono informativo, no CTA de inscripción.
- Entrada en `SECONDARY_NAV` (`src/lib/constants.ts`) y en el grupo «El club» de `FOOTER_GROUPS` (`src/lib/navigation.ts`). `<ScrollDepth target="main" />`.

**Insumos que debe dar el club** — Lista de obstáculos con nombre, tipo y nivel; fotos por obstáculo; el texto del entrenador sobre cómo se pasa cada uno y cómo se comporta el piso con lluvia (conocimiento propio, no reconstruible); **consentimientos de imagen firmados** de los menores que aparezcan.

**Medición GA4** — `scroll_depth`. Umbral: ≥30% de las sesiones de `/la-pista` alcanzan `depth=75`. El KPI de verdad es de supervivencia: sesiones en noviembre+diciembre ≥50% de las de octubre.

**Esfuerzo** — Alto (2-3 días). Si compite en calendario con la idea 1, la idea 1 va primero, sin discusión.

**Fecha de corte** — Insumos: **lunes 14 de septiembre**. En producción: **viernes 25 de septiembre**, junto con el crosslink botánico. Después del 4 de octubre ya no vale la pena crear la URL.

---

### 5. El domingo y el lunes: capturar el pico y quedarse con él

**Qué es** — Tres piezas para el momento en que de verdad llega el tráfico. (a) `/enlaces` en modo carrera: la página del QR ya existe, ya está impresa y `nextRace()` ya devuelve `today: true` cuando la carrera es ese día — solo hay que hacer que ese bloque lleve a la logística y no a `/calendario`. (b) El paquete de 48 horas: resultados en `src/content/results/*.yml`, crónica con `relatedEvent`, y álbum con captions por categoría para que Pagefind los devuelva. (c) Un canal para que el pico no se evapore: la Comunidad de WhatsApp, ofrecida en el álbum de fotos el lunes, que es cuando la gente está más dispuesta.

**Para quién** — El domingo, quien escanea un QR en la pista. El lunes, 350 familias de todos los clubes del Valle buscando su resultado y su foto: el mayor volumen de la semana y la única ocasión del año en que este sitio recibe visitantes de todo el departamento a la vez.

**Por qué gana** — `/enlaces` es la mejor relación esfuerzo/impacto de todo el conjunto: cero página nueva, cero URL que indexar, y el QR impreso sigue sirviendo. El paquete del lunes captura un pico que hoy el sitio pierde entero, y la ventana de 48 h de `news-sitemap.xml.ts` está anclada al artículo más reciente, así que publicar rápido sí cambia el resultado (Google News lleva 0). Y sin un canal propio, el 20 de octubre el tráfico vuelve a ~40 sesiones al mes.

**Cómo se construye**
- Ampliar `nextRace()` en `src/lib/linktree.ts` para devolver también `href` y `status`, con test. En `src/pages/enlaces.astro`, el bloque `race &&` gana dos accesos condicionados a `race.today`: «Cómo llegar» (deep link) y «Resultados» (cuando el evento pasa a `past` y tiene `resultsUrl`). `/enlaces` sigue en `Disallow` de `robots.txt` y fuera del sitemap: eso no se toca, esta página compite por escaneos, no por búsqueda.
- **El sitio es estático: «hoy» es la fecha del build.** Hace falta un `workflow_dispatch` manual el sábado 17 o la mañana del 18, con responsable asignado. No un cron diario: `deploy-prod.yml` corre sin gate de tests y `lftp mirror --only-newer` re-subiría ~146 páginas cada día.
- Plantillas listas **antes del viernes 16**: esqueleto de la crónica en `src/content/news/`, álbum vacío en `src/content/gallery/` con `relatedEvent`, y los `.yml` de resultados con el formato del README de la colección (una válida + una categoría por archivo; en la carpeta solo puede haber **una** temporada o `buildStandings()` suma dos años en la misma general).
- Álbum: `gallerySchema` ya soporta `images[].caption` y `photographer` — **no hay que tocar el schema**. Lo que falta es disciplina de captura: el fotógrafo cubre por bloques horarios y los captions llevan la categoría literal («Infantil B — primera salida»), para que `SiteSearch` (island ya montada, Pagefind ya indexando `dist/`) devuelva «Infantil B» como resultado navegable.
- Comunidad de WhatsApp: campo `whatsappCommunity` en `CONTACT` (`src/lib/constants.ts`), enlace saliente con `withUtm()` y `source` distinto por superficie, `data-analytics-event="community_join_click"`. Si el club no la crea, la constante queda vacía y el bloque no se pinta.
- **Canal visible de retirada de imagen a solicitud**, publicado antes del 18. La Ley 1581 obliga a tenerlo y hoy no existe en ninguna parte del sitio.

**Insumos que debe dar el club** — Fotógrafo asignado con instrucción escrita (cubrir por bloques, sin identificación individual de terceros); **decisión por escrito, antes del sábado 17, sobre qué nombres de menores se publican en resultados**; resultados oficiales el mismo domingo; quién modera la comunidad (una comunidad con familias de menores sin moderación es un riesgo, no un activo).

**Medición GA4** — `race_directions_click` desde `/enlaces`; `share_click` (`content_id`); `community_join_click` (`content_id`); `scroll_depth`. Umbral: ≥25 sesiones a `/enlaces` con `utm_source=qr` el 17 y 18 de octubre (piso: hoy no se ha medido un día de carrera); ≥150 vistas combinadas de crónica y álbum entre el 19 y el 26 de octubre; ≥20 `community_join_click`.

**Esfuerzo** — Bajo en código (`/enlaces` es un `if` y un test), medio en operación fotográfica.

**Fecha de corte** — `/enlaces` en modo carrera: **viernes 9 de octubre**. Plantillas y decisión legal: **viernes 16 de octubre**. Publicación del paquete: **lunes 19 de octubre antes del mediodía**.

---

## 3. La island React: en qué se gasta

**Recomendación: no se gasta antes del 18 de octubre. Se guarda para noviembre.**

Las tres candidatas se caen por razones distintas, y ninguna de ellas es «no alcanza el tiempo»:

- **Mapa Leaflet de la sede con capa de árboles** — se apoya en un hecho falso: **solo 2 de los 77 árboles tienen `lat`/`lng`**. La «capa de Trocha Verde alrededor de la pista» no existe hoy.
- **Mapa interactivo del día de carrera (POIs de parqueo, meta, dónde ver)** — es la única con una necesidad genuinamente stateful, pero falla los dos filtros duros: sus datos dependen de un rol operativo del club que todavía se negocia, y su momento de uso —el domingo, de pie en la pista, con una barra de señal— es justo cuando las teselas de OpenStreetMap no cargan y el mapa es un rectángulo gris. Cuesta 43 KB gz de Leaflet más su CSS y ~20 peticiones de teselas. Un SVG build-time del circuito más dos deep links (`google.com/maps/dir` y `waze.com/ul`) entregan el 90% del valor con 0 KB, abren la app nativa —que sí tiene mapas cacheados— y **son medibles con un clic**, que es más de lo que produce un mapa embebido.
- **Planificador «¿a qué hora corro yo?»** — su valor es una consulta categoría → hora, y eso es una tabla con radios y `:checked`/`:has()`, el patrón que `ProgramAgePicker.astro` ya usa en producción. El único argumento a favor era el `.ics` con hora real (el `generateICSContent()` actual emite `DTSTART;VALUE=DATE`, de día completo), pero ese helper puede correr **en build**, uno por categoría, y servirse como el `.ics` que `AddToCalendar.astro` ya sirve por `data:` URI. React no aporta nada que el HTML horneado no dé: 0 KB, funciona sin JS, indexable. Y si la Comisión no publica horarios por categoría, la island se renderiza vacía.

**Si aun así se quiere gastar**, el orden es: mapa del día de carrera → planificador de horarios, y el primero solo si (i) el GPX está en el repo antes del 12 de septiembre, (ii) el SVG build-time se renderiza como `children` del island y es útil por sí solo si Leaflet nunca hidrata, (iii) solo se pintan capas de infraestructura permanente —trazado, entrada, sombra real—, nunca capas que decida el organizador, y (iv) se mide LCP e INP en PageSpeed móvil antes de mergear a `main`.

La island guardada vale más en noviembre, con los insumos completos y sin una fecha encima.

---

## 4. Ideas de segunda línea

| Título | Qué es en una línea | Esfuerzo | Impacto | Cuándo hacerla |
|---|---|---|---|---|
| FAQ del visitante foráneo | 8-10 preguntas del que viene de lejos (números, reconocimiento, lluvia, baños, dónde pararse) usando `category: 'competencias'`, que **ya existe** en `faqsSchema` — cero cambio de schema | Bajo | Medio | Semana 3 (14-20 sep) |
| «Tu primera válida» | Página evergreen: qué es una XCO, Teteros con y sin pedales, qué llevar, qué sorprende al debutante; `FaqAccordion` + `generateFAQPageJsonLd()` | Bajo | Alto (permanente) | Semana 4, publicar antes del 4-oct |
| Categorías y vueltas por edad | Tabla de las 24 categorías + Teteros con vueltas y kilómetros calculados, filtrable por edad al estilo `ProgramAgePicker` | Medio | Alto | Solo si llega la convocatoria de la Comisión; semana 4 |
| `/prensa`: kit para medios | Cinco datos derivados del contenido, fotos en alta con licencia, logo vectorial, contacto; es lo que hace que pedir un backlink funcione | Bajo | Medio-alto | Semana 4, antes de la ronda de prensa |
| Voluntarios | Tareas, turnos y qué recibe el voluntario; reutiliza `ContactForm` con asunto prefijado. Es lo único que no depende del rol operativo del club | Bajo | Alto (comunidad local) | Semana 4-5 |
| Logística para clubes visitantes | Bloque `#para-clubes`: buseta, carpa, reconocimiento el sábado, «avísanos que vienen» por WhatsApp — produce el dato de cuántos clubes vienen y de dónde | Bajo | Alto | Semana 5 |
| Previa + ronda de prensa e instituciones | Artículo en `/noticias` con `relatedEvent` diez días antes + correos a Mundo Ciclístico, leanotas, zonadeimpacto, IMDERTY y Alcaldía, con el kit adjunto | Bajo | Medio | Miércoles 7 de octubre |
| Propuesta a patrocinadores | Sección en `/patrocinadores` para los 7 sponsors reales del repo (`level: 'aliado'` ya existe en el schema) + reporte post-evento. Cero eventos GA4 nuevos | Bajo | Medio-alto | Semana 4, **solo tras hablar con la Comisión** |
| Hoja de estilos de impresión | `@media print` en `global.css` para que un padre guarde la guía en PDF antes de perder señal — sustituye a la idea de la página aparte | Bajo | Bajo-medio | Semana 5 |
| Aliados institucionales en `/la-pista` | Reconocer por nombre a quien sostiene la pista, con `sponsors level: 'aliado'` y `sponsor_click` (ya existen) | Bajo | Medio | Noviembre |
| `track-map.ts` + `TrackMap.astro` | Parseo de GPX y proyección programática a `path`, reutilizable en tres superficies (tareas 10-11 de docs/07) | Medio | Medio | Noviembre, sin fecha encima |
| Historia de Carlos Castro | `Timeline` con hitos de construcción de la pista; contenido E-E-A-T que solo el club puede escribir | Medio | Medio | Noviembre |
| Índice `/copa-valle` | Hub de la serie con las siete válidas | Medio | Bajo hoy | 2027 |

---

## 5. Descartadas y por qué

| Idea | Por qué se descarta |
|---|---|
| `/dia-de-carrera`, página de bolsillo aparte | `/enlaces` ya **es** esa página: mismo layout, ya desplegada, ya en el QR impreso, y ya sabe si la carrera es hoy. Una segunda URL `noindex` duplica contenido sin ganar nada. |
| PDF de guía del visitante con QR | Foto fija de una logística que no controlamos: si la Comisión mueve el horario el viernes, la versión que circula por WhatsApp queda equivocada y no se puede corregir. Además exige diseño e impresión sin dueño asignado. |
| «Vive la vuelta»: recorrido scroll-driven | El esfuerzo de ingeniería más caro del pool (escena alta en un tráfico 82% móvil, longhands por Lightning CSS, Firefox sin soporte) y no produce una sola línea indexable que `.circuit-map` no dé con CSS ya escrito. Es la Fase 2 de docs/07, no octubre. |
| Mapa Leaflet de la sede (cualquiera de las dos versiones) | Ver §3: dato falso en una (2/77 árboles georreferenciados), dependencia del organizador y del ancho de banda en la otra. |
| Island de horarios por categoría | Se resuelve con radios y `:checked`; el `.ics` con hora se genera en build. |
| Comparador de los siete circuitos | Publicaríamos distancias de sedes ajenas que el repo no tiene y no podemos verificar. Violaría «nada inventado» por omisión. |
| Cron diario de despliegue | Resuelve un problema inexistente —ningún contenido depende de «hoy» salvo `/enlaces`, que se cubre con `workflow_dispatch`— y a cambio despliega a producción sin gate de tests. |
| Categorías `valida` o `pista` en `faqsSchema` | `competencias` ya existe en el enum. Cambiar el schema en tres sitios para preguntas que caben ahí es churn puro. |
| Desnivel acumulado del GPX como dato duro | La altimetría barométrica de un celular en 3,8 km puede desviarse; multiplicarla por vueltas propaga el error. Se publica solo si el club valida la cifra. |
| Seis clips de video, uno por sector | Seis clips + seis pósters + copy en siete semanas, encima de todo lo demás. Uno solo, y bueno. |
| Bitácora semanal de actualizaciones tipo `Timeline` | Una bitácora abandonada envejece peor que no tenerla, y este club no ha sostenido cadencia editorial nunca (Google News = 0 por eso). Se reduce a un campo `updatedAt` y una frase. |

---

## 6. Plan de medición GA4

### Eventos nuevos

Se declaran **los siete de una vez el 1 de septiembre**, aunque algunos se usen semanas después: GA4 no aplica dimensiones personalizadas retroactivamente, y este proyecto ya perdió 567 `scroll_depth` en `(not set)` por registrarlas tarde.

| Evento | Cuándo dispara | Parámetros | Por qué importa |
|---|---|---|---|
| `race_directions_click` | Clic en «Cómo llegar» (Google Maps o Waze) o en el punto de parqueo | `content_id` (**nuevo**): `google-maps` \| `waze` \| `parqueo` | Es la definición operativa de «visitante que va a viajar». Señal conductual, manda sobre la geolocalización por IP del operador móvil |
| `race_asset_download` | Descarga del GPX o de cualquier archivo de carrera | `content_id`: `gpx-circuito`, `kit-prensa`… | La intención más honesta del sitio: nadie descarga el GPX de un circuito al que no piensa ir |
| `race_registration_outbound` | Clic al CTA hacia ciclomontañismovalle.com | — | Hoy el club regala ese tráfico sin registro. Es también el activo de negociación más concreto ante la Comisión |
| `race_calendar_add` | Clic en Google Calendar o en «Descargar .ics» de `AddToCalendar.astro` | — | Compromiso con la fecha. **`AddToCalendar` hoy no emite nada**: hay que añadir `data-analytics-event` a los dos anchors |
| `share_click` | Clic en compartir, **solo** donde se active por prop | `content_id` = slug de la página | Cierra el punto ciego de WhatsApp: mide quién reenvía, y `utm_campaign=compartir-desde-web` mide quién llega. **No mezclar con `whatsapp_click`**, que significa «quiero hablar con el club» |
| `track_video_click` | Clic a la fachada del video POV | `content_id` = slug del tramo o `vuelta-completa` | Ya estaba previsto como tarea 14 de `docs/07-plan-la-pista.md` |
| `consent_granted` | Handler de aceptar en `ConsentBanner.astro`, junto a `persist('granted')` | — | Sin esto, todos los umbrales de abajo están medidos sobre un denominador desconocido: `analytics_storage` arranca en `denied` |

Opcional, solo si el club confirma la Comunidad de WhatsApp antes del 1 de septiembre: `community_join_click` con `content_id`.

**Parámetro nuevo: uno solo, `content_id`.** No es PII: es un slug de recurso (`gpx-circuito`, `waze`), nunca una persona.

### Procedimiento de declaración — los dos sitios, siempre

1. **`src/lib/events.ts`** — añadir cada string a `EVENT_NAMES` y `content_id` a `ALLOWED_PARAM_KEYS`.
2. **`src/components/common/Analytics.astro`, líneas ~133-143** — repetir literalmente en los arreglos `ALLOWED_EVENTS` y `ALLOWED_PARAMS`. Ese bloque es JS plano dentro de un `<script is:inline define:vars={{ ga4Id }}>` y **no importa de `events.ts` a propósito**: corre antes de que exista cualquier bundle. Si se olvida, el evento se descarta en silencio dentro de `emit()`, sin error visible.
3. **`handleDelegatedClick` en el mismo archivo** — hoy solo lee `data-analytics-pdf-name`, `data-analytics-sponsor-id` y `data-analytics-program-id`. Añadir la línea que lee `data-analytics-content-id`.
4. **Test de paridad nuevo**: `src/lib/__tests__/analytics-parity.test.ts` lee `Analytics.astro` con `node:fs`, extrae los dos arreglos y los compara contra `EVENT_NAMES`/`ALLOWED_PARAM_KEYS`. Hoy no existe ninguna red de seguridad para esto.
5. **En GA4, el mismo día del despliegue**: registrar `content_id` como dimensión personalizada y marcar `race_directions_click`, `race_asset_download` y `race_registration_outbound` como key events.
6. **Verificación en DebugView contra un Android real a 360px**, tocando cada elemento instrumentado. `cta_inscripcion_click` marcó cero durante tres meses porque el botón era `display:none` en móvil y el 82% del tráfico es móvil. No repetir ese error.

### Tablero — ocho KPIs con umbrales honestos

Línea base del sitio: **163 sesiones en cuatro meses (~40/mes)**, 81 impresiones de ciclismo en tres meses, 2 backlinks. «Piso» es el mínimo que justifica haber hecho el trabajo; «objetivo» es el buen resultado. Todo se lee **por usuarios, no por eventos**: con este volumen, una sola persona del club navegando mueve varios puntos porcentuales, y el filtro de tráfico interno sigue sin resolverse.

| # | KPI | Cómo se mide | Piso | Objetivo | Corte |
|---|---|---|---|---|---|
| 1 | Alcance de la página de la válida | GA4 › Páginas y pantallas, ruta `/calendario/copa-valle-yumbo-2026`, 12-sep → 18-oct | 45 sesiones | 100 | 19-oct |
| 2 | Lectura real | % de esas sesiones con `scroll_depth` = 75 | 25% | 40% | 19-oct |
| 3 | Intención de viaje | Usuarios con `race_directions_click` | 12 | 30 | 19-oct |
| 4 | Salida a inscripción | Usuarios con `race_registration_outbound`, 12-sep → 15-oct | 10 | 25 | 16-oct |
| 5 | Compromiso con la fecha | Usuarios con `race_calendar_add` | 8 | 20 | 19-oct |
| 6 | Reconocimiento del circuito | Usuarios con `race_asset_download` (`gpx-circuito`) + `track_video_click` | 8 | 25 | 19-oct |
| 7 | Visibilidad en Google | Search Console, impresiones de octubre para consultas con «yumbo», «copa valle» o «carlos castro» (usar `&breakdown=` y `&query=~regex`) | 120 | 300 | 1-nov |
| 8 | Supervivencia del activo | Sesiones a `/la-pista` en nov+dic frente a las de octubre | ≥50% | ≥80% | 30-nov |

**Factor de corrección obligatorio, no es KPI**: tasa de consentimiento = `consent_granted` / sesiones. Todo lo de arriba está medido solo sobre quien acepta el banner. Si esa tasa es baja, los ocho números están subestimados y hay que decirlo por escrito antes de sacar conclusiones.

### Qué revisar el 19 de octubre

- Los siete eventos nuevos aparecen con datos y **ninguno con `content_id` en `(not set)`**. Si aparece, la dimensión se registró tarde y el dato es irrecuperable.
- KPIs 1 a 6, con la tasa de consentimiento al lado.
- Ningún evento del catálogo en cero por fallo de instrumentación (distinguir «nadie lo tocó» de «no estaba conectado»: verificar el atributo en el HTML desplegado).
- El artículo del lunes aparece en el informe de Google News de Search Console (línea base: 0).
- Que el `race_registration_outbound` se lea en dos ventanas separadas: 12-sep → 15-oct (intención de inscribirse) y 16 → 18-oct (los que ya vienen).

### Qué revisar el 30 de noviembre

- KPI 8: si `/la-pista` conserva la mitad del tráfico de octubre, el trabajo produjo un activo y no un domingo.
- KPI 7 a 90 días, y si aparecieron consultas nuevas con «pista carlos castro» que antes no existían.
- Backlinks nuevos en Search Console › Enlaces (línea base: 2 en todo el sitio).
- Miembros efectivos de la comunidad de WhatsApp, contados por el club (WhatsApp no da analítica: el sitio solo mide el clic de salida — no confundir intención con conversión).
- Regla de decisión: **cinco de ocho umbrales de piso alcanzados = la apuesta se repite en 2027; menos de tres = se revisa el canal de difusión antes que el contenido.**

---

## 7. Cronograma de 7 semanas

**La fecha de corte para indexación es el sábado 12 de septiembre.** Todo lo que quiera tráfico orgánico el 18 de octubre tiene que estar en producción antes. Y **el domingo 4 de octubre es la última URL nueva que vale la pena crear**: catorce días de margen de rastreo. Después de esa fecha solo se editan páginas existentes.

**Semana 1 — 1 al 6 de septiembre. Bloquea todo lo demás.**
- Corregir «Séptima y **última** válida» en el `.md` del evento. Cinco minutos, y es lo primero.
- Constante `TRACK` + test de coherencia de coordenadas (idea 2). **Bloquea `generateTrackJsonLd()` y el bloque de cómo llegar.**
- Arnés GA4: siete eventos + `content_id` en los dos archivos, `data-analytics-content-id` en `handleDelegatedClick`, `consent_granted` en `ConsentBanner`, test de paridad. **Bloquea toda medición posterior; las dimensiones se registran en GA4 el mismo día.**
- Iniciar el trámite de la ficha de Google. Latencia fuera de nuestro control: empieza ya o no llega.
- **Viernes 4 de septiembre: congelamiento de schema.** `eventsSchema` ampliado (`slug`, `circuit`, `categories`, `venueSlug`, `updatedAt`) en los tres sitios, con tests verdes. Después de esta fecha, cualquier campo nuevo obliga a re-editar `.md` + `config.yml` + tests con la página ya escrita.

**Semana 2 — 7 al 13 de septiembre. La semana que decide el proyecto.**
- `src/pages/calendario/[slug].astro` completa, con el bloque de estado de la Copa, el bloque logístico, `registrationUrl` instrumentado con UTM, `og:image` real y `ScrollDepth`.
- `calendario.astro` pasa a enlazar fichas en vez de anclas; `generateEventsListJsonLd()` apunta al detalle.
- **Viernes 11 de septiembre: despliegue a producción.** Con lo que esté confirmado, aunque falten horarios y categorías. Solicitar inspección de URL en Search Console el mismo día.

**Semana 3 — 14 al 20 de septiembre.**
- **Lunes 14: los insumos de `/la-pista` y del circuito tienen que estar en manos del equipo** (obstáculos, fotos, texto del entrenador, consentimientos firmados, GPX, video). Sin esto ese lunes, `/la-pista` no sale y el proyecto pierde su único activo permanente.
- `.circuit-map` dibujado sobre el GPX con seis tramos bautizados, GPX descargable instrumentado, video POV subido y enlazado con fachada (idea 3).
- FAQ del visitante con `category: 'competencias'`.

**Semana 4 — 21 al 27 de septiembre.**
- `/la-pista` Fase 1: schema `obstaculos`, `la-pista.ts`, la página, `ObstacleCard`, `generateTrackJsonLd()`, navegación, `venueSlug`.
- Crosslink botánico desde las fichas de especie y de árbol, el mismo día que `/la-pista`.
- «Tu primera válida», `/prensa` y voluntarios en paralelo si hay aire.
- **Viernes 25: `/la-pista` en producción.** Coincide con la fecha muerta de Roldanillo — momento natural para revisar el bloque de estado.

**Semana 5 — 28 de septiembre al 4 de octubre.**
- Logística para clubes visitantes, hoja de estilos de impresión, categorías por edad si llegó la convocatoria.
- **Domingo 4: última URL nueva.** A partir de aquí solo se editan páginas existentes.

**Semana 6 — 5 al 11 de octubre.**
- **Miércoles 7: previa publicada** + ronda a Comisión, IMDERTY, Alcaldía y prensa, con el kit adjunto. Diez días es el mínimo para que un medio agende.
- **Viernes 9: `/enlaces` en modo carrera** desplegado y probado.
- **Viernes 9: congelamiento de `og:image` y de la tarjeta de WhatsApp.** WhatsApp cachea la previsualización por URL durante días; cambiarla después deja circulando la versión vieja todo el fin de semana.

**Semana 7 — 12 al 18 de octubre.**
- **Domingo 11 / lunes 12: congelamiento de logística.** Lo que la Comisión no haya confirmado por escrito, no se publica.
- **Jueves 15: cierra la inscripción.** El CTA cambia de estado; un botón «Inscríbete» vivo el 16 apunta a un formulario cerrado.
- **Viernes 16: solo ediciones de texto.** Cero componentes nuevos, cero despliegues de código. Crónica en borrador, álbum vacío y `.yml` de resultados **ya existentes en la rama**. Fotógrafo con instrucciones escritas. Decisión del club sobre nombres de menores, por escrito.
- **Sábado 17 o mañana del 18: `workflow_dispatch` manual** para que el build sea reciente y `/enlaces` sepa que la carrera es hoy. Cronometrar ese despliegue **antes** del 18: build de ~146 páginas + Pagefind + `lftp` por FTPS, nadie ha medido cuánto tarda.
- **Domingo 18: carrera.**
- **Lunes 19 antes del mediodía**: resultados, crónica y álbum publicados. La ventana de 48 h de `news-sitemap.xml.ts` se ancla al artículo más reciente; publicar el miércoles es publicar tarde.
- **Lunes 20**: primera lectura de datos, no antes.

---

## 8. Insumos que debe entregar el club (checklist)

**Antes del martes 1 de septiembre**
- [ ] Decisión sobre la ficha de Google del lugar: ¿la reclama el club, o hay que hablar antes con Alcaldía/IMDERTY? La pista es infraestructura pública.
- [ ] Un correo del club disponible para la verificación de Google.
- [ ] Confirmación de si se crea la Comunidad de WhatsApp y quién la modera (para declarar el evento en la misma pasada del arnés).

**Antes del viernes 4 de septiembre** — bloquean el congelamiento de schema
- [ ] URL exacta de inscripción en ciclomontañismovalle.com.
- [ ] Confirmación de que 3,8 km / 24 categorías / 350 cupos / $70.000 y $50.000 siguen vigentes tras la cancelación de Roldanillo.
- [ ] Foto real de la pista, horizontal, para `image` y `og:image`.

**Antes del miércoles 9 de septiembre** — bloquean el despliegue del 11
- [ ] Qué puede afirmar el club sobre acceso y parqueo, separado de lo que decide el organizador.
- [ ] Tiempos de viaje desde 5-6 ciudades del Valle, medidos una vez, con fecha.
- [ ] Postura sobre qué preguntas responde el club y cuáles redirige a la Comisión.

**Antes del lunes 14 de septiembre** — bloquean `/la-pista` y el circuito
- [ ] GPX o trazado de una vuelta, con nota de dispositivo y de si es el trazado oficial o de entrenamiento.
- [ ] Video POV horizontal de una vuelta completa, sin cortes, subido a YouTube.
- [ ] Seis nombres de tramo con una frase cada uno, del entrenador.
- [ ] Lista de obstáculos con nombre, tipo y nivel + fotos + texto pedagógico del entrenador.
- [ ] **Consentimientos de imagen firmados** de todos los menores identificables en fotos y video.

**Antes del domingo 4 de octubre**
- [ ] Convocatoria oficial de la Comisión con categorías, rangos de edad y vueltas (si no llega, ese bloque no se pinta).
- [ ] Aval de la Comisión sobre qué activaciones de marca son posibles, si se va a hablar con patrocinadores.
- [ ] Contactos de prensa y de instituciones para la ronda del 7 de octubre.

**Antes del domingo 12 de octubre**
- [ ] Franja horaria del día, confirmada **por escrito** por la Comisión. Sin confirmación, el bloque no se publica.

**Antes del viernes 16 de octubre**
- [ ] Decisión escrita sobre qué nombres de menores se publican en resultados.
- [ ] Fotógrafo asignado, con instrucción escrita de cubrir por bloques horarios y sin identificación individual de menores de otros clubes.
- [ ] Canal de retirada de imagen publicado y con responsable que lo atienda.
- [ ] Responsable asignado para el `workflow_dispatch` del sábado 17.

---

## 9. Riesgos y planes B

**Si Roldanillo se reagenda y Yumbo deja de ser la final.** Se cae poco, y lo que se cae ya está roto hoy: el `.md` del evento afirma «Séptima y **última** válida». Esa línea se corrige el primer día. Fuera de eso, el plan está blindado por diseño: el estado sale de `resolveEventStatus()` y `cancelledAhead()`, nunca de una frase escrita a mano; el copy dice «la Copa Valle llega a Yumbo», nunca «la Copa Valle se decide en Yumbo»; y ningún título de crónica, ninguna tarjeta de WhatsApp y ningún `og:image` puede llevar «final», «cierre» o «última» —el de WhatsApp es el peor, porque se cachea por URL y no se puede corregir una vez circula—. Aproximadamente el 80% del trabajo describe un lugar y un día, no una posición en una tabla, y es indiferente al escenario. Y hay una oportunidad escondida: si Roldanillo se corre en noviembre, Yumbo pasa a ser la penúltima con la general abierta, que es una historia mejor, no peor.

**Si el rol operativo del club no se define.** Es el escenario base, no el excepcional: se planifica asumiendo que no se define. Regla dura: cada afirmación logística lleva su fuente y su fecha, y se separan visualmente **lo que el club sabe de su casa** (dirección, cómo se llega, dónde hay sombra real, cómo se comporta el piso con lluvia) de **lo que decide el organizador** (parqueo oficial, horarios, entrega de números, cierres viales). Lo segundo no se publica sin confirmación escrita; si no llega, el bloque no se pinta —regla del sistema editorial— y la página sigue siendo útil. En comunicación externa se habla siempre de **sede** («la válida se corre en nuestra casa»), nunca de organización, hasta que el club confirme lo contrario. Y la idea de voluntarios existe precisamente porque es lo único que no depende de esto: el anfitrión siempre necesita manos de la casa.

**Si no llegan los consentimientos de imagen.** `/la-pista` se publica igual, con fotos de obstáculos **sin personas en cuadro** o con la cámara en el casco sin cara visible; el video POV se graba con un adulto. Las fichas de obstáculo funcionan sin corredor: lo que enseñan es el terreno. El álbum del lunes es el punto crítico y no es negociable: el club **no tiene ni puede tener** autorizaciones de los menores de Sevilla, Cali o Palmira que aparezcan en 400 fotos, y `gallerySchema` exige `alt` pero no modela consentimiento —el schema no protege a nadie—. Regla operativa: fotos de acción sin identificación individual de terceros, cero nombres en pies de foto salvo autorización expresa, canal de retirada publicado y operativo **antes** del 18, y ante la duda se deja fuera en vez de publicar y borrar después. Ley 1098 y Ley 1581. Es el único riesgo del plan que puede terminar en una queja formal en vez de en una métrica mala, y se dispara justo cuando hay prisa.

**Otros dos que conviene tener a la vista.** Primero: si se llenan `mapUrl` y `registrationUrl` en el `.md` antes de terminar el arnés, `calendario.astro:203-221` despliega dos CTA salientes sin instrumentar ni UTM — el orden importa. Segundo: los umbrales del §6 están calibrados sobre 40 sesiones al mes y sobre tráfico consentido; con ese volumen ninguna conclusión de conversión es estadísticamente sólida, y el valor del tablero es comparativo, no absoluto. Escribirlo así en el informe del 25 de octubre, antes de que alguien lo lea al revés.

---

## 10. Relación con `docs/07-plan-la-pista.md`

**Se activan tal como están escritas** (Fase 1, publicable sin flipbook por diseño del propio plan):

- **Tarea 1** — `obstaculosSchema` + enums `OBSTACLE_TYPES`/`OBSTACLE_LEVELS` + colección en `content.config.ts` + tests de schema.
- **Tarea 2** — `src/lib/la-pista.ts` (`summarizeTrack`, `skillsByFrequency`, `programsUsingTrack`) con tests y `null` cuando no hay datos.
- **Tarea 4** — colección `obstaculos` en `public/admin/config.yml`, en sync con el schema.
- **Tarea 5** — página `/la-pista` con apertura, `ObstacleCard` (ficha + póster estático), `FactGrid` de habilidades, `WeekRhythm` filtrado, CTA y navegación en `SECONDARY_NAV` y footer.
- **Tarea 6** — `generateTrackJsonLd()` (`SportsActivityLocation`) + test + verificación en sitemap.
- **Tarea 14** — evento `track_video_click` con `content_id`, declarado en el catálogo. Se adelanta desde la Fase 4 a la semana 1, porque el video POV sale en septiembre y las dimensiones de GA4 no son retroactivas.
- **Tarea 16** — gate de auditoría (Lighthouse ≥95, CLS < 0.05, INP < 200 ms, teclado y lector de pantalla, `npm run test:run` + `npm run typecheck`) antes de cada merge a `main`.

**Se modifican:**

- **Tarea 3** — «extraer 10 fotogramas del clip de muestra» pasa a ser póster estático único por obstáculo. Los fotogramas solo tienen sentido con el flipbook, que se pospone. El riesgo de consentimiento que el plan ya anotaba manda: sin autorización firmada, el obstáculo se fotografía vacío.
- **Tarea 6** — se le añade una dependencia que el plan no tenía: el `geo` del JSON-LD toma sus coordenadas de la constante `TRACK` unificada. No se marca un lugar en Schema.org mientras `src/lib/seo.ts` afirme dos puntos distintos y `TrochaVerdeMap.tsx` un tercero.
- **Tarea 10** — el plan ya contempla la salida barata («o constante dibujada si no hay GPX») y es la que se toma para octubre: el `path` se dibuja a mano sobre el GPX y se incrusta con el markup `.circuit-map`, que ya existe en `global.css:1124-1207` y no tiene consumidores. El parseo programático de GPX en `src/lib/track-map.ts` queda para noviembre, sin fecha encima: proyectar un circuito de 3,8 km que se cruza consigo mismo a un `path` legible no es trivial, y **seis ideas del pool original dependían de ese módulo inexistente** — el plan de octubre está construido para no pasar por ahí.
- **Tarea 15** — «tarjeta de `/la-pista` en la portada» se mantiene, pero el enlazado interno prioritario no es la portada sino las fichas de especie y de árbol de Trocha Verde, que son las únicas páginas del sitio con tracción real en Google (8.690 impresiones frente a 81 de ciclismo).

**Se posponen a noviembre o después:**

- **Tareas 7, 8 y 9** — toda la Fase 2 (flipbook scroll-driven, su test y su medición). Es el trabajo más caro del plan, con `animation-timeline` en longhands por Lightning CSS, escena alta en un tráfico 82% móvil y Firefox sin soporte, y no produce nada indexable que el póster estático no dé.
- **Tareas 11 y 12** — `TrackMap.astro` y el marcador que se ilumina al scroll. Dependen de la tarea 10 programática.
- **Tarea 13** — carga del resto de obstáculos desde el CMS, que por definición es crecimiento continuo.

**Lo que el plan pedía y ya está resuelto:** la sección 9 de `docs/07` («insumos que bloquean la Fase 1 → 2») listaba exactamente lo que el club acaba de confirmar. El plan lleva bloqueado desde marzo por esa lista; esta es la primera vez que se puede ejecutar.