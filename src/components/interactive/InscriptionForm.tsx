import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CONTACT } from '@lib/constants';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Program {
  id: string;
  title: string;
  ageRange: string;
}

interface Props {
  programs: Program[];
}

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const inscriptionSchema = z.object({
  // Paso 1 - Programa
  programId: z.string().min(1, 'Selecciona un programa'),
  riderAge: z.string().min(1, 'Selecciona la edad del corredor'),

  // Paso 2 - Corredor
  riderName: z.string().min(2, 'Ingresa el nombre completo').max(100),
  birthDay: z.string().min(1, 'Selecciona el día'),
  birthMonth: z.string().min(1, 'Selecciona el mes'),
  birthYear: z.string().min(1, 'Selecciona el año'),
  gender: z.string().min(1, 'Selecciona el género'),
  shirtSize: z.string().min(1, 'Selecciona la talla'),
  experience: z.string().min(1, 'Selecciona el nivel de experiencia'),

  // Paso 3 - Acudiente
  guardianName: z.string().min(2, 'Ingresa el nombre del acudiente').max(100),
  guardianPhone: z
    .string()
    .min(1, 'Ingresa el celular')
    .regex(/^3\d{9}$/, 'Celular colombiano: 10 dígitos comenzando en 3'),
  guardianEmail: z.string().email('Ingresa un email válido'),
  guardianAddress: z.string().optional(),
  riderEps: z.string().min(1, 'Ingresa la EPS del niño/a'),
  relationship: z.string().min(1, 'Selecciona el parentesco'),

  // Paso 4 - Confirmación
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
  }),
  acceptDataPolicy: z.literal(true, {
    errorMap: () => ({ message: 'Debes autorizar el tratamiento de datos' }),
  }),
});

type InscriptionData = z.infer<typeof inscriptionSchema>;

// Schemas por paso para validación parcial
const step1Fields = ['programId', 'riderAge'] as const;
const step2Fields = ['riderName', 'birthDay', 'birthMonth', 'birthYear', 'gender', 'shirtSize', 'experience'] as const;
const step3Fields = ['guardianName', 'guardianPhone', 'guardianEmail', 'guardianAddress', 'riderEps', 'relationship'] as const;
const step4Fields = ['acceptTerms', 'acceptDataPolicy'] as const;

const stepFieldsMap = [step1Fields, step2Fields, step3Fields, step4Fields] as const;

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'trocha-inscription';
const STORAGE_TTL = 48 * 60 * 60 * 1000; // 48 hours

const STEPS = [
  { label: 'Programa', shortLabel: 'Programa' },
  { label: 'Corredor', shortLabel: 'Corredor' },
  { label: 'Acudiente / Emergencia', shortLabel: 'Acudiente' },
  { label: 'Confirmar', shortLabel: 'Confirmar' },
];

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const RELATIONSHIPS = ['Madre', 'Padre', 'Abuelo/a', 'Tío/a', 'Otro'];
const SHIRT_SIZES = ['S', 'M', 'L', 'XL'];
const EXPERIENCE_LEVELS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'basica', label: 'Básica' },
  { value: 'intermedia', label: 'Intermedia' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadSavedData(): Partial<InscriptionData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: Partial<InscriptionData>; ts: number };
    if (Date.now() - parsed.ts > STORAGE_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function saveData(data: Partial<InscriptionData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Storage full or unavailable
  }
}

function clearSavedData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InscriptionForm({ programs }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<InscriptionData>({
    resolver: zodResolver(inscriptionSchema),
    mode: 'onTouched',
    defaultValues: {
      programId: '',
      riderAge: '',
      riderName: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      gender: '',
      shirtSize: '',
      experience: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianAddress: '',
      riderEps: '',
      relationship: '',
      acceptTerms: undefined as unknown as true,
      acceptDataPolicy: undefined as unknown as true,
    },
  });

  // Restore saved data on mount
  useEffect(() => {
    const saved = loadSavedData();
    if (saved) {
      reset({ ...getValues(), ...saved });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data on change
  const allValues = watch();
  useEffect(() => {
    if (submitStatus === 'success') return;
    const { acceptTerms, acceptDataPolicy, ...rest } = allValues;
    saveData(rest);
  }, [allValues, submitStatus]);

  // Focus management on step change
  useEffect(() => {
    stepRef.current?.focus();
  }, [currentStep]);

  const goToStep = (step: number) => setCurrentStep(step);

  const handleNext = async () => {
    const fields = stepFieldsMap[currentStep];
    const valid = await trigger(fields as unknown as (keyof InscriptionData)[]);
    if (valid) {
      setCurrentStep((s) => Math.min(s + 1, 3));
    } else {
      // Mover foco al primer campo con error de este paso
      const firstErrorField = (fields as readonly string[]).find(
        (f) => (errors as Record<string, unknown>)[f],
      );
      if (firstErrorField) {
        try {
          setFocus(firstErrorField as keyof InscriptionData);
        } catch {
          // Algunos campos (radios/checkboxes) pueden no ser focuseables vía setFocus
        }
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const onInvalidSubmit = (formErrors: Record<string, unknown>) => {
    // Mover foco al primer campo con error
    const orderedFields = [
      ...step1Fields,
      ...step2Fields,
      ...step3Fields,
      ...step4Fields,
    ] as readonly string[];
    const firstErrorField = orderedFields.find((f) => formErrors[f]);
    if (firstErrorField) {
      try {
        setFocus(firstErrorField as keyof InscriptionData);
      } catch {
        // Ignorar si el campo no es focuseable
      }
    }
  };

  const onSubmit: SubmitHandler<InscriptionData> = async (data) => {
    setSubmitStatus('submitting');
    setErrorMessage('');

    const selectedProgram = programs.find((p) => p.id === data.programId);

    const formData = new FormData();
    formData.append('access_key', import.meta.env.PUBLIC_WEB3FORMS_KEY);
    formData.append('subject', `Nueva inscripcion - ${data.riderName}`);
    formData.append('from_name', data.guardianName);

    // Honeypot
    formData.append('botcheck', '');

    // Formatted fields
    formData.append('Programa', selectedProgram?.title ?? data.programId);
    formData.append('Edad Corredor', `${data.riderAge} años`);
    formData.append('Nombre Corredor', data.riderName);
    formData.append('Fecha Nacimiento', `${data.birthDay}/${data.birthMonth}/${data.birthYear}`);
    formData.append('Genero', data.gender);
    formData.append('Talla Camiseta', data.shirtSize);
    formData.append('Experiencia', data.experience);
    formData.append('Acudiente / Contacto Emergencia', data.guardianName);
    formData.append('Celular', data.guardianPhone);
    formData.append('Email', data.guardianEmail);
    if (data.guardianAddress) formData.append('Direccion', data.guardianAddress);
    formData.append('EPS', data.riderEps);
    formData.append('Parentesco', data.relationship);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setSubmitStatus('success');
        clearSavedData();
      } else {
        setSubmitStatus('error');
        setErrorMessage('Error al enviar. Intenta de nuevo.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Error de conexion. Verifica tu internet e intenta de nuevo.');
    }
  };

  // ─── Success Screen ─────────────────────────────────────────────────────────

  if (submitStatus === 'success') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Inscripcion enviada con exito
        </h2>
        <p className="mt-2 text-text-secondary">
          Hemos recibido la inscripcion de <strong>{getValues('riderName')}</strong> al programa{' '}
          <strong>{programs.find((p) => p.id === getValues('programId'))?.title}</strong>.
        </p>

        <div className="mt-8 rounded-xl bg-surface-muted p-6 text-left">
          <h3 className="font-display text-lg font-semibold text-text-primary">
            Que sigue?
          </h3>
          <ol className="mt-4 space-y-3 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">1</span>
              Recibiras un email de confirmacion en tu correo.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">2</span>
              Nos comunicaremos contigo en las proximas 24-48 horas.
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">3</span>
              Te indicaremos fecha de inicio y equipo necesario.
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`${CONTACT.whatsapp}?text=${encodeURIComponent('Hola, acabo de inscribir a mi hijo/a en Trocha y Ruta.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.344 0-4.525-.691-6.365-1.873l-.444-.296-3.26 1.093 1.093-3.26-.296-.444A9.958 9.958 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
            </svg>
            Escribenos por WhatsApp
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────

  const values = getValues();
  const selectedProgram = programs.find((p) => p.id === values.programId);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Anuncio de paso para lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Paso ${currentStep + 1} de ${STEPS.length}: ${STEPS[currentStep].label}`}
      </div>

      {/* Progress Bar */}
      <nav aria-label="Progreso de inscripcion" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <li key={step.label} className={`flex items-center ${idx < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-colors ${
                      isCompleted
                        ? 'bg-primary text-white'
                        : isCurrent
                          ? 'border-2 border-primary bg-white text-primary'
                          : 'border-2 border-gray-300 bg-white text-gray-400'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span
                    className={`mt-1 text-xs font-medium hidden sm:block ${
                      isCurrent ? 'text-primary' : isCompleted ? 'text-text-primary' : 'text-gray-400'
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      idx < currentStep ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
        noValidate
        className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"
      >
        {/* Honeypot */}
        <input type="text" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

        <div ref={stepRef} tabIndex={-1} className="outline-none">
          {/* ─── Step 1: Programa ──────────────────────────────────────── */}
          {currentStep === 0 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-text-primary">
                Selecciona un programa
              </legend>
              <p className="mt-1 text-sm text-text-secondary">
                Elige el programa que mejor se ajuste a la edad y nivel de tu hijo/a.
              </p>

              <div className="mt-6 space-y-3">
                {programs.map((program) => (
                  <label
                    key={program.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-colors ${
                      values.programId === program.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={program.id}
                      {...register('programId')}
                      className="h-11 w-11 shrink-0 border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-semibold text-text-primary">{program.title}</span>
                      <span className="ml-2 text-sm text-text-secondary">({program.ageRange})</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.programId && (
                <p className="mt-2 text-sm text-red-600" role="alert">{errors.programId.message}</p>
              )}

              <div className="mt-6">
                <label htmlFor="riderAge" className="block text-sm font-medium text-text-primary">
                  Edad del corredor
                </label>
                <select
                  id="riderAge"
                  {...register('riderAge')}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">Seleccionar edad</option>
                  {Array.from({ length: 48 }, (_, i) => i + 3).map((age) => (
                    <option key={age} value={String(age)}>
                      {age} años
                    </option>
                  ))}
                </select>
                {errors.riderAge && (
                  <p className="mt-1 text-sm text-red-600" role="alert">{errors.riderAge.message}</p>
                )}
              </div>
            </fieldset>
          )}

          {/* ─── Step 2: Corredor ──────────────────────────────────────── */}
          {currentStep === 1 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-text-primary">
                Datos del corredor
              </legend>
              <p className="mt-1 text-sm text-text-secondary">
                Informacion basica del nino o nina que se inscribe.
              </p>

              <div className="mt-6 space-y-5">
                {/* Nombre */}
                <div>
                  <label htmlFor="riderName" className="block text-sm font-medium text-text-primary">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="riderName"
                    type="text"
                    {...register('riderName')}
                    autoComplete="name"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.riderName && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.riderName.message}</p>
                  )}
                </div>

                {/* Fecha nacimiento */}
                <div>
                  <span className="block text-sm font-medium text-text-primary">
                    Fecha de nacimiento <span className="text-red-500">*</span>
                  </span>
                  <div className="mt-1 grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="birthDay" className="sr-only">Dia</label>
                      <select
                        id="birthDay"
                        {...register('birthDay')}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Dia</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="birthMonth" className="sr-only">Mes</label>
                      <select
                        id="birthMonth"
                        {...register('birthMonth')}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Mes</option>
                        {MONTHS.map((m, i) => (
                          <option key={m} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="birthYear" className="sr-only">Año</label>
                      <select
                        id="birthYear"
                        {...register('birthYear')}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Año</option>
                        {Array.from({ length: 51 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(errors.birthDay || errors.birthMonth || errors.birthYear) && (
                    <p className="mt-1 text-sm text-red-600" role="alert">Completa la fecha de nacimiento</p>
                  )}
                </div>

                {/* Genero */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-text-primary">
                    Genero <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    {...register('gender')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.gender.message}</p>
                  )}
                </div>

                {/* Talla camiseta */}
                <div>
                  <span className="block text-sm font-medium text-text-primary">
                    Talla de camiseta <span className="text-red-500">*</span>
                  </span>
                  <div className="mt-2 flex gap-4">
                    {SHIRT_SIZES.map((size) => (
                      <label
                        key={size}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          values.shirtSize === size
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 text-text-secondary hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={size}
                          {...register('shirtSize')}
                          className="sr-only"
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                  {errors.shirtSize && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.shirtSize.message}</p>
                  )}
                </div>

                {/* Experiencia */}
                <div>
                  <span className="block text-sm font-medium text-text-primary">
                    Experiencia previa <span className="text-red-500">*</span>
                  </span>
                  <div className="mt-2 space-y-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                          values.experience === level.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={level.value}
                          {...register('experience')}
                          className="h-11 w-11 shrink-0 border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text-primary">{level.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.experience.message}</p>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          {/* ─── Step 3: Acudiente ─────────────────────────────────────── */}
          {currentStep === 2 && (
            <fieldset>
              <legend className="font-display text-xl font-bold text-text-primary">
                Acudiente / Contacto de emergencia
              </legend>
              <p className="mt-1 text-sm text-text-secondary">
                Información del padre, madre o acudiente responsable. Esta persona será también el contacto de emergencia.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="guardianName" className="block text-sm font-medium text-text-primary">
                    Nombre completo del acudiente / contacto de emergencia <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="guardianName"
                    type="text"
                    {...register('guardianName')}
                    autoComplete="name"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.guardianName && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.guardianName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guardianPhone" className="block text-sm font-medium text-text-primary">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="guardianPhone"
                    type="tel"
                    {...register('guardianPhone')}
                    placeholder="3001234567"
                    autoComplete="tel"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.guardianPhone && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.guardianPhone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guardianEmail" className="block text-sm font-medium text-text-primary">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="guardianEmail"
                    type="email"
                    {...register('guardianEmail')}
                    autoComplete="email"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.guardianEmail && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.guardianEmail.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="guardianAddress" className="block text-sm font-medium text-text-primary">
                    Direccion <span className="text-sm font-normal text-text-secondary">(opcional)</span>
                  </label>
                  <input
                    id="guardianAddress"
                    type="text"
                    {...register('guardianAddress')}
                    autoComplete="street-address"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="riderEps" className="block text-sm font-medium text-text-primary">
                    EPS del nino/a <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="riderEps"
                    type="text"
                    {...register('riderEps')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  {errors.riderEps && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.riderEps.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="relationship" className="block text-sm font-medium text-text-primary">
                    Parentesco <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="relationship"
                    {...register('relationship')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Seleccionar</option>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r.toLowerCase()}>{r}</option>
                    ))}
                  </select>
                  {errors.relationship && (
                    <p className="mt-1 text-sm text-red-600" role="alert">{errors.relationship.message}</p>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          {/* ─── Step 4: Confirmar ─────────────────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Confirma los datos
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Revisa la informacion antes de enviar la inscripcion.
              </p>

              <div className="mt-6 space-y-4">
                {/* Programa summary */}
                <SummarySection
                  title="Programa"
                  onEdit={() => goToStep(0)}
                  items={[
                    { label: 'Programa', value: selectedProgram?.title ?? values.programId },
                    { label: 'Edad', value: values.riderAge ? `${values.riderAge} años` : '' },
                  ]}
                />

                {/* Corredor summary */}
                <SummarySection
                  title="Corredor"
                  onEdit={() => goToStep(1)}
                  items={[
                    { label: 'Nombre', value: values.riderName },
                    { label: 'Nacimiento', value: values.birthDay && values.birthMonth && values.birthYear ? `${values.birthDay}/${values.birthMonth}/${values.birthYear}` : '' },
                    { label: 'Genero', value: values.gender },
                    { label: 'Talla', value: values.shirtSize },
                    { label: 'Experiencia', value: values.experience },
                  ]}
                />

                {/* Acudiente summary */}
                <SummarySection
                  title="Acudiente / Contacto de emergencia"
                  onEdit={() => goToStep(2)}
                  items={[
                    { label: 'Nombre', value: values.guardianName },
                    { label: 'Celular', value: values.guardianPhone },
                    { label: 'Email', value: values.guardianEmail },
                    ...(values.guardianAddress ? [{ label: 'Direccion', value: values.guardianAddress }] : []),
                    { label: 'EPS', value: values.riderEps },
                    { label: 'Parentesco', value: values.relationship },
                  ]}
                />
              </div>

              {/* Checkboxes */}
              <div className="mt-6 space-y-4">
                <label className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="h-11 w-11 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-secondary">
                    Acepto los terminos y condiciones del Club Deportivo Trocha y Ruta <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600" role="alert">{errors.acceptTerms.message}</p>
                )}

                <label className="flex items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    {...register('acceptDataPolicy')}
                    className="h-11 w-11 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-secondary">
                    Autorizo el tratamiento de datos personales segun la Ley 1581 de 2012 <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.acceptDataPolicy && (
                  <p className="text-sm text-red-600" role="alert">{errors.acceptDataPolicy.message}</p>
                )}
              </div>

              {submitStatus === 'error' && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Navigation Buttons ──────────────────────────────────────── */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Atras
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Siguiente
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitStatus === 'submitting'}
              className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitStatus === 'submitting' ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Inscripcion'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Summary Section Component ───────────────────────────────────────────────

function SummarySection({
  title,
  onEdit,
  items,
}: {
  title: string;
  onEdit: () => void;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-text-primary">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Editar
        </button>
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-2 sm:gap-x-4">
        {items.map((item) => (
          <div key={item.label} className="contents">
            <dt className="text-text-secondary">{item.label}</dt>
            <dd className="text-text-primary font-medium break-all">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
