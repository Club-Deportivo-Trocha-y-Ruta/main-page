import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useRef, useEffect } from 'react';
import { PUBLIC_WEB3FORMS_KEY } from 'astro:env/client';
import { trackEvent } from '@lib/analytics';
import SuccessConfetti from './SuccessConfetti';

const subjects = [
  { value: '', label: 'Selecciona un asunto' },
  { value: 'informacion', label: 'Información general' },
  { value: 'inscripcion', label: 'Inscripción' },
  { value: 'patrocinio', label: 'Patrocinio' },
  { value: 'otro', label: 'Otro' },
] as const;

const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  phone: z
    .string()
    .max(20, 'El teléfono no puede superar 20 caracteres')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(1, 'Selecciona un asunto'),
  message: z
    .string()
    .min(1, 'El mensaje es obligatorio')
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(2000, 'El mensaje no puede superar 2000 caracteres'),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Props {
  defaultSubject?: string;
}

// Checkmark de campo válido (tocado + sin error): puramente decorativo, el
// mensaje de error/aria-invalid ya comunican el estado real. `field-pop` solo
// existe dentro de `prefers-reduced-motion: no-preference` (global.css); sin
// esa preferencia el ícono se pinta directo en su estado final (sin animar).
function ValidCheckmark() {
  return (
    <svg
      aria-hidden="true"
      className="field-pop pointer-events-none absolute right-3 top-3 h-5 w-5 text-green-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ContactForm({ defaultSubject = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: defaultSubject,
      message: '',
    },
  });

  // ─── Shake de error (estilo Duolingo) ───────────────────────────────────
  // Un solo Set con los nombres de campo que están agitando ahora mismo. La
  // clase `field-shake` NUNCA se ata directo a `errors[name]` (eso sigue
  // gobernando solo el borde rojo) para no tener dos fuentes de verdad
  // compitiendo por la misma clase — ver InscriptionForm.tsx, mismo patrón.
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());
  const prevErrorFieldsRef = useRef<Set<string>>(new Set());

  function triggerShake(fields: string[]) {
    if (fields.length === 0) return;
    setShakingFields((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => next.delete(f));
      return next;
    });
    requestAnimationFrame(() => {
      setShakingFields((prev) => new Set([...prev, ...fields]));
    });
  }

  // Un campo que ACABA de entrar en error (p. ej. al perder el foco) agita de
  // inmediato. Los reintentos con el campo ya inválido se agitan explícitamente
  // desde `onInvalidSubmit`, que conoce el error fresco tras el intento.
  useEffect(() => {
    const currentErrorFields = new Set(Object.keys(errors));
    const newlyErrored = [...currentErrorFields].filter((f) => !prevErrorFieldsRef.current.has(f));
    prevErrorFieldsRef.current = currentErrorFields;
    if (newlyErrored.length > 0) triggerShake(newlyErrored);
  }, [errors]);

  const onInvalidSubmit = (formErrors: Record<string, unknown>) => {
    triggerShake(Object.keys(formErrors));
  };

  const onSubmit = async (data: ContactFormData) => {
    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: PUBLIC_WEB3FORMS_KEY,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          subject: `[Trocha y Ruta] ${subjects.find((s) => s.value === data.subject)?.label ?? data.subject}`,
          message: data.message,
          botcheck: '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        reset();
        trackEvent({ name: 'contact_submit' });
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Hubo un error al enviar el formulario. Intenta de nuevo.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
    }
  };

  if (status === 'success') {
    return (
      // El confeti va FUERA del `role="status"` a propósito: esa región es
      // aria-atomic por definición, así que montar/desmontar la capa decorativa
      // dentro haría que el lector de pantalla repitiera el anuncio de éxito.
      // El wrapper solo aporta el sistema de coordenadas (`relative`) y el mismo
      // radio, que la capa hereda con `rounded-[inherit]`.
      <div className="relative rounded-2xl">
        <SuccessConfetti />
        <div
          role="status"
          className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 256 256"
            className="mx-auto mb-4 text-green-600"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M128 24a104 104 0 1 0 104 104A104.12 104.12 0 0 0 128 24Zm45.66 85.66-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32Z"
            />
          </svg>
          <h3 className="text-xl font-display font-bold text-green-800 mb-2">
            Mensaje enviado
          </h3>
          <p className="text-green-700 mb-6">
            Gracias por contactarnos. Te responderemos lo antes posible.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      noValidate
      className="space-y-6"
    >
      {/* Honeypot anti-spam */}
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Nombre */}
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Nombre completo <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            aria-invalid={errors.name ? 'true' : undefined}
            className={`w-full rounded-lg border bg-white pl-4 pr-10 py-2.5 text-base text-text-primary placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              errors.name ? 'border-red-400' : 'border-surface-muted'
            } ${shakingFields.has('name') ? 'field-shake' : ''}`}
            placeholder="Tu nombre"
            {...register('name')}
          />
          {touchedFields.name && !errors.name && <ValidCheckmark />}
        </div>
        {errors.name && (
          <p id="contact-name-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Correo electrónico <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            aria-invalid={errors.email ? 'true' : undefined}
            className={`w-full rounded-lg border bg-white pl-4 pr-10 py-2.5 text-base text-text-primary placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              errors.email ? 'border-red-400' : 'border-surface-muted'
            } ${shakingFields.has('email') ? 'field-shake' : ''}`}
            placeholder="tu@email.com"
            {...register('email')}
          />
          {touchedFields.email && !errors.email && <ValidCheckmark />}
        </div>
        {errors.email && (
          <p id="contact-email-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label
          htmlFor="contact-phone"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Teléfono <span className="text-text-secondary text-xs">(opcional)</span>
        </label>
        <div className="relative">
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            aria-invalid={errors.phone ? 'true' : undefined}
            className={`w-full rounded-lg border bg-white pl-4 pr-10 py-2.5 text-base text-text-primary placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
              errors.phone ? 'border-red-400' : 'border-surface-muted'
            } ${shakingFields.has('phone') ? 'field-shake' : ''}`}
            placeholder="300 123 4567"
            {...register('phone')}
          />
          {touchedFields.phone && !errors.phone && <ValidCheckmark />}
        </div>
        {errors.phone && (
          <p id="contact-phone-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Asunto */}
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Asunto <span className="text-accent">*</span>
        </label>
        <select
          id="contact-subject"
          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          aria-invalid={errors.subject ? 'true' : undefined}
          className={`w-full rounded-lg border bg-white px-4 py-2.5 text-base text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.subject ? 'border-red-400' : 'border-surface-muted'
          } ${shakingFields.has('subject') ? 'field-shake' : ''}`}
          {...register('subject')}
        >
          {subjects.map((s) => (
            <option key={s.value} value={s.value} disabled={s.value === ''}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p id="contact-subject-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.subject.message}
          </p>
        )}
      </div>

      {/* Mensaje */}
      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Mensaje <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <textarea
            id="contact-message"
            rows={5}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            aria-invalid={errors.message ? 'true' : undefined}
            className={`w-full rounded-lg border bg-white pl-4 pr-10 py-2.5 text-text-primary placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y ${
              errors.message ? 'border-red-400' : 'border-surface-muted'
            } ${shakingFields.has('message') ? 'field-shake' : ''}`}
            placeholder="Escribe tu mensaje aquí..."
            {...register('message')}
          />
          {touchedFields.message && !errors.message && <ValidCheckmark />}
        </div>
        {errors.message && (
          <p id="contact-message-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Error global */}
      {status === 'error' && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full items-center justify-center rounded-lg bg-surface-dark px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-surface-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? (
          <>
            <svg
              className="mr-2 h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          'Enviar mensaje'
        )}
      </button>
    </form>
  );
}
