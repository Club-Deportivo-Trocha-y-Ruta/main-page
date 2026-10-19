# Plan — página web de la VI Válida Copa Valle · Yumbo (18 de octubre de 2026)

> 6-oct-2026. Faltan 12 días. Pedido del usuario: una página del sitio para la válida con el
> agradecimiento a los aliados, las fotos oficiales del evento descargables en calidad original
> (que traigan tráfico) y los datos relevantes del evento cuando existan. Complementa el plan de
> redes (`../../plan-redes-valida-yumbo-2026-10-18.md`, §17 «Complemento web») y reemplaza, para
> esta fecha, el plan del 29-ago que vive en la rama `feature/valida-yumbo-ficha-evento`
> (evaluación en `evaluacion-rama-ficha-evento.md`). Investigaciones de apoyo:
> `investigacion-galeria-fotos.md` (cómo entregar las fotos) e `investigacion-imagen-menores.md`
> (marco legal y política de imagen).
>
> **Estado (7-oct)**: **construida y verificada, oculta** (`published: false`). Existen
> `src/pages/copa-valle-yumbo-2026.astro`, `ValidaAllies` y `ValidaNumbers`, el island
> `RacePhotoGallery`, `src/lib/valida.ts` y `jpeg-meta.ts` con tests, el pipeline
> `scripts/valida-fotos.mjs`, la subida `scripts/media-push.sh`, los cuatro JSON de
> `src/data/valida-yumbo-2026/` y la referencia en `docs/04` §30. **7-oct**: los datos reales
> quedaron restaurados y limpios (manifest de fotos vacío hasta el lunes 19) y **separados de los de
> prueba**, que viven en `preview/` y la página solo lee con `VALIDA_PREVIEW=true`
> (`npm run valida:preview` sirve ~420 fotos de prueba; ver `fotos-operacion.md` y `docs/04` §30).
> **Rediseño de la distribución en curso**: franja y muro de aliados, índice flotante y galería con
> 12 fotos por categoría en «Todas». Suite completa, typecheck, lint y build estaban en verde el 6-oct;
> revisión de opus en `revision-opus-pagina.md`. **Sin commits**: todo está en el árbol de trabajo.
> **Cómo publicar**: `fotos-operacion.md` (paso 10). **Cómo retomar con Claude**: «Lee
> `claudedocs/valida-yumbo-2026/web/plan-pagina-valida.md` y `fotos-operacion.md`».

## 1. La idea

Una sola URL para la válida que sirva **antes** (información práctica y aliados), **el domingo**
(destino del QR de los pendones y de las historias) y **después** (fotos descargables,
resultados, «2026 en números», gracias). La página vive para siempre como archivo de la válida y
es la prueba de visibilidad que se le entrega a cada marca el 25 de octubre: vistas de la página
y clics por marca (`sponsor_click`), medidos en GA4.

Lo que trae tráfico son las fotos: unas 250 familias de 24 municipios buscando su foto el lunes.
Los aliados viven en esa misma página, debajo de las fotos, así que cada visita los ve.

## 2. Dónde vive

**Propuesta: `/copa-valle-yumbo-2026`**, página propia construida con el sistema editorial
(`SectionShell` → `SectionIntro` → dato ilustrado → paso siguiente), no una ficha genérica.

| Opción | A favor | En contra |
|---|---|---|
| **A. Página propia `/copa-valle-yumbo-2026`** (recomendada) | URL corta para QR y WhatsApp; coincide con lo que se busca («copa valle yumbo»); libertad para diseñar el muro de aliados y la galería como protagonistas; no toca schema ni CMS; se publica esta semana | No da URL al resto de eventos (no hace falta ahora) |
| B. Mergear la rama y construir sobre `/calendario/copa-valle-yumbo-2026` | Infraestructura genérica (ficha por evento, JSON-LD con URL propia, 62 tests) lista para 2027 | 9–11 h solo en ponerla al día (tarifa extraordinaria, año de nacimiento, 25 categorías, tema oscuro, 12 fichas casi vacías, slug viejo de Roldanillo) antes de empezar lo pedido; riesgo en `main`, que no tiene gate de tests |

De la rama se toman piezas sueltas, sin conflicto con `main`: el catálogo de analítica con
`content_id` + el test de paridad (`analytics-parity.test.ts`), `AddToCalendar` con `raceId`,
`mapProvider()` y la guarda de `Offer` en `seo.ts`. El merge completo de la ruta genérica queda
para después de la válida, sin fecha encima.

## 3. Secciones de la página

Orden y tono (alternan entre contiguas, docs/04):

| # | Sección | Tono | Antes del 18 | Después del 18 |
|---|---|---|---|---|
| 1 | **Apertura**: eyebrow «VI Válida Copa Valle», H1, fecha, Pista Carlos Castro, botones «Agregar a calendario», «Cómo llegar» (Google Maps / Waze, con `content_id`) y «Inscripción oficial» | tinted + topo | Afiche oficial como imagen; `og:image` propio | Se cambia el CTA por «Ver las fotos» |
| 2 | **Lo esencial** (`FactGrid`): fecha y hora de inicio, circuito, inscripción ordinaria (hasta jue 15, 6:00 p. m.: $50.000 teteros / $70.000) y extraordinaria (dom 18, 7:00 a. m., en la mesa: $70.000 / $90.000), categorías por año de nacimiento (lámina 3 del carrusel oficial), cronograma de mangas **solo si la Comisión lo confirma por escrito** | plain | Texto que no depende de «hoy» (el sitio es estático) | Se conserva como ficha histórica |
| 3 | **Fotos oficiales** | muted | Aviso: «Las fotos del domingo estarán aquí desde el lunes 19, para descargar en calidad original», con el aviso de imagen y el canal de retiro | La galería (§5) |
| 4 | **Con el patrocinio de** — muro de 15 aliados + **Con el apoyo de** ASCOMY; debajo, la franja institucional del afiche | plain | Desde el día 1; se actualiza con cada «Se suma» (último: mié 14) | «Gracias a quienes lo hicieron posible» |
| 5 | **La casa**: la Pista Carlos Castro (2012 primera válida · 2019 Juegos Nacionales · 2021 Panamericanos Junior), enlace a `/la-pista`, y cifras históricas aprobadas (§6) | muted + yumbo | Sí | Sí |
| 6 | **Resultados y 2026 en números** | tinted | No se pinta | Enlace a resultados oficiales, podios del club, cifras del día (§6), enlace a la crónica y al álbum |
| 7 | **Paso siguiente**: «Próxima parada: Roldanillo, 7 y 8 de noviembre» + `InscriptionCTA` | dark | Sí | Sí |

Reglas del sitio que aplican: si un dato no existe, el bloque no se pinta; texto visible fuera de
la plantilla (`src/data/valida-yumbo-2026/*.json`); contraste con tokens (`text-text-primary`,
`bg-surface-raised`, `border-hairline`, placas blancas para logos con `dark:bg-white`); cero JS
nuevo salvo el visor de fotos (island existente, ampliado).

## 4. Aliados

- Fuente: `src/data/valida-yumbo-2026/aliados.json` (19 marcas al 9-oct —16 al 6-oct más Mera Artesanal, la Alcaldía de Yumbo (apoyo) y Coordinadora—, orden de llegada; `role`
  `patrocinio` | `apoyo`; `instagram` solo cuando está confirmado; `tagline` opcional). Logos en
  `public/images/valida-yumbo-2026/aliados/<id>.webp` (≤ 640×400, con alfa, 484 KB en total),
  generados con `node scripts/prepare-valida-aliados.mjs` desde `../marcas/<id>/logo.png`.
- Cada tarjeta: placa blanca con el logo, nombre, tagline si existe, enlace a Instagram si
  existe (`data-analytics-event="sponsor_click"` + `data-analytics-sponsor-id`). Sin niveles
  mientras Oscar no los confirme.
- Franja institucional del afiche: Liga de Ciclismo del Valle, Paraíso de Todos, Indervalle,
  IMDERTY, GW, Manzur, Comisión Vallecaucana de Ciclomontañismo, Gobernación del Valle, Alcaldía
  de Yumbo, Shimano. **Solo hay logo de Alcaldía e IMDERTY** (`public/images/sponsors/`); los
  otros ocho hay que pedirlos (ver §9).
- Regla del plan de redes: ningún logo sobre fotos con niños; las marcas van en tarjetas.

## 5. Fotos oficiales — arquitectura propuesta

Base: `investigacion-galeria-fotos.md` (6-oct). Conclusión: **autoalojar en Hostinger**, en el
mismo dominio. Ninguna plataforma gratis entrega el original (Flickr lo bloqueó en mayo de 2025,
Pixieset no da resolución completa, Drive bloquea 24 h lo que se descarga mucho), las pagas se
llevan el tráfico, y `<a download>` solo funciona con archivos del mismo origen. Ningún club ni
liga colombiana tiene galería descargable en su propio sitio: sería un diferencial.

- **Fuera de git.** Copia maestra en el Mac (`~/Trocha-media/valida-yumbo-2026/original/`) y
  en un disco aparte: Hostinger dice en su contrato que el hosting «no es un archivo». Es la
  Fase 0 de `docs/10-plan-media-hostinger.md`, adelantada solo para esta carpeta:
  `/public_html/media/valida-yumbo-2026/`, mismo origen que el sitio (la CSP `'self'` ya lo
  cubre), subida con lftp desde el Mac. **Retención**: originales hasta el 31-ene-2027; después
  queda solo la versión web.
- **El disco es el límite real.** Un plan Premium comprado desde el 17-dic-2025 trae 20 GB;
  Unlimited (antes Business), 50 GB; Cloud Startup, 100 GB. 1.500 originales de 10 MB son 15 GB.
  Hay que mirar el plan y el disco libre en hPanel antes del 18; si es Premium, pedirle al
  fotógrafo JPG a resolución completa con calidad ≈90 (3-5 MB). Sin «descargar todo» en ZIP. El
  CDN de Hostinger está apagado hoy; si se enciende, convierte los JPG a WebP y los «originales»
  dejan de serlo: dejarlo apagado o excluir esa opción.
- **Pipeline** `scripts/valida-fotos.mjs` (sharp, ya instalado): de cada original genera
  `web/<id>.webp` (1600 px, ≈250 KB), `thumb/<id>.webp` (480 px, ≈30 KB), una versión para
  compartir de 1080 px con una banda discreta (club, aliados, URL) y copia `original/<id>.jpg`
  sin GPS ni datos del autor en el EXIF (conserva la orientación; el original va limpio, sin
  banda). Escribe `manifest.json` con id, ancho, alto, hora de captura y **manga asignada por
  hora**; se copia a `src/data/valida-yumbo-2026/fotos.json`, que lee la página.
- **Cómo encuentra cada familia su foto.** El lunes, **por manga**: la hora EXIF cruzada con la
  hora real de salida de cada manga (el domingo temprano se fotografía un celular con la hora
  para sincronizar cada cámara y se anota la hora real de cada largada; en Alcalá una manga
  salió 50 minutos tarde). Del martes en adelante, **por número de placa**: OCR local con Apple
  Vision en el Mac (gratis; las fotos de menores no salen del equipo) más revisión humana, 1-2 h
  por cada 1.000 fotos; la prueba del 6-oct con tres fotos del club acertó 4 placas de 11 y leyó
  2 con un dígito de más, así que pre-etiqueta pero no reemplaza la revisión. Un enlace por placa
  (`?placa=123`) es lo que el papá reenvía a la familia. **Nada de reconocimiento facial**: son
  menores y la biometría es dato sensible.
- **Página**: unas 30 fotos escogidas en el HTML (indexables) y el resto desde el JSON en una
  isla `client:visible` que agrupa por manga («Manga 3 · Infantiles»), filtra por placa, abre el
  visor y ofrece «Descargar original» y «Compartir». Pie de foto solo con manga y categoría,
  **nunca nombres**. En iPhone el `download` va a Archivos, no a Fotos: la página lo explica
  («mantén presionada la foto → Guardar en Fotos») u ofrece la hoja de compartir. Junto al botón
  de descarga: «Fotos gratis gracias a…» con los aliados.
- **Fuera de Google Imágenes**: `X-Robots-Tag: noindex` en el `.htaccess` de
  `/media/valida-yumbo-2026/`, sin sitemap de imágenes; solo la página del evento se indexa.
- **GA4**: `gallery_search`, `photo_download` y `photo_share` con `content_id` = id de la foto;
  **nunca el número de placa como parámetro** (identifica a un menor).
- **Vista previa en WhatsApp**: `og:image` de menos de 300 KB, ≥300 px de ancho, proporción
  ≤ 4:1, y el `<head>` dentro de los primeros 300 KB del HTML.
- **El lunes, una persona**: copiar y respaldar (20 min) → agrupar por manga (30 min) → sharp
  (15 min) → subir con lftp (30 min a 50 Mbps, 2 h 15 min a 10 Mbps: **medir la velocidad de
  subida antes**) → build y deploy (15 min). Total 1,5-3 h sin placas; las placas, del martes.
- **Política de imagen**: ver §5.1 y §9, pregunta 4. Además, el acuerdo con el fotógrafo debe
  permitir repartir los originales gratis y la página le da crédito (Ley 23 de 1982, art. 30).

### 5.1 Política de imagen (de `investigacion-imagen-menores.md`)

Lo verificado en la norma: una foto que identifica a un niño es dato personal (Ley 1581, art. 3)
y para la SIC el rostro es biométrico, es decir, sensible; los datos de menores exigen
autorización previa, expresa e informada del representante, con finalidades específicas y oído el
niño (Ley 1581, art. 7; Decreto 1377, arts. 5 y 12); y un dato no público no puede quedar abierto
en internet «salvo que el acceso sea técnicamente controlable» (Ley 1581, art. 4 f). Correr en
un escenario público no vuelve pública la foto. Antecedente: en 2022 la SIC ordenó a un concurso
infantil borrar imágenes de una menor publicadas sin autorización. La práctica del sector
(álbumes abiertos en Facebook, prensa con nombres de ganadores infantiles) va por debajo de la
norma. **No es asesoría legal**: el club debe consultarlo.

**El pivote**: el registro de la Copa Valle ya exige una «autorización para el uso de material
fotográfico» firmada por el acudiente, pero su texto no es público. Si cubre al operador de la
válida y la finalidad «galería para las familias», el club tiene base para publicar; si no, no.
Pedir el texto a la Comisión **antes del martes 13**.

**Diseño propuesto, en dos niveles**, que funciona con o sin esa autorización:

| Nivel | Qué contiene | Acceso | Cuándo |
|---|---|---|---|
| **Abierta** | Planos generales: salidas, pelotón, pista, ambiente, público, marcas; podios de conjunto sin nombres solo si la autorización de la Comisión cubre al club | Pública, indexable, descarga libre | Lunes 19 |
| **Por deportista** | Primeros planos y fotos cuyo foco es un niño | Solo su familia: placa + código aleatorio entregado con el número (o a solicitud por WhatsApp si no hay código); enlace fuera de buscadores; 30 días en línea | Del martes 20, cuando estén etiquetadas las placas |

Reglas en ambos niveles: sin nombres de menores; sin caídas, lesiones ni llanto; marca «Sin
fotos» en la mesa de números para quien no autorice (y si el niño no quiere salir, no sale);
retiro el mismo día por WhatsApp o correo, con bitácora; originales sin GPS, número de serie,
miniatura ni nombres; nada de reconocimiento facial; el número de placa solo no es llave
suficiente (es público y se recorre del 1 al 300).

Textos listos para adaptar en el informe: política de una página, aviso de la página, aviso
físico para la mesa de números, el ingreso y el podio (con QR a la política), y la lista de lo
que se le pide a la Comisión. El informe también señala que la política de datos del sitio admite
«aceptación tácita por navegación», contraria al art. 7 del Decreto 1377: conviene corregirla.

Cómo se implementa el nivel «por deportista» en un sitio estático: enlaces privados por placa
generados por el pipeline a partir del etiquetado (`/media/valida-yumbo-2026/corredores/<token>/`,
listado de directorio apagado, `noindex`), con el token impreso en el sobre del número o enviado
por la plataforma de la Comisión; alternativa con control real, un gate mínimo en PHP en Hostinger
que verifique placa + código y sirva el archivo desde fuera de `public_html`. Se decide con la
respuesta de la Comisión.

## 6. Datos: qué cifras sí van

**Histórico (antes y después)**, con la fuente al pie («Datos: resultados de la Comisión
Vallecaucana de Ciclomontañismo, 2022, 2024 y 2025»): cerca de 600 ciclistas distintos han
corrido en Yumbo al menos una vez; más de 30 corrieron las tres ediciones; en 2025 llegaron de 24
municipios y 5 departamentos; de 4 a más de 60 años el mismo día; 96 de cada 100 terminan; el
club en casa: 65 participaciones y 9 podios en tres ediciones. Son los ángulos ya aprobados en
`../yumbo-en-numeros.md` §2 y en la serie «Copa Valle en números».

**No va** la infografía para la junta (`me/output/copa-valle-yumbo/historico-yumbo-2022-2026`):
muestra la caída 340 → 242 → 228 y una proyección, que el usuario decidió no publicar (30-sep).

**Después del 18**: desde la base de resultados (`me/backend`, solo conteos agregados, patrón de
`infografia_yumbo.py`) sale `src/data/valida-yumbo-2026/datos.json`: corredores, terminaron,
mujeres, categorías, municipios, clubes, niños hasta 12 años, podios del club y «de los 33,
volvieron N». Regla de `../yumbo-en-numeros.md` §8: si el total queda por debajo de 2025 no se
publica el total; municipios, el final más ajustado y los 33 van siempre. Cada cifra del JSON
es opcional: lo que no está, no se pinta.

### 6.1 Pendiente: los 20 mejores promedios por vuelta de 2026 (pedido del usuario, 7-oct)

**Qué pidió**: en las cifras de la página (`ValidaNumbers`, `#cifras`), el top 20 de los mejores
promedios por vuelta registrados en la válida de 2026, con sus tiempos y la diferencia con los demás.
**Por qué por vuelta**: unas categorías dan más vueltas que otras; el promedio (tiempo total ÷ vueltas)
es lo que las vuelve comparables. **Alcance**: solo las categorías que hacen el 100 % del recorrido
(vueltas completas al circuito largo; las de recorrido corto o vuelta reducida quedan fuera).

**Cuándo**: cuando estén los resultados oficiales. **El usuario dirá** qué categorías hicieron el
recorrido completo, cuántas vueltas dio cada una y los resultados. Nada de esto se adivina ni se saca
de la base antes de que él lo confirme.

**Cálculo propuesto** (lógica pura en `src/lib/valida.ts` con test, como el resto de las cifras):
promedio = tiempo total ÷ vueltas, ordenado de menor a mayor, primeros 20; por cada fila, la
diferencia por vuelta con el primero (`+0:12`) y, si suma, con el puesto anterior. Precisión: la de los
resultados (décimas si las traen).

**Decisiones que hay que tomar con el usuario cuando lleguen los datos**:
1. **Nombres.** Regla de la página: nunca el nombre de un menor (y junior y prejuvenil pueden
   serlo); qué nombre aparece en resultados lo decide el club. Por defecto, sin nombres (puesto,
   categoría, vueltas, tiempo total, promedio, diferencia); con nombres solo si el club lo autoriza
   y solo de mayores de edad.
2. **Quienes llegan con vueltas de menos**: ¿se excluyen (propuesta: sí, solo los que completaron
   todas las vueltas de su categoría) o se promedian con las vueltas que dieron?
3. **La salida**: el tiempo total incluye el arranque desde la parrilla; si la primera vuelta no es
   el circuito completo, el promedio se sesga y hay que saberlo.
4. Si además va a redes (carrusel), con la fuente al pie como toda pieza con cifras.

**Datos y presentación**: un campo opcional nuevo en `datos.json` (schema Zod + test de coherencia en
`valida-data.test.ts`) con las vueltas por categoría y los tiempos por corredor; el ranking se calcula
en el build. En la página, un bloque «Los 20 mejores promedios por vuelta» dentro de Cifras, con la
diferencia dibujada (usar la guía `dataviz` al hacerlo) y la fuente: «Datos: resultados de la
Comisión Vallecaucana de Ciclomontañismo, VI Válida 2026». Sin datos, el bloque no se pinta.

## 7. SEO, analítica y compartir

- `<title>`: «VI Válida Copa Valle 2026 en Yumbo: inscripción, categorías, cómo llegar y fotos
  oficiales». JSON-LD `SportsEvent` (`generateEventJsonLd`, con la guarda de `Offer` de la rama)
  y, después, `ImageGallery`. `og:image` 1200×630 recortado del afiche o de una foto real de la
  pista. Entra al sitemap y a Pagefind. Pedir inspección de URL en Search Console el día que se
  publique.
- Eventos GA4 nuevos (declarar en `events.ts` **y** en `Analytics.astro`, con el test de paridad
  de la rama): `race_directions_click`, `race_registration_outbound`, `race_calendar_add`,
  `photo_download`; parámetro nuevo `content_id`. Registrar `content_id` como dimensión en GA4 el
  día del despliegue: no es retroactiva.
- Enlaces hacia la página desde fuera, siempre con UTM (`docs/05`): `utm_campaign=copa-valle-yumbo-2026`
  y `utm_content` por pieza (`kit-whatsapp-v2`, `historia-cierre`, `qr-pendon`…). Enlaces
  internos sin UTM. Botón «Compartir por WhatsApp» (`WhatsappShareButton`) al pie.
- `AnnouncementBar`, `/enlaces` y la tarjeta del evento en `/calendario` pasan a enlazar a esta
  página mientras sea la próxima fecha.

## 8. Calendario de trabajo

| Cuándo | Qué | Quién |
|---|---|---|
| Mar 6 – mié 7 | Respuestas a §9; v1 de la página (apertura, lo esencial, aliados, la casa, aviso de fotos); piezas de la rama; tests; revisión en los dos temas y en móvil | Claude (sonnet monta, opus revisa) |
| Jue 8 | **v1 en producción** y en Search Console; la URL entra en la nota a medios (plan de redes §16.6), en el kit de WhatsApp v2 y en el QR de los pendones | Usuario |
| Hasta mié 14 | Aliados nuevos («Se suma») y logos institucionales que lleguen | Usuario → Claude |
| Vie 16 | Solo texto: cronograma y logística confirmados; `og:image` congelado | Claude |
| Sáb 17 – dom 18 | Pipeline de fotos probado con las fotos del sábado («todo listo»); el domingo, el fotógrafo entrega los originales | Usuario / fotógrafo |
| **Lun 19, antes del mediodía** | Fotos procesadas y subidas; galería, resultados oficiales y crónica publicados | Usuario + Claude |
| Jue 22 | `datos.json` desde la base; «2026 en números» si procede | Claude |
| Dom 25 | Reporte a las marcas con vistas de la página y clics por marca | Usuario |

## 9.1 Decisiones del usuario (6-oct, tarde)

| Pregunta | Respuesta | Consecuencia |
|---|---|---|
| 1 URL | Página propia | `/copa-valle-yumbo-2026`, construida con el sistema editorial; de la rama solo se toman el catálogo de analítica con `content_id` y el test de paridad |
| 2 Fotógrafo | Pagado por el club; entrega un enlace de Drive con todas las fotos, **con marca de agua**; la licencia permite la descarga gratis | El «original» que se descarga es el JPG con marca de agua tal como lo entrega; el pipeline solo le quita EXIF (GPS, serie) y aplica la orientación sin pérdida |
| 3 Hostinger | Tiene las credenciales FTP; suele subir un `.zip` y descomprimirlo en hPanel | `scripts/media-push.sh` (lftp) como vía principal y zips por subcarpeta como alternativa documentada; el plan y el disco libre siguen sin confirmar |
| 4 Política de imagen | No entendió la pregunta | Se explica en lenguaje llano; el diseño queda con el interruptor: todo abierto salvo los ids que el club marque como «familiar» (`--familiar lista.txt`), que se entregan por WhatsApp. Pendiente: que Oscar pida a la Comisión el texto de la autorización de fotos |
| 5 Placas | No entendió la pregunta | Por defecto, agrupación por manga (automática). Etiquetar placas es opcional y queda documentado |
| 6 Aliados | Sin orden ni niveles, todos iguales | Rejilla uniforme en orden alfabético; ASCOMY conserva la etiqueta «Apoyo»; instituciones del afiche en texto (faltan sus logos) |
| 7 Datos | Sí, con creatividad; el foco son fotos y aliados | Ángulos aprobados de `datos.json`, presentados con el sistema editorial; sin la caída de corredores ni la proyección |
| 8 Info práctica | La página es **posterior** a la carrera; lo práctico va en Instagram | Se eliminan las secciones de inscripción, cómo llegar y cronograma |
| 9 Publicación | Se mantiene en borrador | `published: false` → `noindex`, fuera del sitemap y sin enlaces (patrón de `/equipo`); se activa el lunes 19 |
| 10 Retiro | No entendió la pregunta | Canal por defecto: WhatsApp y correo del club, retiro el mismo día; el texto va en la página |

Indicaciones adicionales del usuario: «como si fuera un top mundial en este tipo de cosas» y «responsive, con tags de analítica y eventos».

## 9. Preguntas abiertas (para el usuario, 6-oct)

1. **URL y enfoque**: ¿página propia `/copa-valle-yumbo-2026` (recomendada) o mergear la rama y
   construir sobre `/calendario/copa-valle-yumbo-2026`?
2. **Fotógrafo**: ¿quién toma las fotos oficiales, con qué cámara, cuántas se esperan, entrega
   los originales el mismo domingo, quiere crédito o marca de agua, y firma una licencia que
   permita la descarga gratis?
3. **Hostinger**: ¿qué plan tiene el club y cuánto disco libre hay en hPanel? ¿Tienes las
   credenciales FTP a mano (no están en el `.env` local)? ¿Cuál es la velocidad de subida de tu
   internet?
4. **Política de imagen** (la decisión grande, con el club y de ser posible un abogado):
   (a) dos niveles, abierta con planos generales y por deportista con placa + código
   (recomendada); (b) todo abierto apoyado en la autorización de la Comisión, si su texto cubre
   al club y la galería; (c) solo planos generales. Y en todo caso: pedir a la Comisión el texto
   de la autorización antes del martes 13, y confirmar quién atiende la mesa de números (para la
   marca «Sin fotos» y el código).
5. **Cómo encuentra cada quien su foto**: por manga el lunes (automático) y por placa desde el
   martes (OCR local + revisión, 1-2 h por cada 1.000 fotos): ¿hay quien revise el martes?
6. **Aliados**: ¿orden de llegada o alfabético? ¿Van los institucionales del afiche? Faltan ocho
   logos (Liga, Paraíso de Todos, Indervalle, GW, Manzur, Comisión, Gobernación, Shimano): ¿se
   piden a Oscar o a la Comisión? ¿Tienes una línea descriptiva de cada aliado (solo tengo seis)?
7. **Datos**: ¿confirmas que en la web van solo los ángulos aprobados (§6) y no la infografía
   de la junta? Después del 18, ¿qué cifras quieres y quién entrega el PDF oficial y cuándo?
8. **Información práctica confirmada por escrito**: cronograma de mangas, URL exacta de
   inscripción, parqueadero, zona de público. Lo que no esté confirmado no se pinta. ¿Hay una
   foto horizontal real de la pista para el `og:image` o uso el afiche?
9. **Publicación**: ¿v1 el jueves 8, directo a `main` o vía `develop`? ¿Quién despliega el
   lunes 19? ¿El QR de los pendones apunta a esta URL?
10. **Canal de retiro de imágenes**: ¿WhatsApp del club + correo, respuesta el mismo día? ¿Quién
    lo atiende la semana del 19? ¿Corregimos de paso la política de datos del sitio?
