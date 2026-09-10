# 01 - Arquitectura UX: Club Deportivo Trocha y Ruta

> **Nota (2026-08): la sección de testimonios se eliminó del sitio.** Los tres testimonios
> que existían eran de demostración, no reales. Se borraron la colección `testimonials`, su
> schema, la página `/testimonios`, el carrusel y las referencias en portada y Quiénes Somos.
> Lo que este documento diga sobre testimonios es histórico: no lo reconstruyas sin contenido
> real y autorizado por las familias.


> Documento de arquitectura de informacion, flujos de usuario y wireframes para la reconstruccion del sitio web del Club Deportivo Trocha y Ruta.

---

## 1. Arquitectura de Informacion

### 1.1 Sitemap

> **La lista de rutas de este documento quedó obsoleta.** El sitemap real es el
> contenido de `src/pages/`, y la estructura de cada página está en
> `docs/04-sistema-editorial.md` (referencia por página y tabla de migración).
> Diferencias que conviene conocer antes de leer lo que sigue: los programas son
> tres (`escuela-de-iniciacion` 4-5 años, `formacion-juvenil` 6-11,
> `alto-rendimiento` 12+), no los cuatro rangos que se propusieron en marzo;
> `/equipo` existe pero está oculta y no tiene perfiles individuales; no hay
> filtros por query param en ninguna sección; y nacieron después Trocha Verde
> (`/trocha-verde`, con ~110 páginas de árboles y especies), `/la-pista`,
> `/preguntas-frecuentes`, `/politica-editorial`,
> `/politica-de-tratamiento-de-datos` y `/enlaces`.

### 1.2 Navegación

> La navegación no se define aquí. Los ítems del header salen de `NAV_ITEMS` y
> `SECONDARY_NAV` en `src/lib/constants.ts`, y el pie de `FOOTER_GROUPS` en
> `src/lib/navigation.ts`. Duplicar la lista en prosa solo garantiza que vuelva
> a desincronizarse. Lo que sí sigue vigente como criterio: la nav principal se
> queda en cinco ítems, el CTA de inscripción es un botón y no un ítem más, y
> en móvil hay una barra de conversión fija.


### 1.3 Estrategia de Breadcrumbs

```
Patron:  Inicio > Seccion > Subseccion > Pagina actual

Ejemplos:
- Inicio > Programas > Escuela de Iniciacion
- Inicio > Noticias > Chequeo Pro-Fondos: la primera carrera en casa
- Inicio > Galeria > Chequeo Pro-Fondos 2026
- Inicio > La pista > Drop con recibidor de madera
- Inicio > Trocha Verde > Mango Tommy
```

**Reglas de breadcrumbs:**
- Se muestran en todas las paginas excepto Homepage
- El ultimo elemento (pagina actual) no es clickeable, solo texto
- En mobile se colapsa mostrando solo: `< Seccion padre` como link de retorno
- Usar schema markup `BreadcrumbList` para SEO

---

## 2. User Personas

### Persona 1: Carolina Munoz - "La Mama Protectora"

| Campo          | Detalle                                                      |
|----------------|--------------------------------------------------------------|
| **Edad**       | 34 anos                                                      |
| **Ubicacion**  | Yumbo, Valle del Cauca                                       |
| **Ocupacion**  | Auxiliar contable                                             |
| **Dispositivo**| Samsung Galaxy A14 (Android, datos moviles 4G)               |
| **Contexto**   | Su hijo Santiago (7 anos) tiene mucha energia y le gusta la bicicleta. Carolina busca una actividad extracurricular que lo aleje de pantallas y le ensene disciplina. Una amiga del colegio le recomendo el club. |
| **Goals**      | 1) Entender que ofrece el club para la edad de su hijo. 2) Saber que tan seguro es (staff, metodologia). 3) Inscribir a Santiago sin complicaciones. 4) Conocer costos, horarios y requisitos. |
| **Frustrations** | 1) Sitios que no cargan bien en datos moviles. 2) No encontrar informacion de precios o requisitos. 3) Formularios largos que se pierden al salir. 4) No poder hablar con alguien real si tiene dudas. |
| **Quote**      | *"Necesito saber que mi hijo esta en buenas manos antes de inscribirlo en cualquier cosa."* |

### Persona 2: Mateo Giraldo - "El Corredor Activo"

| Campo          | Detalle                                                      |
|----------------|--------------------------------------------------------------|
| **Edad**       | 13 anos                                                      |
| **Ubicacion**  | Yumbo, Valle del Cauca                                       |
| **Ocupacion**  | Estudiante de 8vo grado                                      |
| **Dispositivo**| Celular prestado del papa (Xiaomi Redmi Note 11)             |
| **Contexto**   | Lleva 3 anos en el club, compite en categoria juvenil. Quiere ver sus fotos despues de las competencias, revisar el calendario de proximas carreras y presumir el club con sus amigos del colegio. |
| **Goals**      | 1) Consultar rapidamente el calendario de proximas carreras. 2) Ver y compartir fotos de competencias. 3) Encontrar su perfil en el roster del equipo. 4) Compartir noticias del club en Instagram/WhatsApp. |
| **Frustrations** | 1) Paginas pesadas que gastan muchos datos. 2) No encontrar fotos de su ultima competencia. 3) Que el calendario no este actualizado. 4) No poder compartir facilmente en redes. |
| **Quote**      | *"Quiero mandarle a mis amigos el link de cuando gane la carrera en Roldanillo."* |

### Persona 3: Luis Fernando Caicedo - "El Patrocinador Potencial"

| Campo          | Detalle                                                      |
|----------------|--------------------------------------------------------------|
| **Edad**       | 45 anos                                                      |
| **Ubicacion**  | Cali, Valle del Cauca                                        |
| **Ocupacion**  | Dueno de tienda de bicicletas "CicloValle"                   |
| **Dispositivo**| iPhone 14, tambien laptop (Macbook)                          |
| **Contexto**   | Le interesa patrocinar un club juvenil de ciclismo para posicionar su marca en la comunidad ciclista del Valle. Necesita evaluar si el club es serio, cuantos corredores tiene, que alcance mediativo poseen y como seria la alianza. |
| **Goals**      | 1) Evaluar la profesionalidad y alcance del club. 2) Ver resultados deportivos y numero de miembros. 3) Conocer los niveles de patrocinio disponibles. 4) Contactar directamente para negociar una alianza. |
| **Frustrations** | 1) Clubs sin presencia digital profesional. 2) No encontrar cifras o logros concretos. 3) Formularios genericos sin opcion de "quiero patrocinar". 4) Falta de transparencia institucional. |
| **Quote**      | *"Si el club se ve profesional, me interesa asociar mi marca. Pero necesito ver numeros."* |

### Persona 4: Andrea Velasco - "La Visitante Casual"

| Campo          | Detalle                                                      |
|----------------|--------------------------------------------------------------|
| **Edad**       | 28 anos                                                      |
| **Ubicacion**  | Cali, Valle del Cauca                                        |
| **Ocupacion**  | Disenadora grafica freelance, ciclista recreativa             |
| **Dispositivo**| Motorola Moto G Power, conexion WiFi en casa                 |
| **Contexto**   | Vio una publicacion del club en Instagram con ninos compitiendo y le parecio interesante. Quiere saber mas sobre el club por curiosidad y quiza compartir con su sobrina de 6 anos. |
| **Goals**      | 1) Entender rapidamente que es el club. 2) Ver fotos y videos de actividades. 3) Si le parece bien, compartir con su hermana (mama de la sobrina). 4) Quiza seguir al club en redes. |
| **Frustrations** | 1) Sitios que no comunican su propuesta de valor en 5 segundos. 2) Diseño anticuado que no inspira confianza. 3) No encontrar redes sociales para seguir al club. |
| **Quote**      | *"Vi las fotos en Instagram y se ve chevere, pero necesito saber mas antes de recomendarlo."* |

---

## 3. User Flows

### 3.1 Flow: Inscripcion de Nuevo Miembro

Este es el flujo critico del sitio. Un padre/madre llega (probablemente desde redes sociales o recomendacion) y necesita inscribir a su hijo.

```
                    ENTRADA
                      |
          +-----------+-----------+
          |           |           |
     Google      Instagram    WhatsApp
     Search       link       recomend.
          |           |           |
          +-----------+-----------+
                      |
                      v
              +---------------+
              |   HOMEPAGE    |
              | (Hero + CTA)  |
              +-------+-------+
                      |
         +------------+------------+
         |                         |
         v                         v
  +-------------+          +--------------+
  | VER PROGR.  |          | CTA DIRECTO  |
  | (confianza) |          | "Inscribete" |
  +------+------+          +------+-------+
         |                        |
         v                        |
  +--------------+                |
  | /programas   |                |
  | Elige prog.  |                |
  +------+-------+                |
         |                        |
         v                        |
  +--------------+                |
  | Detalle prog.|                |
  | CTA inscrib. |                |
  +------+-------+                |
         |                        |
         +--------+------+--------+
                  |
                  v
        +-------------------+
        | /inscripciones    |
        | PASO 1: Programa  |
        | - Elige programa  |
        | - Edad del nino   |
        +--------+----------+
                 |
                 v
        +-------------------+
        | PASO 2: Corredor  |
        | - Nombre completo |
        | - Fecha nacim.    |
        | - Genero          |
        | - Talla camiseta  |
        +--------+----------+
                 |
                 v
        +-------------------+
        | PASO 3: Acudiente |
        | - Nombre padre    |
        | - Celular / email |
        | - Direccion       |
        | - EPS del nino    |
        +--------+----------+
                 |
                 v
        +-------------------+
        | PASO 4: Confirmar |
        | - Resumen datos   |
        | - Aceptar termin. |
        | - Enviar          |
        +--------+----------+
                 |
                 v
        +-------------------+
        | CONFIRMACION      |
        | - Mensaje exito   |
        | - Que sigue       |
        | - WhatsApp link   |
        | - Descargar PDF   |
        +-------------------+
```

**Notas del flujo:**
- Indicador de progreso visible (Paso 1 de 4, Paso 2 de 4...)
- Boton "Atras" en cada paso sin perder datos
- Validacion en tiempo real por campo (no al final)
- Si el usuario abandona, los datos se guardan en localStorage por 48h
- Opcion de contacto por WhatsApp en caso de dudas durante el proceso

### 3.2 Flow: Consulta de Calendario y Resultados

```
          ENTRADA
             |
     +-------+-------+
     |               |
  Homepage       /noticias
  "Proximos      (link a
   eventos"      evento)
     |               |
     +-------+-------+
             |
             v
     +----------------+
     | /calendario    |
     | Vista cronolog.|
     | +- Filtros:    |
     |    Proximos    |
     |    Pasados     |
     |    Todos       |
     +-------+--------+
             |
      +------+------+
      |             |
      v             v
  +--------+   +--------+
  |PROXIMO |   | PASADO |
  |evento  |   | evento |
  +---+----+   +---+----+
      |            |
      v            v
  +--------+   +-----------+
  |Detalle |   | Detalle   |
  |- Fecha |   | - Fecha   |
  |- Lugar |   | - Lugar   |
  |- Categ.|   | - Result. |
  |- Mapa  |   | - Fotos   |
  |        |   | - Galeria |
  +---+----+   +-----+-----+
      |              |
      v              v
  +----------+  +-----------+
  |Agregar a |  | Compartir |
  |Google Cal|  | WhatsApp  |
  +----------+  +-----------+
```

**Notas del flujo:**
- Vista default: proximos eventos primero
- Eventos pasados muestran resultados y enlace a galeria de fotos
- Cada evento tiene meta tag para Google Calendar (iCal)
- Boton de compartir nativo (Web Share API) en cada evento

### 3.3 Flow: Contacto para Patrocinio

```
          ENTRADA
             |
     +-------+--------+
     |        |        |
  Google   Homepage  Direct
  "patrocinar  Sponsors  URL
  club"     Bar
     |        |        |
     +--------+--------+
              |
              v
     +-----------------+
     | /patrocinadores |
     | Niveles:        |
     |  - Principal    |
     |  - Oficial      |
     |  - Aliado       |
     |  - Proveedor    |
     |                 |
     | CTA: "Quiero    |
     |  ser sponsor"   |
     +--------+--------+
              |
              v
     +-----------------+
     | /contacto       |
     | ?asunto=        |
     |  patrocinio     |
     |                 |
     | Formulario:     |
     | - Nombre        |
     | - Empresa       |
     | - Email         |
     | - Telefono      |
     | - Asunto (pre-  |
     |   seleccionado: |
     |   "Patrocinio") |
     | - Mensaje       |
     +--------+--------+
              |
              v
     +-----------------+
     | CONFIRMACION    |
     | - Gracias       |
     | - Tiempo de     |
     |   respuesta     |
     | - Descargar     |
     |   brochure PDF  |
     |   del club      |
     +-----------------+
```

**Notas del flujo:**
- La pagina de patrocinadores muestra beneficios claros por nivel
- El CTA "Quiero ser sponsor" lleva a /contacto con el asunto pre-llenado
- El media kit en PDF sigue sin existir; el argumento de venta son las cifras derivadas del contenido, con su procedencia visible

---

## 4. Wireframes Descriptivos (ASCII Art)

> **Los wireframes de portada y de `/equipo` se borraron (2026-09-09).** El de
> portada describía una banda de cuatro cifras sin fuente (200+ niños, 50+
> competencias, 100+ medallas) que se eliminó del sitio por no tener de dónde
> comprobarse, y secciones que ya no existen. El de `/equipo` describía una
> rejilla pública de perfiles de corredores: son menores de edad y sus fichas no
> se publican. La estructura real de cada página está en
> `docs/04-sistema-editorial.md`; la portada, en su §19, y `/equipo` —construida
> y oculta— en su §27. Se conserva solo el de inscripciones, que sigue
> describiendo la pantalla real.


### 4.3 Inscripciones (Formulario Multi-paso)

```
+================================================================+
|  [Logo]   Inicio  Quienes Somos  Programas  Equipo  ... [CTA] |
+================================================================+

  Inicio > Inscripciones

  +===============================================+
  |          INSCRIBE A TU HIJO                   |
  |  El primer paso para formar un campeon        |
  +===============================================+

  PROGRESO:
  [*1. Programa*] --- [2. Corredor] --- [3. Acudiente] --- [4. Confirmar]
  ===============      ============      ==============      ============

  +==============================================+
  |                                              |
  |  Elige el programa                           |
  |                                              |
  |  +----------------------------------------+ |
  |  | ( ) Escuela Infantil (4-8 anos)        | |
  |  |     Primeros pedales, seguridad vial,  | |
  |  |     juegos en bicicleta                | |
  |  +----------------------------------------+ |
  |  | ( ) Desarrollo Juvenil (9-14 anos)     | |
  |  |     Tecnica XCO, resistencia,          | |
  |  |     competencias regionales            | |
  |  +----------------------------------------+ |
  |  | (o) Competicion (15+ anos)             | |
  |  |     Alto rendimiento, calendario       | |
  |  |     nacional, preparacion fisica       | |
  |  +----------------------------------------+ |
  |                                              |
  |  Edad del corredor: [  13 anos  v]           |
  |                                              |
  |                      [ SIGUIENTE > ]         |
  |                                              |
  +==============================================+

  +----------------------------------------------+
  | Dudas? Escribenos por WhatsApp [icono WA]    |
  | o llama al 3XX XXX XXXX                      |
  +----------------------------------------------+
```

**Paso 2: Datos del Corredor**

```
  PROGRESO:
  [1. Programa] --- [*2. Corredor*] --- [3. Acudiente] --- [4. Confirmar]

  +==============================================+
  |                                              |
  |  Datos del corredor                          |
  |                                              |
  |  Nombre completo *                           |
  |  +----------------------------------------+ |
  |  | Juan David Perez Munoz                 | |
  |  +----------------------------------------+ |
  |                                              |
  |  Fecha de nacimiento *                       |
  |  +------------+ +----------+ +------------+ |
  |  | Dia [15]   | | Mes [03] | | Ano [2013] | |
  |  +------------+ +----------+ +------------+ |
  |                                              |
  |  Genero                                      |
  |  +----------------------------------------+ |
  |  | Masculino                          [v] | |
  |  +----------------------------------------+ |
  |                                              |
  |  Talla camiseta                              |
  |  [  S  ] [  M  ] [ *L* ] [ XL  ]            |
  |                                              |
  |  Experiencia previa en ciclismo              |
  |  +----------------------------------------+ |
  |  | ( ) Ninguna - primer acercamiento      | |
  |  | (o) Basica - sabe montar bicicleta     | |
  |  | ( ) Intermedia - ha competido          | |
  |  +----------------------------------------+ |
  |                                              |
  |  [ < ATRAS ]             [ SIGUIENTE > ]     |
  |                                              |
  +==============================================+
```

**Paso 4: Confirmacion**

```
  PROGRESO:
  [1. Programa] --- [2. Corredor] --- [3. Acudiente] --- [*4. Confirmar*]

  +==============================================+
  |                                              |
  |  Revisa la informacion                       |
  |                                              |
  |  PROGRAMA                          [Editar]  |
  |  Competicion (15+ anos)                      |
  |  ------------------------------------------ |
  |  CORREDOR                          [Editar]  |
  |  Juan David Perez Munoz                      |
  |  15/03/2013 - Masculino - Talla L            |
  |  ------------------------------------------ |
  |  ACUDIENTE                         [Editar]  |
  |  Carolina Munoz Betancourt                   |
  |  cel: 312 456 7890                           |
  |  email: carolina@email.com                   |
  |  EPS: Nueva EPS                              |
  |  ------------------------------------------ |
  |                                              |
  |  [x] Acepto los terminos y condiciones       |
  |      del Club Deportivo Trocha y Ruta        |
  |  [x] Autorizo el tratamiento de datos        |
  |      personales segun la Ley 1581 de 2012    |
  |                                              |
  |  [ < ATRAS ]        [ ENVIAR INSCRIPCION ]   |
  |                                              |
  +==============================================+
```

**Pantalla de Exito**

```
  +==============================================+
  |                                              |
  |            [icono check verde]               |
  |                                              |
  |     INSCRIPCION ENVIADA CON EXITO            |
  |                                              |
  |  Hemos recibido la inscripcion de            |
  |  Juan David Perez al programa                |
  |  de Competicion.                             |
  |                                              |
  |  Que sigue?                                  |
  |  1. Recibiras un email de confirmacion       |
  |  2. Nos comunicaremos en 24-48 horas         |
  |  3. Te indicaremos fecha de inicio           |
  |     y equipo necesario                       |
  |                                              |
  |  [ DESCARGAR COMPROBANTE PDF ]               |
  |                                              |
  |  [ ESCRIBENOS POR WHATSAPP ]                 |
  |                                              |
  |  [ VOLVER AL INICIO ]                        |
  |                                              |
  +==============================================+
```

---

## 5. Principios de Diseno UX

### 5.1 Mobile-First

La audiencia principal (padres colombianos, corredores jovenes) accede desde dispositivos Android de gama media con conexion 4G. El diseno debe priorizar:

- **Touch targets minimos de 44x44px** (WCAG 2.5.5)
- **Peso de pagina < 500KB** en primera carga (sin imagenes hero)
- **Imagenes lazy-loaded** con placeholders blur (LQIP)
- **Fuentes con font-display: swap** para evitar FOIT
- **Breakpoints**: 320px (min), 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Navegacion mobile**: hamburguesa con drawer lateral, CTA "Inscribete" siempre visible
- **Formularios**: inputs con `inputmode` apropiado (tel, email, numeric), autocomplete habilitado

### 5.2 Confianza para Padres de Familia

Los padres necesitan sentirse seguros antes de inscribir a su hijo. Elementos de confianza:

- **Fotos reales** del club, entrenadores y ninos (nunca stock photos)
- **Staff visible**: fotos y credenciales de entrenadores en /quienes-somos
- **Transparencia**: seccion con documentos legales, reconocimientos deportivos, certificaciones DIAN
- **Contacto accesible**: WhatsApp siempre visible, telefono clickeable, formulario simple
- **Estadisticas verificables**: solo cifras con fuente comprobable (anos cumplidos, programas activos, arboles sembrados). Nunca un numero de ninos formados: no existe registro que lo respalde
- **Redes sociales activas**: embed o links a Instagram/Facebook con contenido reciente

### 5.3 Profesionalismo Deportivo

Inspirado en webs de equipos UCI WorldTour, adaptado a escala comunitaria:

- **Tipografia bold** (Plus Jakarta Sans para titulos, Inter para cuerpo)
- **Cards** con foto, titular prominente y dato de apoyo (eventos, albumes, arboles; no corredores: son menores)
- **Calendario deportivo** con vista cronologica, estados claros (proximo/pasado)
- **Resultados** con posiciones, tiempos y medallas
- **Paleta de colores** definida y consistente (teal primario, lima acento, grafito de superficie)
- **Imagenes en alta calidad** optimizadas (WebP/AVIF con fallback)

### 5.4 Accesibilidad WCAG 2.1 AA

Requisitos minimos de accesibilidad:

| Criterio | Implementacion |
|----------|---------------|
| 1.1.1 Contenido no textual | Alt text descriptivo en todas las imagenes |
| 1.3.1 Info y relaciones | HTML semantico: nav, main, article, section, aside |
| 1.4.3 Contraste minimo | Ratio 4.5:1 texto normal, 3:1 texto grande |
| 1.4.4 Cambio de tamano | Texto escalable hasta 200% sin perdida |
| 2.1.1 Teclado | Toda funcionalidad accesible por teclado |
| 2.4.1 Saltar bloques | Skip-to-content link oculto visualmente |
| 2.4.2 Pagina titulada | Titulos unicos y descriptivos por pagina |
| 2.4.6 Encabezados | Jerarquia h1-h6 correcta, un solo h1 por pagina |
| 2.4.7 Foco visible | Outline de foco visible en todos los interactivos |
| 3.1.1 Idioma | `lang="es-CO"` en el html |
| 3.3.1 Identificacion errores | Mensajes de error claros en formularios |
| 3.3.2 Etiquetas | Labels asociados a todos los inputs |
| 4.1.2 Nombre, rol, valor | ARIA labels donde sea necesario |

**Contraste:** los ratios que traía este documento se calcularon sobre una paleta
azul/rosa que el club nunca adoptó. La paleta real es teal `#20b7c9` y lima
`#8be000`, y ninguno de los dos cumple contraste como texto sobre fondo claro:
para texto van `primary-deep` y `accent-deep`, y sobre fondos de color va el
grafito. La regla vigente esta en `CLAUDE.md` y los tokens en
`src/styles/global.css`.

### 5.5 Patrones de Interaccion Recomendados

| Patron | Donde | Implementacion |
|--------|-------|----------------|
| **Scroll suave** | Anclas internas, "volver arriba" | `scroll-behavior: smooth` + boton flotante |
| **Swipe** | Galeria | Carrusel con soporte touch/swipe |
| **Share nativo** | Noticias, eventos, perfiles | Web Share API con fallback a copiar URL |
| **Formularios progresivos** | Inscripciones | Multi-paso con validacion por campo |
| **Toast notifications** | Formularios enviados | Notificacion temporal de exito/error |
| **Hover elevacion** | Cards | `transform: translateY(-4px)` + sombra en hover |
| **View Transitions** | Navegacion entre paginas | Astro View Transitions API |
| **Count-up al entrar en pantalla** | Stats counter, secciones | CSS puro (`@property` + `animation-timeline`), sin JS |

---

## 6. Recomendaciones de Mejora vs PROMPT Original

> **Histórico, no backlog.** Esta sección es de marzo de 2026. La mayoría ya se hizo
> (WhatsApp como canal, FAQ, tags en noticias, staff separado del roster, experiencia
> previa e integración con Google Calendar en el formulario). Otras se resolvieron
> distinto a como se proponen aquí (el palmarés se resolvió como `SeasonStandings`
> en `/noticias`, no como página propia — y una página de corredores individuales
> choca con la política de menores). Media kit en PDF, widget de Strava, modo oscuro
> e internacionalización siguen sin implementarse. Se conserva por trazabilidad, no
> como lista de tareas pendientes.

Despues de analizar el PROMPT-PROYECTO.md y compararlo con las mejores practicas de equipos profesionales y las necesidades de las personas definidas, se identifican las siguientes oportunidades:

### 6.1 Mejoras de Alto Impacto

**1. Agregar WhatsApp como canal principal de contacto**
- El PROMPT menciona formularios y email, pero WhatsApp es el canal dominante en Colombia para comunicacion directa.
- **Recomendacion**: Boton flotante de WhatsApp en todas las paginas (esquina inferior derecha). Link directo con mensaje pre-escrito segun contexto: "Hola, quiero inscribir a mi hijo en el programa [X]".

**2. Seccion "Preguntas Frecuentes" (FAQ)**
- No existe en el sitemap original. Los padres tienen preguntas recurrentes: costos, horarios, equipo necesario, seguridad.
- **Recomendacion**: Agregar `/preguntas-frecuentes` o seccion FAQ en la pagina de inscripciones. Usar schema markup `FAQPage` para SEO.
- **Sitemap actualizado**: agregar como pagina independiente o seccion dentro de /inscripciones.

**3. Seccion de "Logros / Palmarés" dedicada**
- El PROMPT menciona logros dentro de "Quienes Somos", pero un club deportivo merece una seccion dedicada de resultados historicos.
- **Recomendacion**: Crear `/logros` o `/palmares` con filtros por ano, categoria y tipo de competencia. Esto sirve tanto para orgullo de familias como argumento para patrocinadores.

**4. Media Kit descargable para patrocinadores**
- No existe en el PROMPT. Un patrocinador potencial necesita un PDF con datos del club, alcance, audiencia, niveles de patrocinio.
- **Recomendacion**: PDF descargable en /patrocinadores con: historia breve, estadisticas, audiencia (redes sociales, web), niveles de patrocinio con beneficios, fotos de alta calidad, datos de contacto.

### 6.2 Mejoras de Medio Impacto

**5. Blog/Noticias con etiquetas, no solo categorias**
- El PROMPT define 4 categorias. Para SEO y descubrimiento, conviene agregar un sistema de tags complementario (ej: "XCO", "Roldanillo", "Sub-15", "entrenamiento montana").
- **Implementacion**: Agregar campo `tags: z.array(z.string())` al schema de noticias.

**6. Pagina de "Como Llegar" / Mapa de rutas de entrenamiento**
- El club entrena en rutas especificas de Yumbo. Seria util para nuevas familias saber donde y como llegar.
- **Recomendacion**: Incluir en /contacto un mapa con la ubicacion del punto de encuentro y las rutas de entrenamiento marcadas.

**7. Seccion de "Staff / Entrenadores" separada del roster de corredores**
- El PROMPT mezcla staff con corredores en la misma vista (filtro "staff" en /equipo).
- **Recomendacion**: Mostrar entrenadores de forma prominente en /quienes-somos con credenciales, experiencia y foto. Mantener el roster solo para corredores activos.

**8. Integracion con Strava para rutas y actividades**
- El schema de riders ya incluye campo Strava. Se podria embeber un widget o link a las rutas del club.
- **Recomendacion**: Mostrar las ultimas actividades del club o rutas favoritas en la pagina de programas o contacto.

### 6.3 Mejoras de Bajo Impacto (Nice to Have)

**9. Notificaciones de eventos por email/WhatsApp**
- Un simple formulario de "suscribete para recibir avisos de proximas competencias" en la pagina de calendario.

**10. Seccion de "Exalumnos" o "Historias de Exito"**
- Enfocada en corredores que crecieron en el club y ahora compiten en categorias superiores.

**11. Modo oscuro**
- No es prioridad, pero la paleta de colores ya incluye `surface.dark`. Podria implementarse como enhancement posterior.

**12. Internacionalizacion (i18n) basica**
- El sitio es en espanol, pero una version minima en ingles de la homepage podria ser util si el club participa en eventos internacionales o busca patrocinadores extranjeros. No prioritario ahora.

### 6.4 Correcciones al Flujo Propuesto

**Inscripciones: agregar campo de experiencia previa**
- El PROMPT no lo menciona pero es informacion util para asignar correctamente al nino a un grupo.

**Calendario: agregar funcionalidad de exportar a Google Calendar**
- Cada evento deberia tener un boton "Agregar a mi calendario" con formato iCal.

**Galeria: considerar integracion con Google Photos o Cloudinary**
- En lugar de subir fotos al repo Git (que crece rapidamente), usar un servicio externo de imagenes.

---

## Resumen Ejecutivo

Este documento nacio en marzo de 2026 como base UX de la reconstruccion del sitio.
Lo que sigue vigente y por lo que se conserva:

1. **4 personas** que cubren el espectro de usuarios: padres, corredores,
   patrocinadores y visitantes casuales. Es la parte que mas se cita desde los
   agentes del proyecto y los planes de marketing.
2. **3 flujos criticos** paso a paso: inscripcion, calendario y patrocinio. Los
   tres siguen describiendo el recorrido real.
3. **Principios mobile-first** y la tabla de criterios WCAG 2.1 AA.
4. El **wireframe de inscripciones**, unico que aun describe la pantalla que
   existe.

Lo que se retiro por haber quedado desmentido: el sitemap y la navegacion (los
define el codigo), los wireframes de portada y de `/equipo`, los ratios de
contraste de una paleta que no se adopto, y las cifras del club sin fuente.

La estructura de cada pagina se documenta en `docs/04-sistema-editorial.md`; el
modelo de contenido, en `docs/03-modelo-de-contenido.md`.
