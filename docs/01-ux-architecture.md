# 01 - Arquitectura UX: Club Deportivo Trocha y Ruta

> Documento de arquitectura de informacion, flujos de usuario y wireframes para la reconstruccion del sitio web del Club Deportivo Trocha y Ruta.

---

## 1. Arquitectura de Informacion

### 1.1 Sitemap Jerarquico

```
/ (Homepage)
├── /quienes-somos
│   (Historia, mision, vision, valores, equipo directivo, logros)
│
├── /programas
│   ├── /programas/escuela-infantil        (4-8 anos)
│   ├── /programas/desarrollo-juvenil      (9-14 anos)
│   └── /programas/competicion             (15+ anos)
│
├── /equipo
│   ├── /equipo?cat=infantil               (Filtro por categoria)
│   ├── /equipo?cat=juvenil
│   ├── /equipo?cat=elite
│   ├── /equipo?cat=staff
│   └── /equipo/[slug]                     (Perfil individual)
│
├── /noticias
│   ├── /noticias?cat=competencias
│   ├── /noticias?cat=club
│   ├── /noticias?cat=entrenamiento
│   ├── /noticias?cat=comunidad
│   └── /noticias/[slug]                   (Articulo individual)
│
├── /calendario                            (Eventos y competencias)
│
├── /galeria
│   └── /galeria/[slug]                    (Album individual)
│
├── /inscripciones                         (Formulario multi-paso)
│
├── /testimonios                           (Historias de familias y corredores)
│
├── /patrocinadores                        (Sponsors por nivel)
│
├── /transparencia
│   └── /transparencia/dian                (Documentos DIAN)
│
├── /contacto                              (Formulario + mapa + datos)
│
└── /404                                   (Pagina de error)
```

### 1.2 Priorizacion de Navegacion

**Navegacion Principal (Header - visible siempre)**

| Orden | Item           | Justificacion                                        |
|-------|----------------|------------------------------------------------------|
| 1     | Inicio         | Ancla de orientacion                                 |
| 2     | Quienes Somos  | Confianza para padres (primer contacto)              |
| 3     | Programas      | Core value: que ofrece el club                       |
| 4     | Equipo         | Orgullo deportivo, roster de corredores              |
| 5     | Noticias       | Actividad y vitalidad del club                       |
| 6     | Calendario     | Proximas competencias                                |
| 7     | Inscripciones  | CTA principal (boton destacado en header)            |

**Navegacion Secundaria (Footer + menu mobile expandido)**

| Item            | Justificacion                                     |
|-----------------|---------------------------------------------------|
| Galeria         | Contenido visual de soporte                       |
| Testimonios     | Social proof, pero no es accion principal         |
| Patrocinadores  | Relevante para sponsors, no para padres           |
| Transparencia   | Legal/institucional, bajo trafico                 |
| Contacto        | Siempre accesible en footer                       |
| Redes Sociales  | Links externos en footer                          |

**CTA Flotante Mobile**: Boton "Inscribete" fijo en la parte inferior de la pantalla en dispositivos moviles (solo visible cuando no esta en la pagina de inscripciones).

### 1.3 Estrategia de Breadcrumbs

```
Patron:  Inicio > Seccion > Subseccion > Pagina actual

Ejemplos:
- Inicio > Programas > Escuela Infantil
- Inicio > Equipo > Juan David Perez
- Inicio > Noticias > Copa Valle 2026: Tres medallas para Trocha
- Inicio > Galeria > Entrenamiento Marzo 2026
- Inicio > Transparencia > Documentos DIAN
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
- Incluir boton de descarga de brochure/media kit PDF del club
- Mostrar estadisticas del club (corredores, anos, competencias) como argumento de venta

---

## 4. Wireframes Descriptivos (ASCII Art)

### 4.1 Homepage

```
+================================================================+
|  [Logo]   Inicio  Quienes Somos  Programas  Equipo  ...  [CTA]|
|                                                    [INSCRIBETE]|
+================================================================+

+================================================================+
|                                                                |
|                        H E R O                                 |
|                   (imagen full-width                           |
|                  ninos en bicicleta,                           |
|                 fondo montanas Valle)                          |
|                                                                |
|          "Formando campeones en la vida                        |
|               y en la pista"                                   |
|                                                                |
|       [ INSCRIBETE ]    [ CONOCE MAS ]                         |
|                                                                |
|   Club Deportivo Trocha y Ruta - Yumbo, Valle del Cauca        |
+================================================================+

+================================================================+
|                   NUESTROS NUMEROS                              |
|                                                                |
|    +--------+   +--------+   +--------+   +--------+          |
|    | 15+    |   | 200+   |   | 50+    |   | 100+   |          |
|    | Anos   |   | Niños  |   | Compe- |   | Meda-  |          |
|    | activo |   | forma- |   | tencias|   | llas   |          |
|    |        |   | dos    |   |        |   |        |          |
|    +--------+   +--------+   +--------+   +--------+          |
+================================================================+

+================================================================+
|                    PROGRAMAS                                    |
|                                                                |
|  +------------------+ +------------------+ +----------------+  |
|  |  [icono bici]    | |  [icono bici]    | | [icono bici]   |  |
|  |                  | |                  | |                |  |
|  | ESCUELA INFANTIL | | DESARROLLO       | | COMPETICION    |  |
|  | 4-8 anos         | | JUVENIL          | | 15+ anos       |  |
|  |                  | | 9-14 anos        | |                |  |
|  | Primeros pedales | | Tecnica y        | | Alto rendim.   |  |
|  | y amor por el    | | resistencia en   | | y competencias |  |
|  | deporte          | | montana          | | regionales     |  |
|  |                  | |                  | |                |  |
|  | [Ver programa >] | | [Ver programa >] | | [Ver programa]||  |
|  +------------------+ +------------------+ +----------------+  |
+================================================================+

+================================================================+
|                 PROXIMOS EVENTOS                                |
|                                                                |
|  +-----------------------------------------------------------+|
|  | ABR  |  Copa Valle XCO - Roldanillo           | Proxima  ||
|  | 12   |  Roldanillo, Valle del Cauca            |  [>]     ||
|  +-----------------------------------------------------------+|
|  | ABR  |  Entreno Especial Montana               | Proxima  ||
|  | 19   |  Cerro La Cumbre, Yumbo                 |  [>]     ||
|  +-----------------------------------------------------------+|
|  | MAY  |  Nacional XCO Sub-15                    | Proxima  ||
|  | 03   |  Manizales, Caldas                      |  [>]     ||
|  +-----------------------------------------------------------+|
|  |                                                            ||
|  |              [ VER CALENDARIO COMPLETO ]                   ||
|  +-----------------------------------------------------------+|
+================================================================+

+================================================================+
|                EQUIPO DESTACADO                                 |
|                                                                |
|  +----------+  +----------+  +----------+  +----------+       |
|  |  [foto]  |  |  [foto]  |  |  [foto]  |  |  [foto]  |       |
|  |          |  |          |  |          |  |          |       |
|  | Juan D.  |  | Maria L. |  | Carlos   |  | Sofia    |       |
|  | Perez    |  | Gomez    |  | Restrepo |  | Diaz     |       |
|  | Juvenil  |  | Infantil |  | Elite    |  | Juvenil  |       |
|  | XCO      |  | XCO      |  | Downhill |  | XCO      |       |
|  +----------+  +----------+  +----------+  +----------+       |
|                                                                |
|               [ VER EQUIPO COMPLETO ]                          |
+================================================================+

+================================================================+
|                    GALERIA                                      |
|                                                                |
|  +--------------------------+  +------------+                  |
|  |                          |  |            |                  |
|  |        [foto grande]     |  | [foto med] |                  |
|  |                          |  |            |                  |
|  |                          |  +------------+                  |
|  |                          |  +------------+                  |
|  +--------------------------+  |            |                  |
|  +------------+ +------------+ | [foto med] |                  |
|  | [foto peq] | | [foto peq] | |            |                  |
|  +------------+ +------------+ +------------+                  |
|                                                                |
|                  [ VER GALERIA ]                                |
+================================================================+

+================================================================+
|                 TESTIMONIOS                                     |
|                                                                |
|          "Mi hijo llego timido y ahora es un lider.            |
|           Trocha y Ruta le cambio la vida."                    |
|                                                                |
|              - Maria Fernanda Lopez,                           |
|                Mama de Samuel (9 anos)                         |
|                                                                |
|              [ o ]  [ o ]  [*o*]  [ o ]                        |
|                    (indicadores carrusel)                       |
+================================================================+

+================================================================+
|                 NUESTROS PATROCINADORES                         |
|                                                                |
|    [logo1]   [logo2]   [logo3]   [logo4]   [logo5]            |
|                  (carrusel infinito)                            |
|                                                                |
|              [ QUIERO SER PATROCINADOR ]                       |
+================================================================+

+================================================================+
|                                                                |
|        INSCRIBE A TU HIJO HOY                                  |
|                                                                |
|   Formamos ninos con valores a traves del ciclomontanismo.     |
|   Desde los 4 anos, con entrenadores certificados.             |
|                                                                |
|              [ INSCRIBETE AHORA ]                              |
|                                                                |
+================================================================+

+================================================================+
| FOOTER                                                         |
|                                                                |
| TROCHA Y RUTA    | NAVEGACION      | CONTACTO    | REDES     |
| Logo              | Quienes Somos   | Dir: Yumbo  | [Fb]     |
| "Deporte,         | Programas       | Tel: 3XX    | [Ig]     |
|  formacion y      | Equipo          | Email: ..   | [Yt]     |
|  contacto con     | Calendario      |             | [Str]    |
|  la naturaleza"   | Inscripciones   |             |          |
|                   | Contacto        |             |          |
|                   | Transparencia   |             |          |
|                                                                |
| (c) 2026 Club Deportivo Trocha y Ruta | Politica privacidad   |
+================================================================+
```

### 4.2 Equipo / Roster

**Vista Grid (Index)**

```
+================================================================+
|  [Logo]   Inicio  Quienes Somos  Programas  Equipo  ... [CTA] |
+================================================================+

  Inicio > Equipo

  +===============================================+
  |              NUESTRO EQUIPO                   |
  |   "Los guerreros de la trocha"                |
  +===============================================+

  FILTROS:
  [ Todos ]  [ Infantil ]  [ Juvenil ]  [ Elite ]  [ Staff ]

  +----------+  +----------+  +----------+  +----------+
  |  [foto]  |  |  [foto]  |  |  [foto]  |  |  [foto]  |
  |  aspect  |  |  aspect  |  |  aspect  |  |  aspect  |
  |  3:4     |  |  3:4     |  |  3:4     |  |  3:4     |
  |          |  |          |  |          |  |          |
  | Juan D.  |  | Maria L. |  | Carlos R.|  | Sofia D. |
  | Perez    |  | Gomez    |  | Restrepo |  | Diaz     |
  | -----    |  | -----    |  | -----    |  | -----    |
  | Juvenil  |  | Infantil |  | Elite    |  | Juvenil  |
  | XCO      |  | XCO      |  | Downhill |  | XCO      |
  +----------+  +----------+  +----------+  +----------+

  +----------+  +----------+  +----------+  +----------+
  |  [foto]  |  |  [foto]  |  |  [foto]  |  |  [foto]  |
  |          |  |          |  |          |  |          |
  | Andres   |  | Valeria  |  | Santiago |  | Coach    |
  | Munoz    |  | Torres   |  | Ramirez  |  | Pedro M. |
  | -----    |  | -----    |  | -----    |  | -----    |
  | Juvenil  |  | Infantil |  | Elite    |  | Staff    |
  | XCO      |  | XCO      |  | Enduro   |  | Director |
  +----------+  +----------+  +----------+  +----------+
```

**Vista Perfil Individual**

```
+================================================================+
|  [Logo]   Inicio  Quienes Somos  Programas  Equipo  ... [CTA] |
+================================================================+

  Inicio > Equipo > Juan David Perez

  +==========================+=================================+
  |                          |                                 |
  |                          |  JUAN DAVID PEREZ               |
  |      [foto grande]       |                                 |
  |      perfil              |  Categoria: Juvenil             |
  |      aspect 3:4          |  Especialidad: XCO              |
  |      aprox 400px         |  Edad: 13 anos                  |
  |                          |  Desde: 2021                    |
  |                          |                                 |
  |                          |  [Instagram]  [Strava]          |
  |                          |                                 |
  +==========================+=================================+

  +===============================================+
  |  BIOGRAFIA                                    |
  |                                               |
  |  Juan David inicio en Trocha y Ruta a los     |
  |  10 anos en la escuela infantil. Hoy es       |
  |  uno de los corredores mas destacados en      |
  |  categoria juvenil del Valle del Cauca...     |
  +===============================================+

  +===============================================+
  |  LOGROS                                       |
  |                                               |
  |  [medalla] 1er puesto Copa Valle XCO 2025     |
  |  [medalla] 3er puesto Nacional Sub-15 2025    |
  |  [medalla] 2do puesto Departamental 2024      |
  +===============================================+

  +===============================================+
  |  GALERIA                                      |
  |                                               |
  |  +--------+ +--------+ +--------+ +--------+ |
  |  | [foto] | | [foto] | | [foto] | | [foto] | |
  |  +--------+ +--------+ +--------+ +--------+ |
  +===============================================+

  [ < Anterior corredor ]        [ Siguiente corredor > ]
```

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
- **Testimonios** de otros padres con nombre y foto real
- **Staff visible**: fotos y credenciales de entrenadores en /quienes-somos
- **Transparencia**: seccion con documentos legales, reconocimientos deportivos, certificaciones DIAN
- **Contacto accesible**: WhatsApp siempre visible, telefono clickeable, formulario simple
- **Estadisticas verificables**: anos de trayectoria, numero de ninos formados
- **Redes sociales activas**: embed o links a Instagram/Facebook con contenido reciente

### 5.3 Profesionalismo Deportivo

Inspirado en webs de equipos UCI WorldTour, adaptado a escala comunitaria:

- **Tipografia bold** (Plus Jakarta Sans para titulos, Inter para cuerpo)
- **Cards de corredores** con foto profesional, nombre prominente, categoria y logros
- **Calendario deportivo** con vista cronologica, estados claros (proximo/pasado)
- **Resultados** con posiciones, tiempos y medallas
- **Paleta de colores** definida y consistente (azul primario, rosa acento, cyan secundario)
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

**Verificacion de contraste con la paleta del club:**
- Azul primario (#046bd2) sobre blanco: ratio 4.56:1 (pasa AA)
- Rosa acento (#ef4297) sobre blanco: ratio 3.51:1 (pasa AA solo texto grande; usar sobre fondo oscuro para texto normal)
- Texto principal (#1e293b) sobre blanco: ratio 12.63:1 (pasa AAA)
- Texto secundario (#64748b) sobre blanco: ratio 4.73:1 (pasa AA)

### 5.5 Patrones de Interaccion Recomendados

| Patron | Donde | Implementacion |
|--------|-------|----------------|
| **Skeleton loading** | Imagenes, cards | Placeholder gris animado mientras carga |
| **Scroll suave** | Anclas internas, "volver arriba" | `scroll-behavior: smooth` + boton flotante |
| **Pull-to-refresh visual** | Mobile general | Indicador de recarga nativo |
| **Swipe** | Galeria, testimonios | Carrusel con soporte touch/swipe |
| **Share nativo** | Noticias, eventos, perfiles | Web Share API con fallback a copiar URL |
| **Formularios progresivos** | Inscripciones | Multi-paso con validacion por campo |
| **Toast notifications** | Formularios enviados | Notificacion temporal de exito/error |
| **Hover elevacion** | Cards | `transform: translateY(-4px)` + sombra en hover |
| **View Transitions** | Navegacion entre paginas | Astro View Transitions API |
| **Intersection Observer** | Stats counter, secciones | Animacion al entrar en viewport |

---

## 6. Recomendaciones de Mejora vs PROMPT Original

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
- Complementaria a testimonios, enfocada en corredores que crecieron en el club y ahora compiten en categorias superiores.

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

Este documento define la base UX para el sitio web del Club Deportivo Trocha y Ruta. Los puntos clave son:

1. **12 paginas principales** organizadas en una jerarquia clara con navegacion dividida en primaria (7 items) y secundaria (footer).
2. **4 personas** que cubren el espectro completo de usuarios: padres, corredores, patrocinadores y visitantes casuales.
3. **3 flujos criticos** disenados paso a paso: inscripcion, calendario y patrocinio.
4. **Wireframes detallados** para homepage, equipo y formulario de inscripcion.
5. **Principios mobile-first** para la audiencia colombiana con acceso predominante desde celulares Android.
6. **12 recomendaciones de mejora** priorizadas por impacto, destacando WhatsApp como canal, FAQ, y media kit para patrocinadores.

Este documento sirve como guia para los agentes de diseno visual y desarrollo frontend del equipo.
