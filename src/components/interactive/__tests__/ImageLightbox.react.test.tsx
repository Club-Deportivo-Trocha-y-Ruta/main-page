import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import ImageLightbox from '../ImageLightbox';

const images = [
  { src: '/img/foto1.jpg', alt: 'Carrera XCO 2026', caption: 'Primer puesto' },
  { src: '/img/foto2.jpg', alt: 'Entrenamiento en pista' },
  { src: '/img/foto3.jpg', alt: 'Premiación copa valle', caption: 'Podio infantil' },
];

describe('ImageLightbox', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  // ─── Grid de thumbnails ──────────────────────────────────

  it('renderiza grid con todas las imágenes', () => {
    render(<ImageLightbox images={images} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(images.length);
  });

  it('cada thumbnail tiene aria-label descriptivo', () => {
    render(<ImageLightbox images={images} />);

    expect(screen.getByLabelText('Ver imagen: Carrera XCO 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Ver imagen: Entrenamiento en pista')).toBeInTheDocument();
  });

  // ─── Apertura del lightbox ───────────────────────────────

  it('abre lightbox al hacer click en thumbnail', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // La imagen full está dentro del dialog
    const fullImage = within(dialog).getByAltText('Carrera XCO 2026');
    expect(fullImage).toBeInTheDocument();
  });

  it('muestra caption en el lightbox', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Primer puesto')).toBeInTheDocument();
  });

  it('muestra contador de imágenes', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  // ─── Cierre del lightbox ─────────────────────────────────

  it('cierra lightbox con botón cerrar', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));
    await user.click(screen.getByLabelText('Cerrar visor'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra lightbox con Escape', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cierra lightbox al hacer click en backdrop', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    // Click en el backdrop (el div exterior del lightbox)
    const backdrop = screen.getByRole('dialog').parentElement!;
    await user.click(backdrop);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ─── Navegación ──────────────────────────────────────────

  it('navega a la siguiente imagen con botón', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));
    await user.click(screen.getByLabelText('Imagen siguiente'));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByAltText('Entrenamiento en pista')).toBeInTheDocument();
  });

  it('navega a la imagen anterior con botón', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));
    await user.click(screen.getByLabelText('Imagen anterior'));

    // Circular: 1 - 1 = 0 → wraps a la última (3/3)
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('navega con flechas del teclado', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  // ─── Body scroll lock ────────────────────────────────────

  it('bloquea scroll del body cuando el lightbox está abierto', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });

  // ─── Accesibilidad ───────────────────────────────────────

  it('dialog tiene aria-modal y aria-label', async () => {
    const user = userEvent.setup();
    render(<ImageLightbox images={images} />);

    await user.click(screen.getByLabelText('Ver imagen: Carrera XCO 2026'));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Visor de imágenes');
  });

  it('grid no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<ImageLightbox images={images} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
