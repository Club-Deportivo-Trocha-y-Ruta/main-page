---
name: a11y-deudas-preexistentes
description: Deudas de accesibilidad ya auditadas y conscientemente no corregidas (islands, foco, reduce) — no volver a "descubrirlas" como nuevas
metadata:
  type: project
---

Auditadas y documentadas el 2026-08-22 en el gate 14 de `docs/06-plan-animaciones.md`.
Son **anteriores** al plan de animaciones y siguen abiertas. Ninguna se corrigió en ese
gate porque el encargo era auditar, no tocar código.

- `InscriptionForm` no anuncia el envío exitoso (sin `role="status"`, sin mover el foco);
  `ContactForm` sí lo tiene pero inserta la región ya poblada, que VoiceOver no anuncia
  de forma fiable.
- El cajón de `MobileMenu` vive siempre en el DOM tras hidratar (portal a `<body>`, así
  que el `lg:hidden` del Header no lo alcanza), con `role="dialog" aria-modal="true"`
  permanente y sus enlaces en el orden de tabulación aunque esté cerrado.
- `ImageLightbox` no anuncia el cambio de foto al navegar con flechas.
- `global.css` no tiene catch-all de `prefers-reduced-motion: reduce`: ~24
  `transition-transform` preexistentes (los `group-hover:scale-105` de las tarjetas)
  siguen animando con la preferencia activa.
- Anillo de foco `focus-visible:outline-primary` = 2.42:1 sobre blanco (WCAG 1.4.11 pide
  3:1). `--color-primary-deep` da 5.88:1 sobre blanco pero solo ~2.3:1 sobre la foto
  oscura del Hero, así que la corrección necesita dos tokens, no uno.
- Ni `InscriptionForm.react.test.tsx` ni `ContactForm.react.test.tsx` afirman nada sobre
  el foco (`toHaveFocus` no aparece): el `setFocus()` tras validación fallida está sin
  cubrir.

**Why:** el equipo audita por fases y acumula hallazgos en las "Notas acumuladas para el
gate 14" del plan en vez de corregir sobre la marcha, para no mezclar arreglos con la
feature que se está midiendo.

**How to apply:** al reportar, distingue siempre lo preexistente de lo introducido por el
cambio en curso — es la distinción que este equipo pide explícitamente. Antes de citar
cualquiera de estos puntos, verifica que siga vigente: son de agosto de 2026 y algunos ya
tienen arreglo propuesto. Receta de verificación en [[a11y-tooling]].
