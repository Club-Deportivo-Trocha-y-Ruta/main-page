---
name: fotocronica-formato
description: Reglas del formato "fotocrónica" (Photo Epic) que pidió el club para crónicas con muchas fotos y poco texto — dónde van resultados, CTA y ficha, y el tope de palabras
metadata:
  type: feedback
---

Cuando el club pide **fotocrónica** (estrenada con el downhill de Cali Bike Park, 2026-09-20):
el texto vive en los pies de foto; fuera de ellos, **~250 palabras máximo**; resultados
(tabla + stat-strip) en el **primer 15 %** de la página; el `.mid-cta` entre el **35 y el
60 %** del scroll; la `.visit-card` plegada en `<details>` al final.

**Why:** la curva de lectura de GA4 (solo 7 de 30 lectores llegan al final) — lo que
importa tiene que estar donde todavía hay audiencia, y el club quiere que la nota se
lea desde la foto, no desde el párrafo.

**How to apply:**
- Estimar el % de scroll en móvil: `.figure-grid` usa `minmax(180px, 1fr)`, así que a
  390 px apila en **una columna** (cada grid de dos fotos verticales suma ~900 px); los
  carruseles son una sola fila. En la crónica de Cali el CTA quedó al ~68 % después de
  la rejilla de roca y se movió tras el carrusel POV de la pista (~50 % móvil, ~55 %
  escritorio).
- El `excerpt` se pinta como bajada bajo el H1 (`noticias/[...slug].astro`): el primer
  párrafo del cuerpo **no puede repetirlo** casi textual. Escribir el intro con datos
  que la bajada no tiene.
- Pies de foto uniformes por sección ("Nombre · puesto · tiempo"); si el club decidió
  no destacar una categoría en el titular, no meterla solo en algunos pies.
- Cada alt describe lo visible: no afirmar "rampa", "carpas", "cerro de roca" si la foto
  no lo muestra; y una bici prestada no es "su bicicleta".
- Citas con «» (precedente: crónica del Chequeo); el `.pull-quote` no añade comillas
  por CSS.
