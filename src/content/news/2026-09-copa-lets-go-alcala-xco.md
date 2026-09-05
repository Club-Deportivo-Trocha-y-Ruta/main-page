---
# TÍTULO PROVISIONAL — reemplazar con el hito real del domingo (50-65 caracteres).
# Patrón: "[Hito del club] en el XCO de Alcalá" / ej.: "Miguel Ángel, tercero
# entre corredores de tres departamentos en Alcalá". Nunca "Trocha y Ruta arrasó".
title: "Trocha y Ruta se mide fuera de casa en el XCO de Alcalá"
# Fecha del XCO: domingo 13 de septiembre. El evento completo va del jueves 10
# al domingo 13, pero el club asistió solo el domingo, así que la crónica
# lleva la fecha del día de carrera.
date: 2026-09-13
author: "Juan Diego García"
category: "competencias"
# Agregar tags de los corredores protagonistas al cerrar (patrón Palmira).
tags: ["copa-lets-go", "copa-lets-go-2026", "interdepartamental", "xco", "alcala", "resultados"]
# Portada: el afiche de horarios de competencia del domingo (ya en el repo).
# Si el club prefiere una foto del día, cambiar aquí y en seo.ogImage.
image: "/images/news/copa-lets-go-alcala-2026/horarios-competencia.webp"
imageAlt: "Afiche de horarios de competencia de la Copa Let's Go Interdepartamental XCO en Alcalá: seis mangas entre las 8:00 a. m. y las 12:00 m."
imageLayout: contain
# Máximo 200 caracteres (lo valida el schema). Reescribir con el hito real.
excerpt: "El club viajó al norte del Valle para correr solo el domingo de la Copa Let's Go Interdepartamental XCO en Alcalá. Manga por manga, así le fue a cada corredor fuera de casa."
featured: true
draft: true
relatedEvent: "2026-09-copa-lets-go-alcala"
relatedGallery: "copa-lets-go-alcala-2026"
galleryFolder: "/images/news/copa-lets-go-alcala-2026"
galleryImages: []
seo:
  metaTitle: "Trocha y Ruta en el XCO de Alcalá (Copa Let's Go 2026)"
  metaDescription: "Resultados del Club Trocha y Ruta en el XCO de la Copa Let's Go Interdepartamental en Alcalá, Valle del Cauca, contados manga por manga."
  ogImage: "/images/news/copa-lets-go-alcala-2026/horarios-competencia.webp"
---

<!-- =====================================================================
     PLANTILLA "RELOJ DEL DOMINGO" — CRÓNICA XCO COPA LET'S GO, ALCALÁ
     Estado: esqueleto de producción. Se publica solo cuando el checklist
     esté completo. Protocolo general: .claude/agents/content-marketer.md.

     POR QUÉ ESTA ESTRUCTURA Y NO LA v4
     Esta no es una válida de la Copa Valle: no reparte puntos para la
     general del club, el organizador es otro (Copa Let's Go Interdepartamental
     XCO, con la marca Inter-American XCO Cup) y el club fue un solo día, a
     una sola cosa: el XCO del domingo. Sin general que contar, el tablero
     (.standings-board) y el hilo de temporada (.thread) de Roldanillo no
     tienen qué mostrar. Lo que sí tiene este domingo, y ninguna otra fecha
     del año, es un HORARIO OFICIAL por manga: seis salidas entre las 8:00
     a. m. y las 12:00 m., cada una con sus categorías. Ese reloj es la
     columna vertebral de la crónica:

       · La jornada se cuenta EN ORDEN DE HORA, una sección ## por manga en
         la que el club tuvo corredores en pista. Dentro de cada manga van
         los corredores del club que salieron en ella (nombre, categoría
         oficial del organizador, puesto de cuántos, tiempo, diferencia).
       · REGLA DEL RELOJ: el reloj solo marca las horas en que el club
         estuvo en pista. Si en una manga no corrió nadie del club, la
         sección se BORRA (y, si hace falta para el hilo del día, se
         menciona en una frase dentro de la manga anterior). No se rellena.
       · Las dos premiaciones (10:40 a. m. y 1:00 p. m.) son secciones
         cortas del mismo reloj: quién del club subió a recibir.
       · Sin .stat-strip: el "parte" de arriba es una FICHA de la visita
         (.visit-card, un tiquete con talón de fecha), porque el dato
         singular de este domingo no es una cifra sino el contexto (dónde,
         contra quién, a qué fuimos).
       · PIEZAS PROPIAS (formato v5, estreno en esta crónica; markup y
         reglas en .claude/agents/content-marketer.md):
           .day-clock    el programa del día como lista vertical con la
                         separación proporcional al tiempo real entre
                         salidas (--gap en minutos); el riel se traza con
                         el scroll. Va UNA vez, antes de la primera manga.
                         Ajustar los modificadores --club / --quiet /
                         --award con lo que pasó de verdad.
           .clock-stamp  la hora grande bajo cada ## de manga, con la barra
                         del día que avanza hasta esa hora (--t = minutos
                         desde las 8:00). Si la manga salió tarde, cambiar
                         la hora escrita Y el --t.
       · Máximo 2 .stat-callout en toda la crónica, dentro de las mangas.
       · El bloque de cierre no es "la general" sino "La medida fuera de
         casa": qué dice el domingo del club a cinco semanas de la válida
         de Yumbo.
       · .circuit-map sigue EN RESERVA (misma regla que en Roldanillo):
         no se usa sin el trazado real y sin 4+ momentos ubicados sobre él.

     NOMBRES DE CATEGORÍA: en esta crónica se usan los del organizador tal
     como aparecen en el afiche (Pre Infantil Mixto A, Infantil Femenino A,
     Pre Juvenil Masculino A-B, Kanguritos, Damas Máster…). El protocolo del
     club prefiere "Femenina" y "Preinfantil", pero aquí el nombre oficial es
     otro y la tabla debe poder cruzarse con la planilla del organizador.
     La equivalencia con las categorías de la Copa Valle NO se asume: los
     rangos de edad pueden no coincidir. CONFIRMAR con la inscripción.

     ═══════════════════════════════════════════════════════════════════
     CHECKLIST — QUÉ EXTRAER DEL XCO DEL DOMINGO PARA CERRAR LA CRÓNICA
     ═══════════════════════════════════════════════════════════════════

     A. EL VIAJE (para el cold open y la ficha)
     [ ] Hora real de salida de Yumbo y hora de llegada a la sede.
     [ ] Vía usada y duración del trayecto. ¿Fue el desplazamiento más
         largo del año para el club? (Roldanillo, en noviembre, también
         reclama ese título en su borrador: que solo uno lo diga.)
     [ ] Cuántos corredores viajaron y cuántas familias (número, sin
         nombres de adultos salvo permiso).

     B. LA SEDE Y EL CIRCUITO (bloque de contexto técnico)
     [ ] Nombre exacto de la pista / lugar dentro de Alcalá. El afiche no
         lo dice y el evento del calendario quedó con "Alcalá" a secas:
         actualizar también src/content/events/2026-09-copa-lets-go-alcala.md.
     [ ] Confirmar la vuelta de 3,3 km del afiche y qué recorría la "pista
         especial" de las mangas 2 y 3 (longitud, si era un tramo del
         circuito grande o un trazado aparte).
     [ ] Terreno (tierra suelta, raíces, piedra, pasto), desnivel
         aproximado, 2-3 tramos con nombre o descripción, clima del día y
         cómo afectó la carrera (polvo, barro, calor a mediodía).
     [ ] Número de vueltas por categoría del club.

     C. POR CADA MANGA EN QUE CORRIÓ EL CLUB (bloque del reloj)
     Por cada corredor del club:
     [ ] Nombre completo tal como quedó inscrito, categoría OFICIAL del
         organizador y número de dorsal.
     [ ] Puesto y cuántos inscritos/llegados tenía la categoría ("7° de
         13" vale más que "7°").
     [ ] Tiempo final, diferencia con el ganador y con el puesto siguiente
         (o "-1 vuelta" si fue doblado; DNF solo en tabla).
     [ ] Cómo se desarrolló: salida, vuelta clave, momento decisivo,
         mecánica si la hubo. Sin esto la sección queda plana.
     [ ] Si la manga arrancó a la hora del afiche o con retraso (el reloj
         de la crónica es el real, no el impreso: corregir los ## si
         cambió).
     [ ] Con quién se midió: de qué departamentos / clubes eran los
         corredores de su categoría. ¿Hubo delegaciones de fuera del Valle?
         ¿Alguna de otro país? (La marca Inter-American XCO Cup lleva las
         banderas de Colombia y México en el afiche: NO afirmar presencia
         extranjera sin verla.)

     D. PREMIACIONES (10:40 a. m. y 1:00 p. m.)
     [ ] Hasta qué puesto premió el organizador (¿3? ¿5?). De eso depende
         si se puede decir "podio". En esta crónica NO aplica la regla del
         top-5 de la Copa Valle hasta confirmarlo.
     [ ] Quién del club subió, en cuál de las dos premiaciones, y foto.
     [ ] Si la Copa Let's Go lleva puntaje o clasificación propia y si el
         club piensa correr más fechas: define la columna "Puntos" de la
         tabla y el tono del cierre.

     E. FUENTES OFICIALES (cero memoria)
     [ ] Planilla o PDF de resultados del organizador (foto legible de la
         cartelera sirve como respaldo, no como fuente final).
     [ ] Publicación del organizador en redes con resultados / galería
         (enlace para guardar en este comentario).
     [ ] Nombre del organizador / club operador y del director de carrera,
         para nombrarlos correctamente.

     F. FOTOS → /public/images/news/copa-lets-go-alcala-2026/
     [ ] WebP, máx. 1600 px, q76. Nombrar como en Palmira:
         nombre-contexto-alcala.webp (salida, acción en tramo, podio,
         grupal del equipo, la pista especial con los pequeños).
     [ ] Foto grupal del equipo para la portada del álbum
         (src/content/gallery/copa-lets-go-alcala-2026.md, `cover`).
     [ ] Autorizaciones de imagen de cualquier corredor nuevo o debutante
         (Ley 1581 y Ley 1098). Menores: nombre + primer apellido.

     G. VOCES
     [ ] 1-2 citas textuales recogidas en sitio, máx. 200 caracteres.
         Menores: con padre presente y autorización registrada. Sin cita
         real, el bloque 7 se borra.

     H. CIERRE EDITORIAL
     [ ] Título definitivo (50-65 chars), excerpt ≤ 200, metaTitle /
         metaDescription ≤ 160, tags de protagonistas, galleryImages.
     [ ] Verificar nombres contra src/content/riders/ y contra la planilla.
     [ ] Agregar relatedNews: ["2026-09-copa-lets-go-alcala-xco"] al evento
         2026-09-copa-lets-go-alcala.md y actualizar allí `location` con la
         sede real.
     [ ] Enlace de ida y vuelta con la noticia del Chequeo del 5 de
         septiembre (2026-09-chequeo-profondos-yumbo.md) cuando esté
         publicada.
     [ ] draft -> false.
===================================================================== -->

<!-- ── BLOQUE 1 · COLD OPEN (50-80 palabras) ──
     Un momento concreto, no logística ni resultado plano. El zoom out
     (Alcalá + Copa Let's Go + "a esto vinimos") llega en la segunda o
     tercera frase. Direcciones posibles según cómo se dé el día:
     a) La madrugada: el club saliendo de Yumbo a oscuras hacia el norte
        del Valle para llegar a una carrera que arranca a las 8:00 a. m.
        (CONFIRMAR hora de salida y duración del viaje).
     b) Los más pequeños del club en la "pista especial" de las 9:20:
        el primer contacto con un circuito que no es el de casa.
     c) El contraste: un domingo en el que el club no sumaba un solo punto
        para ninguna general, y aun así madrugó. A eso se vino: a medirse.
     Evitar: abrir con la hora del bus, con la lista de podios o con
     "una jornada llena de…". -->

[PENDIENTE — cold open]

## Ficha de la visita

<!-- Sustituye al .stat-strip de las crónicas de la Copa Valle. Aquí el dato
     singular no es una cifra sino el contexto, así que va como tiquete de
     viaje (.visit-card): el talón lleva la fecha (decorativo, se repite en
     la lista) y la lista de definiciones el resto. Los valores fijos salen
     del afiche oficial; los [PENDIENTE] se llenan el domingo. Actualizar la
     sede cuando se sepa el nombre de la pista. Máximo 7 ítems (el
     escalonado de entrada cubre hasta 7). -->

<div class="visit-card reveal">
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
    <div class="visit-card__item"><dt>Mangas</dt><dd>Seis salidas de 8:00 a. m. a 12:00 m.; premiaciones a las 10:40 a. m. y 1:00 p. m.</dd></div>
    <div class="visit-card__item"><dt>Corredores del club</dt><dd>[PENDIENTE — número] en [PENDIENTE — número] mangas</dd></div>
    <div class="visit-card__item"><dt>Qué se jugaba</dt><dd>Nada de la general de la Copa Valle: se corrió para medirse fuera de casa</dd></div>
  </dl>
</div>

## A qué se vino

<!-- Bloque pre-escrito. VERIFICAR antes de publicar: el número de
     corredores, que efectivamente hubo clubes de otros departamentos (el
     afiche dice "interdepartamental"; confirmarlo en la planilla) y que el
     viaje haya sido de un solo día. Si el club decide correr más fechas de
     la Copa Let's Go, reescribir la última frase. -->

La Copa Let's Go es otra competencia, con otro organizador y otro calendario: sus puntos no entran en la general de la **Copa Valle Paraíso de Todos GW Shimano 2026**, la que el club viene peleando desde enero. El programa oficial ocupaba cuatro días —entrenamientos oficiales de jueves a sábado, congreso técnico el viernes, relevos XCR el sábado—, y Trocha y Ruta decidió ir a una sola cosa: el **XCO del domingo**. Ocho días después del [chequeo en casa](/noticias/2026-09-chequeo-profondos-yumbo), y a cinco semanas de recibir la Copa Valle en la Pista Carlos Castro, el domingo en Alcalá servía para lo que no se puede ensayar en el patio propio: correr contra corredores de otros departamentos, en una pista que nadie del club conocía, sin el colchón de los puntos. [PENDIENTE — número] corredores del club salieron en [PENDIENTE — número] de las seis mangas.

## El reloj del domingo

<!-- El programa completo del afiche, de un vistazo y ANTES de las mangas:
     el lector ve la forma del día (tres salidas en media hora, luego el
     mediodía largo) y sabe qué secciones vienen. La separación entre
     paradas es proporcional a los minutos reales (--gap = minutos desde la
     parada anterior). Modificadores, a ajustar el domingo:
       --club   el club tuvo corredores en pista (punto lleno)
       --quiet  manga sin corredores del club (punto hueco, texto atenuado)
       --award  premiación (rombo lima)
     Las horas son las del afiche; si una manga salió tarde, corregir aquí
     la hora, el --gap de ESA parada y el de la siguiente. Los [PENDIENTE]
     de las notas se llenan con los corredores del club por manga. -->

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

<!-- ── BLOQUE 3 · CONTEXTO TÉCNICO DE PISTA (60-120 palabras) ──
     Datos fijos del afiche: vuelta de 3,3 km para las categorías mayores;
     "pista especial" para las mangas 2 y 3 (Kanguritos, Pre Infantil A y B,
     Infantil Femenino A e Infantil Masculino A). PENDIENTE: nombre del
     lugar, terreno, desnivel, tramos clave, en qué consistía la pista
     especial, clima del día y cómo afectó. Imagen mental del esfuerzo para
     el lector familiar; vocabulario del protocolo (single track en cursiva
     la primera vez, "peralte", "tramo de raíces", "tramo de piedra suelta"). -->

## La pista

[PENDIENTE — contexto de pista]

<!-- ── BLOQUE 4 · EL RELOJ DEL DOMINGO ──
     Una sección ## por manga en la que corrió alguien del club, en orden
     de hora. El ## lleva la HORA REAL de salida + el número de manga + un
     gancho corto (la historia de esa manga, no el puesto). Dentro:
       1. Una frase de contexto: qué categorías salían juntas y cuántos
          corredores había en la parrilla (del organizador).
       2. Por cada corredor del club en esa manga: nombre completo +
          categoría oficial + puesto de cuántos; cómo se desarrolló
          (salida, vuelta clave, momento decisivo); dato técnico (tiempo,
          diferencia); una línea humana (qué significa para el proceso).
          Regla de oro: cada corredor premiado merece 2-3 frases propias.
       3. <figure> con foto(s): acción y, si aplica, premiación.
     Máximo 2 .stat-callout en toda la crónica, dentro de las mangas.

     QUIÉN CORRE EN QUÉ MANGA — HIPÓTESIS DE TRABAJO, CONFIRMAR CON LA
     INSCRIPCIÓN. Mapa hecho desde las categorías de la Copa Valle de cada
     corredor del club (crónica de Palmira); los rangos de edad de la Copa
     Let's Go pueden ser otros y un corredor puede caer en otra manga:
       · Manga 1 (8:00, Máster A-D) → probablemente nadie del club.
       · Manga 2 (9:20, pista especial: Kanguritos, Pre Infantil Mixto A)
         → los teteros (Liam Guevara, Celeste Muriel, Thiago Duque, Mathiw
         Bohórquez, Ihsan Garcés) si "Kanguritos" es su rango; Samuel Anaya
         si Pre Infantil A equivale a Preinfantil A.
       · Manga 3 (9:35, pista especial: Pre Infantil Mixto B, Infantil
         Femenino A, Infantil Masculino A) → Juan David Giraldo; Sofía
         Gómez y Sophia Vargas; Miguel Ángel Anaya y Matías Montoya.
         OJO: aquí Infantil A corre la pista especial, no la vuelta de
         3,3 km. Es un dato de color legítimo si se confirma.
       · Manga 4 (9:50, 3,3 km: Infantil Femenino B, Infantil Masculino B,
         Pre Juvenil Femenino A-B, Pre Juvenil Masculino A-B) → Jostin
         Villamizar; Isabel Quiñones y Mariana Coronado; Samuel Ortiz y
         Nicolás Segura. Probablemente la manga más poblada del club.
       · Manga 5 (10:45, 3,3 km: Élite Femenino, Juvenil Femenino, Damas
         Máster, Novatos) → probablemente nadie, salvo que alguien del
         club se inscriba en Novatos (Héctor Eduardo Giraldo, Promocional
         en la Copa Valle: CONFIRMAR).
       · Manga 6 (12:00, 3,3 km: Juvenil Masculino, Élite Masculino) →
         Juan Diego García (Élite).
     Las secciones de abajo están escritas para ESA hipótesis. Ajustar
     nombres, borrar mangas vacías y, si una manga cambió de hora, cambiar
     el ##. -->

## 9:20 a. m. — Manga 2: [PENDIENTE — gancho: los más pequeños en la pista especial]

<div class="clock-stamp reveal" style="--t:80">
  <span class="clock-stamp__time">9:20 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 2 · pista especial</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Contexto fijo del afiche: salían juntos Kanguritos y Pre Infantil
     Mixto A, en la pista especial. PENDIENTE: cuántos en la parrilla, en
     qué consistía la pista especial, si la salida fue a las 9:20. -->

[PENDIENTE — una frase de contexto de la manga]

[PENDIENTE — corredores del club en esta manga: nombre completo, categoría oficial, puesto de cuántos, desarrollo, tiempo, línea humana]

<figure class="figure--portrait">
  <img
    src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
    alt="[Corredor] del Club Trocha y Ruta en la pista especial de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
    width="1200"
    height="1600"
    loading="lazy"
    decoding="async"
  />
  <figcaption>[PENDIENTE]</figcaption>
</figure>

## 9:35 a. m. — Manga 3: [PENDIENTE — gancho]

<div class="clock-stamp reveal" style="--t:95">
  <span class="clock-stamp__time">9:35 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 3 · pista especial</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Contexto fijo del afiche: Pre Infantil Mixto B, Infantil Femenino A e
     Infantil Masculino A, también en la pista especial. Quince minutos
     después de la manga 2: si el club tuvo corredores en las dos, contar el
     relevo en la zona de salida. -->

[PENDIENTE — una frase de contexto de la manga]

[PENDIENTE — corredores del club en esta manga]

<div class="stat-callout reveal">
  <span class="stat-callout__value">—</span>
  <span class="stat-callout__text">[PENDIENTE — un número que cuente una historia por sí solo: la diferencia con el ganador, los inscritos de la categoría, los segundos entre dos compañeros]</span>
</div>

## 9:50 a. m. — Manga 4: [PENDIENTE — gancho]

<div class="clock-stamp reveal" style="--t:110">
  <span class="clock-stamp__time">9:50 <small>a. m.</small></span>
  <span class="clock-stamp__label">Manga 4 · vuelta de 3,3 km</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Contexto fijo del afiche: Infantil Femenino B, Infantil Masculino B,
     Pre Juvenil Femenino A-B y Pre Juvenil Masculino A-B, ya sobre la
     vuelta de 3,3 km. Es la primera manga del club sobre el circuito
     grande: aquí va el color de pista (tramos, terreno) contado desde lo
     que hicieron los corredores, no como descripción suelta. -->

[PENDIENTE — una frase de contexto de la manga]

[PENDIENTE — corredores del club en esta manga]

<figure>
  <img
    src="/images/news/copa-lets-go-alcala-2026/[PENDIENTE].webp"
    alt="[Corredor] del Club Trocha y Ruta en el circuito de 3,3 km de la Copa Let's Go Interdepartamental XCO, Alcalá, 2026"
    width="1600"
    height="1200"
    loading="lazy"
    decoding="async"
  />
  <figcaption>[PENDIENTE]</figcaption>
</figure>

## 10:40 a. m. — Primera premiación

<div class="clock-stamp reveal" style="--t:160">
  <span class="clock-stamp__time">10:40 <small>a. m.</small></span>
  <span class="clock-stamp__label">Primera premiación</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Sección corta. Quién del club subió a recibir y por qué categoría.
     CONFIRMAR hasta qué puesto premió el organizador antes de escribir
     "podio". Si nadie del club fue premiado aquí, borrar la sección y
     mover la foto de grupo a la manga 4. -->

[PENDIENTE]

## 12:00 m. — Manga 6: [PENDIENTE — gancho: la más larga del día]

<div class="clock-stamp reveal" style="--t:240">
  <span class="clock-stamp__time">12:00 <small>m.</small></span>
  <span class="clock-stamp__label">Manga 6 · vuelta de 3,3 km</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Contexto fijo del afiche: Juvenil Masculino y Élite Masculino, la
     última salida, a mediodía. Si corre Juan Diego García: la carrera más
     larga del domingo, con el sol arriba y el resto del club ya con la
     jornada terminada mirando desde la cinta (patrón Palmira, "la más
     larga del fin de semana"). Si la manga 5 (10:45) tuvo a alguien del
     club, va antes de esta con su propio ##; si no, se borra. -->

[PENDIENTE — una frase de contexto de la manga]

[PENDIENTE — corredores del club en esta manga]

## 1:00 p. m. — Premiación final

<div class="clock-stamp reveal" style="--t:300">
  <span class="clock-stamp__time">1:00 <small>p. m.</small></span>
  <span class="clock-stamp__label">Premiación final · cierra el día</span>
  <span class="clock-stamp__day" aria-hidden="true"><span class="clock-stamp__dot"></span></span>
</div>

<!-- Sección corta, misma regla que la primera premiación. Cierra el reloj:
     es la última hora de la jornada y da pie al bloque de cierre. -->

[PENDIENTE]

<!-- ── BLOQUE 7 · VOCES (opcional) ──
     Solo citas textuales reales recogidas en Alcalá, con autorización.
     Menor de edad: padre/tutor presente. Máx. 200 caracteres por cita.
     Sin cita real → borrar el bloque completo, sin excepciones. -->

<div class="pull-quote">
  <p class="pull-quote__text">"[PENDIENTE — cita textual]"</p>
  <p class="pull-quote__attribution">— [Nombre], [relación/categoría]</p>
</div>

## Resultados del club — XCO

<!-- De la planilla oficial del organizador. Sin columna de puntos de la
     Copa Valle (no aplica). Si la Copa Let's Go publica puntaje propio y
     el club va a seguirla, agregar una columna "Puntos". Negrita solo a los
     premiados según lo que el organizador haya premiado (CONFIRMAR hasta
     qué puesto). Tiempo H:MM:SS · "-1 vuelta" si fue doblado · DNF solo
     aquí. Orden: por manga y, dentro de cada manga, por puesto. -->

| Deportista | Categoría (oficial) | Manga | Pos. | Tiempo | Dif. |
|------------|---------------------|:-----:|:----:|--------|------|
| [PENDIENTE] | | | de | | |

## La medida fuera de casa

<!-- Bloque de cierre analítico, en lugar de "la general". 150-250
     palabras. Qué dice el domingo del club, en tres planos:
       1. Contra quién: cuántos clubes y de qué departamentos había en
          las categorías del club; dónde quedó cada corredor respecto de
          los de fuera del Valle (sin comparar negativamente entre
          compañeros).
       2. Lo que se vio que no se ve en casa: pista desconocida, pista
          especial para los pequeños, horario por mangas, salida sin
          reconocimiento previo (el club no fue a los entrenamientos
          oficiales de jueves a sábado: CONFIRMAR si alguien reconoció el
          circuito el domingo temprano).
       3. Lo que se lleva al entrenamiento de cara al 18 de octubre en
          Yumbo. Verbo clave: progresar, no competir.
     Sin épica. Si el resultado fue regular, se dice; si fue bueno, no se
     infla: un día, una carrera, sin puntos en juego. -->

[PENDIENTE — la medida fuera de casa]

## Lo que viene

<!-- 60-100 palabras. La Copa Valle vuelve el 18 de octubre a la Pista
     Carlos Castro de Yumbo (séptima válida, semifinal de la temporada) y
     cierra en Roldanillo el 7 y 8 de noviembre. Si el club decide correr
     otra fecha de la Copa Let's Go, decirlo aquí con sede y fecha
     confirmadas; si no, no se inventa calendario. Enlace a /calendario. -->

[PENDIENTE — lo que viene]
