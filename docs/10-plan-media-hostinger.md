# Plan: medios fuera de git — carpeta `/media` en Hostinger

- **Fuente**: diagnóstico del 24-sep-2026 (dos agentes: peso del repo y mapa de referencias). Decisión del usuario: servir fotos de crónicas, fotos de Trocha Verde y videos desde `/public_html/media/` en Hostinger, referenciados por URL.
- **Problema**: `.git` pesa **249 MB**. Medios en HEAD: `public/images` 60 MB (news 43, trocha-verde 17, sponsors 0,3), `public/videos` 11 MB (5 mp4), PDFs 18 MB, `src/assets/images` 5 MB. **88 MB son solo historia** (un `trocha-y-ruta-dist.zip` de 30 MB y 158 `.jpg` originales que se convirtieron a webp). Ago+sep 2026 sumaron 70 MB: cada crónica con fotos añade 5-8 MB.
- **Estrategia**: incremental y reversible. El orden es *subir → apuntar → verificar → borrar*. Nada se borra del repo hasta que `develop` sirva todo desde Hostinger. La limpieza de historia (Fase 5) es opcional y aparte.
- **Estado**: **Fase 0 pendiente**. Nada ejecutado.
- **Cómo retomar con Claude**: `Ejecuta la siguiente tarea pendiente de docs/10-plan-media-hostinger.md con el modelo asignado`. Marcar `[x]` al mergear a `develop`.

---

## 0. Decisiones de diseño (cerradas)

| Decisión | Elección | Por qué |
|---|---|---|
| Dónde | `/public_html/media/` en el host de **producción**, fuera de `dist/` | El `mirror` de lftp no lleva `--delete` (`deploy-prod.yml:108-115`): lo que no está en `dist/` sobrevive a cada deploy. Mismo origen que el sitio, así que en producción la CSP `'self'` ya lo cubre. |
| Estructura | Se conserva el subárbol: `/media/images/news/...`, `/media/images/trocha-verde/...`, `/media/videos/news/...` | Reescritura mecánica: `/images/news/` → `${MEDIA_BASE}/images/news/`. Cero renombres. |
| Forma de la URL | **Absoluta**: `https://clubdeportivotrochayruta.org/media/...` | Funciona igual en `npm run dev`, en staging (`develop` despliega a **otro host** de Hostinger, `deploy.yml:23`) y en producción. `og:image`, RSS y JSON-LD exigen absoluta de todos modos. La alternativa relativa + proxy de Vite rompía staging. |
| Dónde vive la URL base | `MEDIA_BASE` en `src/lib/constants.ts` para el código. En `src/content/**` va la URL completa escrita | El markdown de las crónicas (`<img>`, `<video>`, `<source>`) no puede llamar helpers. Un test garantiza que todo lo que apunte a `/media/` use exactamente `MEDIA_BASE`. |
| Qué se mueve | `public/images/news/**`, `public/images/trocha-verde/**`, `public/videos/**` (≈71 MB) | Es lo que crece. |
| Qué se queda | `src/assets/images/**` (5 MB, pasa por `astro:assets` y `import.meta.glob`), `public/images/sponsors/` (0,3 MB), `public/images/hero-poster.jpg` (og:image por defecto), `placeholder-news.svg`, `public/logo.webp`, PDFs de transparencia | Perder `<Image>` costaría LCP/CLS; los logos son pequeños y salen en la home; los PDFs son documentos legales que conviene versionar. |
| Subida | Script local `scripts/media-push.sh` con lftp desde una carpeta **fuera del repo** (`~/Trocha-media/`), credenciales en `.env` (ya ignorado) | Sin un workflow nuevo ni secretos nuevos en GitHub. El editor sube fotos con un comando. |
| CMS | Fuera de alcance | Sveltia sube a `src/assets/images` (`config.yml:21`); las crónicas se escriben a mano con rutas `public/`. No cambia. |
| Cloudinary | Se descarta y se documenta como deuda cerrada | Quedó a medias desde ADR-002 (`image.domains`, preconnect, CSP, env var sin uso). |

---

## 1. Fase 0 — Preparar Hostinger y el script de subida

- [ ] **T1 (sonnet)** — `scripts/media-push.sh`: lftp `mirror --reverse --only-newer --parallel=4` de `$MEDIA_SRC` (por defecto `~/Trocha-media/`) a `/public_html/media/`. Lee `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` de `.env`; falla con mensaje claro si faltan. Flag `--dry-run` (`mirror --dry-run`). Añadir `"media:push": "bash scripts/media-push.sh"` a `package.json` y las tres variables a `.env.example` con comentario. **Nunca** `--delete`.
- [ ] **T2 (sonnet)** — Copiar el árbol actual a la carpeta local: `~/Trocha-media/images/{news,trocha-verde}/` y `~/Trocha-media/videos/`. Verificar con `diff -rq` contra `public/`. Añadir `.htaccess` en `~/Trocha-media/` con `Cache-Control "public, max-age=2592000"` para imágenes y video (30 días; el raíz usa 1 h en `.htaccess:102-109` porque `dist/` cambia con cada deploy, `/media/` no).
- [ ] **T3 (usuario)** — Ejecutar `npm run media:push -- --dry-run` y luego sin flag. Comprobar en el navegador dos URLs: una foto de `news`, un `.mp4`. Anotar aquí la fecha de la primera subida.

## 2. Fase 1 — Código y configuración

- [ ] **T4 (sonnet)** — `MEDIA_BASE` en `src/lib/constants.ts`: `` `${SITE.url}/media` ``. Helper `mediaUrl(path)` en `src/lib/utils.ts`: si `path` empieza por `http`, lo devuelve; si empieza por `/images/` o `/videos/`, antepone `MEDIA_BASE`; el resto lo deja. Test en `src/lib/__tests__/utils.test.ts`.
- [ ] **T5 (fable)** — CSP en `public/.htaccess:71-78`: añadir `https://clubdeportivotrochayruta.org` a `img-src` y crear **`media-src 'self' https://clubdeportivotrochayruta.org`** (hoy no existe y los `.mp4` caen a `default-src`). Sin esto **staging** bloquea todo lo que venga de `/media/`. Recordatorio: `.htaccess` solo aplica en Hostinger, `dev`/`preview` no lo detectan.
- [ ] **T6 (sonnet)** — Redirecciones para URLs viejas indexadas (Google Images trae tráfico a las fichas botánicas): en `public/.htaccess`, `RedirectMatch 301 ^/images/(news|trocha-verde)/(.*)$ https://clubdeportivotrochayruta.org/media/images/$1/$2` y lo mismo para `^/videos/(.*)$`. No hay `mod_rewrite` en uso; `RedirectMatch` es `mod_alias` y basta.
- [ ] **T7 (sonnet)** — Código que arma rutas: `NewsGallery.astro:37` (`src`), `seo.ts:596` (`hero-poster` se queda local: no tocar), `trocha-verde/index.astro:137,173` (afiche del Día de la Tierra), `rss.xml.ts` si enlaza imágenes de noticias. Pasar por `mediaUrl()` todo campo de frontmatter que se renderice como `src`: `NewsCard`, `AlbumCard`, `TreeCard`, `RiderCard`, `RaceLineup`, fichas de árbol y especie, `galeria/[slug]`. Los tests `.astro.test.ts` de esos componentes ya usan rutas `/images/...`: actualizar la expectativa a `MEDIA_BASE`.

## 3. Fase 2 — Contenido

- [ ] **T8 (sonnet)** — Reescritura en `src/content/**`: `"/images/news/` → `"https://clubdeportivotrochayruta.org/media/images/news/`, igual para `trocha-verde` y `/videos/`, en frontmatter y en el cuerpo markdown (`<img src`, `poster=`, `<source src`, `![](…)`). Son ≈469 líneas (trees 77, species 32, news 13, gallery 10, events 8, sponsors 7, riders 5, social-initiatives 3, directivos 1, obstaculos 1) más los `<video>` de `2026-09-copa-cali-bike-park-dh.md:208-212,306-310` y `2026-09-copa-lets-go-alcala-xco.md:68-72,147-151`. **No tocar** `/images/sponsors/`, `/images/hero-poster.jpg`, `/images/placeholder-*`. Hacerlo con `sed` y revisar el diff: no formatear con Prettier.
- [ ] **T9 (sonnet)** — Test nuevo `src/test/media-urls.test.ts`: (a) ninguna ruta `/images/news/`, `/images/trocha-verde/` ni `/videos/` relativa queda en `src/content/**` ni en `src/**/*.astro`; (b) toda URL que contenga `/media/` empieza exactamente por `MEDIA_BASE`; (c) `public/images/` no contiene `.mp4` y pesa menos de 3 MB (presupuesto que impide volver a meter fotos por costumbre). Correr con el gate de `develop`.
- [ ] **T10 (sonnet)** — Script `scripts/media-check.mjs` (`npm run media:check`, **no** entra en CI): extrae todas las URLs `/media/` de `src/content/**` y hace `HEAD` a cada una; falla si alguna no responde 200. Correr antes de cada merge que toque medios y después de cada `media:push`.

## 4. Fase 3 — Verificar y borrar

- [ ] **T11 (usuario)** — Merge a `develop`. En staging: portada, `/noticias`, dos crónicas con video, `/galeria/<álbum>`, `/trocha-verde` y una ficha de árbol. Abrir la consola: cero errores de CSP. Validar `og:image` de una crónica con el depurador de Facebook o `curl -sI`.
- [ ] **T12 (sonnet)** — `git rm -r public/images/news public/images/trocha-verde public/videos`. Confirmar que `npm run build` y `npm run test:run` pasan y que `dist/` ya no contiene esas carpetas.
- [ ] **T13 (usuario)** — Tras el deploy a `main`, borrar del servidor las copias viejas (`/public_html/images/news`, `/public_html/images/trocha-verde`, `/public_html/videos`) por lftp o el gestor de archivos de Hostinger. Sin esto siguen ocupando espacio, aunque el 301 de T6 ya redirige.
- [ ] **T14 (sonnet)** — Docs: ADR nuevo en `docs/02-technical-architecture.md` (cerrar la deuda Cloudinary de la línea 167 y retirar `image.domains`, el preconnect de `BaseLayout.astro:235-236` y `PUBLIC_CLOUDINARY_CLOUD_NAME` si se decide), sección de imágenes de `CLAUDE.md`, `docs/03:155`. Añadir `*.zip` y `*.mov` a `.gitignore`.

## 5. Fase 4 — Flujo editorial nuevo

Para cada crónica o siembra a partir de ahora:

1. Procesar fotos y clips como siempre (memoria `procesar-fotos-iphone-cronicas`).
2. Copiarlas a `~/Trocha-media/images/news/<slug>/` (y `videos/news/<slug>/`), **no** a `public/`.
3. `npm run media:push` y `npm run media:check`.
4. Escribir la crónica con URLs `https://clubdeportivotrochayruta.org/media/...`.
5. El test T9 bloquea el merge si se cuela una ruta relativa o un archivo pesado.

- [ ] **T15 (sonnet)** — Actualizar `.claude/agents/content-marketer.md` y `photo-video-editor.md` con este flujo y el prefijo de URL.

## 6. Fase 5 (opcional) — Reducir la historia

Mover archivos **no reduce** los 249 MB actuales; solo frena el crecimiento. Para bajar a ≈160 MB hay que reescribir la historia. Es una operación única y consciente, con `git push --force`, que está **denegado** en `.claude/settings.json`: la ejecuta el usuario.

- [ ] **T16 (fable, solo preparar)** — Guion con `git filter-repo --invert-paths` para `trocha-y-ruta-dist.zip`, los 158 `.jpg` ya convertidos, `public/images/sponsors/58C3F997-*.jpejpeg` y, si se hizo la Fase 3, `public/images/{news,trocha-verde}` y `public/videos`. Ensayar en un clon aparte, medir `.git` antes y después, documentar aquí el resultado.
- [ ] **T17 (usuario)** — Coordinar: cerrar el worktree `.claude/worktrees/wf_*`, sincronizar `develop` con `main`, correr el guion, `push --force` a `main` y `develop`, re-clonar en cualquier otra máquina. GitHub puede tardar en liberar los objetos viejos.

---

## 7. Hallazgos colaterales (no bloquean, conviene arreglar)

- `src/lib/seo.ts:185,242` y `src/pages/rss.xml.ts:55` apuntan a `/images/logo.png`, **que no existe** (el logo está en `public/logo.webp`). El JSON-LD de la organización lleva un logo roto. Arreglar aparte; Google prefiere PNG/JPG para `logo`, así que quizá generar `public/logo.png`.
- `src/content/sponsors/nutrifit.md:3` y `deportes-montana.md:3` usan `/images/placeholder-sponsor.png`, que tampoco existe en `public/`.
- Ningún test verifica que una ruta de imagen exista en disco ni en red; T9 y T10 cubren ese hueco por primera vez.
- `illustrations-src/yumbo/` (7,6 MB de PNG fuente) está versionado; se podría tratar como `fonts-src/`, pero es una sola vez y no crece. Se deja.
