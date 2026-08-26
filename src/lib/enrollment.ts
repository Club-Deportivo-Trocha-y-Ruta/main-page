/**
 * Datos duros del proceso de inscripción: los pasos desde que se envía la
 * preinscripción hasta el primer entrenamiento, los documentos que pide el
 * club para confirmarla y el detalle de la póliza deportiva.
 *
 * Nada de esto sale de una collection — es información fija que publica el
 * club, con el mismo patrón que `EVENT_CATEGORIES` en calendar.ts o
 * `LEVEL_STYLES` en programs.ts. Lo único que varía por contenido (qué
 * programa le corresponde a cada edad) sigue viniendo de la collection
 * `programs`, en `src/pages/inscripciones.astro`.
 */

export interface EnrollmentStep {
  /** Qué hace la familia o el club en este paso. */
  title: string;
  /** Detalle en una o dos frases. */
  body: string;
  /** Icono Phosphor del paso. */
  icon: string;
}

/**
 * El recorrido completo, en orden: del formulario al primer entrenamiento.
 * La numeración visible ("Paso 1", "Paso 2"…) se deriva de la posición en
 * esta lista — igual que el "01/02/03" de la ruta de programas — así que no
 * se guarda aquí como dato propio de cada paso.
 */
export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  {
    title: 'Envías la preinscripción',
    body: 'Completas el formulario con los datos del programa, el corredor y el acudiente. Es una solicitud: todavía no es un cupo confirmado.',
    icon: 'ph:clipboard-text-bold',
  },
  {
    title: 'El director deportivo te contacta',
    body: 'Se comunica contigo en las próximas 24 a 48 horas para resolver dudas y agendar la clase de prueba.',
    icon: 'ph:phone-call-bold',
  },
  {
    title: 'Clase de prueba gratuita',
    body: 'Tu hijo o hija conoce la pista, a los entrenadores y a su grupo. No tiene costo ni compromiso.',
    icon: 'ph:bicycle-bold',
  },
  {
    title: 'Entregas los documentos y pagas el seguro',
    body: 'Con la clase de prueba hecha, completas la inscripción: presentas los documentos que pide el club y pagas el seguro deportivo anual.',
    icon: 'ph:identification-card-bold',
  },
  {
    title: 'Primer entrenamiento',
    body: 'Con la inscripción confirmada, tu hijo o hija se integra a su programa y arranca a entrenar con su grupo.',
    icon: 'ph:user-check-bold',
  },
];

export interface RequiredDocument {
  label: string;
  /** Icono Phosphor del documento. */
  icon: string;
}

/**
 * Lo que pide el club para confirmar la inscripción (paso 4 del proceso).
 * Fuente única para el checklist de `/inscripciones` y el de la pantalla
 * de éxito de `InscriptionForm.tsx` — ninguno de los dos repite esta copia.
 */
export const ENROLLMENT_DOCUMENTS: RequiredDocument[] = [
  { label: 'Documento de identidad del niño o niña', icon: 'ph:identification-card-bold' },
  { label: 'EPS vigente', icon: 'ph:heartbeat-bold' },
  { label: 'Autorización firmada del acudiente', icon: 'ph:signature-bold' },
];

export interface PolicyCoverage {
  label: string;
  /** Monto tal como lo publica la aseguradora: no se redondea ni se reformula. */
  amount: string;
  /** Icono Phosphor de la cobertura. */
  icon: string;
}

export interface EnrollmentPolicy {
  insurer: string;
  /** Vigencia legible: "Marzo 2026 – marzo 2027". */
  validity: string;
  /** Valor anual formateado con separador de miles: "$60.000". */
  annualFee: string;
  coverages: PolicyCoverage[];
}

/**
 * Póliza de accidentes personales que el club gestiona para todos los
 * deportistas activos. Los montos son los que publica la aseguradora;
 * "Ambulancia para eventos" no trae un tope en pesos en el documento fuente,
 * así que su valor describe la cobertura en vez de inventar una cifra.
 */
export const ENROLLMENT_POLICY: EnrollmentPolicy = {
  insurer: 'Aseguradora Solidaria de Colombia',
  validity: 'Marzo 2026 – marzo 2027',
  annualFee: '$60.000',
  coverages: [
    { label: 'Gastos médicos', amount: 'Hasta $5.000.000', icon: 'ph:first-aid-kit-bold' },
    { label: 'Rehabilitación integral', amount: '$10.000.000', icon: 'ph:wheelchair-bold' },
    { label: 'Traslado en ambulancia', amount: '$500.000', icon: 'ph:ambulance-bold' },
    { label: 'Renta hospitalaria', amount: '$50.000/día (30 días)', icon: 'ph:hospital-bold' },
    { label: 'Incapacidad total', amount: '$10.000.000', icon: 'ph:bandaids-bold' },
    {
      label: 'Ambulancia para eventos',
      amount: 'Incluida en la póliza',
      icon: 'ph:ambulance-bold',
    },
  ],
};
