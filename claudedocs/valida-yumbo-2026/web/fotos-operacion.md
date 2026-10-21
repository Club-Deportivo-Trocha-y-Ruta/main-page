# Fotos oficiales de la VI Válida — instructivo del lunes 19-oct

Cómo pasar de «el fotógrafo entregó un Drive» a «las familias descargan sus fotos en el sitio».
Arquitectura y política de imagen: `plan-pagina-valida.md` §5 y §5.1. Esto es solo la operación.

**Piezas**: `scripts/valida-fotos.mjs` (procesa) · `scripts/media-push.sh` (sube) ·
`src/lib/jpeg-meta.ts` (EXIF y limpieza, con tests) · `src/data/valida-yumbo-2026/mangas.json`
(horas reales de salida) · `src/data/valida-yumbo-2026/fotos.json` (lo que lee la página).

## Reglas que no se rompen

1. **El Drive del fotógrafo trae GPS y datos de la cámara. Nunca va dentro de `~/Trocha-media/`**
   (esa carpeta es la que se sube). Va en `~/Trocha-entregas/`, que está fuera.
2. **La subida es manual y solo de `valida-yumbo-2026/`** (paso 8). Nunca subas carpetas
   `*-familiar`, `_*`, `.DS_Store` ni `*.bak.json`.
3. **La carpeta `valida-yumbo-2026-familiar/` no se sube jamás.** Es el nivel «por deportista»:
   solo se entrega a su familia.
4. **El servidor nunca se limpia solo.** Lo que retires, lo borras tú
   en hPanel (ver «Retirar una foto»).
5. **Siempre se corre sobre la carpeta completa**, no por tandas. El manifest se arma con lo que haya
   en `--src`: una tanda más chica deja fuera de la página las fotos que no estén.

Rutas que usa todo el instructivo. Pégalas una vez en la terminal de trabajo:

```bash
cd "$HOME/Documents/Personal/Trocha y Ruta/page"                  # la raíz del repo (la ruta lleva espacios: con comillas)
export ENTREGA=~/Trocha-entregas/valida-yumbo-2026-drive         # originales tal como llegan (con GPS)
export SALIDA=~/Trocha-media/valida-yumbo-2026                   # lo que se sube
export FAMILIAR=~/Trocha-entregas/familiar.txt                   # ids de las fotos solo para familias
```

## 0. Antes del lunes (jueves a sábado)

- [ ] **Espacio en disco.** Hoy (6-oct) el Mac tiene **14 GB libres de 460 (97 % lleno)**. Con `S` GB de
  originales necesitas unos `S` en `ENTREGA` + `1,03 × S` en `SALIDA` (más una copia de respaldo en
  otro disco). 1.500 fotos de 10 MB son 15 GB: **no caben**. Opciones: un disco externo para
  `ENTREGA` y `SALIDA` (abajo), liberar espacio, o pedirle al fotógrafo JPG a calidad ≈90 (3-5 MB: ahí
  quedan en ≈ 12 GB entre los dos y apenas caben). Mira el espacio con `df -h ~`.
- [ ] **jpegtran**: ya está en `/opt/homebrew/bin/jpegtran`; si alguna vez falta, `brew install jpeg-turbo`.
- [ ] **hPanel**: plan y disco libre (Premium 20 GB, Unlimited 50, Cloud Startup 100; un plan Premium
  comprado antes del 17-dic-2025 trae más). Los originales de una válida (hasta ≈ 15-30 GB) tienen que
  caber *además* del sitio. Confirma que el CDN siga apagado: si estuviera encendido convertiría los
  «originales» a WebP (ver «Si algo sale mal»).
- [ ] **Medir la velocidad de subida** (abajo) y decidir el plan de subida.
- [ ] **Con el fotógrafo**: que sincronice los relojes de sus cámaras el domingo temprano, que entregue
  JPG a resolución completa y que confirme por escrito que las familias pueden descargarlas gratis y
  que la página le da crédito.
- [ ] **Ensayo con las fotos del sábado** (abajo). Es lo que descubre un problema con tiempo.

### Medir la velocidad de subida

```bash
networkQuality -d        # SOLO subida (en este macOS -d omite la descarga; -u omite la subida)
```

Anota «Uplink capacity». Desde este Mac, el 6-oct, dio **270 Mbps**. Eso es lo que da tu línea hacia
internet, no lo que aceptará el servidor de Hostinger: calcula con la mitad de ese número
hasta confirmarlo con el primer zip real.

**Tiempo estimado** (`minutos por GB = 8.192 Mb ÷ Mbps ÷ 60`, más 25 % de sobrecarga):

| Subida real | Por GB | 5 GB | 15 GB | 30 GB |
|---|---|---|---|---|
| 5 Mbps | 34 min | 2 h 51 | 8 h 32 | 17 h |
| 10 Mbps | 17 min | 1 h 25 | 4 h 16 | 8 h 32 |
| 20 Mbps | 8,5 min | 43 min | 2 h 8 | 4 h 16 |
| 50 Mbps | 3,4 min | 17 min | 51 min | 1 h 42 |
| 100 Mbps | 1,7 min | 9 min | 26 min | 51 min |

(El plan §5 usa 30 min a 50 Mbps y 2 h 15 a 10 Mbps para unos 10 GB: es la misma cuenta sin la sobrecarga.)

**Si subes a menos de 20 Mbps y los originales pasan de 10 GB**, no esperes a tenerlo todo: sube en dos
tandas (ver paso 8) y no pongas `published: true` hasta que terminen los originales, o «Descargar» dará 404.

### Si el Mac no tiene espacio: disco externo

Todo igual, con otras rutas:

```bash
export ENTREGA="/Volumes/MI_DISCO/Trocha-entregas/valida-yumbo-2026-drive"
export SALIDA="/Volumes/MI_DISCO/Trocha-media/valida-yumbo-2026"
```

### Ensayo del sábado 17 (con las fotos de la «prueba del sábado»)

Sirve para probar el flujo completo, incluida la subida real, sin tocar nada de lo definitivo. **Ojo con
`--no-data`**: sin él, el ensayo pisaría `fotos.json` con las fotos de prueba.

```bash
mkdir -p ~/Trocha-entregas/prueba-sabado                   # ahí van 10-20 JPG del sábado
npm run valida:fotos -- --src ~/Trocha-entregas/prueba-sabado --out ~/Trocha-media/valida-prueba --no-data
# la subida de prueba se hace a mano, como en el paso 8, a public_html/media/valida-prueba/
```

Verifica las URLs (paso 9, cambiando `valida-yumbo-2026` por `valida-prueba`), mide la velocidad real,
y **borra después `valida-prueba`** de `~/Trocha-media/` y de `public_html/media/` (hPanel). Revisa
`git status`: `src/data/valida-yumbo-2026/fotos.json` no debe aparecer modificado.

### Ensayar la galería con 420 fotos (vista previa, sin Hostinger)

Para ver cómo se siente la página con cientos de fotos (chips con conteos, filtro por placa, visor,
descarga) sin esperar a las del sábado y sin tocar los JSON reales:

```bash
npm run valida:preview            # sirve en :8765 ~420 fotos de prueba (banco de ~56 MB en ~/Trocha-media/_valida-preview/)
VALIDA_PREVIEW=true npm run dev   # en otra terminal: http://localhost:4321/copa-valle-yumbo-2026#fotos
```

La página lee `src/data/valida-yumbo-2026/preview/` en lugar de `evento.json`, `fotos.json` y `datos.json`
(franja roja arriba y `noindex`); `git status` no debe mostrar cambios en esos tres. Las fotos se repiten
(el banco son ~70 imágenes) y los originales pesan ~0,4 MB, no 3-10 MB: sirve para el diseño y el
rendimiento de la galería, **no** para la subida ni las cabeceras del servidor real (eso es el ensayo del
sábado). `node scripts/valida-preview.mjs --make-manifest 420` regenera el manifest de prueba.

## 1. Domingo 18

- Temprano: fotografía un celular que muestre la hora con **cada cámara** (así se sabe cuánto se
  desfasa cada reloj) y anota la **hora real de cada largada** de las seis mangas.
- Si hay adelanto para esa noche (30-50 fotos): copia esas fotos a una carpeta aparte y úsala como
  `--src` con el mismo `--out`. Los ids salen del contenido, así que **no cambian el lunes**: los
  enlaces compartidos el domingo siguen sirviendo. El lunes, corre sobre la carpeta completa.

## 2. Lunes 19

Tiempos de referencia para ≈ 2.000 fotos: Drive y respaldo 30-60 min según tu línea y tu disco,
horas 5 min, script 7 min, revisión 20-40 min, subida (tabla de arriba), verificación 10 min,
build y deploy 15 min.

### Paso 1. Bajar el Drive (fuera de `~/Trocha-media`)

En el Drive: abre la carpeta del fotógrafo → ⋮ → **Descargar**. Drive arma varios `.zip` en `~/Downloads`.

```bash
mkdir -p "$ENTREGA"
for z in ~/Downloads/drive-download-*.zip; do unzip -n -q "$z" -d "$ENTREGA"; done
find "$ENTREGA" -iname '*.jp*g' | wc -l                  # ¿coincide con las fotos que dice el Drive?
du -sh "$ENTREGA"
```

`unzip -n` no pisa nada. Si Drive te dio la carpeta ya descomprimida, cópiala a `$ENTREGA` con `rsync`.

### Paso 2. Respaldar los originales sin tocar, en otro disco

```bash
rsync -a --progress "$ENTREGA"/ "/Volumes/OTRO_DISCO/valida-yumbo-2026-originales"/
rsync -rcni "$ENTREGA"/ "/Volumes/OTRO_DISCO/valida-yumbo-2026-originales"/    # vacío = copia idéntica (lento: lee todo)
```

Hostinger dice en su contrato que el hosting «no es un archivo»: esta copia es la maestra. Se
conserva hasta el 31-ene-2027.

### Paso 3. Anotar las horas reales en `mangas.json`

Edita `src/data/valida-yumbo-2026/mangas.json`: el `start` de cada manga es su hora real de largada
(`"HH:MM"`, o `"HH:MM:SS"`). `previa` se queda en `null`. Cada foto cae en la manga cuyo `start` es el
**último anterior** a su hora de captura; lo anterior a la primera salida cae en `previa`.

**Desfase del reloj.** Si el celular de la foto de sincronización marca 10:15:00 y el EXIF de esa
foto dice 10:18:30, la cámara va 3 min 30 s adelantada: súmale 3:30 a cada `start` (la comparación es
contra la hora de la cámara). La hora EXIF de una foto:

```bash
node -e "import('./src/lib/jpeg-meta.ts').then(m => console.log(m.readExif(require('node:fs').readFileSync(process.argv[1])).dateTimeOriginal))" "$ENTREGA/ruta/foto.JPG" 2>/dev/null
```

(También sirve Vista Previa → Herramientas → Mostrar inspector → pestaña EXIF.) Con **varias cámaras
de relojes distintos** un solo desfase no alcanza: lo mejor es que queden sincronizadas desde el
domingo temprano.

### Paso 4. Ensayo (no escribe nada)

```bash
npm run valida:fotos -- --src "$ENTREGA" --out "$SALIDA" --dry-run
```

Lista cada foto (id, manga, hora y marcas `GPS`, `gira(n)`, `sin-fecha-EXIF`) y, al final, la **tabla
por manga con las columnas Desde y Hasta**: compárala con tus horas reales. Si una manga muestra
fotos fuera de su horario, corrige `mangas.json` y repite (es cuestión de segundos).

Lo que avisa:

| Aviso | Qué significa |
|---|---|
| «sin fecha EXIF» | Usó la fecha del archivo; revisa esas fotos a mano. |
| «sin DateTimeOriginal» | Usó la fecha de modificación del EXIF: en archivos exportados puede ser la hora de exportación. |
| «fecha distinta al 2026-10-18» | Reloj de cámara mal puesto. La manga se asignó solo por la hora del día. |
| «repetidos» | El mismo archivo en dos carpetas: cuenta una vez. |

### Paso 5. Procesar

```bash
npm run valida:fotos -- --src "$ENTREGA" --out "$SALIDA"
```

Medido en este Mac: 8 JPG de 24 MP y 13 MB en 1,5 s (≈ 0,19 s por foto, cuatro a la vez, unos 380 MB de
RAM), es decir ≈ 7 min para 2.000 fotos; con fotos reales puede tardar algo más. Se puede interrumpir
con Ctrl+C y volver a correr: **salta lo que ya existe** (`--force` regenera todo).

Escribe en `$SALIDA`: `thumb/`, `web/`, `original/` (limpio: sin EXIF/XMP/IPTC/GPS ni número de
serie, con la orientación aplicada **sin recomprimir**), `manifest.json` y los `.htaccess`. Copia el
manifest a `src/data/valida-yumbo-2026/fotos.json`. Verifica cada original antes de darlo por bueno.
Si alguna foto falla (archivo cortado, p. ej.), la lista al final, no entra al manifest y el código de
salida es 1: vuelve a bajar esa foto del Drive y repite.

### Paso 6. Revisar y separar las «familiares»

```bash
open "$SALIDA/thumb"          # vista de iconos grandes o de galería en Finder
```

El nombre de cada archivo es su id. Qué va a la galería abierta y qué solo a las familias lo decide la
política de imagen (plan §5.1: planos generales abiertos; primeros planos de un niño, por deportista).

Para marcar las familiares: selecciona sus miniaturas en Finder → **⌥⌘C** (Copiar como ruta) y:

```bash
pbpaste >> "$FAMILIAR"        # acepta rutas pegadas, ids sueltos, un id por línea y # comentarios
```

Luego repite el paso 5 con la lista:

```bash
npm run valida:fotos -- --src "$ENTREGA" --out "$SALIDA" --familiar "$FAMILIAR"
```

Esas fotos **salen** de `thumb/`, `web/`, `original/` y del manifest, y el original limpio queda en
`${SALIDA}-familiar/<id>.jpg` con su `familiar-manifest.json`. **Esa carpeta no se sube.** Un id que no
corresponde a ninguna foto sale como aviso (error de dedo). Para devolver una foto a la galería,
quita su línea de la lista y corre de nuevo.

> Si ya habías subido una foto y después la marcas familiar, el script la retira de tu carpeta local
> pero **no del servidor**: bórrala allí (ver «Retirar una foto»).

### Paso 7. La imagen para compartir

Elige una foto de la galería abierta (un plano general: salida, pelotón, pista; nada de primeros
planos de menores) y genera `og.jpg`:

```bash
npm run valida:fotos -- --src "$ENTREGA" --out "$SALIDA" --familiar "$FAMILIAR" --og ID_DE_LA_FOTO
```

(Si no marcaste ninguna foto como familiar, quita `--familiar "$FAMILIAR"`: la lista tiene que existir.)

Escribe `public/images/valida-yumbo-2026/og.jpg` (1200×630, recorte por zona de interés, la calidad
más alta que pese **menos de 300 KB**, el tope de la vista previa de WhatsApp) e imprime la línea para
`evento.json`. Ábrela y mírala antes de seguir. Se puede cambiar de foto las veces que quieras.

### Paso 8. Subir (a mano, con zips)

Se sube con el Administrador de archivos de hPanel; no hay script de subida para la válida. Los JPG y
WebP ya vienen comprimidos: `zip -0` guarda sin recomprimir y es mucho más rápido.

```bash
mkdir -p ~/Trocha-media/_zips && cd ~/Trocha-media/valida-yumbo-2026
zip -q -0 -r -X ~/Trocha-media/_zips/valida-1-base.zip .htaccess thumb web
find original -name '*.jpg' | sort | split -l 70 - /tmp/lote-original-
for lote in /tmp/lote-original-*; do zip -q -0 -X ~/Trocha-media/_zips/valida-2-original-$(basename "$lote").zip -@ < "$lote"; done
zip -q -0 -X ~/Trocha-media/_zips/valida-2-original-aaa.zip original/.htaccess   # el .htaccess de original/
```

En hPanel: Archivos > Administrador de archivos > `public_html/media/valida-yumbo-2026/` (créala si no
existe) > subir cada `.zip` > clic derecho > **Extraer en esa misma carpeta** (los zips ya traen
`thumb/`, `web/` y `original/`). Primero el de base: comprueba una URL de `thumb/` antes de seguir con los
originales. **No olvides los dos `.htaccess`** (Finder los oculta; `⌘⇧.` los muestra): sin ellos la carpeta
queda con listado público y «Descargar» no descarga en iPhone. Borra los `.zip` del servidor y de
`_zips/` al terminar. NO subas `valida-yumbo-2026-familiar/`.

### Paso 9. Verificar tres URLs y las cabeceras

```bash
BASE=https://clubdeportivotrochayruta.org/media/valida-yumbo-2026
ID=$(grep -o '"id": "[^"]*"' "$SALIDA/manifest.json" | sed -n 5p | cut -d'"' -f4)
for u in thumb/$ID.webp web/$ID.webp original/$ID.jpg thumb/ .htaccess; do
  printf '%-44s ' "$u"; curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download} bytes\n' "$BASE/$u"
done
curl -sI "$BASE/original/$ID.jpg" | grep -i -E 'content-type|content-disposition|x-robots-tag|cache-control|content-length'
```

Debe dar: `thumb` y `web` **200** `image/webp`; `original` **200** `image/jpeg` con
`content-disposition: attachment`; `thumb/` y `.htaccess` **403**; y en las tres imágenes
`x-robots-tag: noindex, noimageindex` y `cache-control: public, max-age=2592000, immutable`. Abre también las tres
URLs en el navegador (la del original debe **descargarse**, no abrirse).

Una muestra de 10 originales cuyo tamaño remoto debe ser igual al local (detecta subidas cortadas):

```bash
cd "$SALIDA" && for f in $(ls original/*.jpg | sort -R | head -10); do
  remoto=$(curl -sI "$BASE/$f" | tr -d '\r' | awk 'tolower($1)=="content-length:" {print $2}')
  local_=$(stat -f %z "$f"); [ "$remoto" = "$local_" ] && echo "ok   $f" || echo "MAL  $f (local $local_, remoto $remoto)"
done; cd - >/dev/null
```

### Paso 10. Publicar la página

Edita `src/data/valida-yumbo-2026/evento.json`:

```json
"published": true,
"photographer": { "name": "Nombre del fotógrafo", "instagram": "usuario_sin_arroba", "url": "https://..." },
"ogImage": "/images/valida-yumbo-2026/og.jpg",
"hero": { "photoId": "ID_DE_UNA_FOTO_ABIERTA", "alt": "…" }
```

(`hero.photoId`, `resultsUrl` y `chronicle` son opcionales si aún no los tienes.) Después:

```bash
git status                       # deben aparecer: fotos.json, mangas.json, evento.json y og.jpg; NINGUNA foto
npm run test:run                 # el gate de develop y la regla de CLAUDE.md antes de tocar main
npm run build && npm run preview # abre /copa-valle-yumbo-2026 y mira la galería con fotos reales
```

La página es estática: **subir fotos al servidor no las muestra; aparecen cuando `fotos.json` se
publica con un deploy.** Mensaje de commit sugerido:

```text
feat(valida): publica las fotos oficiales de Yumbo
```

Push según el flujo habitual (`develop` y `main`). **En staging (`develop`) las fotos no cargan**
mientras la CSP no admita `https://clubdeportivotrochayruta.org` en `img-src` (`docs/10-plan-media-hostinger.md`
T5): verifica en producción o con `npm run preview`.

### Paso 11. Después de publicar

- Search Console: inspección de URL de `/copa-valle-yumbo-2026` y «Solicitar indexación».
- Vista previa de WhatsApp: mándale el enlace a alguien y revisa que salga la imagen (si no sale, el
  `og.jpg` pesa más de 300 KB o el `<head>` quedó pasado de los primeros 300 KB del HTML).
- GA4: `photo_download` / `photo_share` llevan solo el id de la foto, nunca la placa.
- Las placas (a partir del martes) se escriben en `fotos.json` o en `$SALIDA/manifest.json`: el script
  conserva las del archivo **más reciente** y, si una corrida deja fuera fotos con placas, guarda antes
  el manifest anterior como `manifest.<fecha>.bak.json` en `$SALIDA`.
- Retención: los originales se borran del servidor el **31-ene-2027** (queda solo la versión web).

## Retirar una foto

El mismo día, por WhatsApp o correo, y anótalo en la bitácora (plan §5.1):

1. En local, según el caso:
   - *Sale de la galería pero se guarda para su familia*: añade su id a `$FAMILIAR` y repite el paso 5.
     El script la saca del manifest y de `thumb/`, `web/` y `original/`, y deja el original limpio en
     `${SALIDA}-familiar/`.
   - *Se borra del todo*: mueve el JPG fuera de `$ENTREGA`, borra a mano `thumb/<id>.webp`,
     `web/<id>.webp` y `original/<id>.jpg` de `$SALIDA` y repite el paso 5 (refresca el manifest). Si
     dejas los archivos, los vuelves a subir en la próxima tanda.
2. **Bórrala del servidor** en hPanel → Administrador de archivos → `public_html/media/valida-yumbo-2026/`:
   `thumb/<id>.webp`, `web/<id>.webp` y `original/<id>.jpg`.
3. Publica de nuevo: `fotos.json` cambió y la página es estática. Si es urgente, borra solo la línea de
   esa foto en `fotos.json` y despliega ese cambio.

Lo que ya copiaron Google, WhatsApp o una familia no se puede recoger; por eso la carpeta de medios
va en `noindex` y la página no tiene sitemap de imágenes.

## Si algo sale mal

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| «jpegtran no disponible» | No está instalado | `brew install jpeg-turbo` y repite con `--force`: las fotos que giraron quedan sin pérdida. Sin él todo funciona, pero las giradas se recomprimen (calidad 95). |
| «Fallaron N fotos … premature end of JPEG» | Archivo cortado en la descarga | Baja esa foto otra vez del Drive y repite el paso 5. |
| Una foto girada perdió «hasta 15 px de borde» | Su tamaño no es múltiplo del bloque JPEG (8/16 px) y se giró sin pérdida | Es lo normal con `jpegtran -trim` y no se nota; el original queda sin recompresión. |
| Fotos en la manga equivocada | Horas de `mangas.json` o desfase del reloj | Corrige `mangas.json` y repite el paso 5: solo recalcula el manifest. |
| «Salieron del manifest N fotos con placas etiquetadas» | Corriste sobre una carpeta más chica | Copia `$SALIDA/manifest.<fecha>.bak.json` sobre `manifest.json` y repite con la carpeta completa. |
| `original/…jpg` llega como `image/webp` o hay cabeceras `x-hcdn-*` | El CDN de Hostinger está convirtiendo imágenes | Apágalo en hPanel: los «originales» dejarían de serlo. |
| `cache-control` dice `max-age=3600` en vez de 30 días | El `.htaccess` de la raíz pesa más en ese servidor | Solo afecta al caché del navegador; no bloquea nada. |
| «Descargar» da 404 | Faltan los originales o la carpeta `original/` | Termina la subida de `original/` antes de publicar. |
| «No space left on device» | Disco lleno | Libera espacio o usa el externo; repite: retoma. |
| `fotos.json` no cambió | Corriste con `--out` en `/tmp` o con `--no-data` | A propósito: las corridas de prueba nunca tocan el repo. |

## Cómo funciona (para entender los avisos)

- **Id** = nombre del archivo sin extensión en minúsculas y con guiones + 4 hex del SHA-1 del
  contenido (`dsc-0001-a0c5`). Es estable entre corridas y no choca entre cámaras; dos copias del mismo
  archivo cuentan una vez.
- **Hora de captura** = EXIF `DateTimeOriginal`; si falta, el `DateTime` del EXIF; si falta, la fecha
  del archivo. El EXIF no trae zona horaria: se le pone `-05:00`.
- **thumb** 480 px (calidad 70) y **web** 1600 px (calidad 78), WebP, ya giradas por su orientación y
  sin metadatos; los colores se pasan a sRGB. `w` y `h` del manifest son los de la versión web.
- **original**: el JPG del fotógrafo con la orientación aplicada sin pérdida (`jpegtran`), el perfil de
  color conservado y **todo lo demás fuera**: EXIF (con GPS, número de serie, nombre del dueño y la
  miniatura), XMP, IPTC, comentarios y las imágenes embebidas del formato MPF. También se pierden los
  datos de autor/copyright del EXIF: el crédito al fotógrafo va en la marca de agua y en la página.
- **Cabeceras** (los `.htaccess` los escribe el script): sin listado de carpetas, `X-Robots-Tag: noindex,
  noimageindex`, caché de 30 días y, solo en `original/`, `Content-Disposition: attachment` para que
  «Descargar» descargue también en iPhone.
- **Idempotente**: salta lo que ya existe; solo el manifest y los `.htaccess` se reescriben siempre.
