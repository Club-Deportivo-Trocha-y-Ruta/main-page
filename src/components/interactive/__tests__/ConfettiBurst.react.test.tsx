import { act, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import ConfettiBurst from '../ConfettiBurst';

// Unidad directa de la celebración (docs/06-plan-animaciones.md, Fase 2, Tarea 6):
// `SuccessConfetti` es la única compuerta que la monta en producción, pero acá
// se prueba sin pasar por `matchMedia`/`import()` — solo el propio componente.
describe('ConfettiBurst', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza 28 piezas decorativas, aria-hidden y sin bloquear el puntero', () => {
    render(<ConfettiBurst />);

    const layer = screen.getByTestId('confetti-burst');
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer).toHaveClass('pointer-events-none');
    expect(layer.querySelectorAll('.confetti-piece')).toHaveLength(28);
  });

  it('se auto-desmonta a los 2600ms sin dejar la capa viva', () => {
    render(<ConfettiBurst />);
    expect(screen.getByTestId('confetti-burst')).toBeInTheDocument();

    // TEARDOWN_MS = DELAY_MAX_MS (400) + FALL_MAX_MS (2000) + 200 = 2600ms.
    act(() => {
      vi.advanceTimersByTime(2599);
    });
    expect(screen.getByTestId('confetti-burst')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    // axe hace trabajo async interno; más simple con timers reales para este caso.
    vi.useRealTimers();
    const { container } = render(<ConfettiBurst />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
