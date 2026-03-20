import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import ContactForm from '../ContactForm';

// Mock de import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_WEB3FORMS_KEY: 'test-key' } } });

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
});
