---
# TÍTULO PROVISIONAL — reemplazar con el hito real del domingo (50-65 caracteres).
# Patrón: "[Hito del club] en el XCO de Alcalá". Nunca "Trocha y Ruta arrasó".
# El título hace trabajo medible: el del Chequeo ("Samuel Ortiz gana la Open…")
# trajo 12 sesiones orgánicas de Google en tres días. Un título sin nombre ni
# resultado no tiene con qué rankear.
title: "Trocha y Ruta se mide fuera de casa en el XCO de Alcalá"
# Fecha del XCO: domingo 13 de septiembre. El evento va del jueves 10 al
# domingo 13, pero el club asiste solo el domingo: la crónica lleva ese día.
date: 2026-09-13
author: "Juan Diego García"
category: "competencias"
# Agregar tags de los corredores protagonistas al cerrar (patrón Palmira).
tags: ["copa-lets-go", "copa-lets-go-2026", "interdepartamental", "xco", "alcala", "resultados"]
# PORTADA: en este formato la portada es una FOTO REAL del domingo (la salida,
# el equipo, un paso de pista), horizontal, 1600×900. El afiche de horarios
# queda solo como respaldo mientras no exista la foto. Al reemplazarla, cambiar
# imageLayout a `cover` y actualizar seo.ogImage con la misma foto.
image: "/images/news/copa-lets-go-alcala-2026/horarios-competencia.webp"
imageAlt: "Afiche de horarios de competencia de la Copa Let's Go Interdepartamental XCO en Alcalá: seis mangas entre las 8:00 a. m. y las 12:00 m."
imageLayout: contain
# Máximo 200 caracteres (lo valida el schema). Reescribir con el hito real.
excerpt: "El club viajó al norte del Valle a correr solo el domingo de la Copa Let's Go Interdepartamental XCO. Manga por manga, en fotos y clips, así le fue a cada corredor fuera de casa."
featured: true
draft: true
relatedEvent: "2026-09-copa-lets-go-alcala"
relatedGallery: "copa-lets-go-alcala-2026"
galleryFolder: "/images/news/copa-lets-go-alcala-2026"
# Las fotos que NO van en el cuerpo. Se pintan al final como rejilla con
# lightbox (NewsGallery). Nombres de archivo, sin ruta.
galleryImages: []
# EL EQUIPO EN PISTA (tarjetas con retrato y categoría, componente RaceLineup).
# Se activa descomentando el bloque cuando existan los retratos del domingo:
# vertical 600×800, con dorsal a la vista, fondo limpio, uno por corredor
# (ver kit de captura, toma «Retrato con dorsal»). `slug` es el identificador
# interno del corredor (no enlaza a ninguna página pública).
# lineup:
#   - name: "[Nombre Apellido]"
#     category: "[Categoría oficial del organizador]"
#     slug: "[nombre-apellido]"
#     image: "/images/news/copa-lets-go-alcala-2026/lineup/[nombre-apellido].webp"
seo:
  metaTitle: "Trocha y Ruta en el XCO de Alcalá (Copa Let's Go 2026)"
  metaDescription: "Resultados del Club Trocha y Ruta en el XCO de la Copa Let's Go Interdepartamental en Alcalá, Valle del Cauca, contados manga por manga en fotos y clips."
  ogImage: "/images/news/copa-lets-go-alcala-2026/horarios-competencia.webp"
---

<!-- =====================================================================
     FORMATO v6 «POSTALES DEL DOMINGO» — CRÓNICA XCO COPA LET'S GO, ALCALÁ
     Estado: esqueleto de producción. Se publica cuando el kit de captura
     esté completo: claudedocs/copa-lets-go-alcala-2026/kit-captura-domingo.md
     (qué grabar, qué anotar y cómo procesarlo el lunes). Protocolo general:
     .claude/agents/content-marketer.md.

     POR QUÉ v6 Y NO EL «RELOJ» LARGO
     Las crónicas de Palmira y del Chequeo pasan de 3.000 palabras (12-15 min
     de lectura) y el 93 % de las visitas a la del Chequeo llegó desde el
     celular. Esta fecha no reparte puntos ni general: no hay tablero que
     explicar. Así que el domingo se cuenta con lo que se trae de Alcalá
     —fotos, clips de 15 s, una nota de voz— y el texto justo para que cada
     pieza tenga sentido. Presupuesto: ≤ 700 palabras visibles (3-4 min),
     ≤ 3 clips, 1 audio, ≤ 300 KB por foto, ≤ 3 MB por clip.

     POR QUÉ ESTE ORDEN (GA4, crónica del Chequeo, 5-7 sep 2026)
     De 30 usuarios que abrieron la nota: 27 pasaron el 25 % de scroll, 24 el
     50 %, 21 el 75 % y solo 7 llegaron al final. El tiempo medio fue 3:37
     para un texto de 13-15 min. Entre el 75 % y el 100 % se pierden dos de
     cada tres lectores, y ahí era justo donde estaban la tabla de resultados
     (67 % de la página) y el cierre. De ahí las tres decisiones de este
     esqueleto:
       · Los resultados van ARRIBA, antes del reloj. Es lo que trae al lector.
       · La salida a /inscripciones y el enlace al álbum van a la MITAD, donde
         todavía queda el ~70 % de la audiencia. El InscriptionCTA que pinta
         `noticias/[...slug].astro` al final se queda, pero no se cuenta con él.
       · La ficha administrativa de la visita va PLEGADA al final: es
         referencia, no gancho, y abriendo la crónica empujaba el resultado
         fuera de la primera pantalla.

     REGLAS DEL FORMATO
       · Una «postal» por manga en la que corrió el club: hora real + 3-4
         fotos en carrusel + UNA frase + el resultado de cada corredor como
         pie de foto (nombre · categoría oficial · puesto de cuántos ·
         tiempo), no como párrafo. Manga sin corredores del club → se borra.
       · Se conservan .visit-card, .day-clock y .clock-stamp (son visuales).
         Sin .stat-strip. Un solo .stat-callout en toda la crónica.
       · Clips: <figure class="clip"> con <video preload="none" poster>.
         MP4 H.264, 720×1280 vertical, ≤ 15 s, ≤ 3 MB, alojado en
         public/videos/news/copa-lets-go-alcala-2026/. YouTube va en el
         álbum (campo `videos`), no aquí. Con 93 % de lectura en celular, si
         hay que sacrificar un clip cae el paneo de pista: es el único que no
         lleva a un corredor dentro.
       · Voces: nota de voz de ≤ 20 s (<audio>) con su transcripción en
         texto debajo, o cita de ≤ 120 caracteres. Sin material real, el
         bloque se borra.
       · Pies de foto de menores: nombre + primer apellido. Nunca edad
         exacta ni apellido completo. Solo corredores con autorización.
       · Categorías: las del organizador tal como aparecen en el afiche
         (Pre Infantil Mixto A, Kanguritos, Damas Máster…), para que la
         tabla cruce con su planilla. La equivalencia con la Copa Valle NO
         se asume: confirmar con la inscripción.
       · Los comentarios HTML se borran al publicar.
     ===================================================================== -->

<!-- ── COLD OPEN (≤ 50 palabras) ──
     Dos frases: un momento concreto (la salida de la pista especial, el
     primer paso por meta, el bus a oscuras) y a qué se vino. Nada de
     logística ni lista de puestos. -->

[PENDIENTE — cold open, dos frases]

## Cómo le fue al club

<!-- LA TABLA VA AQUÍ, NO AL FINAL. Es la pregunta que trae a la mayoría de
     los lectores («¿cómo le fue a mi hijo?») y en esta posición la alcanza
     el 80-90 % de la audiencia; al final la veía el 23 %.

     De la planilla oficial del organizador. Sin columna de puntos de la
     Copa Valle (no aplica). Negrita solo a los premiados según lo que el
     organizador haya premiado (CONFIRMAR hasta qué puesto). Tiempo H:MM:SS ·
     "-1 vuelta" si fue doblado · DNF solo aquí. Orden: por manga y, dentro
     de cada manga, por puesto. -->

| Deportista  | Categoría (oficial) | Manga | Pos. | Tiempo | Dif. |
| ----------- | ------------------- | :---: | :--: | ------ | ---- |
| [PENDIENTE] |                     |       |  de  |        |      |

<!-- ── CLIP 1 · LA PISTA EN 15 SEGUNDOS ──
     Un paneo lento del circuito (o el tramo más vistoso) grabado a pie,
     ANTES de la primera manga del club. Es el «contexto técnico de pista»
     de v4 convertido en video: el lector ve el terreno en vez de leerlo.
     El <figcaption> lleva lo que la cámara no dice: terreno, desnivel,
     qué era la pista especial. Si no se grabó, reemplazar por UNA foto
     de plano abierto del circuito con el mismo pie. -->

<figure class="clip clip--wide">
  <video controls playsinline preload="none" width="1280" height="720"
    poster="/images/news/copa-lets-go-alcala-2026/clip-pista-poster.webp">
    <source src="/videos/news/copa-lets-go-alcala-2026/clip-pista.mp4" type="video/mp4" />
    Tu navegador no reproduce este video.
    <a href="/videos/news/copa-lets-go-alcala-2026/clip-pista.mp4">Descárgalo</a>.
  </video>
  <figcaption>[PENDIENTE — la pista en una frase: terreno, desnivel, tramo clave, y qué recorría la pista especial de los pequeños]</figcaption>
</figure>

## El reloj del domingo

<!-- El programa del afiche de un vistazo. --gap = minutos desde la parada
     anterior. Modificadores: --club (el club corrió) / --quiet (sin
     corredores del club) / --award (premiación). Si una manga salió tarde,
     corregir la hora, el --gap de ESA parada y el de la siguiente. -->

<ol class="day-clock reveal">
  <li class="day-clock__stop day-clock__stop--quiet" style="--gap:0">
    <span class="day-clock__time">8:00</span>
    <span class="day-clock__label">Manga 1 · Máster A, B, C y D</span>
    <span class="day-clock__note">3,3 km por vuelta · sin corredores del club</span>
  </li>
  <li class="day-clock__stop day-clock__stop--club" style="--gap:80">
    <span class="day-clock__time">9:20</span>
    <span class="day-clock__label">Manga 2 · Kanguritos y Pre Infantil Mixto A</span>
    <span class="day-clock__note">Pista especial · [PENDIENTE — corredores del club]</span>
  </li>
  <li class="day-clock__stop day-clock__stop--club" style="--gap:15">
    <span class="day-clock__time">9:35</span>
    <span class="day-clock__label">Manga 3 · Pre Infantil Mixto B, Infantil Femenino A e Infantil Masculino A</span>
    <span class="day-clock__note">Pista especial · [PENDIENTE — corredores del club]</span>
  </li>
  <li class="day-clock__stop day-clock__stop--club" style="--gap:15">
    <span class="day-clock__time">9:50</span>
    <span class="day-clock__label">Manga 4 · Infantil B y Pre Juvenil A-B, femenino y masculino</span>
    <span class="day-clock__note">3,3 km por vuelta · [PENDIENTE — corredores del club]</span>
  </li>
  <li class="day-clock__stop day-clock__stop--award" style="--gap:50">
    <span class="day-clock__time">10:40</span>
    <span class="day-clock__label">Primera premiación</span>
    <span class="day-clock__note">[PENDIENTE — quién del club subió]</span>
  </li>
  <li class="day-clock__stop day-clock__stop--quiet" style="--gap:5">
    <span class="day-clock__time">10:45</span>
    <span class="day-clock__label">Manga 5 · Élite Femenino, Juvenil Femenino, Damas Máster y Novatos</span>
    <span class="day-clock__note">3,3 km por vuelta · sin corredores del club (CONFIRMAR)</span>
  </li>
  <li class="day-clock__stop day-clock__stop--club" style="--gap:75">
    <span class="day-clock__time">12:00</span>
    <span class="day-clock__label">Manga 6 · Juvenil Masculino y Élite Masculino</span>
    <span class="day-clock__note">3,3 km por vuelta · la salida más larga del día · [PENDIENTE — corredores del club]</span>
  </li>
  <li class="day-clock__stop day-clock__stop--award" style="--gap:60">
    <span class="day-clock__time">1:00</span>
    <span class="day-clock__label">Premiación final</span>
    <span class="day-clock__note">[PENDIENTE — quién del club subió]</span>
  </li>
</ol>

<p class="day-clock__legend">
  <span><span class="day-clock__key"></span> el club estuvo en pista</span>
  <span><span class="day-clock__key day-clock__key--award"></span> premiación</span>
  <span><span class="day-clock__key day-clock__key--quiet"></span> manga sin corredores del club</span>
  <span>Horas del afiche oficial, de 8:00 a. m. a 1:00 p. m.</span>
</p>

<!-- ── POSTALES POR MANGA ──
     Una sección ## por manga en la que corrió alguien del club, en orden
     de hora. Dentro: .clock-stamp, UNA frase de contexto, un carrusel de
     3-4 fotos donde el pie de cada foto es el resultado del corredor, y
     (en dos mangas como máximo) un clip vertical de 15 s. El texto corrido
     de cada postal no pasa de 40 palabras.

     QUIÉN CORRE EN QUÉ MANGA — hipótesis de trabajo, confirmar con la
     inscripción (mapa completo en el kit de captura). Las secciones de abajo
     están escritas para esa hipótesis: ajustar, borrar las vacías y, si una
     manga cambió de hora, cambiar el ## y el --t (minutos desde las 8:00). -->

## 9:20 a. m. — Manga 2: [PENDIENTE — gancho de cinco palabras]

<div class="clock-stamp reveal" style="--t:80">
  <span class="clock-stamp__time">9:20 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 2 · pista especial</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

[PENDIENTE — UNA frase: cuántos salían en la parrilla, qué era la pista especial para ellos y qué pasó en la salida.]

<figure class="clip">
  <video controls playsinline preload="none" width="720" height="1280"
    poster="/images/news/copa-lets-go-alcala-2026/clip-salida-manga-2-poster.webp">
    <source src="/videos/news/copa-lets-go-alcala-2026/clip-salida-manga-2.mp4" type="video/mp4" />
    Tu navegador no reproduce este video.
    <a href="/videos/news/copa-lets-go-alcala-2026/clip-salida-manga-2.mp4">Descárgalo</a>.
  </video>
  <figcaption>[PENDIENTE — la salida de la manga 2, hora real; quién del club está en el cuadro]</figcaption>
</figure>

<div class="figure-carousel" role="group" aria-label="Fotos de la manga 2" tabindex="0">
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en la pista especial de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Kanguritos · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en la pista especial de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Pre Infantil Mixto A · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
</div>

<!-- ── ENLACE AL ÁLBUM, TEMPRANO ──
     El álbum ya se pinta al final por `relatedGallery`, pero ahí lo ve poca
     gente: en el Chequeo la galería recibió 23 vistas de 7 usuarios. Este
     enlace va en cuanto el lector ha visto la primera tanda de fotos, que es
     cuando la oferta «hay más» tiene sentido. Ajustar el número al cerrar. -->

En el álbum del domingo hay [PENDIENTE — número] fotos más: [todas las fotos de Alcalá](/galeria/copa-lets-go-alcala-2026).

## 9:35 a. m. — Manga 3: [PENDIENTE — gancho]

<div class="clock-stamp reveal" style="--t:95">
  <span class="clock-stamp__time">9:35 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 3 · pista especial</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

[PENDIENTE — UNA frase. Quince minutos después de la manga 2: si el club tuvo corredores en las dos, el relevo en la zona de salida es la frase.]

<div class="figure-carousel" role="group" aria-label="Fotos de la manga 3" tabindex="0">
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en la pista especial de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Infantil Femenino A · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en la pista especial de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Infantil Masculino A · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
</div>

## 9:50 a. m. — Manga 4: [PENDIENTE — gancho: la primera vuelta de 3,3 km del club]

<div class="clock-stamp reveal" style="--t:110">
  <span class="clock-stamp__time">9:50 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 4 · vuelta de 3,3 km</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

[PENDIENTE — UNA frase: cuántos en la parrilla, cuántas vueltas, el tramo donde se decidió.]

<figure class="clip">
  <video controls playsinline preload="none" width="720" height="1280"
    poster="/images/news/copa-lets-go-alcala-2026/clip-manga-4-poster.webp">
    <source src="/videos/news/copa-lets-go-alcala-2026/clip-manga-4.mp4" type="video/mp4" />
    Tu navegador no reproduce este video.
    <a href="/videos/news/copa-lets-go-alcala-2026/clip-manga-4.mp4">Descárgalo</a>.
  </video>
  <figcaption>[PENDIENTE — el paso del club por el tramo con nombre; quién va en el cuadro]</figcaption>
</figure>

<div class="figure-carousel" role="group" aria-label="Fotos de la manga 4" tabindex="0">
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en el circuito de 3,3 km de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Pre Juvenil Femenino A-B · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en el circuito de 3,3 km de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Pre Juvenil Masculino A-B · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en el circuito de 3,3 km de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Infantil Masculino B · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
</div>

<!-- ── EL ÚNICO NÚMERO ──
     Un dato que cuente una historia por sí solo: la diferencia con el
     ganador, los inscritos de la categoría, los segundos entre dos
     compañeros, los kilómetros del viaje. Uno solo en toda la crónica. -->

<div class="stat-callout reveal">
  <span class="stat-callout__value">—</span>
  <span class="stat-callout__text">[PENDIENTE — el número del domingo y su frase]</span>
</div>

<!-- ── SALIDA A LA INSCRIPCIÓN, A LA MITAD ──
     Aquí todavía queda el ~70 % de los lectores. El InscriptionCTA del final
     de `noticias/[...slug].astro` sigue existiendo; este no lo reemplaza, lo
     adelanta. En el Chequeo, con el CTA solo al final, se registró UN
     `cta_inscripcion_click` en 30 usuarios. Si al cerrar la crónica se ve que
     el bloque parte una postal por la mitad, moverlo una sección, no borrarlo. -->

<aside class="mid-cta" aria-label="Inscripciones al club">
  <p class="mid-cta__text">
    Los que salen en estas fotos empezaron igual: sin experiencia y con una bici
    prestada. En el club se arranca desde los 4 años y la primera clase es gratis.
  </p>
  <a class="mid-cta__link" href="/inscripciones" data-analytics-event="cta_inscripcion_click">
    Agendar la clase de prueba
  </a>
</aside>

## 10:40 a. m. — Primera premiación

<div class="clock-stamp reveal" style="--t:160">
  <span class="clock-stamp__time">10:40 <small>a. m.</small></span>
  <span class="clock-stamp__label">Primera premiación</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Solo fotos del podio con pie. CONFIRMAR hasta qué puesto premió el
     organizador antes de escribir «podio». Si nadie del club subió, borrar
     la sección completa. -->

<div class="figure-grid">
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE]-podio.webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en el podio de [categoría], Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · [categoría] · [puesto]</figcaption>
  </figure>
</div>

## 12:00 m. — Manga 6: [PENDIENTE — gancho: la más larga del día]

<div class="clock-stamp reveal" style="--t:240">
  <span class="clock-stamp__time">12:00 <small>m.</small></span>
  <span class="clock-stamp__label">Manga 6 · vuelta de 3,3 km</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

[PENDIENTE — UNA frase: la última salida, con el sol arriba y el resto del club mirando desde la cinta. Si la manga 5 tuvo a alguien del club, va antes con su propio ##.]

<div class="figure-carousel" role="group" aria-label="Fotos de la manga 6" tabindex="0">
  <figure>
    <img
      src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
      alt="[Nombre Apellido] del Club Trocha y Ruta en el circuito de 3,3 km de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
      width="1200"
      height="1600"
      loading="lazy"
      decoding="async"
    />
    <figcaption><strong>[Nombre Apellido]</strong> · Élite Masculino · [n.º] de [N] · [tiempo]</figcaption>
  </figure>
</div>

## 1:00 p. m. — Premiación final

<div class="clock-stamp reveal" style="--t:300">
  <span class="clock-stamp__time">1:00 <small>p. m.</small></span>
  <span class="clock-stamp__label">Premiación final · cierra el día</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Misma regla que la primera premiación: solo fotos con pie, o se borra. -->

[PENDIENTE — foto(s) del podio con pie, o borrar la sección]

## Voces

<!-- Una nota de voz de ≤ 20 s grabada en Alcalá, con una sola pregunta
     («¿Qué fue lo más difícil de la pista?»). Menor de edad: con el padre o
     la madre presente y autorización registrada. La transcripción va SIEMPRE
     debajo en texto. Sin audio real → cita de ≤ 120 caracteres en
     .pull-quote; sin cita real → borrar el bloque completo. -->

<figure class="clip">
  <audio controls preload="none">
    <source src="/videos/news/copa-lets-go-alcala-2026/voz-[nombre].m4a" type="audio/mp4" />
    Tu navegador no reproduce este audio.
  </audio>
  <figcaption>[Nombre Apellido], [categoría], al bajarse de la bici.</figcaption>
</figure>

<div class="pull-quote">
  <p class="pull-quote__text">"[PENDIENTE — transcripción textual de la nota de voz]"</p>
  <p class="pull-quote__attribution">— [Nombre Apellido], [categoría]</p>
</div>

## En tres frases

<!-- El cierre analítico de v4 («La medida fuera de casa») en ≤ 60 palabras:
     1) contra quién se corrió (clubes y departamentos en las categorías
     del club); 2) lo que se vio que no se ve en casa; 3) lo que se lleva
     al entrenamiento de cara al 18 de octubre en Yumbo. Sin épica: si fue
     regular, se dice.

     Si al cerrar la crónica estas tres frases repiten el cold open, se borran:
     en esta posición las lee menos de un cuarto de la audiencia, así que no
     compensa duplicar. Lo que valga la pena de aquí sube al cold open. -->

[PENDIENTE — tres frases]

<figure>
  <img
    src="/images/news/copa-lets-go-alcala-2026/equipo-grupal.webp"
    alt="Equipo del Club Trocha y Ruta al cierre de la jornada en la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
    width="1600"
    height="1200"
    loading="lazy"
    decoding="async"
  />
  <figcaption>[PENDIENTE — el equipo al cierre del domingo: cuántos viajaron, cuántas familias]</figcaption>
</figure>

## Lo que viene

<!-- Dos frases. La Copa Valle vuelve el 18 de octubre a la Pista Carlos
     Castro de Yumbo (séptima válida, casa del club) y cierra en Roldanillo
     el 7 y 8 de noviembre. Si el club decide correr otra fecha de la Copa
     Let's Go, decirlo con sede y fecha confirmadas; si no, no se inventa
     calendario. Enlace a /calendario. -->

[PENDIENTE — dos frases y enlace al calendario]

<!-- ── FICHA DE LA VISITA, PLEGADA ──
     Datos de referencia: sede, organizador, qué se jugaba. Abría la crónica y
     empujaba el resultado fuera de la primera pantalla; aquí no le estorba a
     nadie y sigue disponible para quien la busca (y para el buscador: el
     contenido de un <details> se indexa igual).
     La .visit-card va SIN `reveal` a propósito: con el <details> cerrado el
     bloque está en display:none y el IntersectionObserver de BaseLayout nunca
     lo intersecta, así que la clase lo dejaría invisible al abrirlo. -->

<details class="visit-details">
  <summary>Ficha de la visita: sede, circuito y qué se jugaba</summary>
  <div class="visit-card">
    <div class="visit-card__stub" aria-hidden="true">
      <span class="visit-card__stub-day">Dom</span>
      <span class="visit-card__stub-num">13</span>
      <span class="visit-card__stub-month">Sep 2026</span>
    </div>
    <dl class="visit-card__list">
      <div class="visit-card__item visit-card__item--wide"><dt>Competencia</dt><dd>Copa Let's Go Interdepartamental XCO (Inter-American XCO Cup)</dd></div>
      <div class="visit-card__item"><dt>Sede</dt><dd>[PENDIENTE — nombre de la pista], Alcalá, Valle del Cauca</dd></div>
      <div class="visit-card__item"><dt>Día</dt><dd>Domingo 13 de septiembre de 2026, solo el XCO</dd></div>
      <div class="visit-card__item"><dt>Circuito</dt><dd>3,3 km por vuelta; pista especial para Kanguritos, Pre Infantil e Infantil A</dd></div>
      <div class="visit-card__item"><dt>Corredores del club</dt><dd>[PENDIENTE — número] en [PENDIENTE — número] mangas</dd></div>
      <div class="visit-card__item"><dt>Qué se jugaba</dt><dd>Nada de la general de la Copa Valle: se corrió para medirse fuera de casa</dd></div>
    </dl>
  </div>
</details>
