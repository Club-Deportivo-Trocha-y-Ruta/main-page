import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import SuccessConfetti from '../SuccessConfetti';

// `SuccessConfetti` es la compuerta (docs/06-plan-animaciones.md, Fase 2, Tarea 6):
// consulta `matchMedia('(prefers-reduced-motion: reduce)')` ANTES de cargar el
// chunk de `ConfettiBurst` con `import()`. jsdom no trae `window.matchMedia`,
// así que el caso "sin matchMedia" es simplemente no stubbear nada — el mismo
// comportamiento por defecto del resto de la suite.
function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  };
  const matchMediaFn = vi.fn().mockReturnValue(mediaQueryList);
  vi.stubGlobal('matchMedia', matchMediaFn);
  return matchMediaFn;
}

describe('SuccessConfetti', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sin window.matchMedia (jsdom por defecto) no monta ninguna .confetti-piece', () => {
    expect(window.matchMedia).toBeUndefined();

    render(<SuccessConfetti />);

    expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.confetti-piece')).toHaveLength(0);
  });

  it('con prefers-reduced-motion: reduce no monta el confeti', () => {
    stubMatchMedia(true);

    render(<SuccessConfetti />);

    expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
  });

  it('con motion permitido, carga el chunk de forma async y monta 28 piezas aria-hidden', async () => {
    const matchMediaFn = stubMatchMedia(false);

    render(<SuccessConfetti />);

    const burst = await screen.findByTestId('confetti-burst');
    expect(burst).toHaveAttribute('aria-hidden', 'true');
    expect(burst.querySelectorAll('.confetti-piece')).toHaveLength(28);
    expect(matchMediaFn).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('no tiene violaciones de accesibilidad con el confeti montado', async () => {
    stubMatchMedia(false);
    const { container } = render(<SuccessConfetti />);
    await screen.findByTestId('confetti-burst');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
