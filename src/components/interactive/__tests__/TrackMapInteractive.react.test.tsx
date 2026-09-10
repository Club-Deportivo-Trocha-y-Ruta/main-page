import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import TrackMapInteractive from '../TrackMapInteractive';
import type { TrackObstacleMarker } from '../TrackMapInteractive';

/**
 * Leaflet necesita un canvas y medidas reales que jsdom no da; lo que se prueba
 * aquí es el contrato del island: que el contenido sin JavaScript esté en el
 * DOM desde el primer render y que la caja tenga altura estable (sin CLS).
 */
const track: [number, number][] = [
  [3.5969, -76.486],
  [3.5972, -76.4858],
  [3.5975, -76.4861],
  [3.5969, -76.486],
];

const obstacles: TrackObstacleMarker[] = [
  {
    slug: 'drop-recibidor-madera',
    name: 'Drop con recibidor de madera',
    level: 'intermedio',
    lat: 3.596855,
    lng: -76.486564,
    number: 1,
  },
];

describe('TrackMapInteractive', () => {
  it('muestra el contenido de reserva hasta que Leaflet monta', () => {
    render(
      <TrackMapInteractive track={track} obstacles={obstacles}>
        <p data-testid="svg-fallback">Trazado en SVG</p>
      </TrackMapInteractive>,
    );

    expect(screen.getByTestId('svg-fallback')).toBeInTheDocument();
  });

  it('reserva la caja del mapa desde el primer render, sin salto de layout', () => {
    const { container } = render(
      <TrackMapInteractive track={track}>
        <p>Trazado</p>
      </TrackMapInteractive>,
    );

    const box = container.querySelector('.aspect-\\[3\\/4\\]');
    expect(box).not.toBeNull();
    expect(box?.className).toContain('rounded-card');
  });

  it('no anuncia el mapa como aplicación mientras no haya mapa', () => {
    const { container } = render(
      <TrackMapInteractive track={track}>
        <p>Trazado</p>
      </TrackMapInteractive>,
    );

    expect(container.querySelector('[role="application"]')).toBeNull();
  });

  it('aguanta un trazado vacío sin romperse', () => {
    const { container } = render(
      <TrackMapInteractive track={[]}>
        <p data-testid="svg-fallback">Trazado</p>
      </TrackMapInteractive>,
    );

    expect(screen.getByTestId('svg-fallback')).toBeInTheDocument();
    expect(container.querySelector('[role="application"]')).toBeNull();
  });

  it('no tiene violaciones de accesibilidad en el estado inicial', async () => {
    const { container } = render(
      <TrackMapInteractive track={track} obstacles={obstacles}>
        <p>Trazado de la pista</p>
      </TrackMapInteractive>,
    );

    await waitFor(async () => {
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
