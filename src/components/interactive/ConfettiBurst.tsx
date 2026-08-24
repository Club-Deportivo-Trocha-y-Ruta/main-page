import { useEffect, useState, type CSSProperties } from 'react';

// ─── Confeti de celebración (docs/06-plan-animaciones.md, Fase 2 Tarea 6) ────
//
// Implementación CSS pura: cada partícula es UN solo `<span>`; el papelito
// visible lo pinta su `::before`. Así el `<span>` se encarga de la caída
// (translate) y el pseudo-elemento del giro (rotate) sin que dos animaciones
// peleen por la misma propiedad `transform`.
//
// Este módulo NUNCA se importa de forma estática: `SuccessConfetti.tsx` lo trae
// con `import()` dinámico solo al entrar a la pantalla de éxito y solo si el
// usuario no pidió `prefers-reduced-motion: reduce`. Todo lo que hay aquí vive
// en un chunk aparte, fuera del JS que se descarga al hidratar el island.
//
// Los estilos (`.confetti-piece`) están en `src/styles/global.css`, dentro de
// `@media (prefers-reduced-motion: no-preference)`: sin esa preferencia el
// `<span>` no tiene ni tamaño ni color, así que ni siquiera un montaje
// accidental dejaría partículas estáticas en pantalla.

const PARTICLE_COUNT = 28;
const FALL_MIN_MS = 1400;
const FALL_MAX_MS = 2000;
const DELAY_MAX_MS = 400;

// Momento en que el confeti se desmonta solo: la última partícula posible
// (delay máximo + caída más larga) ya terminó. Sin loops, sin capas vivas
// después de la celebración.
const TEARDOWN_MS = DELAY_MAX_MS + FALL_MAX_MS + 200;

// Colores de marca (tokens de `@theme`). No se usan los `-deep`: son para
// texto, y aquí el papelito es decorativo, no tiene que cumplir contraste.
const COLORS = [
  'var(--color-primary)',
  'var(--color-primary-light)',
  'var(--color-accent)',
  'var(--color-accent-light)',
  'var(--color-accent-dark)',
];

interface Particle {
  id: number;
  style: CSSProperties;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    // Una de cada cuatro es redonda; el resto, papelitos rectangulares.
    const isRound = id % 4 === 0;
    const width = Math.round(randomBetween(6, 10));
    const height = isRound ? width : Math.round(width * randomBetween(1.2, 1.9));

    return {
      id,
      style: {
        // Hasta 95% y no 100%: el papelito crece hacia la derecha desde este
        // punto, así no queda recortado contra el borde de la capa.
        left: `${randomBetween(2, 95).toFixed(2)}%`,
        '--confetti-color': COLORS[id % COLORS.length],
        '--confetti-drift': `${Math.round(randomBetween(-42, 42))}px`,
        '--confetti-w': `${width}px`,
        '--confetti-h': `${height}px`,
        '--confetti-radius': isRound ? '999px' : '2px',
        '--confetti-turns': String(Math.round(randomBetween(2, 5))),
        '--confetti-duration': `${Math.round(randomBetween(FALL_MIN_MS, FALL_MAX_MS))}ms`,
        '--confetti-delay': `${Math.round(randomBetween(0, DELAY_MAX_MS))}ms`,
      } as CSSProperties,
    };
  });
}

export default function ConfettiBurst() {
  // Inicializador perezoso: las partículas se sortean una sola vez por montaje,
  // así un re-render del formulario no reinicia la lluvia a mitad de camino.
  const [particles] = useState(createParticles);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFinished(true), TEARDOWN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (finished) return null;

  return (
    <div
      aria-hidden="true"
      data-testid="confetti-burst"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      {particles.map((particle) => (
        <span key={particle.id} className="confetti-piece" style={particle.style} />
      ))}
    </div>
  );
}
