---
name: ornamento-vs-costuras
description: El usuario revisa el sitio con capturas y rechaza el ornamento decorativo que cruza secciones, pero exige uniones sin costura al píxel entre bloques de color.
metadata:
  type: feedback
---

Dos criterios que el usuario aplicó el 2026-08-26 revisando el sitio en pantalla, y que
conviene dar por sentados en cualquier propuesta visual futura:

1. **El ornamento que cruza secciones no pasa.** El «hilo de ruta» de la portada (línea
   punteada vertical con hitos, scroll-driven, `lg+`) se descartó a la primera captura:
   «se ve muy feo». Lo que molestó fue que atravesaba todas las secciones y seguía
   pintado sobre el bloque teal del cierre, es decir, decoraba el margen sin aportar
   orientación.
2. **Las uniones entre bloques de color se miran al píxel.** En el borde superior del pie
   detectó, en la captura, tanto una línea clara de menos de 1px como un escalón de tono
   de 6 niveles de gris entre el SVG y la banda.

**Why:** el usuario evalúa el resultado renderizado, no la descripción del efecto; la
decoración tiene que justificar su ruido y los empalmes tienen que ser invisibles. Un
degradado «casi igual» o un relleno que no llega al borde del viewBox se ve.

**How to apply:** para efectos decorativos nuevos, proponerlos acotados (una sección, no
la página entera) y llevar captura antes de darlos por buenos — ver
[[headless-chrome-css-verification]] para producirla. Para cualquier silueta/ola que una
dos superficies: el relleno sale del **mismo token** que el fondo vecino (`currentColor`
heredado, nunca un color parecido), el trazo se cierra por fuera del viewBox para que el
recorte del SVG haga de borde, y la pieza solapa 1px con lo que sigue.
