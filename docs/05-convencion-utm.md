# Convención UTM

## Por qué

En el trimestre 20 may – 20 ago 2026, el **50% de las sesiones entraron como «Direct»**
(82 de 163). No es tráfico que teclea el dominio: es WhatsApp. Los enlaces pegados en
un chat llegan sin `referer`, así que GA4 no puede atribuirlos y todo cae en el mismo
cajón junto al tráfico del propio equipo.

Consecuencia práctica: hoy no se puede responder «¿la crónica de Ginebra corrió por
WhatsApp o por Instagram?», que es exactamente la pregunta que decide dónde publicar
la siguiente.

Un enlace etiquetado lo resuelve. Uno sin etiquetar es un dato perdido para siempre —
no se puede reconstruir después.

## Las cuatro piezas

| Parámetro | Obligatorio | Qué responde |
|---|---|---|
| `utm_source` | Sí | Dónde estaba el enlace |
| `utm_medium` | Sí | Cómo agrupa GA4 el canal |
| `utm_campaign` | Sí | Qué acción lo generó |
| `utm_content` | No | Cuál de dos enlaces de la misma acción |

### `utm_medium`: no lo improvises

GA4 clasifica la sesión en **«Organic Social»** solo si el medium es uno de sus valores
reconocidos: `social`, `social-network`, `social-media`, `sm`. Con `referral`,
`whatsapp` o cualquier invento, la sesión cae en «Referral» o «Unassigned» y el informe
de canales deja de cuadrar.

- Redes y mensajería → **`social`**
- Correo a familias → **`email`**
- Código QR impreso (volantes, pendón) → **`qr`**

### `utm_source`: minúsculas, sin tildes

`whatsapp` · `instagram` · `facebook` · `youtube` · `tiktok` · `boletin` · `volante`

### `utm_campaign`: minúsculas y guiones

Nombra **la acción**, no la fecha suelta. Ejemplos: `cronica-roldanillo`,
`openday-2026-09`, `temporada-2026`, `captacion-yumbo`.

## Plantilla

```
https://clubdeportivotrochayruta.org/RUTA?utm_source=FUENTE&utm_medium=social&utm_campaign=CAMPAÑA
```

## Recetas listas para copiar

**Crónica en el grupo de WhatsApp de familias**
```
https://clubdeportivotrochayruta.org/noticias/2026-09-copa-valle-roldanillo/?utm_source=whatsapp&utm_medium=social&utm_campaign=cronica-roldanillo
```

**Bio de Instagram** (fija, no cambia entre publicaciones)
```
https://clubdeportivotrochayruta.org/enlaces/?utm_source=instagram&utm_medium=social&utm_campaign=bio
```

**Story de Instagram hacia el Open Day**
```
https://clubdeportivotrochayruta.org/openday/?utm_source=instagram&utm_medium=social&utm_campaign=openday-2026-09&utm_content=story
```

**Publicación en Facebook**
```
https://clubdeportivotrochayruta.org/programas/?utm_source=facebook&utm_medium=social&utm_campaign=captacion-yumbo
```

**QR en volante impreso**
```
https://clubdeportivotrochayruta.org/inscripciones/?utm_source=volante&utm_medium=qr&utm_campaign=captacion-yumbo
```

## Reglas

1. **Solo en enlaces que entran al sitio desde fuera.** Nunca en enlaces internos: GA4
   interpretaría cada clic interno como una sesión nueva y romperías la atribución.
2. **Nunca datos personales** en un UTM. Van en la URL, quedan en los informes y en el
   historial del navegador. Aplica la misma prohibición que el catálogo de eventos
   (`src/lib/events.ts`).
3. **Minúsculas siempre.** GA4 distingue mayúsculas: `WhatsApp` y `whatsapp` aparecen
   como dos fuentes distintas.
4. **Un nombre de campaña por acción**, reutilizado en todos los canales de esa acción.
   Así se comparan entre sí.

## Lo que ya va automático

Los botones «Compartir» del sitio (`src/components/common/ShareButtons.astro`) etiquetan
solos mediante `src/lib/utm.ts`, con `utm_campaign=compartir-desde-web`. Eso separa lo
que reenvía una familia por su cuenta de lo que publica el club — dos cosas que hasta
ahora eran el mismo número.

Para enlaces internos del código, `withUtm()` y `shareUrl()` viven en `src/lib/utm.ts`.

## Cómo se lee después

GA4 › Adquisición › Adquisición de tráfico, y cambiar la dimensión a
**«Fuente/medio de la sesión»** o **«Campaña de la sesión»**.

La señal de que esto funciona: que «Direct» baje del 50%. Si sigue en la mitad, es que
se están compartiendo enlaces sin etiquetar.
