# Plan Definitivo — Campaña de Publicidad Digital "Captación 8-15 años"
## Club Deportivo Trocha y Ruta · Agosto 2026 – Febrero 2027

**Versión**: 1.0 final (integra correcciones de los auditores de cumplimiento y viabilidad, que prevalecen sobre los insumos de especialistas) · **Fecha**: 2026-07-31 · **Owner**: cmo-marketing-director · **Aprobación requerida**: ceo-strategist + legal-compliance-officer

---

## 1. Resumen ejecutivo

**Objetivo**: captar deportistas activos de 8 a 15 años, niños y niñas, en Yumbo, Vijes, Guabinas y norte de Cali, con meta de **40% de niñas entre las nuevas inscripciones al cierre de Q1 2027**.

**Principio rector**: los menores no pagan ni deciden. Toda la pauta se dirige a madres, padres y acudientes adultos (25-54 años), con "Carolina" como persona principal. Los niños aparecen en los creativos solo con autorización de imagen firmada; nunca son el target publicitario.

**Concepto**: **"Pedalea tu propia ruta"** (#PedaleaTuPropiaRuta, #NiñasEnLaTrocha). Promesa a la familia: "Aquí tu hijo o hija no solo aprende a montar bici. Aprende a caerse, a levantarse y a llegar."

**Gancho de conversión**: clase de prueba gratuita mensual (open day grupal), agendada vía landing dedicada `/clase-de-prueba` o WhatsApp.

**Presupuesto recomendado**: arrancar en **Escenario A (COP $300.000/mes)** durante el primer mes de pauta como fase de aprendizaje y validación de tracking, y escalar a **Escenario B (COP $800.000/mes)** desde el mes 2 si el CPL se mantiene bajo umbral.

**Meta de captación**: **6 inscritos/mes en Q3 2026 → 10/mes en Q4 → 12/mes en Q1 2027 (~66 nuevos inscritos en la campaña)**, condicionada al techo de capacidad operativa que `head-of-operations` debe fijar antes del lanzamiento.

**Gate de lanzamiento**: la pauta paga **no arranca hasta que el checklist legal de 20 puntos esté en verde** (políticas de privacidad publicadas, formularios corregidos, auditoría de consentimientos de imagen cerrada). Fecha realista de encendido de Ads: **semana del 1 de septiembre de 2026**. El open day del 30 de agosto se promociona solo orgánicamente y con creativos sin menores identificables.

---

## 2. Marco legal y de plataformas

### 2.1 Targeting válido

| Plataforma | Permitido y recomendado | Prohibido / no disponible |
|---|---|---|
| Meta (FB/IG) | Adultos **25-54**, geo Yumbo + radio local, segmentación por **inclusión**: "Padres con preadolescentes (9-12)", "Padres con adolescentes (13-17)", intereses ciclismo/MTB/deporte infantil. Piso de edad 25 también en Advantage+. Campañas de Leads/Conversiones (no Advantage+ Shopping, que es para e-commerce) | Ad sets que incluyan 13-17 (quedan ciegos: solo edad+ubicación); **exclusiones** de segmentación detallada (Meta las eliminó en 2025); custom audiences desde números de WhatsApp, listas de asistentes a eventos o "suscriptores YouTube" |
| Google Ads | Keywords de intención parental, geo local, edad 25-54 + "Desconocido" | Remarketing sobre tráfico que pueda incluir menores; cualquier tramo sub-18 (no existe) |
| TikTok | 18+ obligatorio en Colombia para servicios infantiles (la plataforma lo fuerza) | Intentar incluir 13-17 |
| YouTube | Video a 25-54, contextual en canales de MTB/crianza | Remarketing desde videos Made for Kids |

**Made for Kids**: clasificar video por video. Contenido cuyo atractivo principal son niños → MFK obligatorio (sin personalización ni remarketing). Crónicas y testimonios dirigidos a padres → no MFK. La etiqueta no es una decisión estratégica: depende del test de audiencia FTC/COPPA.

**Audiencias custom lícitas**: únicamente (a) engagement audiences nativas de Meta (interacciones con página/perfil) y (b) leads propios adultos con **casilla específica de autorización para publicidad/matching** marcada, datos hasheados SHA-256. Ninguna otra fuente.

**Retargeting**: solo sobre usuarios con consentimiento marketing otorgado (Consent Mode), solo sobre `/clase-de-prueba` y `/programas` (páginas sin datos de menores), **nunca sobre `/inscripciones`**, con frecuencia limitada a 2-3 impresiones/semana.

**Target orgánico**: adolescentes 13-15 y padres/hermanos mayores 18+. El alcance a los 8-12 se logra vía sus padres y vía pares en el entorno físico (colegios, open days) — nunca diseñando contenido para cuentas sociales que un menor de 13 no debería tener.

### 2.2 Marco normativo colombiano (versión corregida v1.1)

- **Ley 1581/2012 + Decreto 1377/2013**: los datos de menores son de especial protección; solo el representante legal autoriza. Representación legal: **arts. 62 y 288 del Código Civil** (patria potestad conjunta). Sanciones (art. 23): multas hasta 2.000 SMMLV, suspensión de actividades hasta 6 meses, cierre temporal o definitivo del tratamiento de datos sensibles.
- **Publicidad a menores**: **art. 28 Ley 1480/2011 + Decreto 975/2014** (vigilancia SIC) — información clara, veraz, verificable; prohibido aprovechar credulidad o sugerir rechazo social.
- **Ley 1098/2006 (arts. 33 y 47)**: protección de imagen, honra e intimidad del menor.
- **RNBD**: obligatorio **solo si los activos totales del club superan 100.000 UVT (Decreto 090/2018)**. Validar con contador; un club ESAL pequeño casi con certeza está exento. No bloquea el lanzamiento.

### 2.3 Checklist de consentimientos (gate duro pre-pauta)

1. Publicar `/politica-de-privacidad` y `/politica-de-cookies`, enlazadas desde footer, formularios y banner de cookies.
2. `InscriptionForm.tsx`: **mover el aviso de privacidad y la casilla obligatoria de autorización de tratamiento al paso 1** (precondición para continuar), más casilla de confirmación de representación legal, más casilla opcional (no premarcada) de comunicaciones, más casilla opcional separada de autorización de publicidad/matching.
3. Plantilla de "Autorización de Uso de Imagen de Menor" con: usos taxativos (web, redes, **pauta paga** explícita, impresos, media kit, y casilla separada opcional para **entrega a medios de comunicación**), vigencia máxima 2 años renovable, revocatoria (retiro en máx. 30 días hábiles), y **firma de ambos padres** o de uno con declaración juramentada de custodia exclusiva.
4. Auditoría de consentimientos de todos los riders y galerías actuales (incluidos los 64 JPGs de copa-valle-ginebra): sin consentimiento vigente, la imagen se baja o se anonimiza.
5. Índice interno de consentimientos por slug; ninguna pieza sale sin verificación contra el índice.
6. Consent Mode v2 verificado en `denied` por defecto (test con DebugView de GA4).
7. Lead forms y WhatsApp: **nunca pedir el nombre del menor en el primer contacto** — solo nombre del acudiente, teléfono, edad del niño y programa. El nombre del menor se captura únicamente en `/inscripciones`. Plantillas de WhatsApp con línea de aviso corto + link a `/politica-de-privacidad`.
8. Datos de leads sin conversión se eliminan a los 12 meses. Prohibido compartir datos de inscritos con patrocinadores (reportes solo agregados).

**Regla de imagen sin excepción**: si un menor es identificable, requiere consentimiento aunque el plano sea grupal. El fallback válido es "ningún menor identificable" (espaldas, distancia, detalle de bici/casco sin rostro). **No se transmite en vivo desde open days** (asisten niños nuevos sin autorización); se publica en diferido tras verificación. El check-in presencial de cada open day incluye la firma de la autorización de imagen.

---

## 3. Concepto creativo y mensajes

**Campaña**: "Pedalea tu propia ruta". Territorio: la trocha como metáfora del carácter. Tono cercano vallecaucano, se celebra el proceso, no el triunfalismo.

**Mensaje a Carolina (decisora)**: "Aquí tu hijo o hija no solo aprende a montar bici. Aprende a caerse, a levantarse y a llegar." Claims de apoyo: seguridad + método (staff certificado, protocolos, seguro deportivo — ver nota de veracidad abajo), menos pantallas ("Dos horas al aire libre valen más que dos horas de TikTok"), formación integral. Todo copy en segunda persona **hacia el adulto** ("Inscribe a tu hija"), nunca hacia el menor.

**Reglas de veracidad (Ley 1480)**:
- Prohibido "Único club de XCO infantil en Yumbo" (Saurios tiene sede en Yumbo). Usar el diferencial verificable: **"Especialistas en XCO. Competimos en Copa Valle."**
- "Seguro deportivo incluido" solo si realmente está dentro de la mensualidad; si se cobra aparte ($60.000/año según plantillas actuales), el copy es "Seguro deportivo: $60.000/año". Decisión de `head-of-operations` antes de aprobar creativos.
- El claim de antigüedad ("+15 años") solo se usa si se sustenta con la fecha del reconocimiento deportivo en `/transparencia`; de lo contrario se retira.
- **Una sola edad mínima oficial** (decisión de operaciones), propagada a `constants.ts`, programas, GBP y creativos antes de publicar nada. Hoy conviven "desde 3", "desde 4" y "4-15": inconsistencia que degrada confianza y Quality Score.

### Estrategia para niñas (meta: 40% de nuevas inscritas al cierre Q1 2027)

- **No usar**: "también para niñas", estética rosada/infantilizada, "princesas de la trocha", copy que revictimice.
- **Sí usar**: "Aquí se pedalea. Punto." / "Las mujeres de Trocha y Ruta rompen la montaña." / testimonial de madre: "Mi hija bajó su primera trocha y no se cayó. Yo sí, de emoción."
- **Referentes visibles**: 3 mini-perfiles en video (60-90s) de corredoras actuales de 10-15 años — **producidos solo a partir de la semana 3+, condicionados al cierre de la auditoría de consentimientos** y con doble verificación (mayor riesgo de seguridad). Menores de 14 nunca hablan en cámara sin el acudiente presente; guion aprobado por acudiente y Compliance. Modelo preferido: la mamá habla en cámara, la niña aparece en imagen deportiva secundaria.
- **Madrina/referente adulta**: clínica gratuita con una ciclista de la Liga del Valle en octubre (owner: `head-of-operations`).
- **Ratio de contenido**: mínimo 35% de piezas protagonizadas por niñas (con consentimiento), escalando a 45% en Fase 3. Al menos 1 niña visible en primer plano en cada pieza pagada, cuando exista consentimiento; si no, planos no identificables.
- **Open day temático de octubre** "Ellas también rompen la trocha" (mixto, con énfasis comunicacional femenino) + landing variante `/ellas` en Fase 3.
- **Prensa local** ("Niñas rompen la trocha en Yumbo"): solo con la casilla específica de entrega a medios marcada en la autorización de imagen de cada menor que aparezca.
- **Prohibido en cualquier pieza**: uniformes o marcas de colegios, dirección, dorsal legible + nombre completo, información médica, y **rutas geolocalizadas o tracks GPS/Strava de salidas con menores** (permiten ubicar dónde y a qué hora hay niños). El carrusel "nuestro terreno" muestra paisajes sin pin ni patrón horario.

---

## 4. Audiencias y segmentación por plataforma

**Primaria — "Carolina"**: mujeres 30-45, Yumbo + Vijes + Guabinas + norte de Cali (comunas 2, 4, 5, 6). Intereses: crianza, deporte infantil, ciclismo recreativo, vida saludable, Nairo Quintana, Egan Bernal, Mariana Pajón. Activa en WhatsApp y Facebook; Android gama media.

**Secundaria — "Carlos"**: hombres 32-48, mismo geo, intereses MTB/ruta/Strava. Ángulo: "Enséñale lo que a ti te apasiona."

**Configuración**: piso de edad 25 en todos los ad sets (no "exclusión de menores de 25", que no existe como mecanismo). Sin exclusiones de segmentación detallada.

**Geografía en radios**: Core 0-5 km del Parque Belalcázar (frecuencia 3-4/semana); Cercano 5-15 km (Guabinas, Mulaló, Vijes, 2/semana); Ampliado norte de Cali hasta 25 km solo en fases de refuerzo y solo para clase de prueba. Excluir sur de Cali, Palmira, Jamundí (logística inviable para asistencia recurrente).

**Custom/lookalike**: solo engagers de IG/FB (dato de plataforma) y, más adelante, leads adultos propios con opt-in de publicidad marcado. Lookalike 1% sobre esa base cuando supere ~100 registros.

---

## 5. Mix de canales y tácticas

### Pagado

| Canal | Táctica | Presupuesto (Escenario B) |
|---|---|---|
| **Meta Ads** | Reels 9:16 (15-30s) y carruseles testimonio → `/clase-de-prueba`. Campañas de Leads/Conversiones. Boost solo de la **mejor pieza orgánica por semana**, con tope mensual fijo de $200-300k en boosts | 55% |
| **Google Ads Search** | **Solo el grupo A-1** (keywords exactas de máxima intención: `[escuela ciclismo niños yumbo]`, `[club ciclismo niños yumbo]`, "ciclismo niños yumbo"…) a $5.000-7.000/día. **Sin Campaña B regional ni PMax hasta Q4**: el volumen local (<50-300 búsquedas/mes por keyword) no absorbe más. Extensiones: sitelinks, callouts veraces, llamada en horario real, location extension vinculada a GBP. Lista de negative keywords consolidada (ruta, BMX, compra de bicis, ciudades lejanas, e-sports) | 25% |
| Producción creativa | 4 reels/mes + fotos post-Copa Valle | 10% |
| Reserva test "foco niñas" | Creativos separados para el segmento madres con hijas | 10% |

### Orgánico (cadencia sostenible para voluntarios: ~5-6 piezas originales/semana)

- **2 reels/semana producidos una vez y cross-posteados a IG + FB + TikTok + YouTube Shorts** (1 producción → 4 canales).
- Stories 3/semana (no 3/día). GBP: 1 post/semana + post de oferta "clase de prueba gratuita" renovado mensualmente. Grupos de Facebook: 1 aporte de valor/semana en 2 grupos rotativos ("Mamás Yumbo", "Comunidad Guabinas"…), regla 3 aportes de valor por 1 mención al club, jamás copy-paste múltiple.
- TikTok unificado como **@clubtrochayruta** (coincide con YouTube); verificar el handle real de Instagram con el club antes de imprimir nada (`constants.ts` dice `club_trochayruta`).
- Ideas de contenido priorizadas: "Un día en Trocha y Ruta", "De la sala a la trocha", "Padres opinan sin filtro", "Nuestros entrenadores", "El botiquín viaja con nosotros", serie "Niñas al frente" (desde semana 3+ con consentimientos), "Detrás del podio", "El graduado".

### WhatsApp (+57 314 850 5372, WhatsApp Business)

- **Listas de difusión filtradas por opt-in de comunicaciones = sí** (nunca grupos, que exponen los números de todos entre sí). Sin opt-in: solo respuestas 1:1 a conversaciones iniciadas por el usuario.
- **SLA realista: primera respuesta < 24h hábiles**, con mensaje de ausencia automático que entrega info básica + link a `/clase-de-prueba` (los voluntarios entrenan justo en el pico de 4-6 PM). Etiquetado **manual** en la app (LEAD_NUEVO → INTERESADO → CLASE_AGENDADA → INSCRITO → FRÍO).
- Links `wa.me` con texto prellenado por origen que incluye token de campaña `[code:CAP26H2-META-01]` para atribución manual.
- Plantillas T1-T6 del plan de redes, **corregidas**: T2 no pide el nombre completo del menor (solo edad); todas añaden línea de aviso de privacidad; el copy de seguro refleja el costo real.

### Alianzas offline → online (casi costo cero)

- **Colegios: 3 en 2026 (no 6), máximo 1 taller/mes**. Oferta: taller gratuito de 90 min "seguridad en bici + pista cerrada" a cambio de circular a padres con QR → `/clase-de-prueba`.
- Tiendas de bicis Yumbo/Cali norte: sticker con QR + código de referido (una sola oferta vigente, ver §7).
- Secretaría de Deporte de Yumbo, JAC y clubes de otras disciplinas: intercambio de flyer digital y presencia en eventos comunitarios.
- **Eventos presenciales consolidados: 1 open day/mes, que ES la clase de prueba grupal** (no clase quincenal + open days paralelos: los mismos entrenadores no alcanzan).

### GBP / SEO local

- NAP idéntico a `constants.ts`: Club Deportivo Trocha y Ruta · CL 8 Norte 2 N° 55, Yumbo · +57 314 850 5372 · **https://clubdeportivotrochayruta.org**.
- Categorías: Club deportivo (principal) + Escuela de deportes, Club de ciclismo. Descripción con keywords locales, **con la edad mínima oficial única** y sin claims no verificables. Q&A sembrado con las 7 preguntas frecuentes (precio del seguro declarado honestamente).
- Reseñas: link corto distribuido por WhatsApp a familias actuales (nunca a cambio de descuentos); responder todas <24h; meta inicial 15 reseñas 4.8+.
- **KPI contractual: Top 3 para "ciclismo yumbo" al cierre de Q1 2027.** Top 1 es aspiracional, no reportable.
- Fotos de menores en GBP solo con consentimiento verificado; mientras tanto, pista, paisaje, staff y planos no identificables.
- Schema: agregar `SportsActivityLocation` + `LocalBusiness` en homepage con geo 3.5965919, -76.4855763 (y corregir la coordenada errónea 3.4572 en `generateSportsClubJsonLd()` en `src/lib/seo.ts`); los horarios del schema deben coincidir con los horarios reales de los programas. FAQPage en las páginas de programa. Event schema para cada open day (offers price 0).

---

## 6. Funnel y cambios requeridos en el sitio

**Canon único de URLs** (elimina `/openday`, `/inscripciones-2026` y `/gracias` de versiones anteriores):

- **`/clase-de-prueba`** — landing de campaña sin nav completa: H1 "Primera clase de ciclomontañismo gratis en Yumbo", micro-formulario de **4 campos (nombre del acudiente, WhatsApp, edad del niño, programa de interés — sin nombre del menor)** con aviso de privacidad y casillas, botón WhatsApp alternativo, testimonios, FAQ, JSON-LD Event.
- **`/clase-de-prueba/gracias`** — conversión de campaña medible.
- **`/inscripciones/gracias`** — conversión de inscripción completa, con recordatorio del derecho a revocar autorización.
- **`/ellas`** — variante femenina de la landing, Fase 3.
- **`/politica-de-privacidad`** y **`/politica-de-cookies`** — bloqueantes.

**Backlog técnico priorizado** (`cto-architect` + `astro-dev`):

| P | Tarea |
|---|---|
| P0 | Políticas de privacidad/cookies + casillas en `InscriptionForm.tsx` (autorización en paso 1) y `ContactForm.tsx` |
| P0 | `/clase-de-prueba` + `/clase-de-prueba/gracias` + `/inscripciones/gracias` |
| P0 | Botón flotante WhatsApp global con `?text=` dinámico, **instrumentando `trackEvent('whatsapp_click')`** — el evento ya existe en `src/lib/events.ts`; lo que falta es llamarlo desde los CTAs |
| P0 | **Meta Pixel de navegador** (respetando Consent Mode). **CAPI no es viable en el stack estático FTP/Hostinger**: se descarta en Fases 1-2; si luego se justifica, gateway externo (~USD 20/mes) como decisión presupuestal explícita, o subida manual de conversiones offline |
| P0 | Verificación Consent Mode v2 = `denied` por defecto |
| P1 | UTM capture como hidden fields en formularios (para atribución en Web3Forms); custom dimensions en GA4 (los utm_* ya llegan solos en `page_view`) |
| P1 | CTA "Inscríbete" al nav principal (`src/lib/constants.ts`); precio visible "Desde $X/mes" una vez confirmado; imágenes reales en `/programas`; campo `imageConsent`/`imageConsentExpiry` en schemas `riders` y `gallery` con default `false` |
| P2 | Poblar colección `results` (los resultados de Copa Valle son contenido fresco indexable y viral entre pares) |

**Eliminado del plan**: el "lead recovery" server-side a los 60 minutos (técnicamente imposible en sitio estático e ilícito: transmitiría datos capturados antes de la autorización). Alternativa lícita: banner "continúa tu inscripción" al re-visitar (localStorage 48h ya existente) + evento GA4 `form_abandon` sin PII.

**Web3Forms**: un solo micro-formulario de campaña (no dos), honeypot activo, monitoreo del consumo mensual y plan pago (~USD 8/mes) presupuestado como contingencia desde Fase 3 (el límite gratis de 250/mes se acerca en Escenario B).

**Flujo del lead**: Ad → `/clase-de-prueba` → formulario 4 campos o WhatsApp → `/clase-de-prueba/gracias` (conversión) → confirmación WhatsApp T-24h → open day mensual (acudiente presente, firma de autorizaciones en check-in) → follow-up esa noche con link a `/inscripciones` → inscripción → bienvenida.

---

## 7. Presupuesto: 3 escenarios en COP

Supuestos a validar en semana 1 (prerrequisito bloqueante, no nota al pie): **mensualidad real confirmada por `head-of-operations`/`ceo-strategist`** (hoy asumida en $180.000; si es $80-100k, los umbrales de CPA se recortan a la mitad y el Escenario C pierde sentido) y **techo de capacidad operativa mensual** (cupos, entrenadores, cascos de préstamo).

| | A — Semilla | B — Sostenido (recomendado desde mes 2) | C — Escalado (solo si operaciones lo absorbe) |
|---|---|---|---|
| Gasto/mes | $300.000 | $800.000 | $2.000.000 |
| Meta Ads | $210.000 (70%) | $440.000 (55%) | $900.000 (45%) |
| Google Search (solo grupo A-1) | $60.000 (20%) | $200.000 (25%) | $500.000 (25%) |
| PMax / YouTube | — | $80.000 (10%, solo desde Q4) | $460.000 (23%) |
| Producción / contenido | $30.000 | $80.000 | $140.000 |
| Leads/mes esperados | 20-35 | 60-90 | 150-220 |
| Inscritos/mes esperados | 3-5 | 9-13 | 22-35 |
| CPA esperado | $60-100k | $65-90k | $75-110k |
| Break-even (inscritos) | 2 | 5 | 12 |

**Advertencias**: en Escenario A la muestra no permite A/B tests con significancia — las decisiones tempranas son directrices, no conclusiones. El Escenario C satura la audiencia local de Yumbo hacia el mes 3-4 y convierte a operaciones (no a marketing) en el cuello de botella.

**Regla de ofertas**: **una sola oferta por fase, no acumulable**, con costo máximo de adquisición en descuentos = 1 mensualidad. Quedan descartados los descuentos apilados (clase gratis + 20% primer mes + 20% referidos + "sin matrícula" + código de tiendas simultáneos, que erosionaban hasta 50% del primer mes).

---

## 8. Calendario de ejecución

**Fase 0 — Cumplimiento y cimientos (Ago 1 – Ago 31)**. Sin pauta paga. Semanas 1-2: `legal-compliance-officer` entrega plantilla de autorización (5 días hábiles) y se cierra la auditoría de consentimientos; `astro-dev` implementa el backlog P0; confirmación de precio y capacidad; verificación del **calendario real de válidas Copa Valle restantes 2026** con la Comisión Vallecaucana (la temporada arrancó a inicios de año en Sevilla — si no quedan válidas, la Fase 2 se sustituye por eventos propios: retos internos, festival de pista). Contenido orgánico **solo sin menores identificables** (staff, pista, paisaje, adultos) o con consentimientos ya firmados. Semanas 3-4: producción del banco visual con consentimientos nuevos; open day 30 de agosto promovido orgánicamente; check-in con firma de autorizaciones. **Metas Fase 0-1: 25-40 leads, 4-6 inscritos** (coherente con Escenario A y ciclo de venta de 2-3 semanas).

**Fase 1 — Encendido de pauta (Sep 1 – Oct 15)**. Checklist legal en verde → Meta Ads Escenario A ($300k) 4 semanas de aprendizaje; Google Ads grupo A-1. Serie "Niñas al frente" y mini-perfiles arrancan con consentimientos archivados. Alianza con los 2 primeros colegios. Salto a Escenario B en octubre si CPL ≤ $15.000.

**Fase 2 — Cosecha competitiva (Oct 15 – Oct 31, condicionada al calendario verificado)**. Paquete de contenido 48h por válida o evento propio; clínica con madrina/referente; open day "Ellas también rompen la trocha" + landing `/ellas`. Meta: 10 inscritos/mes.

**Fase 3 — Matrículas 2027 (Nov 1 – Dic 15)**. La ventana de decisión anual. Oferta única de fase definida por `ceo-strategist`. Retargeting **solo** sobre `/clase-de-prueba` y `/programas` con consentimiento marketing, cap 2-3/semana. Keywords de "matrículas/inscripciones 2027". Email de bienvenida solo a leads con opt-in. Tercer colegio. Open day masivo primer sábado de noviembre. Meta: 10-12 inscritos/mes.

**Fase 4 — Pausa activa (Dic 16 – Ene 15)**. Ads al 10% solo en Search local; recap del año; limpieza de base (leads >12 meses sin conversión se eliminan).

**Fase 5 — Vuelta al cole (Ene 16 – Feb 28)**. Open day de febrero; reactivación de colegios en año escolar nuevo; consolidar 40% femenino; post-mortem completo con `data-analyst` cerrando febrero. Meta: 12 inscritos/mes.

---

## 9. Medición

**Convención UTM** (dominio correcto: `clubdeportivotrochayruta.org`; ventana Q3 2026 – Q1 2027):
`utm_campaign = cap-2026h2-{mes}-{objetivo}` (ej. `cap-2026h2-sep-arranque`, `cap-2026h2-oct-ninas`, `cap-2026h2-nov-matriculas`) — **el prefijo se mantiene igual en enero-febrero 2027** para no partir la atribución. `utm_content = {formato}-{gancho}-v{n}`. Governance: toda pieza pagada nace de una fila en el Sheets `utm-builder`; sin fila, no se publica.

**Eventos GA4** (extender `src/lib/analytics.ts` respetando el catálogo cerrado de `src/lib/events.ts`):
- Existentes a aprovechar: `inscription_step_view`, `inscription_complete`, `contact_submit` y **`whatsapp_click` (ya está en `EVENT_NAMES`; la tarea es instrumentar los CTAs y el botón flotante, no crear el evento)**.
- Nuevos: `campaign_landing_view`, `cta_click`, `phone_click`, `form_open`, `form_field_error`, `form_abandon` (sin PII), `open_day_signup` (submit de `/clase-de-prueba`).
- **Prohibido**: parámetros `gender` y `age_bracket` del menor en GA4 (dato sensible; violaría minimización y las políticas de Google). El **% de niñas se mide en el CRM interno (Sheets)**, no en analytics. Para edad, reutilizar el `ageBucket()` existente ('7-10'|'11-13'|'14+') solo donde sea imprescindible y agregado.
- Conversiones: primaria `inscription_complete`; secundarias `open_day_signup`, pageview `/clase-de-prueba/gracias`, `whatsapp_click`, `phone_click`, `contact_submit`.
- Conversiones offline: el open day se registra en el Sheets/CRM (fila = asistente); para Google Ads, **subida manual de conversiones offline con gclid** (campo oculto en el formulario) en la interfaz — no Measurement Protocol (no hay backend). Cualquier dato hasheado hacia plataformas requiere aval previo de Legal y opt-in.

**KPIs y umbrales (escala única)**:

| KPI | Aprendizaje (mes 1 de pauta) | Régimen | Rojo (pausar) |
|---|---|---|---|
| CPL | ≤ $15.000 | ≤ $12.000 | > $25.000 |
| CPC Meta | ≤ $700 | ≤ $700 | > $1.200 |
| CPC Google | ≤ $1.600 | ≤ $1.600 | > $2.500 |
| CPA | — | ≤ $120.000* | > $250.000 |
| Inscritos/mes | 4-6 | 6 → 10 → 12 | — |
| % niñas (nuevas, desde CRM) | ≥ 25% | ≥ 35% | < 25% → activar creativo femenino reservado |
| Open day → inscrito | ≥ 30% | ≥ 33% | — |
| GBP "ciclismo yumbo" | — | Top 3 (Q1 2027) | — |

*Recalcular tras confirmar la mensualidad real.

**Dashboard semanal**: Looker Studio sobre **GA4 (conector gratis) + Sheets alimentado con export manual semanal de CSV de Meta/Google Ads** (30 min/semana del `data-analyst`) — no hay presupuesto para conectores de pago tipo Supermetrics. Bloques: adquisición, landing/formulario (funnel con drop-off por paso), leads y calidad (CPL por campaña, SLA de contacto), cierre (inscritos por origen, % niñas desde CRM), alertas.

**Reglas de decisión** (por ad set, tras ≥100 clics o 7 días): CTR <0.8% → reemplazar creativo; CTR >2.5% y CPL en meta → escalar +20%/semana máximo; CPL > rojo → pausar y root-cause; landing→form_open <15% → problema de landing, no de ad; un paso del formulario pierde >40% → auditar con `form_field_error`; CPA >$250k por 2 semanas → pausa total y revisión con `ceo-strategist`. Mínimo 2 creativos activos por conjunto; cada creativo corre ≥3 días o 1.000 impresiones; rotación cada 14 días o frecuencia >3.5.

**Cadencia**: reunión semanal lunes 8:00 (data-analyst, CMO, community-manager); mensual con ceo-strategist (CPA vs. LTV); trimestral con foco en el segmento "niñas 8-15" para el media kit de sponsors.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Publicar imagen de menor sin autorización → SIC/ICBF (multas hasta 2.000 SMMLV, daño reputacional irreversible en mercado local) | Gate duro de consentimientos: índice verificado antes de cada pieza; fallback = planos no identificables; sin transmisiones en vivo; firma en check-in de open days |
| Tratamiento de datos sin autorización (formularios, leads, matching) | Autorización en el paso 1 del formulario; lead forms sin nombre del menor; sin lead recovery server-side; matching solo con opt-in específico y hash |
| Bloqueo de cuenta publicitaria (Meta/Google) por segmentación o creativos que violen protección infantil | Pauta 100% a 25-54; clasificación MFK video por video; revisión de Compliance antes de cargar creativos |
| Publicidad engañosa (Ley 1480) | Sin "único", sin "incluido" falso, edades y antigüedad unificadas y sustentadas |
| Metas de marketing superan la capacidad operativa del club | Techo de absorción mensual fijado por `head-of-operations` **antes** de fijar metas; escalado de presupuesto condicionado a ese techo |
| Fase 2 apoyada en válidas Copa Valle que ya pasaron | Verificación del calendario real en Fase 0; plan B de eventos propios |
| Sobrecarga de voluntarios (burnout del equipo digital) | Cadencia sostenible 5-6 piezas/semana cross-posteadas; SLA WhatsApp <24h con auto-respuesta; 1 evento presencial/mes |
| Saturación de audiencia local (mercado finito de Yumbo) | Rotación creativa quincenal; expansión a norte de Cali solo en fases de refuerzo; monitoreo de frecuencia >3.5 |
| Límite gratis de Web3Forms (250/mes) | Formulario único de campaña, honeypot, monitoreo mensual, plan pago (~USD 8/mes) presupuestado desde Fase 3 |
| Modelo económico colgado de precio asumido | Confirmación de mensualidad como prerrequisito de semana 1; recálculo de CPA/LTV antes del primer peso gastado |
| Desbalance de género en captación (deriva 80/20) | Ratio ≥35% de piezas con protagonistas niñas, presupuesto reservado para creativo femenino, open day temático, regla de activación si % niñas <25% en leads |

---

**Regla final de gobernanza**: donde este plan y cualquier insumo previo difieran, prevalece este documento. Cualquier duda interpretativa sobre datos o imagen de menores se consulta por escrito a `legal-compliance-officer` antes de ejecutar; ante riesgo alto no cubierto, consulta a abogado externo especializado en protección de datos.
