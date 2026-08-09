import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import MobileMenu from '../MobileMenu';

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Programas', href: '/programas' },
  { label: 'Calendario', href: '/calendario' },
];

const secondaryNavItems = [
  { label: 'Contacto', href: '/contacto' },
  { label: 'FAQ', href: '/preguntas-frecuentes' },
];

const defaultProps = {
  navItems,
  secondaryNavItems,
  currentPath: '/',
};

describe('MobileMenu', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  // ─── Renderizado ─────────────────────────────────────────

  it('renderiza el botón hamburguesa', () => {
    render(<MobileMenu {...defaultProps} />);
    expect(screen.getByLabelText('Abrir menú de navegación')).toBeInTheDocument();
  });

  it('el menú drawer está oculto por defecto', () => {
    render(<MobileMenu {...defaultProps} />);
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveClass('translate-x-full');
  });

  // ─── Apertura/Cierre ─────────────────────────────────────

  it('abre el menú al hacer click en hamburguesa', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveClass('translate-x-0');
  });

  it('cierra el menú al hacer click en botón cerrar', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    await user.click(screen.getByLabelText('Abrir menú de navegación'));
    await user.click(screen.getByLabelText('Cerrar menú'));

    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveClass('translate-x-full');
  });

  it('cierra con Escape', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    await user.click(screen.getByLabelText('Abrir menú de navegación'));
    await user.keyboard('{Escape}');

    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveClass('translate-x-full');
  });

  it('cierra al hacer click en overlay', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    // El overlay tiene aria-hidden="true"
    const overlay = document.querySelector('[aria-hidden="true"].fixed.inset-0');
    expect(overlay).toBeTruthy();
    await user.click(overlay!);

    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveClass('translate-x-full');
  });

  // ─── Navegación ──────────────────────────────────────────

  it('renderiza todos los items de navegación', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);
    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    for (const item of [...navItems, ...secondaryNavItems]) {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    }
  });

  it('marca la página activa con aria-current="page"', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);
    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    const activeLink = screen.getByText('Inicio').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
  });

  it('no marca páginas inactivas con aria-current', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);
    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    const inactiveLink = screen.getByText('Programas').closest('a');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('incluye enlace de inscripción (CTA)', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);
    await user.click(screen.getByLabelText('Abrir menú de navegación'));

    expect(screen.getByText('Preinscríbete')).toBeInTheDocument();
  });

  // ─── Accesibilidad ───────────────────────────────────────

  it('aria-expanded se actualiza correctamente', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    const trigger = screen.getByLabelText('Abrir menú de navegación');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('el drawer tiene role="dialog" y aria-modal', () => {
    render(<MobileMenu {...defaultProps} />);
    const drawer = screen.getByRole('dialog', { hidden: true });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('aria-label', 'Menú de navegación');
  });

  it('body overflow se bloquea cuando el menú está abierto', async () => {
    const user = userEvent.setup();
    render(<MobileMenu {...defaultProps} />);

    await user.click(screen.getByLabelText('Abrir menú de navegación'));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');
  });

  it('no tiene violaciones de accesibilidad (cerrado)', async () => {
    const { container } = render(<MobileMenu {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
