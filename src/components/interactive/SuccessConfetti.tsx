import { useEffect, useState, type ComponentType } from 'react';

// ─── Disparador del confeti (docs/06-plan-animaciones.md, Fase 2 Tarea 6) ────
//
// Pieza compartida por `InscriptionForm` y `ContactForm`. Es deliberadamente
// mínima: lo único que vive en el chunk del island es esta compuerta (un
// `matchMedia` y un `import()`), nunca el confeti en sí. `ConfettiBurst` —las
// 28 partículas, sus estilos en línea y el temporizador— queda en un chunk
// aparte que solo se descarga al llegar a la pantalla de éxito.
//
// Criterio de aceptación de la tarea: costo cero en la carga inicial del
// island. Por eso el `import()` está dentro del efecto y no arriba.
//
// `prefers-reduced-motion: reduce` → no hay celebración de ningún tipo: la
// consulta ocurre ANTES del `import()`, así que ni siquiera se descarga el
// chunk. Sin `matchMedia` (entornos sin soporte, jsdom) se asume la opción
// conservadora: no animar.
//
// Montaje = disparo. El efecto tiene deps `[]`, así que corre una sola vez por
// entrada a la pantalla de éxito; los re-renders del formulario no vuelven a
// dispararlo porque el componente sigue montado en la misma posición del árbol.
// Cuando el usuario sale del éxito (p. ej. "Enviar otro mensaje") esto se
// desmonta, y un envío posterior es un montaje nuevo — celebración nueva, que
// es justo lo que se quiere.

export default function SuccessConfetti() {
  const [Burst, setBurst] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let active = true;
    void import('./ConfettiBurst')
      .then((mod) => {
        if (active) setBurst(() => mod.default);
      })
      .catch(() => {
        // El confeti es decorativo: si el chunk no carga (offline, bloqueado),
        // la pantalla de éxito se muestra igual y no se reporta nada.
      });

    return () => {
      active = false;
    };
  }, []);

  if (!Burst) return null;
  return <Burst />;
}
