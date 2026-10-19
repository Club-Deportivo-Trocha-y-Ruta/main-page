# Galería oficial de fotos — VI Válida Copa Valle, Yumbo (18-oct-2026)

Investigación del 6-oct-2026. Tasa usada: USD 1 ≈ COP 3.300 (TRM del 1-oct-2026: $3.312,84). Lo que no pude confirmar va marcado «(sin verificar)».

## Resumen ejecutivo

1. **Recomendación: autoalojar en Hostinger** (`/public_html/media/valida-yumbo-2026/`, mismo dominio) con una página estática en Astro. No usar plataforma externa.
2. Es la única opción que cumple a la vez lo de **original + gratis + volumen + tráfico propio**: Flickr gratis bloquea originales desde mayo de 2025, Pixieset gratis no permite resolución completa y Drive bloquea 24 h los archivos muy descargados.
3. En el mismo origen el botón «Descargar» funciona (`download` + `Content-Disposition: attachment`), la familia ve a los 16 aliados y GA4 mide las descargas.
4. **Antes del 18-oct hay que revisar en hPanel el plan y el disco libre**: un Premium comprado desde el 17-dic-2025 trae 20 GB. 1.500 originales de 10 MB ocupan unos 15 GB.
5. El CDN de Hostinger parece apagado (cabeceras del 6-oct). Si se enciende, convierte los JPG a WebP por defecto: hay que desactivar esa opción o los «originales» dejan de serlo.
6. **El lunes, búsqueda por manga**: la hora de captura (EXIF) se cruza con las horas reales de salida de las 6 mangas. Sale en unos 30 minutos de trabajo.
7. **Del martes en adelante, búsqueda por número de placa**: OCR local en el Mac (Apple Vision, gratis, sin sacar fotos de menores del equipo) y revisión humana. Son 1-2 h por cada 1.000 fotos.
8. Nada de reconocimiento facial: las fotos son de menores y la biometría es dato sensible. Antes de publicar hay que validarlo con el responsable legal.
9. Para el tráfico: una URL corta anunciada en el evento, un enlace por placa para reenviar, la vista previa de WhatsApp con la banda de los aliados y la publicación el mismo domingo de un adelanto.
10. Para SEO: una sola página indexable por evento. Las páginas por foto llevan `noindex` y no se arma sitemap de imágenes.

## 1. Cómo entregan las fotos organizadores y fotógrafos

**Patrones de interfaz que se repiten:**

- **Búsqueda por dorsal**: es el estándar en running (BuscoDorsal, Fotop, Chuspic). Muchas plataformas añaden la búsqueda por selfie, y BuscoDorsal la deja como opción voluntaria con aviso previo.
- **Agrupación**: evento → categoría o punto de foto → hora.
- **Enlace por foto o por corredor** para compartir.
- **Fotos de cortesía** pagadas por un patrocinador o por el organizador: Pic2Go con Brooks, y en Fotop Colombia «Tu foto gratis» (UCI Gravel Bogotá, jul-ago 2026) y «Fotos de cortesía» (Media Maratón del Meta, 3-oct-2026).

**El atributo `download` solo funciona con URL del mismo origen** (o `blob:`/`data:`), según MDN. Desde un host externo, como mucho se abre la foto.

| Plataforma | Gratis y límites | ¿Original? | Búsqueda por dorsal | ¿Se pierde el tráfico? | Pago |
|---|---|---|---|---|---|
| Google Fotos (álbum compartido) | 15 GB de la cuenta; hasta 20.000 por álbum | Sí; «Descargar todo» en ZIP | No | Sí | Google One (sin verificar) |
| Google Drive (carpeta pública) | 15 GB | Sí | Solo por nombre de archivo | Sí | — |
| Dropbox Basic | 2 GB; enlaces con tope de 20 GB al día y bloqueo de 1 día | Sí | No | Sí | — |
| Flickr | 1.000 fotos; desde el 15-may-2025 no deja bajar originales ni >1024 px de cuentas gratis | No | No | Sí; permite incrustar | Pro (sin verificar) |
| Pixieset | 3 GB, **sin descarga en resolución completa** | Solo pago | No (sin verificar) | Sí | USD 10/mes ≈ COP 33.000 (10 GB); USD 20 ≈ COP 66.000 (100 GB) |
| SmugMug | Sin plan gratis; prueba de 14 días | Sí | No (sin verificar) | Sí | Desde USD 20/mes con pago anual ≈ COP 66.000 (ilimitado) |
| Zenfolio | Sin plan gratis | Sí | (sin verificar) | Sí | USD 9/mes ≈ COP 30.000 (15 GB) |
| Fotop, Chuspic, Nexotick | Cobran comisión por venta; Fotop tiene eventos «gratis» | Según el evento | Sí, más facial | Sí | Comisión (sin verificar) |
| Sportograf, MarathonFoto, Pic2Go | Ellos ponen el fotógrafo y el participante paga, o paga el patrocinador | Pagando | Sí | Sí | Foto-Flat de Sportograf ≈ €25 (sin verificar) |
| Immich, PhotoPrism | Software libre; necesitan Docker, es decir, un VPS, no el hosting compartido | Sí (enlace público con descarga) | No | No | VPS aparte (sin verificar) |
| Piwigo | PHP + MySQL; corre en hosting compartido (Hostinger lo lista entre sus aplicaciones; sin verificar en qué planes) | Sí (con permisos) | Con etiquetas | No | Gratis, pero es otro CMS que mantener |
| **Hostinger `/media/` + Astro** | El disco del plan | **Sí** | La armamos nosotros | **No** | COP 0 adicional |

## 2. Hostinger: límites reales

Datos de la página oficial «Parameters and limits», actualizada el 15-sep-2026:

| Plan | Disco | Inodos | Ancho de banda | Subida PHP máx. | CDN |
|---|---|---|---|---|---|
| Single | 10 GB | 200.000 | 100 GB | 1.024 MB | No |
| Premium | 20 GB | 400.000 | Ilimitado | 1.536 MB | Sí |
| Unlimited (antes Business) | 50 GB | 600.000 | Ilimitado | 2.048 MB | Sí |
| Cloud Startup | 100 GB | 2.000.000 | Ilimitado | 3.072 MB | Sí |

- **El disco depende de la fecha de compra.** Premium: 100 GB hasta el 23-abr-2025, 25 GB hasta el 16-dic-2025 y 20 GB después. Business: 200 → 50 → 50 GB. Cloud Startup: 200 → 100 → 100 GB. Desde julio de 2026, «Unlimited» reemplaza a Business.
- **Precios con pago a 48 meses** (renovación entre paréntesis): Premium USD 2,99/mes (10,99 ≈ COP 36.000); Unlimited USD 3,99 (16,99 ≈ COP 56.000); Cloud Startup USD 7,99 (25,99 ≈ COP 86.000).
- **Uso justo.** El contrato dice que lo «ilimitado» está pensado para «la operación típica del sitio web de una pequeña empresa», y que los servidores «no son un archivo». La copia maestra de los originales debe vivir en otro lado.
- **Compartir archivos está permitido** si el contenido es propio. Para «imágenes de alta resolución» Hostinger recomienda Cloud. (sin verificar: lo vi en el fragmento del buscador y la página dio 404).
- **No encontré un tope documentado para FTP.** Un JPG de 15 MB no tiene problema.
- **Inodos: no son el cuello de botella.** 1.500 originales y dos derivados son unas 4.500 entradas.
- **CDN propio**: incluido desde Premium. La compresión WebP viene **activada por defecto** y la «optimización inteligente» cambia el tamaño de las imágenes. No encontré cómo excluir una ruta. Hoy el sitio responde con `server: LiteSpeed` y sin cabeceras `x-hcdn-*` (curl, 6-oct), así que el CDN parece apagado. LiteSpeed lee `.htaccess` como Apache.
- **Almacenamiento de objetos**: no encontré un producto de Hostinger (sin verificar). Si el disco no alcanza, Cloudflare R2 da 10 GB gratis sin costo de salida, pero un dominio propio exige mover el DNS a Cloudflare (sin verificar). Es otro proveedor.

**Cuentas para esta válida**: 1.000-2.000 fotos de 5-15 MB son entre 5 y 30 GB de originales. Las miniaturas de 400 px y la versión de 1.600 px suman cerca de 0,5 GB por cada 1.500 fotos. Si cada una de 250 familias baja 15 originales, son unos 40 GB de tráfico en la semana.

Conviene:

- No ofrecer «descargar todo» en ZIP.
- Fijar retención: originales hasta el 31-ene-2027 y después solo la versión web.
- Si el plan es Premium V3, acordar con el fotógrafo un JPG a resolución completa con calidad cercana a 90, de unos 3-5 MB (sin verificar: medirlo con las primeras fotos).

## 3. Etiquetar unas 1.000 fotos por número de placa con una sola persona

**Prueba propia (6-oct)**: corrí Apple Vision en el Mac sobre 3 fotos del club de 1.600 px con 11 placas conocidas (`claudedocs/chequeo-profondos-2026/fotos/`). Partiendo cada foto en una rejilla de 3×3:

- **Acertó 4 de 11 placas** exactas.
- **Leyó 2 con un dígito de más** (`11257`, `1426`), que se recuperan cruzándolas con la lista de inscritos.
- **Perdió 5** y tardó unos 0,5 s por foto.

Con los originales en resolución completa debería rendir más (sin verificar). Sirve para pre-etiquetar, no reemplaza la revisión.

| Opción | Costo | Tiempo por 1.000 fotos | Privacidad | Veredicto |
|---|---|---|---|---|
| Hora EXIF + horas reales de las mangas | COP 0 | 20-30 min | Local | **El lunes** |
| Planilla manual (archivo → placas) | COP 0 | 2-3 h (estimación) | Local | Respaldo |
| OCR local (Apple Vision con `ocrit` o `apple-vision-utils`, o un script Swift) y revisión | COP 0 | 15 min de máquina + 1-1,5 h de revisión | Local | **Del martes en adelante** |
| Detectores libres (bib-detector YOLOv4-tiny, bibnumber) | COP 0 | Hay que entrenarlos: son para dorsales de running, no placas de manubrio | Local | No para esta fecha |
| RaceTagger | 100 análisis gratis al mes; paquete de 2.000 por €39 ≈ COP 140.000 | ~30 min por 500 fotos, según el fabricante (citado por 9Pic) | Nube (sin verificar) | Está pensado para números de vehículos; no probado |
| Etiquetado manual tercerizado | USD 0,01-0,03 por etiqueta; con 1.000 fotos × ~2 placas, ≈ COP 66.000-200.000 | Días | Las fotos de menores salen del club | No |
| Plataforma con reconocimiento facial (Fotop, Chuspic, Nexotick) | Comisión | Automático | Biometría de menores | No |

**Hora de captura.** El cronograma de la Comisión (versión del 29-ago, por confirmar) tiene 6 mangas (8:30 teteros, 9:00 pre-infantiles, 10:15 infantiles, 11:00, 11:20-11:50 y 12:40). Para que la hora sirva:

- El domingo temprano se sincroniza el reloj de cada cámara: se fotografía un celular que muestre la hora.
- Se anota la hora **real** de salida de cada manga. En Alcalá la manga 4 salió unos 50 minutos tarde.
- Se lee la hora con `mdls`, que ya usa el club, o con `exiftool`, que hay que instalar.

Los números se asignan por categoría (art. 6 del reglamento): con la planilla de inscritos, cada placa da la categoría.

**Lunes por la mañana, una persona**, suponiendo que el fotógrafo entrega el domingo por la noche:

| Paso | Tiempo |
|---|---|
| Copiar y respaldar 1.000 fotos (~10 GB) | 15-20 min |
| Agrupar por manga | 20-30 min |
| Generar las versiones web con sharp (adaptar `scripts/prepare-yumbo-assets.mjs`) | 10-15 min de máquina |
| Subir con lftp | ~30 min a 50 Mbps; ~2 h 15 min a 10 Mbps (**medir antes la velocidad de subida**) |
| Build y deploy de la página | 15 min |
| **Total sin placas** | **1,5-3 h** |
| Placas con OCR y revisión | +1-2 h por cada 1.000 fotos |

## 4. Qué hace que estas galerías traigan tráfico

- **Una URL corta decidida antes** (p. ej. `/fotos`) que repiten el locutor, un QR en la mesa de inscripción y en el podio, el grupo oficial de WhatsApp de la Comisión y una publicación en colaboración con @copavallemtb.
- **Velocidad**: 30-50 fotos el mismo domingo por la noche y el resto el lunes. Mibuc anunció fotos gratis de la Media Maratón de Cali, y el fragmento indexado dice «disponibles durante 48 horas» (sin verificar).
- **Un enlace por placa** (`?placa=123`): es lo que el papá reenvía a la familia.
- **Botón «Compartir»** con una versión de 1.080 px que lleve una banda discreta (club, aliados y URL). El original va limpio. Es el patrón de las fotos de cortesía patrocinadas.
- **Vista previa en WhatsApp**: según Meta, el `og:image` debe pesar menos de 600 KB, medir 300 px o más de ancho y tener una proporción de 4:1 o menos. El `<head>` debe estar en los primeros 300 KB del HTML. Otros reportan que con más de 300 KB no se muestra (sin verificar). Apuntar a 300 KB o menos.
- **iPhone**: con `download` la foto va a la app Archivos, no a Fotos. Hay que explicar «mantén presionada la foto → Guardar en Fotos» u ofrecer la hoja de compartir (Web Share con archivos) (sin verificar en iOS actual).
- **Cerrar el ciclo**: al lado del botón de descarga, «Fotos gratis gracias a…» con los 16 aliados, los resultados, la crónica y la inscripción a la escuela.
- **GA4**: agregar `gallery_search`, `photo_download` y `photo_share` al catálogo cerrado (`events.ts` y `Analytics.astro`), **sin enviar el número de placa** porque identifica a un menor.

**SEO:**

- Una página indexable por evento (encaja en `/galeria/[slug]`), con texto, enlaces y unas 30 fotos escogidas en el HTML. El resto se carga desde un JSON en una isla `client:visible`.
- Páginas por foto solo para compartir, con `noindex`, que además las saca de Pagefind. Si se generan en Astro, cada deploy de lftp las vuelve a subir. Escribirlas como HTML dentro de `/media/` lo evita.
- **Sin sitemap de imágenes.** Google lo recomienda para imágenes que solo se descubren con JavaScript, y aquí no queremos fotos de menores en Google Imágenes. Lo coherente es `X-Robots-Tag: noindex` en `.htaccess` de esa carpeta.

## 5. Ejemplos colombianos

| Quién | Cómo publica | Descarga | Búsqueda |
|---|---|---|---|
| Copa Valle (Comisión Vallecaucana) | Fotos en Instagram (@copavallemtb) y álbumes de Facebook de páginas y clubes. Los resultados van en Excel (sitio de la Comisión) o en enlaces de Drive. El sitio de la Comisión no tiene galería | Lo que deje Facebook (comprimido) | No |
| Copa MTB Antioquia (Liga de Antioquia) | Álbumes de Facebook con crédito al fotógrafo | Comprimida | No |
| Fundación Cali Bike Park | Sección de galería por año en su propio sitio (Webflow) y videos en YouTube | (sin verificar) | No |
| Media Maratón de Bogotá | FocoRace sobre Chuspic: selfie, nombre o número. Antes se acepta una autorización de uso de imagen | (sin verificar) | Facial y número |
| Maratón de Cali | «Yo Quiero Mi Foto» (Fotop) | Pago | Dorsal (sin verificar) |
| Mibuc (Cali: Carrera del Zoo, Ladera Run, MMC) | Índice de eventos en su WordPress que enlaza a su tienda en Fotop | Gratis en algunos eventos | Facial y placa |
| Fotop Colombia | «Fotos de cortesía» y «Tu foto gratis» | Gratis, patrocinada (resolución sin verificar) | Sí |
| Enfoque Fotografía Deportiva (ciclismo) | Venta: «todas tus fotos por $59.900» | Pago | (sin verificar) |
| Atletox | Galería con reconocimiento facial por COP 25.000 | Pago | Facial |
| Rodadas recreativas (Ruta Tamarindo 2026; sin verificar que sea en Colombia) | Carpeta de Drive compartida en un grupo de Facebook | Original | No |

**No encontré ningún club ni liga colombiana con galería descargable por corredor en su propio sitio.** En MTB, lo normal es Facebook; en running, Fotop o Chuspic con reconocimiento facial y casi siempre de pago. Hacerlo bien sería un diferencial del club.

**Pendientes que no son técnicos:**

- La autorización de imagen de menores (Ley 1581, art. 7; Ley 1098) y un canal para pedir que se retire una foto.
- Que el contrato del fotógrafo permita distribuir los originales gratis y que la página le dé crédito.

## Fuentes (consultadas el 6-oct-2026)

- Hostinger, límites: https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/ · versiones V1-V3: https://www.hostinger.com/support/10717644-new-web-and-cloud-hosting-limits-at-hostinger/ · precios: https://www.hostinger.com/web-hosting · contrato: https://www.hostinger.com/uk/legal/hosting-agreement · CDN: https://docs.hostinger.com/websites/cdn y https://www.hostinger.com/support/7935917-hostinger-cdn-website-optimization/ · compartir archivos (fragmento): https://www.hostinger.com/support/?p=1402
- Cabeceras del sitio: `curl -sI https://clubdeportivotrochayruta.org/`
- MDN, `<a download>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a
- Flickr: https://blog.flickr.net/en/2025/04/15/service-update-original-large-size-download-limitations-on-free-accounts/ · límite de 1.000: https://www.multcloud.com/tutorials/flickr-upload-limit-1003.html
- Pixieset: https://pixieset.com/pricing/ · SmugMug: https://www.capterra.com/p/209845/SmugMug/pricing/ · Zenfolio: https://www.capterra.com/p/207233/Zenfolio/pricing/
- Dropbox: https://www.dropboxforum.com/discussions/101001018/banned-links-or-temporarily-disabled-links/127337 · Drive: https://helpdeskgeek.com/how-to-fix-google-drive-download-quota-is-exceeded-error/ · Google Fotos: https://www.phonearena.com/news/Google-doubles-cap-on-photo-albums-to-20000-images_id112113
- Immich: https://docs.immich.app/features/sharing/ · Piwigo: https://en.wikipedia.org/wiki/Piwigo y https://www.hostinger.com/de/applications/piwigo · Cloudflare R2: https://developers.cloudflare.com/r2/pricing/
- Google, sitemaps de imágenes: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps · Meta, vistas previas de WhatsApp: https://developers.facebook.com/docs/whatsapp/link-previews
- RaceTagger: https://9pic.ai/compare/racetagger/ · costo de etiquetado: https://es.flashframe.io/blog/the-cutting-edge-of-race-photo-tagging-software/ · https://github.com/ericBayless/bib-detector · https://github.com/gheinrich/bibnumber · https://scitepress.org/PublishedPapers/2024/125624 · https://pypi.org/project/apple-vision-utils/ · https://github.com/insidegui/ocrit
- Sportograf: https://fr.trustpilot.com/review/sportograf.com · Pic2Go: https://www.racedirectorshq.com/race-photo-sharing-pic2go · BuscoDorsal: https://buscodorsal.com · Nexotick: https://www.nexotick.com/consiguetufoto
- Chuspic y FocoRace: https://focorace-mmb.chuspic.com/events/1 · https://www.mediamaratonbogota.com/focorace · Fotop: https://fotop.com.co/fotos?lang=es · Mibuc: https://www.mibuc.co/fotos y https://www.facebook.com/mibuc.co/posts/1454449813383696 · https://yoquieromifoto.fotop.com.br · https://www.instagram.com/enfoquebikecol · Atletox: https://www.instagram.com/p/Da0mtTaSnl7
- Comisión Vallecaucana: https://xn--ciclomontaismovalle-43b.com · Copa Valle en Facebook: https://www.facebook.com/100052728075254/posts/1649014113532842 · Liga de Antioquia: https://www.facebook.com/LigaCiclismoAntioquia/posts/1325849056252257 · Cali Bike Park: https://www.fundacioncalibikepark.org/eventos · Ruta Tamarindo: https://www.facebook.com/groups/419480308242448/posts/3281412632049187
- TRM: https://www.noticiascaracol.com/economia/dolar-hoy-1-de-octubre-de-2026-como-esta-la-trm-jueves-en-colombia-so35
- Prueba de OCR: un script Swift con Vision en `/tmp/galeria-research/ocr/`, fuera del repositorio
