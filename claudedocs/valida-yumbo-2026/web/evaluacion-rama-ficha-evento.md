# Evaluación de la rama `feature/valida-yumbo-ficha-evento`

*6-oct-2026. Solo lectura; pruebas en worktrees temporales ya eliminados.*

**Veredicto: (a) mergear y corregir, pasando por `develop`.** El código está sano y el merge es mecánico. Lo viejo son los datos y dos decisiones de modelo (tarifa extraordinaria y año de nacimiento). Estimado: **9–11 h** hasta una ficha publicable, más **3–4 h** por los bloques de aliados y material descargable, que la rama no trae.

## 1. Historia

- Un solo commit: `4a81d1e`, 29-ago-2026 20:15, «feat(calendario): agrega ficha propia para cada válida con medición GA4»; 20 archivos, +2.345 / −111; base `9516187` (29-ago).
- `main` tiene **59 commits** que la rama no tiene: tema claro/oscuro, `/la-pista`, `shortName`, categoría `dh`, numeración VI/VII.
- El plan de redes del 22-sep (§17.2) ya cuenta con ella: «sacar a producción la ficha… antes, actualizarla con el carrusel oficial».

## 2. Conflictos

`merge-tree` marca 6 archivos; el resto (`Analytics.astro`, `events.ts`, `seo.ts`, `calendar.ts`, `AddToCalendar`, `SeasonOverview`, tests) fusiona solo. `Analytics.astro` y `events.ts` no cambiaron en `main`.

| Archivo | De qué va | Resolución |
|---|---|---|
| `public/admin/config.yml` | Ambos añaden un campo en el mismo punto (`shortName` / `urlSlug`) | Conservar los dos |
| `src/lib/schemas.ts` | Lo mismo en `eventsSchema`; además el enum `category` (main trae `dh`) | Ambos campos; gana main en el enum |
| `src/lib/__tests__/schemas.test.ts` | La rama inserta 5 tests donde main tiene uno: choque de contexto | Quedarse con los de la rama |
| `src/components/common/EventCard.astro` | Solo formato: main reformateó el bloque donde la rama pasa `raceId` | Formato de main + `raceId` |
| `src/pages/calendario.astro` | main añadió `scheduledJsonLd`; la rama, `nextRegistrationHref` con UTM, y cambió la `url` del `ItemList` | Conservar ambos; los JSON-LD apuntan a `eventPath()` |
| `src/content/events/2026-10-copa-valle-vii-yumbo.md` | Main dice VI y trae el párrafo de Roldanillo; la rama, VII/Séptima, sin «Información general» ni «Categorías» | Título, `shortName` y párrafos de main + `urlSlug`; sin las dos secciones |

Los resolví a mano en un worktree descartable (sin `git merge`): typecheck 0 errores, lint limpio, **83 archivos / 1.764 tests verdes** (línea base de `main`: 80 / 1.702).

## 3. Qué construye la rama

**Página `/calendario/[slug]`** (una por evento no borrador: 13 hoy). Secciones en orden:
1. Apertura: miga, día y mes grandes, insignias de modalidad y nivel, H1, aviso de cancelada, botones «Agregar a calendario» (Google/.ics) y «Cómo llegar» (solo con `mapUrl`).
2. «La ficha»: `FactGrid`, frase del plazo en tres estados, botón «Inscríbete en la página oficial» con UTM (solo si está abierto), nota «datos revisados el…».
3. «Categorías» (si hay): cronograma del día y mangas con hora, vueltas y km (solo si la vuelta es completa).
4. Convocatoria (markdown). 5. «La temporada». 6. Crónicas del evento. 7. «Otras fechas» (las 4 más cercanas). 8. Cierre: `InscriptionCTA`, compartir, `ScrollDepth`.

**`src/lib/race.ts`** (puro, 9 funciones):
`formatKm` (3.8 → «3,8»); `chroniclesOf` (cruza `relatedEvent` y `relatedNews`, sin borradores ni referencias rotas); `otherDates` (las 4 fechas del año más cercanas); `registrationOpen` (true / false / null; el estado manda sobre el plazo); `raceFacts` (hechos del `FactGrid`, omite los sin dato); `mapProvider` (google-maps / waze / otro); `formatRaceTime` («08:30» → «8:30 a. m.»); `categoryDistance` (km solo sin `course`); `groupCategories` (mangas por orden de largada).

**Schema (`eventsSchema`)**: `urlSlug` (no `slug`: el loader de Astro lo reserva y renombra el `id`), `updatedAt`, `venueSlug`, `circuit {distanceKm, laps?, surface?}`, `fees [{label, amount}]`, `capacity`, `categories [{name, group?, startTime?, ageMin?, ageMax?, laps?, course?}]`, `schedule [{time, title, place?}]`.

**Analítica**: eventos `race_registration_outbound`, `race_directions_click`, `race_calendar_add`; parámetros `race_id` y `content_id` (`google-maps | waze | otro | google-calendar | ics`). `AddToCalendar` y `EventCard` aceptan `raceId`; `/calendario` instrumenta y pone UTM a los CTA de la próxima fecha.

**Otros**: `seo.ts` deja de emitir `Offer InStock` en fechas canceladas o corridas; `calendar.ts` suma `eventSlug`, `eventPath`, `formatCop`; portada, `/calendario` y `EventCard` enlazan a la ficha.

**Tests nuevos (62)**: `race.test.ts` 42; `analytics-parity.test.ts` 4 (listas de `Analytics.astro` vs `events.ts`, lectura de los `data-*`, allowlist de PII); `race-render.test.ts` 2 («octubre 2026» sin pegarse); 14 más en `calendar`, `schemas` y `content-validation` (colisión de URL, prohibido `slug`).

**Lo que no trae**: aliados, descargas ni evento de descarga; su «cómo llegar» es solo un botón al `mapUrl` (sin parqueo ni ruta).

## 4. Lo que quedó desactualizado

Contra el carrusel oficial (`flyer-oficial/`), el plan de redes y `main`:

| La rama afirma | Hoy |
|---|---|
| «VII Válida», «Séptima» (título, cuerpo, `imageAlt`) | Es la VI. El merge toma título y cuerpo de main; `image` e `imageAlt` desaparecen (los quitó main; `placeholder-event.jpg` no existe) |
| Inscripción $70.000 / $50.000, nada más | Ordinaria hasta el jueves 15-oct, 6:00 p. m.; **extraordinaria el domingo 18, 7:00 a. m., en la mesa: $90.000 / $70.000**. Desde el 16 la ficha diría «El plazo de inscripción cerró» y retiraría el botón: falso para quien llega el domingo |
| 26 categorías, con «Máster D», «Máster femenino», «Élite femenino» | La lámina trae 25: sin «Máster D»; dice «Máster Damas», «Élite femenina», «Pre-juvenil». El schema modela **edad** (`ageMin/ageMax`); la Comisión publica **año de nacimiento** |
| Horarios y «Datos revisados… el 29 de agosto» | La lámina no trae horas; el plan de redes dice «hay que confirmarlas». Sin reconfirmar, el sello es falso |
| `registrationUrl` = raíz de `ciclomontañismovalle.com` | Resuelve (HTTP 200; la raíz tiene anclas `#inscripciones` y `#eventos`), pero no es la URL exacta |
| «Organiza: Comisión»; «las inscripciones las maneja el organizador, no el club» | Desde el 22-sep: el club opera lo local; la Comisión pone convocatoria, categorías y resultados |
| 3,8 km por vuelta | `/la-pista` calcula 3,7 km desde el GPX: dos cifras en el mismo sitio |
| Roldanillo sin `urlSlug` | Su ficha saldría en `/calendario/2026-11-copa-valle-vi-roldanillo` (numeral viejo; es la VII) |
| El plan (solo en la rama) | Supone Roldanillo cancelada, corte de indexación el 12-sep y un `workflow_dispatch` que no existe |

**Problemas que la rama no podía conocer**
- **Tema oscuro** (10-sep, posterior): `text-surface-dark` (#2f2f2f fijo) en horarios, categorías, nivel y aviso de cancelada da ≈1,2:1 sobre fondo oscuro; la insignia `bg-primary-deep text-white`, ≈1,8:1; `border-black/10` desaparece. Usar `text-text-primary`, `text-on-deep`, `border-hairline`. Ningún test lo detecta.
- **Fichas delgadas**: 12 de 13 eventos solo tendrían 3–4 datos (sin mapa, circuito, precios ni categorías): páginas casi idénticas. Decidir `noindex` o filtrar `getStaticPaths`.
- **Enlaces que no llegan a la ficha**: `chronicle.ts:125`, `gallery.ts:244`, `SeasonOverview.astro:108` y `AnnouncementBar.astro:37` siguen en `/calendario…`. El «Cómo llegar» de `/calendario` fija `content_id="google-maps"`: el error que `mapProvider()` corrige en la ficha.
- **Despliegue**: `deploy-prod.yml` solo dispara con push, y el estado de la ficha se congela en el build.

## 5. Calidad medida

- **Rama sola** (dependencias actuales de `main`): typecheck 0 errores / 0 advertencias; 1.576 de 1.577 tests. La única falla (`StatsCounter`, `--stagger`) no es de la rama: es anterior al commit `2453128` de `main`, que arregló ese test. Los 62 nuevos pasan.
- **No pude correr `astro build`**: con `node_modules` enlazado falla en el worktree (entorno, no código). No vi el HTML ni el tema oscuro; lo del tema sale de cruzar clases con los tokens de `global.css`. Correr `npm run build` antes de tocar `main`.

## 6. Veredicto

| Opción | Qué implica | Horas |
|---|---|---|
| **(a) Mergear y corregir** | Merge (0,5) · datos y modelo: tarifa extraordinaria, año de nacimiento, categorías vs. lámina, horas, URL, imagen (4–5) · tema oscuro (1) · fichas delgadas y slug de Roldanillo (0,5) · build, Lighthouse, ambos temas, GA4 (2) | 9–11 (+1,5 si se enlazan crónicas, álbumes y portada) |
| (b) Piezas sueltas | Portar `race.ts` + tests, analítica + paridad, `raceId`, guarda de `seo.ts`; armar una página única copiando secciones; mismas correcciones de datos | 10–12 |
| (c) Ignorar | Rehacer capa de datos, schema, CMS, analítica y página desde `main` | 14–18 |

**Recomiendo (a).** Cuesta lo mismo que (b) y conserva lo que (b) pierde: CTA de `/calendario` medidos y con UTM (hoy el tráfico saliente llega al organizador como «Direct»), JSON-LD con URL propia, test de colisión de URL y ruta lista para 2027. (c) rehace ≈8–10 h de trabajo ya probado. Se construye **sobre** la ficha, con dos bloques condicionales más (aliados desde `src/data/valida-yumbo-2026/aliados.json`; material oficial): el evento queda con una sola URL.

**Cómo llevarlo:** rama nueva desde `main` → conflictos como en §2 → correcciones de §4 → `develop` (su gate corre typecheck y tests; `main` no tiene gate) → revisar en ambos temas y en móvil → `main`. Registrar `race_id` y `content_id` en GA4 **el día del despliegue**: no son retroactivas.

**Piezas reutilizables si eliges (b)**, todas sin conflicto:
- `race.ts` + `race.test.ts` (necesita `formatCop` de `calendar.ts`; cambiar `ageMin/ageMax` por año de nacimiento y `fees` por fases).
- Catálogo: `events.ts` + lectura de `data-analytics-race-id/-content-id` en `Analytics.astro` + `analytics-parity.test.ts`. Llena un hueco: hoy nada en `main` impide que las dos listas se separen y el evento marque cero en silencio. Las descargas piden un evento nuevo; los aliados ya los cubre `sponsor_click`.
- `AddToCalendar` con `raceId` (ignorar el reformateo de los SVG) y la guarda de `seo.ts` (le falta test).
- `urlSlug` + `eventSlug/eventPath` + test de colisiones, si se adopta la ruta genérica.
- «Cómo llegar»: unas 10 líneas de plantilla; lo útil es `mapProvider()`.
