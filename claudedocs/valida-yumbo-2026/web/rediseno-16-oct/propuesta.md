# Propuesta de rediseño de `/copa-valle-yumbo-2026`: «La válida impresa»

> **Vigente: la v6 (al final de este documento).** La v2 de solo esqueleto (`v2-esqueleto/`) se descartó: el usuario
> prefirió esta dirección, con títulos y botones del estilo global.

> 16-oct-2026. **Propuesta, sin implementar.** Ningún archivo del sitio cambió.
>
> - **Maqueta navegable:** `maqueta/index.html`. Ábrela en el navegador; es HTML suelto con los datos reales de hoy (25 aliados, cifras históricas, mangas y el GPX de la pista) y las fotos de la vista previa.
> - **Comparación de la primera pantalla:** `comparacion-apertura-escritorio.png` y `comparacion-apertura-movil.png`.
> - **Capturas:** `capturas/antes-preview-*.png` (la página de hoy con 420 fotos de prueba) y `maqueta/capturas/v5-*.png` (la maqueta a 1440 y 390 px).
> - **Investigación** (dos agentes Sonnet con Tavily): `investigacion-referencias.md` e `investigacion-skills-tendencias.md`.

## 1. Por qué hoy se ve «sencilla» o «clásica»

1. **Viste el uniforme del sitio, no el de la válida.** Las secciones abren igual: antetítulo en mayúsculas espaciadas con un icono, titular con una palabra subrayada en lima y bajada gris. La investigación confirma que esos dos gestos son justo lo primero que delata una plantilla: la versión vigente de la skill `frontend-design` de Anthropic los nombra como «tells» de diseño generado.
2. **No hay huella de la válida.** La campaña de Instagram (el cerro a dos tintas, la lima plana, la trama de puntos, el papel rasgado del afiche) no aparece en la web. La apertura parece la página de una aplicación: degradado pastel, patrón topográfico y una foto con esquinas redondeadas.
3. **Todo es una tarjeta.** Las cifras son «tres números iguales en una tarjeta redondeada», otro de los rasgos más genéricos. Los aliados y los resultados también van en tarjetas.
4. **La tipografía es tímida.** No hay un solo elemento a escala de cartel.
5. **Las fotos parecen un explorador de archivos:** filas iguales con botones grises.

## 2. El concepto

**La página es el afiche y el programa de la carrera, impresos a dos tintas (lima y tinta) sobre papel.** Es la imprenta de las historias «agencia» que ya aprobaste, llevada a la web.

La investigación lo respalda. La tendencia de 2026 que pesa es la de lo **«imperfecto por diseño»** (textura, papel, sobreimpresión), como respuesta al acabado pulido de la IA. Pero cansa cuando no tiene intención. Por eso cada textura aquí tiene una razón de imprenta y ninguna es un filtro.

### Reglas

- **Dos tintas y papel.** Lima `#8be000`, tinta `#1c1e20` y el papel de las historias (`#f4f2eb`, el tono medido en las piezas aprobadas). El teal del club va una sola vez, en el cierre.
- **Titulares de cartel.** Plus Jakarta Sans itálica 800 en mayúsculas, solo en los titulares. El texto corrido sigue en Inter. No entra ninguna fuente nueva.
- **Nada inventado ni generado con IA.**
  - El cerro sale de la acuarela del club con el mismo generador de las historias (`piezas/03-aliados/agencia_assets.py`), con un encuadre horizontal nuevo.
  - El trazado de la pista sale del GPX real.
  - Cada número sale de los JSON.
- **Un solo elemento enorme por pantalla.** En la apertura, el título sobre el cerro; en el muro, «GRACIAS»; en las cifras, «4 a 60+».

### Lo que la maqueta quitó a propósito (v5)

Después de leer la investigación revisé la maqueta contra su lista de rasgos de diseño generado y quité lo siguiente:

- **Antetítulos** en mayúsculas espaciadas y cadenas con punto medio («Copa Valle 2026 · XCO · Yumbo»).
- **La palabra resaltada en lima** dentro de los titulares.
- **Las sombras duras desplazadas** en botones, boletos y tarjetas. El neobrutalismo es hoy lo primero que produce cualquier agente.
- **Tarjetas que se levantan** al pasar el mouse.
- **Flechas «→»** al final de los botones. Solo queda el icono de «se abre afuera» en los enlaces externos, porque es funcional.
- **24 tarjetas iguales para los aliados.** Ahora es un solo pliego impreso.
- **Tres cifras gigantes en columnas iguales.** Ahora es una sola cifra y una planilla.

## 3. Sección por sección

| # | Hoy | Propuesta | Qué se conserva |
|---|---|---|---|
| 1 | Apertura pastel con foto redondeada | **El afiche.** El cerro de Yumbo a dos tintas a todo el ancho. Sobre el cielo lima: «Tus fotos de la **VI VÁLIDA COPA VALLE**» a escala de cartel y el rótulo negro del afiche oficial con una frase: «Se corrió el domingo 18 de octubre en la Pista Carlos Castro». El letrero YUMBO va en tipografía sobre el cerro, como en las historias. En la sombra del cerro: «**420** fotos oficiales, gratis y en calidad original gracias a 25 aliados», con «Buscar mis fotos» y «Resultados oficiales». El patrocinio se nombra como lo que hizo posible la foto gratis (así lo hace Unbound con Garmin). En escritorio, la **primera fila de logos sigue entrando en la primera pantalla** (la regla del 8-oct). | Textos de `heroCopy`, la versión sin fotos («Así se corrió…»), las migas y la analítica de los botones |
| 2 | Logos sobre blanco y banda grafito | **La franja del afiche**, casi igual: papel sobre el cerro y la banda «25 aliados le apostaron a esta válida» que pediste el 8-oct. Cambian la tipografía y el papel, que pasa a ser el de las historias. Los logos con fondo blanco se funden con el papel (`multiply`, solo en esos logos chicos y quietos). | Todo: igual área por logo, valla ligada al scroll en el celular, `srcset` de 320 px y el aire de abajo |
| 3 | Chips grises y tiras de miniaturas | **Hoja de contactos.** La galería es la tarea, así que los controles se quedan **sencillos y grandes**: chips de 44 px con borde de tinta y la activa en tinta. El estilo vive en el cabezote de cada manga: «MANGA 3» en contorno, «INFANTIL» y «Infantil A y B, salida a las 10:15», con la hora real de `mangas.json`. Las fotos van con esquinas rectas y sin nada encima. El foco del teclado (y el mouse) se marca con **lápiz graso lima por fuera de la foto**. Los botones dicen qué abren: «Ver las 95 fotos de Infantil». | La lógica completa de la isla: filtros, placa, visor, descarga, compartir y los enlaces `?manga=`. Solo cambian clases. |
| 4 | Muro grafito de 24 tarjetas blancas | **El capítulo oscuro, con un solo pliego.** «GRACIAS» enorme en lima, «a los 25 que le apostaron a la válida» y, debajo, **una hoja de papel con todos los logos** (patrocinio y apoyo) con sus **marcas de corte** lima en las cuatro esquinas, como un pliego recién impreso. Cada aliado lleva su nombre en itálica y su @. | Orden alfabético, los tres grupos, las descripciones, los enlaces y `sponsor_wall_view` |
| 5 | Banda con una tarjeta | **El talón.** Un boleto con perforación y el lomo lima «Copa Valle 2026». | Enlace, `race_results_click` y la lógica de 1 a 3 tarjetas |
| 6 | Tarjetas blancas con icono y número teal | **La planilla.** Un pliego lima a todo el ancho con una sola cifra gigante: «DE **4 A 60+** AÑOS, EL MISMO DÍA, LA MISMA PISTA». Debajo, dos planillas de cronometraje con línea punteada: la edición 2026 y la de 2022, 2024 y 2025. El «96 de cada 100» se dibuja como una trama de 100 puntos. | Las cifras de `datos.json`, la nota de la fuente y la regla de no pintar lo que no existe |
| 7 | Línea de tiempo alternada | **El trazado real.** El circuito de la Pista Carlos Castro dibujado desde el GPS, en tinta sobre un trazo lima, con salida y meta. Los hitos van con el año en contorno (aquí la numeración sí es una secuencia real). La foto de la valla va en duotono lima y tinta. Titular corto: «PISTA DE JUEGOS NACIONALES». | Los hitos de `milestones` y «Conoce la pista» |
| 8 | Banda teal con dos columnas | **Una escena:** «NOS VEMOS EN ROLDANILLO» a escala de cartel sobre el teal y, al lado, la invitación a la escuela en una hoja de papel. Debajo entra el pie del sitio con su silueta de elevación. | La próxima parada solo si no ha pasado, la edad mínima de `programs` y los dos botones |

El índice flotante (`SectionDock`) ya es una cápsula de tinta: solo se le ajusta la tipografía.

## 4. Movimiento

- **Un solo momento orquestado: la apertura.** Al cargar entra la lima, después la tinta, y el título «estampa». Son unos 600 ms, solo con `transform` y `opacity`. Con `prefers-reduced-motion` no se anima nada.
- **Nada de aparecer-al-bajar en cada sección.** En esta página se quitan los `.reveal`, porque la investigación los identifica como el movimiento más genérico.
- La franja conserva su pase ligado al scroll en el celular, que no es un carrusel automático.
- **Soporte:**
  - Las animaciones ligadas al scroll funcionan en Chrome/Edge 115+, en Safari 26+ y en Firefox 159, que está en beta.
  - Firefox es el 0,22 % del celular en Colombia.
  - Los demás ven el estado final, como ya exige `docs/04` §2.5.

## 5. Tema oscuro

El afiche, el muro y la planilla ya son tinta y lima. Las secciones de papel pasan a grafito con la tinta invertida a papel; la lima se queda plana, sin brillo ni neón (eso sí delataría «IA»).

## 6. Accesibilidad y rendimiento

| Combinación | Contraste | Uso |
|---|---|---|
| Lima sobre tinta | 10,2:1 | «Gracias», el 420, la banda de aliados |
| Tinta sobre lima | 10,2:1 | La planilla, los botones lima |
| Tinta sobre papel y papel sobre tinta | 14,9:1 | Texto corrido |
| Tinta sobre teal | 6,9:1 | Cierre |
| Lima honda `#456f00` sobre papel | 5,3:1 | Los @ de los aliados en el pliego |
| **Lima sobre papel** | **1,47:1** | **Nunca como texto**, solo marcas y rellenos |

- **Peso de la apertura.** La trama de puntos comprime peor que una foto, y el peso está en los puntos (quitar el grano no la aligera):
  - **Escritorio:** el cerro en WebP pesa **119 KB** a 1440 px. Hoy la foto de la apertura pesa 141 KB a 1200 px.
  - **Celular:** en el celular la trama va un poco más abierta (celdas de 19 px en vez de 13, como sugirió la investigación de referencias). Así pesa **90 KB** a 640 px, casi lo mismo que la foto de hoy (unos 85 KB), y a la vista es la misma serigrafía.
- **Fuentes:** no entra ninguna fuente nueva. Para los titulares gigantes conviene precargar Plus Jakarta Sans con métricas de respaldo (evita el salto de diseño).
- **Galería:** `content-visibility: auto` en las mangas de abajo, `width`/`height` en cada miniatura y `overscroll-behavior: contain` en el visor.
- El HTML semántico, los `aria-*` y el orden de tabulación no cambian. Los textos van en HTML, nunca dentro de la imagen.

## 7. Qué no cambia

Lo que no se toca:

- Los JSON y su validación.
- La regla de nunca nombres de menores ni placas.
- La política de imágenes.
- La analítica.
- El SEO y el JSON-LD.
- El orden de las secciones.
- La lógica de la galería.
- La regla de estilos en el `<style>` de cada componente, nunca en `global.css`.

**Pendiente menor:** el borde rasgado. La investigación marca las máscaras dentadas hechas en código como rasgo de IA, y el de hoy es un trazo SVG generado. Intenté sacar el borde real del afiche oficial, pero ahí lo tapan los logos y el rótulo. Para la fase 2 propongo **escanear o fotografiar una hoja rasgada de verdad** y usarla como máscara.

## 8. Plan y plazo

**Fecha dura:** la página se publica con las fotos el **lunes 19 antes del mediodía**.

- **Fase 1** (vie 16 a dom 18, antes de publicar), en este orden:
  1. El afiche y la franja.
  2. La piel de la galería.
  3. El pliego de aliados.
  4. La planilla.
  5. El talón.

  Es lo que ven las familias el lunes.
- **Fase 2** (semana del 19): el trazado de la pista, el cierre, el tema oscuro fino, la animación de apertura y el borde rasgado escaneado.
- **Reparto de agentes:**
  - Opus para el afiche y la franja (dirección de arte).
  - Sonnet con especificación exacta para la galería y la planilla, con sus tests.
  - Haiku para la batería de verificación.
  - Antes de entregar reviso yo las capturas a 1440, 1024, 768 y 390 px, en claro y en oscuro, contra el checklist de la investigación (§5).
- **Si no alcanza el tiempo**, se publica el lunes con el diseño actual y el rediseño entra después. Los datos y la dirección de la página no cambian.

## 9. Skills: qué recomienda la investigación

- **Actualizar la skill `frontend-design` del repo** (`.claude/skills/frontend-design/SKILL.md`). La copia es del 29-abr; Anthropic la actualizó el 9-jun y el 3-sep-2026, y la versión nueva trae la lista de rasgos de diseño generado que usé para limpiar la maqueta. Es solo texto, sin scripts. **Necesito tu visto bueno** porque cambia la configuración del proyecto.
- **Opcionales:** las skills de movimiento de `emilkowalski/skills` y `better-typography` de `jakubkrehel/skills`. Son solo markdown y se copiarían a mano, después de leerlas.
- **No instalar:**
  - `taste-skill`: reparte estilos al azar, baja imágenes de bancos abiertos y rechaza las reglas de imprenta que aprobaste.
  - Impeccable: instala *hooks* que corren un binario descargado en cada edición.
  - `ui-ux-pro-max`: diseño por categoría, y trae scripts que llaman APIs externas de imágenes.
- **Ojo con la skill instalada `best-practices`:** recomienda cargar `polyfill.io`, un dominio comprometido en 2024. No hay que seguir esa parte.

## 10. Lo que necesito que decidas

1. **¿Apruebas la dirección «La válida impresa»** tal como está en la maqueta v5?
2. **¿Fase 1 antes del lunes**, o publicar el lunes con el diseño actual y rediseñar después?
3. **¿Foto de la carrera en la apertura?** Recomiendo que no: solo el cerro. Las fotos empiezan una pantalla más abajo, y así no queda un primer plano de un niño arriba ni en la vista previa de WhatsApp.
4. **¿Actualizo la skill `frontend-design`** antes de implementar?

## 11. Lo que aportó la investigación de referencias

19 referencias verificadas (`investigacion-referencias.md`). Lo que más pesa:

- **The Big Lost** (biglostidaho.com) es la mejor referencia liviana: tres tintas, titular pesado y 82 KB de JS, sin video. Lo primero después del hero son las fotos oficiales. Nuestra apertura hace lo mismo: el botón lleva directo a la galería.
- **Unbound Gravel** presenta al patrocinador como el que hizo posible la foto gratis («FREE photo… thanks to Garmin»). Ya está en la apertura de la maqueta.
- **Sportograf** busca por «categoría + ventana de hora», que es exactamente nuestra «manga + hora de salida». Lo que lo hace descartable es la búsqueda por selfie (biometría de menores). **Pic2Go** pone la marca del patrocinador sobre la foto: prohibido para nosotros.
- **Lo que hay que superar:** una liga juvenil de MTB de Minnesota entrega 2 fotos de baja resolución con marca de agua y un cupón. Nosotros damos todas en original y sin cupón.
- **Lo que se descarta:** video a pantalla completa, WebGL, scroll secuestrado y sitios de más de 1 MB de CSS (Red Bull Rampage, Unbound, Sea Otter). «Premium» no es pesado.
- **Técnica:** grano como imagen quieta (nunca filtros SVG vivos); `multiply` solo en elementos chicos y quietos; el registro corrido no más de 5 px. La maqueta cumple las tres.

**Ideas que quedan para la fase 2 (no entran antes del lunes):**

1. «Compartir esta foto» con el archivo real desde el celular (Web Share). Hay que probarlo en un iPhone de verdad antes de publicarlo.
2. Una línea por aliado con lo que puso («puso los trofeos», «el sonido»). Solo si el club tiene esos datos; no se inventa.
3. El perfil de elevación de la pista junto al trazado, con el botón «Descargar GPX».
4. El borde de papel rasgado escaneado de una hoja real.

## 12. Cómo se hizo esta propuesta

- **Investigación:** dos agentes Sonnet con Tavily, en paralelo. Uno investigó referencias de eventos deportivos y buscadores de fotos (19 verificadas, unos 30 sitios abiertos en un celular simulado). El otro, skills de diseño para agentes y tendencias 2026 (14 skills evaluadas, sin instalar ninguna).
- **Maqueta:** la armé yo con los datos reales del sitio. Pasó por cinco rondas, cada una revisada con capturas a 1440 y 390 px. La quinta aplica el checklist de la investigación.
- **No se tocó ningún archivo del sitio.** Todo está en esta carpeta.

## v6 (16-oct, tarde): la v5 con títulos y botones del sitio

El usuario prefirió la v5 a la v2 de esqueleto, pero con títulos y botones como los del resto de la web. La maqueta
(`maqueta/index.html`, capturas `maqueta/capturas/v6-*`) ahora usa:

- **Títulos** como `SectionIntro`: antetítulo pequeño en mayúsculas, titular Plus Jakarta Sans bold (sin itálica ni
  mayúsculas) y el trazo lima en una parte.
- **Botones** como `Button`: redondeo de 8 px, Inter semibold y sombra dura de 4 px, en variantes acento, contorno y
  secundario.
- **Chips y campo de placa** como los de la galería actual.

**Textos ocultos corregidos:**

- El titular va sobre un panel de cielo liso, así que los cables pasan por detrás y no por encima.
- La promesa y los botones van en una placa de tinta lisa, no sobre la trama.
- Se quitaron los rótulos en contorno («MANGA 3») y los años en contorno.

La v5 se conserva en `maqueta-v5.css` y `fuente/maqueta-v5.py`.
