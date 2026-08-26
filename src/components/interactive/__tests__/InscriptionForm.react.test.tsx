import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import InscriptionForm from '../InscriptionForm';
import { ENROLLMENT_DOCUMENTS } from '@lib/enrollment';

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

// ─── Helpers para las pruebas de estados animados (Fase 2, Tareas 4-6) ────────
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

function getStepListItems(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll('nav[aria-label="Progreso de inscripcion"] > ol > li'),
  );
}

function getStepIndicator(container: HTMLElement, index: number) {
  return getStepListItems(container)[index].querySelector(
    'div.flex.flex-col.items-center > span',
  ) as HTMLElement;
}

function getStepRailFill(container: HTMLElement, index: number) {
  return getStepListItems(container)[index].querySelector(
    'div[aria-hidden="true"] > span',
  ) as HTMLElement;
}

function getProgramFieldWrapper(container: HTMLElement) {
  // Único `.space-y-3` visible mientras el formulario no está en success (ver
  // InscriptionForm.tsx): el grupo de radios de programa del paso 1.
  return container.querySelector('.space-y-3') as HTMLElement;
}

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

  // ─── Progreso animado del stepper (Fase 2, Tarea 4) ─────────────────────

  describe('Progreso animado del stepper', () => {
    it('al completar el paso 1: indicador con if-step-pop/if-step-check y riel a scale-x-100; el retroceso revierte todo', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);

      // Estado inicial: nada completado todavía.
      expect(getStepRailFill(container, 0)).toHaveClass('scale-x-0');
      expect(getStepIndicator(container, 0)).not.toHaveClass('if-step-pop');

      await user.click(screen.getByText('Escuela de Iniciación'));
      await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');
      await user.click(screen.getByRole('button', { name: /Siguiente/ }));

      await waitFor(() => {
        expect(screen.getByText('Datos del corredor')).toBeInTheDocument();
      });

      const indicator0 = getStepIndicator(container, 0);
      expect(indicator0).toHaveClass('if-step-pop');
      expect(indicator0.querySelector('path.if-step-check')).toBeInTheDocument();
      expect(getStepRailFill(container, 0)).toHaveClass('scale-x-100');
      // El riel del paso 2 (aún no completado) sigue sin relleno.
      expect(getStepRailFill(container, 1)).toHaveClass('scale-x-0');

      // Retroceso: revierte checkmark, clase de pop y relleno del riel.
      await user.click(screen.getByRole('button', { name: /Atras/ }));
      await waitFor(() => {
        expect(screen.getByText('Selecciona un programa')).toBeInTheDocument();
      });

      const indicatorAfterBack = getStepIndicator(container, 0);
      expect(indicatorAfterBack).not.toHaveClass('if-step-pop');
      expect(indicatorAfterBack).toHaveTextContent('1');
      expect(getStepRailFill(container, 0)).toHaveClass('scale-x-0');
    });
  });

  // ─── Shake de validación (Fase 2, Tarea 5) ──────────────────────────────

  describe('Shake de validación', () => {
    it('agita los campos inválidos del paso 1 al intentar avanzar sin llenarlos; error y aria siguen presentes', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);

      await user.click(screen.getByRole('button', { name: /Siguiente/ }));

      await waitFor(() => {
        expect(getProgramFieldWrapper(container)).toHaveClass('field-shake');
        expect(screen.getByLabelText('Edad del corredor')).toHaveClass('field-shake');
      });

      expect(screen.getByText('Selecciona un programa', { selector: 'p' })).toHaveAttribute(
        'role',
        'alert',
      );
      expect(screen.getByText('Selecciona la edad del corredor')).toHaveAttribute('role', 'alert');
    });

    it('re-aplica field-shake en un segundo intento fallido (ciclo remove+add capturado con MutationObserver)', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      const wrapper = getProgramFieldWrapper(container);
      const nextButton = screen.getByRole('button', { name: /Siguiente/ });

      const observedStates: boolean[] = [];
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            observedStates.push(wrapper.classList.contains('field-shake'));
          }
        }
      });
      observer.observe(wrapper, { attributes: true, attributeFilter: ['class'] });

      await user.click(nextButton);
      await waitFor(() => expect(wrapper).toHaveClass('field-shake'));

      await user.click(nextButton);
      await waitFor(() => expect(wrapper).toHaveClass('field-shake'));

      observer.disconnect();

      // El segundo intento debe verse como un ciclo false → true: `triggerShake`
      // retira la clase (antes de un requestAnimationFrame) y la vuelve a
      // aplicar un frame después — no se queda simplemente activa desde el
      // primer intento.
      const lastRemoval = observedStates.lastIndexOf(false);
      expect(lastRemoval).toBeGreaterThan(-1);
      expect(observedStates[lastRemoval + 1]).toBe(true);
      expect(observedStates[observedStates.length - 1]).toBe(true);
    });

    it('no tiene violaciones de accesibilidad con campos en shake', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);

      await user.click(screen.getByRole('button', { name: /Siguiente/ }));
      await waitFor(() => {
        expect(getProgramFieldWrapper(container)).toHaveClass('field-shake');
      });

      const results = await axe(container, {
        rules: {
          label: { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  // ─── ValidCheckmark (Fase 2, Tarea 5) ───────────────────────────────────

  describe('ValidCheckmark', () => {
    async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByText('Escuela de Iniciación'));
      await user.selectOptions(screen.getByLabelText('Edad del corredor'), '6');
      await user.click(screen.getByRole('button', { name: /Siguiente/ }));
      await waitFor(() => expect(screen.getByLabelText(/Nombre completo/)).toBeInTheDocument());
    }

    it('aparece con field-pop y aria-hidden cuando un campo tocado queda válido', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await goToStep2(user);

      await user.type(screen.getByLabelText(/Nombre completo/), 'Juan David Pérez');
      await user.tab();

      await waitFor(() => {
        const checkmark = container.querySelector('svg.field-pop');
        expect(checkmark).toBeInTheDocument();
        expect(checkmark).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('no aparece en un campo tocado que queda en error', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await goToStep2(user);

      await user.type(screen.getByLabelText(/Nombre completo/), 'J');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Ingresa el nombre completo')).toBeInTheDocument();
      });
      expect(container.querySelector('svg.field-pop')).not.toBeInTheDocument();
    });
  });

  // ─── Confeti en pantalla de éxito (Fase 2, Tarea 6) ─────────────────────

  describe('Confeti en pantalla de éxito', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    async function enviarFormularioCompleto(user: ReturnType<typeof userEvent.setup>) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await navegarHastaPaso3(user);

      await user.type(screen.getByLabelText(/Nombre completo del acudiente/), 'María López');
      await user.type(screen.getByLabelText(/Celular/), '3001234567');
      await user.type(screen.getByLabelText(/Email/), 'maria@test.com');
      await user.type(screen.getByLabelText(/EPS/), 'Sura');
      await user.selectOptions(screen.getByLabelText(/Parentesco/), 'madre');
      await user.click(screen.getByRole('button', { name: /Siguiente/ }));

      await waitFor(() => expect(screen.getByText('Confirma los datos')).toBeInTheDocument());
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      await user.click(screen.getByRole('button', { name: /Enviar Solicitud/ }));

      await waitFor(() => {
        expect(screen.getByText(/Solicitud de preinscripcion enviada/)).toBeInTheDocument();
      });
    }

    it('sin matchMedia (jsdom por defecto) no monta ninguna .confetti-piece', async () => {
      const user = userEvent.setup();
      render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
    });

    it('con motion permitido monta 28 piezas aria-hidden dentro de la tarjeta de éxito', async () => {
      stubMatchMedia(false);
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      const burst = await screen.findByTestId('confetti-burst');
      expect(burst).toHaveAttribute('aria-hidden', 'true');
      expect(burst.querySelectorAll('.confetti-piece')).toHaveLength(28);

      // A diferencia de ContactForm, aquí no hay `role="status"`: la capa vive
      // directamente dentro de la tarjeta de éxito.
      const successCard = container.querySelector('.relative.mx-auto.max-w-2xl');
      expect(successCard?.contains(burst)).toBe(true);
    });

    it('con prefers-reduced-motion: reduce no monta confeti', async () => {
      stubMatchMedia(true);
      const user = userEvent.setup();
      render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      expect(screen.queryByTestId('confetti-burst')).not.toBeInTheDocument();
    });

    it('acota el confeti al tercio superior de la tarjeta (nota a11y del gate 14)', async () => {
      stubMatchMedia(false);
      const user = userEvent.setup();
      render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      const burst = await screen.findByTestId('confetti-burst');
      const clipWrapper = burst.parentElement;
      expect(clipWrapper).toHaveClass('h-1/3', 'overflow-hidden');
    });
  });

  // ─── Checklist "qué llevar" en la pantalla de éxito (docs/08 tarea 17) ──

  describe('Checklist "qué llevar" en pantalla de éxito', () => {
    async function enviarFormularioCompleto(user: ReturnType<typeof userEvent.setup>) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

      await navegarHastaPaso3(user);

      await user.type(screen.getByLabelText(/Nombre completo del acudiente/), 'María López');
      await user.type(screen.getByLabelText(/Celular/), '3001234567');
      await user.type(screen.getByLabelText(/Email/), 'maria@test.com');
      await user.type(screen.getByLabelText(/EPS/), 'Sura');
      await user.selectOptions(screen.getByLabelText(/Parentesco/), 'madre');
      await user.click(screen.getByRole('button', { name: /Siguiente/ }));

      await waitFor(() => expect(screen.getByText('Confirma los datos')).toBeInTheDocument());
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      await user.click(screen.getByRole('button', { name: /Enviar Solicitud/ }));

      await waitFor(() => {
        expect(screen.getByText(/Solicitud de preinscripcion enviada/)).toBeInTheDocument();
      });
    }

    it('lista los mismos documentos que ENROLLMENT_DOCUMENTS, sin texto propio', async () => {
      const user = userEvent.setup();
      render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      for (const doc of ENROLLMENT_DOCUMENTS) {
        expect(screen.getByText(doc.label)).toBeInTheDocument();
      }
    });

    it('cada ítem entra con .reveal --stagger y pasa a .revealed tras montarse', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      const items = Array.from(container.querySelectorAll('li.reveal')) as HTMLLIElement[];
      expect(items).toHaveLength(ENROLLMENT_DOCUMENTS.length);

      items.forEach((item, index) => {
        expect(item.style.getPropertyValue('--stagger')).toBe(`${index * 90}ms`);
      });

      // El disparo de `.revealed` es asíncrono (requestAnimationFrame propio
      // del island, no el observer global de BaseLayout): eventualmente
      // todos los ítems lo reciben.
      await waitFor(() => {
        items.forEach((item) => expect(item).toHaveClass('revealed'));
      });
    });

    it('cada ítem trae un check SVG (path.checklist-check) para el trazo if-check-draw', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      const checks = container.querySelectorAll('li.reveal svg.checklist-check path');
      expect(checks).toHaveLength(ENROLLMENT_DOCUMENTS.length);
      checks.forEach((path) => {
        expect(path).toHaveAttribute('d', 'M5 13l4 4L19 7');
      });

      // Decorativo: el badge que lo envuelve es aria-hidden, el texto del
      // documento es lo único que anuncia el lector de pantalla.
      const badges = container.querySelectorAll('li.reveal > span[aria-hidden="true"]');
      expect(badges).toHaveLength(ENROLLMENT_DOCUMENTS.length);
    });

    it('no tiene violaciones de accesibilidad en la pantalla de éxito con el checklist', async () => {
      const user = userEvent.setup();
      const { container } = render(<InscriptionForm programs={programs} />);
      await enviarFormularioCompleto(user);

      await waitFor(() => {
        expect(container.querySelectorAll('li.reveal.revealed')).toHaveLength(
          ENROLLMENT_DOCUMENTS.length,
        );
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
