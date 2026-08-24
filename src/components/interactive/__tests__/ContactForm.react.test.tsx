import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import ContactForm from '../ContactForm';

// Mock de import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_WEB3FORMS_KEY: 'test-key' } } });

// ─── Helper para las pruebas de estados animados (Fase 2, Tareas 5-6) ─────────
// jsdom no trae `window.matchMedia`: por defecto (sin stub) el gate de
// `SuccessConfetti` lo trata como `prefers-reduced-motion: reduce`. Este stub
// se aplica LOCALMENTE por test (nunca en setup-react.ts, ver docs/06-plan-animaciones.md
// Tarea 7) y siempre se limpia con `vi.unstubAllGlobals()` en su propio `afterEach`.
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
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQueryList));
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Renderizado ─────────────────────────────────────────

  it('renderiza todos los campos del formulario', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Asunto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeInTheDocument();
  });

  it('aplica defaultSubject cuando se pasa como prop', () => {
    render(<ContactForm defaultSubject="informacion" />);
    const select = screen.getByLabelText(/Asunto/) as HTMLSelectElement;
    expect(select.value).toBe('informacion');
  });

  // ─── Validación ──────────────────────────────────────────

  it('muestra error si nombre está vacío al hacer blur', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/Nombre completo/);
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    });
  });

  it('muestra error para email inválido', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const emailInput = screen.getByLabelText(/Correo electrónico/);
    await user.type(emailInput, 'no-es-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
  });

  it('muestra error si mensaje tiene menos de 10 caracteres', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const messageInput = screen.getByLabelText(/Mensaje/);
    await user.type(messageInput, 'Hola');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('El mensaje debe tener al menos 10 caracteres')).toBeInTheDocument();
    });
  });

  // ─── Submit exitoso ──────────────────────────────────────

  it('envía formulario y muestra pantalla de éxito', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
    await user.selectOptions(screen.getByLabelText(/Asunto/), 'informacion');
    await user.type(screen.getByLabelText(/Mensaje/), 'Este es un mensaje de prueba para testing.');

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await waitFor(() => {
      expect(screen.getByText('Mensaje enviado')).toBeInTheDocument();
    });
  });

  it('muestra estado de loading durante envío', async () => {
    const user = userEvent.setup();

    let resolvePromise!: (value: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      new Promise((resolve) => { resolvePromise = resolve; })
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan Pérez');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
    await user.selectOptions(screen.getByLabelText(/Asunto/), 'informacion');
    await user.type(screen.getByLabelText(/Mensaje/), 'Mensaje largo de prueba para testing.');

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    expect(screen.getByText('Enviando...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    resolvePromise(new Response(JSON.stringify({ success: true })));
  });

  // ─── Errores de envío ────────────────────────────────────

  it('muestra error cuando Web3Forms responde con error', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, message: 'Límite excedido' }),
        { status: 200 }
      )
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
    await user.selectOptions(screen.getByLabelText(/Asunto/), 'otro');
    await user.type(screen.getByLabelText(/Mensaje/), 'Un mensaje largo para probar el error del servidor.');

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await waitFor(() => {
      expect(screen.getByText('Límite excedido')).toBeInTheDocument();
    });
  });

  it('muestra error de conexión cuando fetch falla', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
    await user.selectOptions(screen.getByLabelText(/Asunto/), 'otro');
    await user.type(screen.getByLabelText(/Mensaje/), 'Un mensaje largo para probar error de red.');

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await waitFor(() => {
      expect(
        screen.getByText(/No se pudo conectar con el servidor/)
      ).toBeInTheDocument();
    });
  });

  // ─── Pantalla de éxito ───────────────────────────────────

  it('permite enviar otro mensaje después de éxito', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }))
    );

    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan');
    await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
    await user.selectOptions(screen.getByLabelText(/Asunto/), 'otro');
    await user.type(screen.getByLabelText(/Mensaje/), 'Un mensaje largo suficiente para pasar validación.');

    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await waitFor(() => {
      expect(screen.getByText('Mensaje enviado')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Enviar otro mensaje'));

    expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
  });

  // ─── Accesibilidad ───────────────────────────────────────

  it('campos con error tienen aria-invalid y aria-describedby', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const nameInput = screen.getByLabelText(/Nombre completo/);
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'contact-name-error');
    });
  });

  it('errores de validación tienen role="alert"', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByLabelText(/Nombre completo/));
    await user.tab();

    await waitFor(() => {
      const alert = screen.getByText('El nombre es obligatorio');
      expect(alert).toHaveAttribute('role', 'alert');
    });
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<ContactForm />);
    const results = await axe(container, {
      rules: {
        // El honeypot input oculto (anti-spam) es intencionalmente sin label
        label: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  // ─── Shake de validación (Fase 2, Tarea 5) ──────────────────────────────

  describe('Shake de validación', () => {
    it('agita el campo al perder el foco vacío; aria-invalid y el mensaje de error siguen presentes', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const nameInput = screen.getByLabelText(/Nombre completo/);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(nameInput).toHaveClass('field-shake');
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
      expect(screen.getByText('El nombre es obligatorio')).toHaveAttribute('role', 'alert');
    });

    it('re-aplica field-shake en un reintento de envío mientras el campo sigue inválido (MutationObserver)', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const nameInput = screen.getByLabelText(/Nombre completo/);
      // Primer feed point: el campo entra en error al perder el foco vacío.
      await user.click(nameInput);
      await user.tab();
      await waitFor(() => expect(nameInput).toHaveClass('field-shake'));

      const observedStates: boolean[] = [];
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            observedStates.push(nameInput.classList.contains('field-shake'));
          }
        }
      });
      observer.observe(nameInput, { attributes: true, attributeFilter: ['class'] });

      // Segundo feed point: reintento de envío con el formulario todavía
      // inválido (onInvalidSubmit) — el campo sigue en error, no "nuevo".
      await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
      await waitFor(() => expect(nameInput).toHaveClass('field-shake'));

      observer.disconnect();

      // Debe verse un ciclo false → true: la clase se retira y se reaplica,
      // no se queda simplemente activa desde el primer intento.
      const lastRemoval = observedStates.lastIndexOf(false);
      expect(lastRemoval).toBeGreaterThan(-1);
      expect(observedStates[lastRemoval + 1]).toBe(true);
    });
  });

  // ─── ValidCheckmark (Fase 2, Tarea 5) ───────────────────────────────────

  describe('ValidCheckmark', () => {
    it('aparece con field-pop y aria-hidden cuando el campo queda válido tras blur', async () => {
      const user = userEvent.setup();
      const { container } = render(<ContactForm />);

      await user.type(screen.getByLabelText(/Nombre completo/), 'Juan Pérez');
      await user.tab();

      await waitFor(() => {
        const checkmark = container.querySelector('svg.field-pop');
        expect(checkmark).toBeInTheDocument();
        expect(checkmark).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('no aparece en un campo tocado que queda en error', async () => {
      const user = userEvent.setup();
      const { container } = render(<ContactForm />);

      const nameInput = screen.getByLabelText(/Nombre completo/);
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      });
      expect(container.querySelector('svg.field-pop')).not.toBeInTheDocument();
    });
  });

  // ─── Confeti en pantalla de éxito (Fase 2, Tarea 6) ─────────────────────

  describe('Confeti en pantalla de éxito', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    async function enviarFormularioValido(user: ReturnType<typeof userEvent.setup>) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true })),
      );
      await user.type(screen.getByLabelText(/Nombre completo/), 'Juan Pérez');
      await user.type(screen.getByLabelText(/Correo electrónico/), 'juan@test.com');
      await user.selectOptions(screen.getByLabelText(/Asunto/), 'informacion');
      await user.type(
        screen.getByLabelText(/Mensaje/),
        'Un mensaje de prueba suficientemente largo.',
      );
      await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
      await waitFor(() => expect(screen.getByText('Mensaje enviado')).toBeInTheDocument());
    }

    it('sin matchMedia no monta ninguna .confetti-piece', async () => {
      const user = userEvent.setup();
      render(<ContactForm />);
      await enviarFormularioValido(user);

      expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
    });

    it('con motion permitido monta 28 piezas aria-hidden fuera del role="status"', async () => {
      stubMatchMedia(false);
      const user = userEvent.setup();
      render(<ContactForm />);
      await enviarFormularioValido(user);

      const burst = await screen.findByTestId('confetti-burst');
      expect(burst).toHaveAttribute('aria-hidden', 'true');
      expect(burst.querySelectorAll('.confetti-piece')).toHaveLength(28);

      // `role="status"` es aria-atomic: el confeti va FUERA (hermano, no
      // descendiente) para no hacer que se re-anuncie el mensaje de éxito.
      const status = screen.getByRole('status');
      expect(status.contains(burst)).toBe(false);
      expect(within(status).queryByTestId('confetti-burst')).not.toBeInTheDocument();
    });

    it('con prefers-reduced-motion: reduce no monta confeti', async () => {
      stubMatchMedia(true);
      const user = userEvent.setup();
      render(<ContactForm />);
      await enviarFormularioValido(user);

      expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
    });

    it('no tiene violaciones de accesibilidad en éxito con confeti montado', async () => {
      stubMatchMedia(false);
      const user = userEvent.setup();
      const { container } = render(<ContactForm />);
      await enviarFormularioValido(user);
      await screen.findByTestId('confetti-burst');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
