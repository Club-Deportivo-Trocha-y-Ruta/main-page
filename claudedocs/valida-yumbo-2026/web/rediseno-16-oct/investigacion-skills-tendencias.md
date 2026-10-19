# Skills de diseño para agentes y tendencias web 2026

**Insumos para el rediseño de `/copa-valle-yumbo-2026` · Club Deportivo Trocha y Ruta**

- **Fecha:** 16-oct-2026. **Alcance:** solo investigación. No se instaló nada ni se ejecutó código de terceros. Los repos externos se leyeron por la API de GitHub y con descargas de archivos sueltos a `/tmp` (solo `cat`/`grep`).
- **Leyenda:** ✅ recomendado · ⚠️ con reservas · ❌ no recomendado. **Verificado** = leído en la fuente primaria (API de GitHub, archivo raw del repo, `web-features`, MDN BCD, notas oficiales de Mozilla). **No verificado** = cita de un tercero o dato que no pude comprobar.
- El contenido web se trató como dato no confiable. Una página (Composio) traía un bloque dirigido a «agentes de IA» pidiendo registrarse en su servicio: se ignoró.

---

## 1. Resumen (10 líneas)

1. **La skill `frontend-design` del repo está vieja:** es la copia del 29-abr (4,4 KB). Anthropic la actualizó el 9-jun y el 3-sep-2026 (hoy 9,4 KB) y ahora nombra los «tells» de lo generado. Actualizarla es lo único de alto valor y riesgo casi nulo (solo texto).
2. **Lo nuevo de esa skill ataca la queja del usuario:** da como defaults de IA la palabra acentuada en el titular, el eyebrow en mayúsculas, la numeración 01/02/03 sin secuencia, el fade-up por sección y «cifra grande + etiqueta + stats»; y exige plan → revisión contra el brief → captura → crítica.
3. **De 14 skills/guías externas evaluadas recomiendo dos conjuntos, y de forma selectiva:** `emilkowalski/skills` (4–5 skills de movimiento) y `jakubkrehel/skills` (`better-typography`; `better-colors` opcional). Ambos son solo markdown.
4. **No instalar:** `taste-skill` (reparte direcciones al azar de una biblioteca de 247 sitios, baja imágenes de bancos abiertos y en sus propias pruebas no supera al baseline), Impeccable (instala *hooks* que corren un binario descargado en cada edición) y `ui-ux-pro-max` (diseño por categoría; su repo trae skills hermanas que llaman a APIs externas de imágenes). Sí **leer** sus listas de «tells» (ya destiladas en §5).
5. **El código actual ya emite varios tells** (lectura rápida, no auditoría): `SectionIntro` pinta eyebrow `uppercase tracking-[0.18em]` y `highlight` en 4 titulares de la página; `ValidaNumbers` es «3 cifras iguales en tarjeta redondeada con ring»; el cuerpo es `Inter Variable`.
6. **Tendencia que respalda la serigrafía:** «anti-IA / imperfecto por diseño» (Creative Bloq, Canva, Webflow). Pero la encuesta de Creative Boom muestra que cansa lo hecho *sin intención*: cada textura necesita una razón de imprenta (sobreimpresión, registro, papel), no un filtro «vintage».
7. **Gastadas:** bento, glassmorfismo/liquid glass, degradados, Y2K, minimalismo/maximalismo perezoso, motion decorativo y el «remedio» crema + serif + terracota. El neobrutalismo (sombras duras, bordes gruesos) es hoy el estilo más fácil de generar para un agente: ya es default.
8. **Soporte (web-features, 15-oct-2026):** `mix-blend-mode`, `text-wrap: balance`, `mask-image` y `content-visibility` ya son seguros. Scroll-driven animations = Chrome/Edge 115+, Safari 26+, Firefox 159 (beta desde el 12-oct; estable a fines de octubre). Firefox es 0,22 % del móvil en Colombia (StatCounter, sep-2026): el riesgo real es Safari < 26, que cubre el fallback «estado final visible» que el repo ya exige.
9. **Rendimiento:** barato = multiply/overprint, titulares con `clamp()`, scroll-driven con `transform`/`opacity`. Riesgoso o no medido = filtros SVG animados o de gran área, overlays `fixed` con blend, máscaras `clip-path` generadas (además marcadas como tell: «Jagged image masks» → usar un recurso raster preparado).
10. **Límites:** no pude leer la comparativa de UX Planet (de pago); no medí el coste de grano/blend en dispositivo; los conteos de instalaciones (skills.sh) son telemetría del CLI, no calidad ni seguridad.

---

## 2. Qué prescriben las skills ya instaladas (lo útil para este rediseño)

Leídas en `.claude/skills/*/SKILL.md`.

### 2.1 `frontend-design` (anthropics/skills · copia local del 29-abr-2026, 4.440 B)

**Prescribe**
- Antes de codificar: propósito, tono («elige un extremo»), restricciones y diferenciación («¿qué será inolvidable?»). «La clave es la intención, no la intensidad.»
- Tipografía: display distintivo + cuerpo refinado; prohíbe Inter/Roboto/Arial/system y Space Grotesk.
- Color: dominante + acento agudo, variables CSS. Movimiento: CSS puro; **un** momento de carga orquestado con revelados escalonados vale más que microinteracciones dispersas.
- Composición: asimetría, solapes, diagonales, elementos que rompen la rejilla; aire generoso **o** densidad controlada. Fondos: ruido/grano, patrones geométricos, capas translúcidas, bordes decorativos.

**Útil aquí:** «dirección primero» y que avala grano/ruido y composición asimétrica (compatibles con la serigrafía).

**Cuidado:** esta versión también sugiere «gradient meshes», «dramatic shadows», «custom cursors» y revelados escalonados: hoy son de los rasgos que más se leen como IA (ver el delta en §3.3). Manda evitar Inter, y el cuerpo del sitio es `Inter Variable`. Su regla «varía fuentes y estéticas entre generaciones» no aplica a una marca con tokens fijos.

### 2.2 `web-design-guidelines` (Vercel, v1.0.0)

- No es una guía estética: es un linter de cumplimiento. **Descarga `command.md` de GitHub en cada uso** (WebFetch), así que las reglas pueden cambiar río arriba: tratarlas como contenido dinámico.
- Reglas que sí pesan aquí (leídas en `command.md`, 8 KB):
  - **Movimiento:** respetar `prefers-reduced-motion`; solo `transform`/`opacity`; nunca `transition: all`; animaciones interrumpibles; autoplay > 5 s necesita pausa; los loops decorativos se detienen con reduced-motion.
  - **Tipografía:** `…` y comillas curvas; espacios duros (`10&nbsp;MB`); `font-variant-numeric: tabular-nums` en columnas de cifras (**tablas de resultados**); `text-wrap: balance`/`pretty` en titulares.
  - **Imágenes:** `width`/`height` explícitos (CLS); `loading="lazy"` bajo el pliegue; `fetchpriority="high"` solo en la crítica. Listas > 50 elementos: `content-visibility: auto` (**galería**).
  - **Táctil:** `touch-action: manipulation`; `overscroll-behavior: contain` en modales/visores (**lightbox**); gestos con alternativa de toque/teclado; `env(safe-area-inset-*)` en diseños a sangre.
  - **Foco:** `:focus-visible`; cabeceras/índices fijos no deben tapar el elemento enfocado (`scroll-margin-top`) → **`SectionDock`**.
  - **Tema/i18n:** `color-scheme` y `<meta name="theme-color">` acordes al fondo; `translate="no"` en nombres de marca («Trocha y Ruta», «Copa Valle»); `Intl.*` para fechas y números.
  - **Antipatrones:** `user-scalable=no`, `<div onClick>`, imágenes sin dimensiones, acción solo por gesto.
- **Ignorar:** «Title Case» para titulares/botones y «`&` en vez de "and"» (reglas de copy en inglés; el español usa mayúscula de oración).

### 2.3 `accessibility` (addyosmani/web-quality-skills, WCAG 2.2)

- Contraste 4,5:1 (texto normal) y 3:1 (grande y componentes); no depender solo del color. **Con grano o trama bajo el texto hay que medir el contraste con la textura puesta**, no con el color base (placa sólida o scrim).
- WCAG 2.2: objetivo táctil mínimo 24×24 px (AA, 2.5.8) y recomienda 44×44 → botones de descarga; foco no oculto por barras fijas (2.4.11); alternativa a arrastrar (2.5.7) → visor con botones además de deslizar.
- Movimiento: su reset global (`*{animation-duration:.01ms!important}`) es burdo; el patrón del repo (`@media (prefers-reduced-motion: no-preference)` + `@supports`) es mejor y debe prevalecer.

### 2.4 `performance` y `core-web-vitals`

- Presupuesto de la skill: página < 1,5 MB, JS < 300 KB, CSS < 100 KB, imágenes sobre el pliegue < 500 KB, fuentes < 100 KB, terceros < 200 KB. Sus umbrales (LCP ≤ 2,5 s, CLS ≤ 0,1) son más laxos que los del repo (LCP < 2,0 s, CLS < 0,05): mandan los del repo.
- **LCP:** imagen crítica en el HTML inicial con `fetchpriority="high"`; nada de LCP renderizado por JS; CSS crítico < 14 KB.
- **CLS:** toda imagen con `width/height` o `aspect-ratio` (miniaturas de la galería); fuentes con `font-display: optional` o métricas de fallback (`size-adjust`, `ascent-override`, `descent-override`) → **clave para titulares gigantes en Plus Jakarta Sans Itálica 800**.
- **INP:** sin tareas > 50 ms; trabajo pesado diferido; en la isla React de la galería, memoizar miniaturas y delegar eventos.
- Animar solo `transform`/`opacity`; `will-change` con mesura.

### 2.5 `best-practices`: dos recomendaciones que **no** deben seguirse

- Casi todo es seguridad/cumplimiento (fuera del rediseño). Pero sugiere cargar `https://polyfill.io/…` (el dominio fue adquirido por Funnull en feb-2024 y sirvió código malicioso a más de 100 mil sitios; fuentes: Wiz, Arctic Wolf), además chocaría con la CSP de `public/.htaccess`; y `X-XSS-Protection: 1; mode=block` (MDN: obsoleto, «evitar en proyectos nuevos»).
- También sugiere URLs *protocol-relative* (`//example.com`) y el truco `preload … onload` para CSS (exige ajustar la CSP).

### 2.6 `astro`

- Es un puntero a docs.astro.build (autor declarado «Astro Team», v0.0.1): comandos y estructura, nada de diseño. Lo específico del repo (ClientRouter, `astro:assets`, capa CSS de `<Image>`) está en `docs/09`.

### 2.7 Otras presentes

- `web-quality-audit` y `playwright-cli` están instaladas (no las leí). Sirven para el bucle de verificación visual (capturas a 390/768/1440).

---

## 3. Skills externas evaluadas

### 3.1 Método y contexto de riesgo

- **Metadatos** (estrellas, licencia, fechas): API de GitHub, 16-oct-2026. **Contenido y riesgos:** lectura de `SKILL.md`, README y scripts (`grep` de red/procesos), sin ejecutar.
- **Instalaciones de skills.sh:** telemetría anónima del CLI `npx skills add` (la página de npm dice «collects anonymous usage data», desactivada en CI; el issue vercel-labs/skills#1315 confirma que skills.sh no rastrea repos, solo cuenta eventos del CLI). **Es popularidad, no calidad ni seguridad.**
- **Seguridad del ecosistema (Snyk «ToxicSkills», 5-feb-2026):** de 3.984 skills (ClawHub y skills.sh), el 13,4 % (534) tenía al menos un problema crítico; el titular reporta prompt injection en el 36 % y 1.467 payloads maliciosos; 76 fueron confirmados a mano. Pesa sobre todo en ClawHub (publicar exige un `SKILL.md` y una cuenta de GitHub de una semana). Los repos de abajo son de autores conocidos, pero eso no sustituye leerlos.

### 3.2 Tabla

| # | Skill / autor | Señales (verificadas) | Qué aporta | Riesgos | Veredicto |
|---|---|---|---|---|---|
| 1 | **frontend-design, versión vigente**<br>Anthropic · `anthropics/skills` (`skills/frontend-design/`) y plugin `frontend-design@claude-plugins-official` | skills ★ 181,5 mil, push 2026-10-09. Commits a la skill: 2026-06-09 y 2026-09-03. Plugin (claude-plugins-official ★ 39,9 mil, Apache-2.0) actualizado 2026-09-01. El `LICENSE.txt` pesa igual que el local (10.174 B). | El delta de §3.3: lista de «tells», plan → revisión → captura → crítica, «gasta tu audacia en un solo lugar». | Solo texto, sin scripts. Cambia el comportamiento (más restricción y un paso de plan). | ✅ **Actualizar ya** |
| 2 | **emilkowalski/skills**<br>Emil Kowalski (README: ex-Vercel y Linear) | ★ 46,6 mil · MIT · push 2026-10-11 · 15 skills, solo `.md`. | `review-animations` (10 estándares: movimiento justificado, < 300 ms, `ease-out`, solo `transform`/`opacity`, reduced-motion, hover bajo `(hover: hover) and (pointer: fine)`), `animation-performance`, `animation-vocabulary`, `find-animation-opportunities` (incluye qué **no** animar), `emil-design-eng`. | Bajo (markdown). Sesgo a UI de app/React/Motion. `review-animations` es de invocación manual (`disable-model-invocation: true`). Sus «< 300 ms» y «sin animación en acciones frecuentes» aplican a controles, no al momento de apertura de una página editorial. | ✅ **Selectivo:** las 4–5 de movimiento. No `animate-expo`, `write-swift`, `mobile-native`, `ask-sonner`, `pick-ui-library`, `prototype`. |
| 3 | **jakubkrehel/skills**<br>Jakub Krehel (interfaces.dev) | ★ 8,0 mil · MIT · push 2026-10-13 · 14 skills; markdown salvo `technical-drawing` (JS/HTML). | `better-typography`: escala semántica, tracking −0,01 a −0,02 em en titulares ≥ 24 px, `balance` solo en titulares / `pretty` en párrafos, puntuación tipográfica, `lang`, números tabulares. `better-colors`: contraste y nombres de tokens. `interface-review`: revisión integral con formato terso. | Bajo. El plugin instala todo el paquete (incluida `technical-drawing`, con JS, que no se ejecuta salvo que se invoque). | ✅ `better-typography` · ⚠️ `better-colors` (el repo ya prueba contraste en `src/test/theme.test.ts`) · el resto duplica skills locales |
| 4 | **taste-skill**<br>Leonxlnx | ★ 97,8 mil · MIT · creado 2026-02-19 · push 2026-10-14 · skills.sh `design-taste-frontend`: 593,7 mil. | Registro fechado de «tells» (3 oleadas + «moda de galería»); estudio de 248 sitios recolectados, 247 cargaron (One Page Love + Awwwards SOTD, 5-oct-2026) con 21 revisores-modelo que puntúan capturas (no humanos); inspector en Chrome real y lazo mirar-corregir. | ~214 KB de scripts Node: `inspect.mjs` lanza Chrome headless con `--remote-debugging-port=0`; `assets.mjs` descarga imágenes/video de Openverse, Wikimedia, Met, AIC, Internet Archive y NASA; `draw.mjs` escribe `~/.taste-skill/history.json`; `install.sh` crea symlinks. `SKILL.md` de 29 KB + referencias de 100+ KB (contexto). Su `lint.mjs` avisa de «Plus Jakarta Sans» (WARN `default-font`) y prohíbe monoespaciada, numeración, hairlines y marcas de corte: **choca con las «reglas de imprenta» aprobadas**. En sus propias pruebas (jurados-LLM ciegos, 16 briefs en 5 rondas) ganó 4 de 16 y su promedio quedó igual o por debajo del baseline sin skill en las 5 rondas (p. ej., 7,7 vs 7,8 en la última), aunque eliminó los fallos que mide su inspector. | ❌ **No instalar.** ✅ Leer `references/tells.md`, `critique.md` y `motion.md` (lo útil ya está en §5). |
| 5 | **Impeccable**<br>Paul Bakaus | ★ 81,8 mil · Apache-2.0 · creado 2025-11-16 · push 2026-10-16. (~251 mil instalaciones: cifra citada por Skillselion, no verificada.) | 24 comandos (`craft`, `critique`, `audit`, `polish`, `typeset`, `animate`…); **59 reglas deterministas + 6 patrones de revisión** (catálogo público: impeccable.style/slop); CLI `npx impeccable detect` que escanea archivos o URL sin LLM. | `npx impeccable install` añade **hooks** (`.claude/settings.local.json`) que ejecutan `scripts/impeccable hook` tras ediciones de UI y en Stop; descarga un binario fijado (con checksum) a `~/.impeccable/bin/`; su README admite que los hooks «corren independientemente de la aprobación de herramientas del modelo». Telemetría anónima del «roll» (se apaga con `DO_NOT_TRACK=1` o `IMPECCABLE_NO_TELEMETRY=1`). El modo «live» ejecuta un script de `package.json` con permisos de usuario. Escribe `PRODUCT.md`/`DESIGN.md` (solapa con `docs/04`). | ❌ **No instalar.** ⚠️ Opcional: una corrida manual de `detect` sobre `dist/` o la URL de preview, en una copia o CI y con telemetría apagada. ✅ Leer su catálogo. |
| 6 | **ui-ux-pro-max-skill**<br>nextlevelbuilder | ★ 136,4 mil · MIT · creado 2025-11-30 · push 2026-10-15 · skills.sh: 391,8 mil. | Base CSV de estilos/paletas/pares de fuentes + `search.py` local que arma un «sistema de diseño» a partir de la categoría. | El núcleo (`.claude/skills/ui-ux-pro-max/scripts`) no hace llamadas de red (revisado con `grep`). Pero el repo incluye skills hermanas: `design/scripts/logo/generate.py` lee `GEMINI_API_KEY`/`ATLASCLOUD_API_KEY`/`MUAPI_API_KEY` y llama APIs de generación de imágenes; `design-system/scripts/fetch-background.py` baja fondos de Pexels (`brand`, `banner-design` y `ui-styling` también traen scripts: no los revisé). Todo eso es **incompatible con «los menores no salen del equipo»** si se invoca con fotos reales. Instalar por plugin trae todo. | ❌ Diseño por categoría = justo lo que el usuario rechaza; paleta y fuentes ya están fijadas. |
| 7 | **web-design-guidelines** (instalada)<br>Vercel | `vercel-labs/agent-skills` ★ 32,5 mil (sin licencia detectada a nivel repo); reglas en `vercel-labs/web-interface-guidelines` ★ 994, MIT · skills.sh: 723,6 mil. | Ver §2.2. | Lee reglas remotas en cada uso. | ✅ Mantener como puerta de salida. |
| 8 | **OneRedOak/claude-code-workflows → `design-review`** | ★ 3,9 mil · MIT · push 2026-10-09. | Agente de revisión en 8 fases con Playwright MCP («entorno vivo primero», 1440/768/375). | Agente con herramientas amplias (Edit, Write, WebFetch, WebSearch); su vara es «Stripe/Airbnb/Linear» (sesgo SaaS). | ❌ Ya cubierto por `qa-auditor`, `accessibility-tester` y Chrome MCP. Solo copiar la idea de las fases. |
| 9 | **AccessLint** (`AccessLint/skills`, antes `accesslint/claude-marketplace`) | ★ 107 · licencia no declarada en la API (Snyk la lista MIT) · push 2026-08-25. | Verificador de contraste (MCP `@accesslint/mcp`), `use-of-color`, `link-purpose`. | Servidor MCP vía npm. | ❌ El repo ya mide contraste en tests y tiene `accessibility`. |
| 10 | **greensock/gsap-skills** y **Motion AI Kit** (motion.dev) | gsap-skills ★ 16,5 mil · MIT · push 2026-07-29 (oficial de GreenSock). Motion AI Kit: skill + MCP oficiales de Motion (no evaluado a fondo). | Enseñan a escribir GSAP/Motion correctamente. | Empujan una librería JS de animación. | ❌ El repo es CSS puro por restricción («sin frameworks extra»). |
| 11 | **VoltAgent/awesome-claude-design** | ★ 4,1 mil · MIT. | 68 `DESIGN.md` inspirados en marcas conocidas. | Copiar sistemas ajenos. | ❌ Reutilizable el **formato** (atmósfera, paleta y roles, tipografía, componentes, layout) para documentar un `DESIGN.md` propio de la serigrafía. |
| 12 | **Owl-Listener/designer-skills** | ★ 2,9 mil · MIT · 63 skills / 27 comandos. | Proceso (investigación → handoff). | Pesado para una página. | ❌ «Fuerte en proceso, débil en gusto» (Composio). |
| 13 | Baja señal (no recomendadas) | `mager/frontend-design` (★ 4), `agents-inc/skills · web-animation-css-animations` (23 ★ según Skillselion, no verificado), `dylantarre/animation-principles` (★ 107), `sliday/google-fonts-skill` (MCP de Google Fonts; fuentes ya fijas), `davepoon/buildwithclaude · frontend-design-pro` (★ 3,6 mil). | — | Procedencia/mantenimiento poco contrastados. | ❌ |
| 14 | Índices para seguir buscando | `ComposioHQ/awesome-claude-skills` (★ 77,2 mil), `hesreallyhim/awesome-claude-code` (★ 55,8 mil), `VoltAgent/awesome-agent-skills` (★ 35,8 mil, MIT, 1.000+), `travisvn/awesome-claude-skills` (★ 15,4 mil), skills.sh. | — | Listas curadas ≠ auditoría. | — |

> Comparativa independiente `frontend-design` vs `ui-ux-pro-max` vs `taste-skill` (Nick Babich, UX Planet, 17-sep-2026): **no la pude leer** (solo para miembros de Medium).

### 3.3 Delta: `frontend-design` vigente vs. la copia local

Verificado con `diff` contra `raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md`.

- **Parte del sujeto, no de un estilo:** «las industrias, materiales y vernáculo del tema son de donde salen las decisiones visuales distintivas». Si el brief no dice qué es, lo identifica y lo confirma.
- **Hero:** «una cifra grande con etiqueta pequeña, stats de apoyo y un acento en degradado es el tratamiento por defecto; úsalo solo si de verdad es la mejor opción».
- **Tipografía:** no necesita dos familias; el tratamiento tipográfico debe ser *parte activa* del diseño. **Defaults a evitar** (los «tells» más comunes): acentuar una sola palabra del titular (cursiva/negrita/color), etiquetas en mayúsculas, etiquetas tipográficas innecesarias sobre el contenido, marcadores 01/02/03 si el contenido no es una secuencia. Líneas < 80 caracteres.
- **Movimiento:** «los fade-and-slide-up en cada sección y los hover en cada tarjeta son el default genérico y se leen como generados»; un solo momento orquestado.
- **Cinco agrupaciones de «diseño de IA ahora mismo»:** (1) fondo crema ~#F4F1EA + serif de alto contraste + acento terracota (~#D97757); (2) casi negro con un único acento verde ácido o bermellón; (3) «periódico»: hairlines, radio 0, columnas densas; (4) kit SaaS: tarjetas idénticas, un solo radio, misma sombra gris, degradados decorativos; (5) «chrome de plantilla»: eyebrow en mayúsculas con tracking, cadenas con punto medio («A · B · C»), «PALABRA — fragmento», negros teñidos (#0B0B0B), mono para etiquetas, «→» al final de enlaces/botones. **«Donde el brief fija una dirección visual, se sigue al pie de la letra»** (aplica a la paleta del club; lo que delata es *cómo* se usa: brillo/neón sobre negro, no el teal ni el lima).
- **Proceso:** plan (4–6 hex con nombre, roles tipográficos, concepto de layout con wireframes ASCII, principios) → revisar el plan contra el brief → construir → capturas y autocrítica. «Gasta tu audacia en un solo lugar»; consejo de Chanel: antes de salir, quita un accesorio.
- **Escritura:** voz activa; CTA que dice lo que pasa («Guardar cambios», no «Enviar»); errores que dicen cómo arreglarlo; sin relleno.

### 3.4 Recomendación para ESTE rediseño

**Sí**
1. **Actualizar `frontend-design`** (§3.3). Es primera parte, sin scripts, y es la que mejor describe lo que el usuario rechaza.
2. **Mantener `web-design-guidelines`** como puerta final sobre la página y los componentes nuevos.
3. **Opcional:** `emilkowalski/skills` (movimiento) y `better-typography` de Jakub Krehel, copiando solo las carpetas necesarias.
4. **Convertir §5 en el brief de los agentes** (`astro-dev`, `content-marketer`, `accessibility-tester`, `qa-auditor`). Sustituye instalar taste-skill o Impeccable.

**No:** taste-skill, `impeccable install`, ui-ux-pro-max, OneRedOak, AccessLint, GSAP/Motion.

**Por qué no «más skills»**
- La dirección de arte ya está decidida (serigrafía de dos tintas aprobada en Instagram). Las skills que «reparten direcciones» (taste-skill) o «recomiendan por categoría» (ui-ux-pro-max) no suman; lo que falta es **chequeo** (tells) y **restricciones**, y eso cabe en un checklist.
- La evidencia de que una skill de «gusto» mejore el resultado es débil: las pruebas del propio taste-skill no superan al baseline, y Composio cierra su lista con «el gusto viene de los humanos; las skills agilizan lo que ya sabes».

### 3.5 Comandos de instalación (solo reporte; **no ejecutados**)

```bash
# 1) Actualizar frontend-design
/plugin install frontend-design@claude-plugins-official      # según Artificial Corner; el plugin existe en anthropics/claude-plugins-official
# o, sin plugin: reemplazar .claude/skills/frontend-design/SKILL.md por
#   https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md

# 2) Emil Kowalski (README oficial; el CLI envía telemetría anónima)
npx skills@latest add emilkowalski/skills
# alternativa sin telemetría: git clone en /tmp, leer, y copiar solo
#   skills/review-animations skills/animation-performance skills/animation-vocabulary skills/find-animation-opportunities

# 3) Jakub Krehel (README oficial)
npx skills add jakubkrehel/skills
/plugin marketplace add jakubkrehel/skills   →   /plugin install interfaces@interfaces

# 4) NO recomendados (solo referencia)
npx impeccable install                      # instala hooks; el detector solo: npx impeccable detect --json <dir|archivo|url>
npx skills add leonxlnx/taste-skill         # o ./install.sh (symlinks)
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill   # trae todas las skills del repo
```

**Protocolo de instalación segura (mi recomendación)**
- Clonar en un directorio de `/tmp` fuera del repo, leer `SKILL.md` y `grep` de `fetch|https?://|spawn|exec|child_process|API_KEY` en los scripts; fijar el SHA del commit revisado.
- Copiar solo las carpetas de markdown necesarias. Evitar `npx skills add` y `npx impeccable install` (telemetría / hooks).
- Después: `git diff .claude/` y revisar que no aparezcan *hooks* ni permisos nuevos en `.claude/settings*.json`.

---

## 4. Tendencias 2026 aplicables a esta página

### 4.1 Soporte de navegadores (verificado)

Fuente: `web-platform-dx/web-features` (rama `main`, leída el 16-oct-2026; último push 15-oct-2026) y MDN BCD. «Widely» = Baseline amplio; «newly» = recién disponible; «no» = aún no es Baseline. «—» = sin soporte estable.

| Característica | Chrome/Edge | Firefox | Safari (iOS) | Baseline |
|---|---|---|---|---|
| Scroll-driven animations (`animation-timeline`, `view()`, `animation-range`) | 115 | **159** (beta desde 12-oct-2026; `web-features` aún no lo lista) | 26 (iOS 26) | no |
| View Transitions, mismo documento | 111 | 144 | 18 | newly (14-oct-2025) |
| View Transitions, entre documentos (`@view-transition`) | 126 | — | 18.2 | no |
| `text-wrap: balance` | 114 | 121 | 17.5 | newly (13-may-2024) |
| `text-wrap: pretty` | 117 | — | 26 | no |
| `mix-blend-mode` (multiply, screen…) | 41 | 32 | 8 | widely (jul-2022) |
| Filtros SVG (`feTurbulence`) | 5 | 3 | 6 | widely |
| CSS masks (`mask-image`) | 120 | 53 | 15.4 | widely (7-jun-2026) |
| `clip-path` | 88 | 71 | 13.1 | widely |
| `shape()` | 135 | 148 | 18.4 | newly (24-feb-2026) |
| `backdrop-filter` | 76 | 103 | 18 | newly (16-sep-2024) |
| `content-visibility` | 108 | 130 | 26 | newly (15-sep-2025) |
| `@starting-style` | 117 | 129 | 17.5 | newly (6-ago-2024) |
| `font-optical-sizing` | 79 | 62 | 13.1 | widely |
| `clamp()` | 79 | 75 | 13.1 | widely |
| `hyphens` (`auto`; con `lang="es"`) | 88 | 43 | 17 | widely (18-mar-2026) |
| AVIF | 85 | 113 | 16.4 | widely (25-jul-2026) |
| `prefers-reduced-motion` | 74 | 63 | 10.1 | widely |
| `hanging-punctuation` | — | — | 26.5 | no |
| `initial-letter` | 110 | — | — (solo `-webkit-` según Carmen Ansio; no verificado) | no |
| `corner-shape` | 139 | — | — | no |
| `text-box` (trim) | 133 | — | 18.2 | no |
| Carruseles CSS (`::scroll-marker`, `::scroll-button`) | 135 | — | — | no |
| Web Share (`navigator.share`, sin archivos) | 128 escritorio / Android 61 | solo Android 79 | 12.1 (iOS 12.2) | no |

**Notas**
- **Scroll-driven en Firefox:** `web-features` (15-oct) no lista Firefox; MDN BCD ya anota **159**; las notas oficiales de Firefox 159 beta (primera oferta 12-oct-2026) dicen «Firefox now supports scroll-driven animations». Firefox 158 salió el 13-oct; la 159 estable se espera a fines de octubre (browsercalendar.com la fecha el 23-oct; Mozilla pasó a ciclos de 2 semanas en sept-2026, así que podría ser el 27-oct: fuente de terceros, no verificado). La nota de web.dev de abril-2026 tuvo que corregir una afirmación de «Baseline» por esto mismo.
- **Tabla de Carmen Ansio vs `web-features`:** su tabla da `text-wrap: pretty` en Safari 17.5; `web-features` dice 26. Se usa `web-features`.
- **Audiencia (StatCounter, móvil en Colombia, sep-2026):** Chrome 81,1 % · Safari 16,54 % · Samsung Internet 1,56 % · Opera 0,23 % · **Firefox 0,22 %**. Qué parte de Safari está en iOS < 26: **no encontré dato**; revisar en GA4 (dimensión navegador/versión de SO).
- Compartir **archivos** con Web Share no se verificó por separado.

### 4.2 Aplicables

**T1 · Anti-IA / «imperfecto por diseño» (textura, huella de mano, papel, collage)** — ✅
- *Qué es:* respuesta a la estética «hiperpulida» de la IA. Landor lo llama «Anti-AI Crafting»: «cuando los algoritmos inundan el mundo de planitud impecable, las marcas del autor se vuelven señal» (Creative Bloq). Canva 2026: «Imperfect by Design», con «Texture Check» y «Zinegeist» (zines, collage, tipografía enorme; búsquedas de «type poster/brutalist/bold typography» +77 % interanual, dato de Canva). Webflow #2: estética vintage/manual con interacciones sofisticadas para señalar oficio humano.
- *Ejemplos:* campaña de punto de cruz de Burberry (https://www.thedrum.com/news/ad-the-day-burberry-brings-its-knight-life-with-cross-stitch-campaign); Madalena Studio × Crucible (https://www.itsnicethat.com/articles/madalena-studio-crucible-graphic-design-project-190824) — ambos vía Creative Bloq, no los abrí.
- *Soporte/coste:* es estilo; el coste depende de la técnica (T2–T3).
- *Celular:* alto. *Reserva:* en la encuesta «State of Creativity 2026» de Creative Boom aparecen entre lo que más cansa el «minimalismo/maximalismo perezoso» y la «cultura de plantillas»; su conclusión: «las quejas no son sobre estética, sino sobre intención».

**T2 · Sobreimpresión de tintas planas (serigrafía/riso) con `mix-blend-mode: multiply`** — ✅
- *Qué es:* capas de color plano que se multiplican (blanco = transparente), con leve desalineación (registro) y papel con grano. Documentado en A List Apart (`mix-blend-mode: multiply; opacity: 70%; /* overprint effect */`), web.dev («stacking multiple transparencies») y el CodePen «Risograph Effect» (https://codepen.io/saoskia/pen/LYXMBEZ).
- *Soporte:* Baseline widely (jul-2022).
- *Coste:* el blend se resuelve al pintar; **no encontré cifras fiables → no medido**. CSS-Tricks advierte que Blink y WebKit lo implementan «ligeramente distinto»: probar en iOS Safari. Mitigación (mía): `isolation: isolate` en el contenedor, áreas acotadas, imágenes estáticas.
- *Celular:* alto. **Nunca mezclar las fotos oficiales de la galería** (los padres quieren la foto real).

**T3 · Grano y halftone** — ✅ con raster
- *Qué es:* grano con `feTurbulence` en data-URI (CSS-Tricks «Grainy Gradients», freeCodeCamp); halftone en CSS puro con `radial-gradient` + máscara + `filter: contrast()` (CSS-IRL https://css-irl.info/css-halftone-patterns; Cloud Four). Catálogo con halftone estático: https://codefronts.com/design-styles/css-grain-texture.
- *Soporte:* filtros SVG y `mask-image` en Baseline widely.
- *Coste:* Codrops advierte que los filtros SVG pueden ser «resource-intensive» y que conviene acotar el área, sobre todo si se animan; **no hallé cifras para filtros estáticos**. *Recomendación propia (sin medición mía):* teselas de ruido/trama pre-renderizadas (PNG/WebP de 128–256 px) y el cerro de Yumbo como raster ya preparado (`prepare-yumbo-assets.mjs`), no overlays `position: fixed` a pantalla completa con blend. Medir en Android de gama media + iOS real.
- *Celular:* alto, en 2–3 superficies, no en todas.

**T4 · Titulares gigantes y «tipografía como diseño»** — ✅
- *Qué es:* Creative Bloq #06 («la tipografía ya no apoya el diseño: *es* el diseño»; ejemplos: Whitney https://whitney.org/about/new-identity, Spotify Wrapped https://newsroom.spotify.com/2025-12-03/wrapped-marketing-campaign/); Figma #4 (titulares sobredimensionados, fuentes variables; Glossier https://www.glossier.com/); Webflow #6. En el estudio de taste-skill (juicio de modelos, no humanos) el texto más grande de la página mide 8,4 vw en los sitios mejor puntuados vs 5,0 vw en los peores; titular ÷ cuerpo = 4,7 vs 4,0.
- *Soporte:* `clamp()` y `font-optical-sizing` widely; `text-wrap: balance` newly (Chrome 114/Firefox 121/Safari 17.5); `pretty` sin Firefox. Smashing Newsletter #571 (11-ago-2026) recomienda «Editorial Typography With CSS» (https://www.carmenansio.com/articles/editorial-typography-css/): `clamp()` para la escala, `balance` en titulares y `pretty` en párrafos; el resto (capitular, óptico, puntuación colgante) como mejora progresiva.
- *Coste:* bajo (texto). **Riesgo = la fuente:** Plus Jakarta Sans Itálica 800 enorme provoca CLS/LCP si hay swap → preload + métricas de fallback.
- *Celular:* alto si el titular cabe en ≤ 2 líneas a 390 px.

**T5 · Tipografía cinética y «guided scrolling» con scroll-driven animations (CSS)** — ⚠️ un solo momento
- *Qué es:* texto que reacciona al scroll; barras/indicadores de progreso (Webflow #7: el scroll como herramienta de **navegación**, no solo de narrativa). CSS-Tricks distingue scroll-driven (ligado al progreso), scroll-triggered, scroll-state y view transitions: https://css-tricks.com/scroll-driven-scroll-triggered-scroll-states-and-view-transitions.
- *Ejemplos:* NRK (Chrome for Developers) https://developer.chrome.com/blog/nrk-casestudy — `@supports` + respeto de `prefers-reduced-motion`; barra de progreso `scaleX` + `animation-timeline: scroll()` en https://developer.chrome.com/docs/css-ui/scroll-driven-animations.
- *Soporte:* ver §4.1; entra en Interop 2026 (web.dev, WebKit, Mozilla).
- *Coste:* corre **fuera del hilo principal** cuando se animan propiedades compositables (Chrome for Developers). web.dev: animar layout/paint es caro → **no animar `font-weight`/variaciones ni `clip-path`** (el repo ya tiene la tabla de excepciones en `docs/04` §2.5).
- *Celular:* medio-alto; Safari < 26 y Firefox < 159 verán el estado final. *Reserva:* Anthropic (vigente): un solo momento orquestado; fade-up en cada sección es el default de IA.

**T6 · View Transitions** — ⚠️ opcional
- *Qué es:* transiciones nativas entre estados (mismo documento) o páginas (entre documentos). Astro `ClientRouter` ya usa el API.
- *Soporte:* mismo documento = Baseline newly (oct-2025); **entre documentos sin Firefox** (y Firefox 159 beta no lo menciona). *Coste:* snapshots de pantalla; no medido en móviles de gama baja.
- *Encaje:* candidata opcional la transición miniatura → visor (mismo documento). No usar entre documentos como pieza central.

**T7 · Collage / stickers / recortes** — ⚠️ 1–2 piezas con sentido
- *Qué es:* Figma #11 («stickers, texturas rasgadas, fotos recortadas, fuentes dibujadas a mano»; La Palatine https://www.ensemblelapalatine.com/); Canva «Zinegeist».
- *Coste:* PNG/WebP con alfa; evitar SVG dibujado a mano en código (Impeccable: «Rough SVG illustrations»; taste-skill: ilustraciones SVG manuales desaconsejadas).
- *Celular:* medio: un sello de fecha/categoría con significado; no una lluvia de stickers (Creative Boom: «lazy maximalism»).

**T8 · Modo oscuro** — ✅ ya existe (tema por tokens). *Cuidado:* «casi negro + un acento verde ácido» es la agrupación #2 de Anthropic: lima **plano**, sin glow, con foto real (§5).

**T9 · Micro-interacciones funcionales** — ✅ feedback de pulsación y de descarga («Descargando…», «Listo»), hover solo bajo `(hover: hover) and (pointer: fine)`, < 300 ms (Emil Kowalski), `touch-action: manipulation` (Vercel). Coste bajo con `transform`/`opacity`.

**T10 · Layouts editoriales asimétricos / un color plano por sección** — ✅ (estudio de taste-skill, juicio de modelos: texto anclado a una línea fija o en esquinas, «una cosa por pantalla», color de fondo propio por sección; Anthropic: asimetría y solapes). Coste bajo. En celular se colapsa a una columna con jerarquía por escala.

**T11 · Ligereza como tendencia («Sustainable web design», Figma #13)** — ✅ `content-visibility: auto` + `contain-intrinsic-size` para la galería larga; AVIF en Baseline widely desde 25-jul-2026.

### 4.3 Gastadas (con evidencia)

- **Bento grids:** en la encuesta de Creative Boom (https://www.creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026) un encuestado escribe «Bento boxes… but can't stop using them»; Cre8tiv: murieron «por sobreuso, mal diseñadas y tratadas como plantilla», no por malas (https://cre8tiv.com.au/posts/can-bento-grids-come-back-already); Impeccable las marca como «Identical card grids». Otros blogs de 2026 aún las listan como dominantes en SaaS. **Para una galería por categoría: filas justificadas o masonry, no bento.**
- **Glassmorfismo / «liquid glass»** (Creative Boom #3; Impeccable «Glassmorphism everywhere»). `backdrop-filter` es Baseline newly y costoso con desenfoques grandes.
- **Degradados** (Creative Boom #4; estudio de taste-skill: relleno en degradado en 52 % de los sitios peor puntuados vs 22 % de los mejores).
- **Y2K / nostalgia retro** (Creative Boom #8), **minimalismo perezoso y maximalismo perezoso** (#5, #6), **plantillas de Canva** (#7), **motion por motion** (#10, «la deshonestidad»).
- **El «remedio» editorial:** crema + serif de alto contraste + terracota, cabecera itálica serif, «periódico» con hairlines (taste-skill, 3.ª oleada; Anthropic, agrupaciones 1 y 3; Impeccable «Cream / beige palette» e «Italic serif display headline»).
- **Neobrutalismo como default** (sombras duras desplazadas, bordes gruesos negros, colores saturados): Figma lo lista como tendencia #12 y es "mainstream" (marca de Figma, Gumroad); un análisis de Design Agent (26-ago-2026, blog de baja autoridad) muestra que toda su firma se reduce a umbrales de estilos computados (borde ≥ 2 px, `box-shadow` con blur 0 y desplazamiento ≥ 4 px, radio ≤ 3 px) → un agente lo produce sin esfuerzo (https://design-agent.dev/blog/2026-08-26-neobrutalism-computable-aesthetic). El repo ya tiene `--shadow-pressable` (sombra dura) en botones: no extenderla a tarjetas.
- **Eyebrow en mayúsculas, numeración 01/02/03, microetiquetas monoespaciadas, hairlines** («moda de galería»): en el estudio de taste-skill son *más* frecuentes en los sitios mejor puntuados (mono 44 % vs 24 %; numeración 38 % vs 21 %), pero son lo primero que copian los generadores; el eyebrow diminuto en mayúsculas sí correlaciona con los peores (57 % vs 16 %).
- **Hero centrado + captura debajo** (7 % de los mejores vs 24 % de los peores, mismo estudio).

### 4.4 No aplicables

- **3D / WebGL / inmersivo** (Figma #1): `canvas` en el 49 % de la muestra de taste-skill, pero cuesta JS (three.js), batería e INP; rompe el presupuesto (JS < 300 KB) y es el uso menos adecuado para familias con el celular.
- **Navegación experimental, scroll-jacking, preloaders y gates:** el estudio de taste-skill advierte que la usabilidad *no* sube con la puntuación de los mejores sitios («no copies sus gates, preloaders, texto diminuto ni navegación oculta»). Aquí la tarea es descargar fotos.
- **Transiciones entre documentos como pieza central:** sin Firefox; innecesario.
- **Carruseles CSS nativos, `corner-shape`, `text-box: trim`, `initial-letter`, `hanging-punctuation`:** soporte de un solo motor (§4.1). Solo como mejora progresiva sin efecto en el contenido.
- **Gamificación, neumorfismo, retrofuturismo** (Figma #7–#9) y **chatbots / interfaces de voz / personalización con IA:** fuera de tono; además, privacidad de menores.
- **Cursor personalizado:** no existe en celular.
- **Marquee que se desplaza solo** (la franja de 24 logos): Impeccable lo marca («hace leer al ritmo de la página»); la guía de Vercel exige pausa si el movimiento dura > 5 s. El repo ya ata el pase de la franja al scroll (`valida-ribbon-pass`), lo cual es distinto de un marquee autónomo.

---

## 5. Checklist «anti-aspecto-de-IA» para este proyecto

### 5.1 Qué tells coinciden en las tres fuentes más fuertes

| Tell | Anthropic (vigente) | taste-skill | Impeccable |
|---|---|---|---|
| Eyebrow / etiqueta en mayúsculas sobre el titular | ✔ | ✔ (prohibido) | ✔ «Label above a heading» |
| Una palabra acentuada del titular | ✔ | ✔ (aviso) | parcial («Italic serif display headline») |
| Numeración 01/02/03 sin secuencia | ✔ | ✔ (prohibido) | ✔ «Tiny numbered section labels» |
| Fade-up en cada sección / hover-lift en cada tarjeta | ✔ | ✔ («motion tells») | — |
| Tarjetas idénticas / bento | ✔ («SaaS-card kit») | ✔ | ✔ «Identical card grids», «Nested cards» |
| Cifra grande + etiqueta + stats | ✔ | — | ✔ «Hero metric layout» |
| Crema + serif + terracota | ✔ | ✔ | ✔ «Cream / beige palette» |
| Casi negro + acento neón / glow | ✔ | ✔ (prohibido) | ✔ «Dark mode with glowing accents» |
| Hairlines por todos lados | ✔ («periódico») | ✔ (prohibido) | ✔ «Hairline border with wide shadow» |
| Etiquetas monoespaciadas | ✔ | ✔ (prohibido) | — |
| Marquee autónomo | — | — | ✔ «Auto-scrolling marquee» |
| Máscaras dentadas (papel rasgado hecho en código) | — | — | ✔ «Jagged image masks» |
| Ilustración SVG hecha a mano en código | — | ✔ (desaconsejada) | ✔ «Rough SVG illustrations» |

### 5.2 Lo que ya aparece en el código actual (lectura rápida de 4 archivos, no auditoría)

- `src/components/editorial/SectionIntro.astro` (~l. 61): eyebrow con `text-xs font-semibold uppercase tracking-[0.18em]` + icono. En la página, `eyebrow=` en l. 337 (`Copa Valle 2026 · {edición}`, con punto medio), 441 y 752.
- `highlight=` (palabra/frase acentuada) en 4 titulares de `copa-valle-yumbo-2026.astro`: l. 340 (hero), 444 («por categoría»), 657 («jornada») y 720.
- `src/components/sections/ValidaNumbers.astro` (l. 124–127): tarjeta `rounded-2xl ring-1` con `grid sm:grid-cols-3` de cifras iguales → «hero metric» + «tarjetas idénticas».
- `src/styles/global.css` l. 55–56: `--font-sans: 'Inter Variable'` (los tres detectores lo marcan) y `--font-display: 'Plus Jakarta Sans'` (taste-skill avisa). Cambiar la familia **no** es parte del rediseño (decisión de marca y de peso): la personalidad debe venir del *tratamiento*.
- A favor: `ValidaSponsorRibbon` ata el pase al scroll con `@supports (animation-timeline: view())` (no es un marquee autónomo); los tonos de sección ya alternan; existen `--radius-plate` (0,25 rem) y los tokens `--shadow-*`.

### 5.3 Checklist (marcar antes de entregar)

**A · Tipografía**
- [ ] Titular de sección ≤ ~5 palabras y ≤ 2 líneas a 390 px (mediana del estudio: 5 palabras; una frase larga en 3 líneas «se lee como titular largo» aunque el marcado diga otra cosa).
- [ ] Sin palabra acentuada suelta. Si hay énfasis, que sea un gesto de imprenta (subrayado grueso o sobreimpresión de *toda* la frase), no una palabra en otro color.
- [ ] Sin eyebrow diminuto en mayúsculas ni cadenas con punto medio. Conservar etiqueta solo si es un dato real (fecha, categoría) y en tamaño legible.
- [ ] Sin numeración 01/02/03 salvo secuencia real (la cronología de la pista sí; las secciones no).
- [ ] **Un salto de escala extremo**: un dato enorme frente al cuerpo (titular ÷ cuerpo ≈ 4,7 en los mejores del estudio). El dato enorme es *contenido* (una cifra con su frase de contexto), no la tarjeta de tres stats ni «cifra + etiqueta + stats de apoyo + degradado».
- [ ] `text-wrap: balance` en titulares y `pretty` en párrafos; `lang="es"` y comillas «» / ¿¡; `…` en vez de `...`; espacios duros en «10 MB»; `font-variant-numeric: tabular-nums` en resultados; tracking −0,01 a −0,02 em en titulares ≥ 24 px.
- [ ] Fuente de display con preload y fallback con métricas (`size-adjust`, `ascent-override`) para evitar CLS en titulares gigantes. Cuerpo ≥ 16 px; nada de texto de 9–13 px (falla de los mejores sitios del estudio).

**B · Color y superficie**
- [ ] Máximo dos tintas (teal, lima) + papel + grafito. Sin degradados decorativos ni texto con degradado. Capas por `mix-blend-mode: multiply` con registro desalineado de 1–3 px en lugar de sombras suaves.
- [ ] Papel: si se usa crema, que sea el tono medido de las piezas de Instagram aprobadas. Lo que delata es la **tríada** crema + serif + terracota, no el papel. Sin acento terracota.
- [ ] Secciones oscuras: lima **plano** sobre grafito con foto real; **sin glow, neón ni borde luminoso**. Una sola sección oscura como «capítulo».
- [ ] Sin sombra suave bajo cada tarjeta, sin `ring-1` + sombra, sin un radio medio idéntico en todo: elegir cuadrado (`--radius-plate`) o redondo total y mantenerlo. Sombra dura (`--shadow-pressable`) solo en botones.
- [ ] Sin glassmorfismo ni `backdrop-filter` decorativo (el `SectionDock` solo si lo exige la legibilidad).
- [ ] Contraste ≥ 4,5:1 **medido con la textura puesta**; teal/lima no como texto sobre claro (`primary-deep`/`accent-deep`); placa sólida o scrim bajo texto sobre grano/foto.

**C · Layout**
- [ ] Sin «3 tarjetas iguales» ni bento. Cifras como líneas de un marcador impreso o una cifra gigante + las demás en frase (el repo tiene `StatFigure`, `FactGrid`, `Timeline`, `ClubSeal`).
- [ ] Hero asimétrico: texto anclado a una línea fija, **un** elemento dominante (foto de acción o cerro con trama). Sin «titular centrado + dos botones + captura».
- [ ] Composición distinta por sección, no solo tono distinto: que 8 secciones no sean 8 × [intro centrado + grilla].
- [ ] **La galería es la tarea:** sección convencional y rápida (controles planos, objetivos ≥ 44 px, `content-visibility: auto`, `width/height` en miniaturas, visor con `overscroll-behavior: contain` y botones además de deslizar). El estilo vive en el marco, no en los controles ni sobre las fotos.
- [ ] Franja de aliados: sin marquee autónomo; si los aliados lo permiten, logos en una sola tinta (si no, respetar sus colores). Nombre de marca también como texto accesible.
- [ ] Una cosa memorable por pantalla; el resto, calmado («gasta tu audacia en un solo lugar»).

**D · Imagen y textura**
- [ ] Fotos reales siempre (reglas del repo: nada inventado; nombres y dorsales de menores nunca). Nada de stock (`picsum`, Pexels) ni ilustración en SVG hecha en código.
- [ ] El cerro de Yumbo y el **papel rasgado** son recursos raster preparados (como las láminas de los hitos), **no** `clip-path: polygon` generado («Jagged image masks»).
- [ ] Grano y halftone como teselas pre-renderizadas, en 2–3 superficies; sin overlay `fixed` a pantalla completa con blend.
- [ ] Sin emoji como iconos ni «icono en cuadrado redondeado» sobre cada título. Sin imágenes que hacen zoom al pasar el cursor.

**E · Movimiento**
- [ ] Un solo momento orquestado (apertura) + progreso de scroll. **No** fade-up en cada sección (revisar dónde se aplica `.reveal`), ni hover-lift en cada tarjeta, ni rebote/elástico, ni punto pulsante.
- [ ] Scroll-driven bajo `@supports (animation-timeline: view())` dentro de `prefers-reduced-motion: no-preference`; **estado final visible sin soporte** (Firefox < 159, Safari < 26) y sin JS; longhands (Lightning CSS rompe el shorthand `animation`).
- [ ] Solo `transform`/`opacity`; nunca `transition: all`; hover bajo `(hover: hover) and (pointer: fine)`; `touch-action: manipulation`.

**F · Copy**
- [ ] Sin rayas largas en cada oración, sin tricolon («rápido, fácil y seguro»), sin «viaje»/«experiencia»/«teatro» genéricos. CTA específico («Descargar fotos de Sub-12 mujeres»), no «Descubre más →». Sin flecha «→» añadida a todo enlace.
- [ ] Reglas del repo: nada inventado, cifras con fuente, sin nombres de menores ni dorsales.

**G · Proceso y verificación**
- [ ] Antes de construir: plan de 4–6 hex con nombre, roles tipográficos, wireframe ASCII y principios; **revisarlo contra el brief** (¿lo produciría igual para cualquier otro evento?).
- [ ] Después: capturas a 390/768/1440; prueba de «tapa el nombre del club»; prueba de entrecerrar los ojos (¿hay un elemento dominante por pantalla?).
- [ ] Sin `animation-timeline` (forzar `@supports not`) y sin JS: contenido completo y legible.
- [ ] Safari iOS real (blend modes, `text-wrap`) y Android de gama media: Lighthouse móvil con LCP < 2,0 s, CLS < 0,05, INP < 200 ms.
- [ ] `web-design-guidelines` sin hallazgos; foco visible; reduced-motion probado.
- [ ] «Quitar un accesorio» antes de cerrar (consejo de la skill vigente).
- [ ] Opcional: `npx impeccable detect --json` sobre una copia de `dist/` (telemetría apagada); justificar cada hallazgo «AI slop» o corregirlo.

### 5.4 Traducción a las 8 secciones (propuesta, no decisión)

1. **Apertura:** póster tipográfico (titular corto, Jakarta 800 itálica), cerro en trama lima como raster, un único dato enorme real si lo hay, un momento scroll-driven bajo `@supports`.
2. **Franja de aliados:** estática, sin marquee autónomo; mantener el requisito de visibilidad.
3. **Fotos oficiales:** lo más convencional y rápido de la página; estilo solo en el marco (cabecera de categoría con sobreimpresión).
4. **Aliados (oscura):** capítulo grafito con lima plano y foto real; nombres como texto, no 24 tarjetas iguales.
5. **Resultados:** tabla «impresa» (`tabular-nums`, filas por tono de papel o reglas gruesas, no hairlines).
6. **Cifras:** una cifra gigante con su frase de contexto; evitar tres columnas iguales.
7. **La pista:** único lugar donde una línea de tiempo/numeración está justificada (es secuencia real).
8. **Paso siguiente:** un CTA con etiqueta específica (`CTA_TRIAL_LABEL`), cierre propio (una escena), no un footer de columnas.

---

## 6. Qué no verifiqué / límites

- **UX Planet** (comparativa de tres skills): paywall; sin veredicto independiente sobre `ui-ux-pro-max` vs `taste-skill` vs `frontend-design`.
- **Conteos de instalaciones** (skills.sh, Skillselion): telemetría del CLI, no auditados. Las ~251 mil de Impeccable y las 23 ★ de `agents-inc` vienen de Skillselion y no las comprobé.
- **Estudio de taste-skill:** autopublicado; puntuaciones de 21 modelos sobre capturas fijas (una captura por sitio y día); él mismo dice que es «moda tanto como calidad». Úsese como señal, no como prueba.
- **Coste de rendimiento de grano, blend y máscaras en móvil:** sin medición propia ni fuente con cifras. Las recomendaciones de teselas raster y de medir en Android de gama media + iOS real son mías.
- **Cuota de iOS < 26 en Colombia:** no hallada. **Web Share con archivos:** no verificado. **Fecha exacta de Firefox 159 estable:** de terceros.
- **Awwwards:** no encontré un informe de tendencias 2026 de Awwwards como tal; sus notas editoriales sobre tipografía no tienen fecha. La señal de Awwwards en este documento viene indirecta (muestra de Sites of the Day en el estudio de taste-skill).
- **Smashing / CSS-Tricks / Codrops:** leí en completo el boletín #571 de Smashing, el artículo de Carmen Ansio, CSS-Tricks «Grainy Gradients» y Codrops (feTurbulence); el resto aparece como extracto de búsqueda (marcado en §7).
- No ejecuté `impeccable detect` ni los scripts de taste-skill; sus riesgos salen de leer el código y los README.

---

## 7. Fuentes

(Extracto = solo vi el fragmento devuelto por la búsqueda; sin marca = lo leí.)

**Skills, repos y seguridad**
- anthropics/skills · frontend-design: https://github.com/anthropics/skills/tree/main/skills/frontend-design · raw: https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- anthropics/claude-plugins-official: https://github.com/anthropics/claude-plugins-official
- vercel-labs/agent-skills: https://github.com/vercel-labs/agent-skills · web-interface-guidelines: https://github.com/vercel-labs/web-interface-guidelines · `command.md`: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- taste-skill: https://github.com/Leonxlnx/taste-skill · sitio: https://www.tasteskill.dev · tells: https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/references/tells.md · estudio: https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/references/research.md
- Impeccable: https://github.com/pbakaus/impeccable · catálogo: https://impeccable.style/slop · CLI: https://raw.githubusercontent.com/pbakaus/impeccable/main/README.npm.md
- ui-ux-pro-max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Emil Kowalski: https://github.com/emilkowalski/skills · Jakub Krehel: https://github.com/jakubkrehel/skills
- OneRedOak: https://github.com/OneRedOak/claude-code-workflows · AccessLint: https://github.com/AccessLint/skills · GSAP: https://github.com/greensock/gsap-skills
- VoltAgent/awesome-claude-design: https://github.com/VoltAgent/awesome-claude-design · Owl-Listener: https://github.com/Owl-Listener/designer-skills
- Índices: https://github.com/ComposioHQ/awesome-claude-skills · https://github.com/hesreallyhim/awesome-claude-code · https://github.com/VoltAgent/awesome-agent-skills · https://github.com/travisvn/awesome-claude-skills
- skills.sh (leaderboard): https://skills.sh/ · telemetría: https://www.npmjs.com/package/skills (extracto) · https://github.com/vercel-labs/skills/issues/1315 (extracto) · https://news.ycombinator.com/item?id=46697908 (extracto)
- Snyk, «Top 8 Claude Skills for UI/UX Engineers»: https://snyk.io/articles/top-claude-skills-ui-ux-engineers · Snyk ToxicSkills: https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/
- Composio, «Top 10 Design Skills for Claude Code and Codex»: https://composio.dev/content/top-design-skills
- UX Planet (de pago, no leído): https://uxplanet.org/ive-tested-3-popular-claude-code-skills-for-web-design-24b7866e05a7
- Skillselion (extracto): https://skillselion.com/guides/impeccable-skill-claude-code-guide
- polyfill.io: https://threats.wiz.io/all-incidents/funnull-polyfill-supply-chain-attack (extracto) · https://arcticwolf.com/resources/blog/polyfill-supply-chain-attack-impacts-100k-sites (extracto) · `X-XSS-Protection`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-XSS-Protection (extracto)

**Tendencias**
- Creative Bloq, «Texture, warmth and tactile rebellion…»: https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026
- Creative Boom, «10 trends that creatives are so over in 2026»: https://www.creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026
- Canva, «Imperfect by Design»: https://www.canva.com/newsroom/news/design-trends-2026
- Figma, «Top Web Design Trends for 2026»: https://www.figma.com/resource-library/web-design-trends
- Webflow, «8 web design trends to watch in 2026»: https://webflow.com/blog/web-design-trends-2026
- Design Agent, neobrutalismo: https://design-agent.dev/blog/2026-08-26-neobrutalism-computable-aesthetic
- Cre8tiv, bento: https://cre8tiv.com.au/posts/can-bento-grids-come-back-already
- Smashing Newsletter #571: https://www.smashingmagazine.com/the-smashing-newsletter/smashing-newsletter-issue-571 · Carmen Ansio: https://www.carmenansio.com/articles/editorial-typography-css/
- CSS-Tricks, scroll-driven/triggered/states/view transitions: https://css-tricks.com/scroll-driven-scroll-triggered-scroll-states-and-view-transitions (extracto) · Interop 2026: https://css-tricks.com/interop-2026 (extracto) · «Grainy Gradients»: https://css-tricks.com/grainy-gradients
- Awwwards (editorial sin fecha, extracto): https://www.awwwards.com/typography-heavy-design.html

**Soporte y rendimiento**
- web-features: https://github.com/web-platform-dx/web-features (archivos `features/*.yml.dist`) · MDN BCD: https://github.com/mdn/browser-compat-data (`css/properties/animation-timeline.json`)
- Notas de Firefox 159 beta: https://www.firefox.com/en-US/firefox/159.0beta/releasenotes/ · calendario (tercero): https://browsercalendar.com/browsers/firefox · ciclo de 2 semanas: https://www.ghacks.net/2026/07/14/firefox-switches-to-two-week-release-cycle-starting-september-2026 (extracto)
- StatCounter, móvil en Colombia: https://gs.statcounter.com/browser-market-share/mobile/colombia
- Chrome for Developers: https://developer.chrome.com/docs/css-ui/scroll-driven-animations · NRK: https://developer.chrome.com/blog/nrk-casestudy
- web.dev: https://web.dev/articles/animations-and-performance · Interop 2026: https://web.dev/blog/interop-2026 · corrección de abril-2026: https://web.dev/blog/web-platform-04-2026 (extracto) · blend modes: https://web.dev/learn/css/blend-modes (extracto)
- WebKit, Interop 2026: https://webkit.org/blog/17818/announcing-interop-2026 (extracto) · Mozilla Hacks: https://hacks.mozilla.org/2026/02/launching-interop-2026 (extracto)
- Codrops, feTurbulence: https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence · A List Apart, blending modes: https://alistapart.com/article/blending-modes-demystified (extracto) · CodePen Riso: https://codepen.io/saoskia/pen/LYXMBEZ (extracto) · CSS-IRL halftone: https://css-irl.info/css-halftone-patterns (extracto) · Cloud Four: https://cloudfour.com/thinks/the-power-of-css-blend-modes (extracto)
- Smashing, intro a scroll-driven (dic-2024): https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations (extracto)
