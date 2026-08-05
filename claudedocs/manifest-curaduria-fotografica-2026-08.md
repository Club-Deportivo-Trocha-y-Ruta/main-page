# Manifest de curaduría fotográfica — T2.0 (Fase 2, agosto 2026)

Selección optimizada en `src/assets/images/refresh/`. Todas WebP, recorte 4:3 (programas) o 3:2 (historia/comunidad).
Astro las reprocesa en build, así que el peso entregado al navegador es menor al de origen.

| Archivo | Origen | Destino en el sitio | Dimensiones | Peso |
|---------|--------|--------------------|-------------|------|
| `programa-iniciacion.webp` | `trocha-verde/dia-tierra-2026/jornada/02` | `/programas` (Escuela de Iniciación) | 900×675 | 36 KB |
| `programa-formacion.webp` | `news/copa-valle-cali-2026/accion-pista-cali-03` | `/programas` (Formación Juvenil) | 900×675 | 87 KB |
| `programa-rendimiento.webp` | `news/copa-valle-cali-2026/accion-pista-cali-05` | `/programas` (Alto Rendimiento) | 900×675 | 88 KB |
| `historia-pista.webp` | `src/assets/images/pista-xco-carlos-castro.jpg` | `/quienes-somos` (hito pista) | 1200×800 | 158 KB |
| `historia-siembra.webp` | `trocha-verde/dia-tierra-2026/jornada/09` | `/quienes-somos` (hito Trocha Verde) | 1200×800 | 100 KB |
| `historia-equipo-ginebra.webp` | `news/departamental-ginebra-2026/grupal-dia-1` | `/quienes-somos` (hito competencia) | 1200×800 | 149 KB |
| `historia-equipo-palmira.webp` | `news/copa-valle-palmira-2026/equipo-grupal-dia-2` | `/quienes-somos` (banda comunidad) | 1200×800 | 162 KB |
| `comunidad-lluvia.webp` | `news/copa-valle-pavas-2026/accion-pista-pavas-05` | `/quienes-somos` (banda comunidad) | 1200×800 | 117 KB |
| `comunidad-circuito.webp` | `news/copa-valle-cali-2026/accion-pista-cali-01` | `/quienes-somos` (banda comunidad) | 1200×800 | 174 KB |

## Batch técnico

- 114 JPG de `public/images/` convertidos a WebP (máx. 1600 px, q76) y originales eliminados.
- 125 WebP existentes recomprimidos (máx. 1280 px, q70).
- Excluidos a propósito: `public/images/hero-poster.jpg` (poster + OG por defecto) y
  `trocha-verde/dia-tierra-2026/afiche.jpg` (usado como `ogImage` en tres lugares).
- Referencias actualizadas automáticamente en `src/` y `public/admin/` (110 archivos): rutas `/images/**.jpg`
  y listas `galleryImages` con nombre suelto.
- **Peso de `public/images/`: 64 MB → 42 MB.** Meta del plan (<40 MB) casi alcanzada; bajar más exige
  recortar resolución de galería por debajo de 1280 px, lo que degrada el lightbox.

## Nota legal (pendiente T3.1)

Las fotos seleccionadas ya son públicas en artículos de noticias del sitio. Ninguna de las nuevas ubicaciones
asocia nombre propio a un menor identificable. `programa-iniciacion.webp` es un primer plano de una niña
pequeña: si `legal-compliance-officer` no encuentra autorización firmada, reemplazar por un plano general
de la misma jornada.
