import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import InscriptionForm from '../InscriptionForm';

// Mock de import.meta.env
vi.stubGlobal('import', { meta: { env: { PUBLIC_WEB3FORMS_KEY: 'test-key' } } });

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const programs = [
  { id: 'iniciacion', title: 'Escuela de Iniciación', ageRange: '4-7 años' },
  { id: 'formacion', title: 'Formación Juvenil', ageRange: '8-13 años' },
  { id: 'alto-rendimiento', title: 'Alto Rendimiento', ageRange: '14-17 años' },
];

describe('InscriptionForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock.clear();
  });

  // ─── Renderizado inicial ─────────────────────────────────

  it('renderiza paso 1 (Selección de programa) por defecto', () => {
    render(<InscriptionForm programs={programs} />);

    expect(screen.getByText('Selecciona un programa')).toBeInTheDocument();
    expect(screen.getByText('Escuela de Iniciación')).toBeInTheDocument();
    expect(screen.getByText('Formación Juvenil')).toBeInTheDocument();
  });

  it('renderiza la barra de progreso con 4 pasos', () => {
    render(<InscriptionForm programs={programs} />);

    expect(screen.getByText('Programa')).toBeInTheDocument();
    expect(screen.getByText('Corredor')).toBeInTheDocument();
    expect(screen.getByText('Acudiente')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
  });

  // ─── Navegación entre pasos ──────────────────────────────

  it('avanza al paso 2 con datos válidos del paso 1', async () => {
    const user = userEvent.setup();
    render(<InscriptionForm programs={programs} />);

    // Seleccionar programa
    await user.click(screen.getByText('Escuela de Iniciación'));
    // Seleccionar edad
    await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => {
      expect(screen.getByText('Datos del corredor')).toBeInTheDocument();
    });
  });

  it('no avanza sin completar campos requeridos', async () => {
    const user = userEvent.setup();
    render(<InscriptionForm programs={programs} />);

    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => {
      // Verificamos que NO avanzó al paso 2
      expect(screen.queryByText('Datos del corredor')).not.toBeInTheDocument();
      // Muestra errores de validación (alerts)
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it('permite retroceder al paso anterior', async () => {
    const user = userEvent.setup();
    render(<InscriptionForm programs={programs} />);

    // Avanzar al paso 2
    await user.click(screen.getByText('Escuela de Iniciación'));
    await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => {
      expect(screen.getByText('Datos del corredor')).toBeInTheDocument();
    });

    // Retroceder
    await user.click(screen.getByRole('button', { name: /Atras/ }));

    await waitFor(() => {
      expect(screen.getByText('Selecciona un programa')).toBeInTheDocument();
    });
  });

  // ─── Paso 2: Corredor ────────────────────────────────────

  it('paso 2 muestra campos del corredor', async () => {
    const user = userEvent.setup();
    render(<InscriptionForm programs={programs} />);

    // Navegar al paso 2
    await user.click(screen.getByText('Escuela de Iniciación'));
    await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument();
      expect(screen.getByLabelText('Dia')).toBeInTheDocument();
      expect(screen.getByLabelText('Mes')).toBeInTheDocument();
      expect(screen.getByLabelText('Año')).toBeInTheDocument();
    });
  });

  // ─── Submit ──────────────────────────────────────────────

  /**
   * Navega el formulario hasta el paso 3 llenando paso 1 y paso 2 completos.
   * Extrae la lógica de navegación repetida para evitar duplicación.
   */
  async function navegarHastaPaso3(user: ReturnType<typeof userEvent.setup>) {
    // Paso 1
    await user.click(screen.getByText('Escuela de Iniciación'));
    await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Paso 2
    await waitFor(() => expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument());
    await user.type(screen.getByLabelText(/Nombre completo/), 'Juan David Pérez');
    await user.selectOptions(screen.getByLabelText('Dia'), '15');
    await user.selectOptions(screen.getByLabelText('Mes'), '6');
    await user.selectOptions(screen.getByLabelText('Año'), '2020');
    await user.selectOptions(screen.getByLabelText(/Genero/), 'masculino');
    // Talla camiseta: label envuelve radio con sr-only, usar getByLabelText con regex
    await user.click(screen.getByLabelText('M'));
    // Experiencia: misma estructura de radio envuelto en label
    await user.click(screen.getByLabelText('Ninguna'));
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Verificar que llegó al paso 3
    await waitFor(() => expect(screen.getByText('Acudiente / Contacto de emergencia')).toBeInTheDocument());
  }

  it('envía formulario completo exitosamente', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    render(<InscriptionForm programs={programs} />);

    await navegarHastaPaso3(user);

    // Paso 3
    await user.type(screen.getByLabelText(/Nombre completo del acudiente/), 'María López');
    await user.type(screen.getByLabelText(/Celular/), '3001234567');
    await user.type(screen.getByLabelText(/Email/), 'maria@test.com');
    await user.type(screen.getByLabelText(/EPS/), 'Sura');
    await user.selectOptions(screen.getByLabelText(/Parentesco/), 'madre');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Paso 4: Confirmar
    await waitFor(() => expect(screen.getByText('Confirma los datos')).toBeInTheDocument());

    // Aceptar términos
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // acceptTerms
    await user.click(checkboxes[1]); // acceptDataPolicy

    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/ }));

    await waitFor(() => {
      expect(screen.getByText(/Solicitud de preinscripcion enviada/)).toBeInTheDocument();
    });
  });

  it('muestra error cuando el servidor falla', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<InscriptionForm programs={programs} />);

    await navegarHastaPaso3(user);

    // Paso 3
    await user.type(screen.getByLabelText(/Nombre completo del acudiente/), 'María López');
    await user.type(screen.getByLabelText(/Celular/), '3001234567');
    await user.type(screen.getByLabelText(/Email/), 'maria@test.com');
    await user.type(screen.getByLabelText(/EPS/), 'Sura');
    await user.selectOptions(screen.getByLabelText(/Parentesco/), 'madre');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Paso 4
    await waitFor(() => expect(screen.getByText('Confirma los datos')).toBeInTheDocument());
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/ }));

    await waitFor(() => {
      expect(screen.getByText(/Error de conexion/)).toBeInTheDocument();
    });
  });

  // ─── Paso 4: Resumen ────────────────────────────────────

  it('paso 4 muestra botones para editar cada sección', async () => {
    const user = userEvent.setup();
    render(<InscriptionForm programs={programs} />);

    await navegarHastaPaso3(user);

    // Paso 3
    await user.type(screen.getByLabelText(/Nombre completo del acudiente/), 'María');
    await user.type(screen.getByLabelText(/Celular/), '3001234567');
    await user.type(screen.getByLabelText(/Email/), 'maria@test.com');
    await user.type(screen.getByLabelText(/EPS/), 'Sura');
    await user.selectOptions(screen.getByLabelText(/Parentesco/), 'madre');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() => expect(screen.getByText('Confirma los datos')).toBeInTheDocument());

    const editButtons = screen.getAllByText('Editar');
    expect(editButtons).toHaveLength(3); // Programa, Corredor, Acudiente
  });

  // ─── Accesibilidad ───────────────────────────────────────

  it('no tiene violaciones de accesibilidad en paso 1', async () => {
    const { container } = render(<InscriptionForm programs={programs} />);
    const results = await axe(container, {
      rules: {
        // El honeypot input oculto (anti-spam) es intencionalmente sin label
        label: { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
