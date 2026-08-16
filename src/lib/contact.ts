/**
 * Lógica compartida de la página de Contacto.
 *
 * Una familia que escribe al club está decidiendo algo, y no todas las
 * preguntas se responden por el mismo canal: lo urgente va por WhatsApp, lo
 * que necesita detalle por el formulario, lo que lleva documentos por correo,
 * y lo que solo se entiende viéndolo, yendo a la pista. Ese vocabulario vive
 * aquí una sola vez, igual que `ENROLLMENT_STEPS` o `DOCUMENT_CATEGORIES`.
 *
 * Lo demás sale del contenido. En particular **la semana del club**: la página
 * anunciaba a mano "Lunes a Viernes: 3:00 PM - 7:00 PM · Sábados: 7:00 AM -
 * 12:00 PM", que contradecía la colección `programs` —entre semana se entrena
 * de 4 a 6, el sábado hasta las 9 y los domingos, que no se mencionaban—.
 * Ahora el ritmo se deriva de los `schedule` reales con `parseSchedule()`.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`. Recibe los datos por
 * parámetro, igual que `gallery.ts` o `transparency.ts`.
 */
import { CONTACT } from './constants';
import { parseSchedule, WEEK_DAYS, WEEK_DAY_LABELS, type WeekDay } from './programs';

// ─── Canales ────────────────────────────────────────────────────────────────

export type ChannelId = 'whatsapp' | 'formulario' | 'correo' | 'pista';

export interface ContactChannel {
  id: ChannelId;
  label: string;
  /** En qué caso conviene este canal y no otro. */
  purpose: string;
  /** Qué conviene tener a mano antes de usarlo. */
  bring: string;
  icon: string;
  href: string;
  /** El destino sale del sitio: necesita `target="_blank"`. */
  external: boolean;
  cta: string;
  /**
   * Nombre del catálogo cerrado de `src/lib/events.ts`. Solo se declara donde
   * existe: un nombre fuera de `EVENT_NAMES` se descarta en la sanitización.
   */
  analyticsEvent?: string;
}

const WHATSAPP_TEXT = encodeURIComponent(
  'Hola, quiero información sobre el Club Deportivo Trocha y Ruta'
);

/**
 * Los cuatro canales, del más rápido al más lento. Los dos anclas (`#escribir`,
 * `#donde`) apuntan a secciones de esta misma página: quien no sabe por dónde
 * empezar no sale del sitio para averiguarlo.
 */
export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    purpose: 'Para una pregunta puntual: si hay cupo, cuánto cuesta, si pueden ir a mirar.',
    bring: 'La edad de tu hijo o hija, para poder decirte a qué programa entra.',
    icon: 'ph:whatsapp-logo-bold',
    href: `${CONTACT.whatsapp}?text=${WHATSAPP_TEXT}`,
    external: true,
    cta: 'Abrir WhatsApp',
    analyticsEvent: 'whatsapp_click',
  },
  {
    id: 'formulario',
    label: 'Formulario',
    purpose: 'Para lo que necesita explicación y quieres dejar por escrito.',
    bring: 'Un correo donde podamos responderte.',
    icon: 'ph:chat-teardrop-text-bold',
    href: '#escribir',
    external: false,
    cta: 'Ir al formulario',
  },
  {
    id: 'correo',
    label: 'Correo',
    purpose: 'Para lo que lleva adjuntos: documentos, certificados, propuestas de patrocinio.',
    bring: 'Los archivos listos, en PDF si se puede.',
    icon: 'ph:envelope-simple-bold',
    href: `mailto:${CONTACT.email}`,
    external: false,
    cta: CONTACT.email,
  },
  {
    id: 'pista',
    label: 'En la pista',
    purpose: 'Para conocer el club sin escribir nada: llegas en un día de entrenamiento y miras.',
    bring: 'Nada. Los papás son bienvenidos a acompañar el entrenamiento.',
    icon: 'ph:map-pin-area-bold',
    href: '#donde',
    external: false,
    cta: 'Ver dónde queda',
  },
];

// ─── La semana del club ─────────────────────────────────────────────────────

/** Un programa, con lo que hace falta para ubicarlo en la semana. */
export interface ProgramScheduleInput {
  id: string;
  title: string;
  schedule: string;
  targetLevel: string;
  /** Orden del programa en la ruta de formación. */
  order?: number;
}

/** Momento del día de una sesión. */
export type DayPeriod = 'mañana' | 'tarde';

export const DAY_PERIODS: readonly DayPeriod[] = ['mañana', 'tarde'];

/**
 * Mañana o tarde, leído del AM/PM de la franja.
 *
 * Es lo que le da forma a la semana del club: de lunes a viernes se entrena en
 * la tarde, después del colegio, y el fin de semana temprano en la mañana. Sin
 * AM/PM devuelve `null` y la sesión no se ubica en ninguno de los dos.
 */
export function sessionPeriod(time: string | null): DayPeriod | null {
  if (!time) return null;
  if (/\ba\.?\s?m\.?\b/i.test(time)) return 'mañana';
  if (/\bp\.?\s?m\.?\b/i.test(time)) return 'tarde';
  return null;
}

/** Una sesión concreta: qué programa entrena ese día, a qué hora y qué hace. */
export interface DaySession {
  programId: string;
  programTitle: string;
  targetLevel: string;
  /** Franja tal como la escribió el club. `null` si el tramo no trae hora. */
  time: string | null;
  /** Qué se hace en esa sesión: "salida", "gymkanas en pista". */
  note: string | null;
  /** Mañana o tarde. `null` cuando la franja no lo dice. */
  period: DayPeriod | null;
}

export interface WeekDayPlan {
  day: WeekDay;
  label: string;
  short: string;
  initial: string;
  sessions: DaySession[];
  /** Ningún programa entrena ese día. */
  rest: boolean;
}

/** Un horario que no se pudo leer: se muestra tal cual en vez de perderse. */
export interface UnreadableSchedule {
  programId: string;
  programTitle: string;
  raw: string;
}

export interface WeekRhythm {
  /** Los siete días, siempre, en orden de lunes a domingo. */
  days: WeekDayPlan[];
  /** Días con al menos una sesión. */
  activeDays: number;
  /** Total de sesiones de la semana, sumando todos los programas. */
  totalSessions: number;
  unreadable: UnreadableSchedule[];
}

/**
 * Arma la semana real del club a partir de los `schedule` de los programas.
 *
 * Los programas se recorren en el orden de la ruta de formación (`order`), así
 * que dentro de un día las sesiones salen siempre en el mismo orden: primero
 * los pequeños, después los mayores.
 *
 * Un tramo del que `parseSchedule()` no reconoció ningún día no se descarta:
 * cae en `unreadable` con su texto original, para que la plantilla lo muestre
 * como está. Nada se inventa y nada desaparece en silencio.
 */
export function buildWeekRhythm(programs: ProgramScheduleInput[]): WeekRhythm {
  const byDay = new Map<WeekDay, DaySession[]>(WEEK_DAYS.map((day) => [day, []]));
  const unreadable: UnreadableSchedule[] = [];
  let totalSessions = 0;

  const ordered = [...programs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  for (const program of ordered) {
    for (const segment of parseSchedule(program.schedule)) {
      if (segment.days.length === 0) {
        unreadable.push({
          programId: program.id,
          programTitle: program.title,
          raw: segment.raw,
        });
        continue;
      }

      for (const day of segment.days) {
        byDay.get(day)?.push({
          programId: program.id,
          programTitle: program.title,
          targetLevel: program.targetLevel,
          time: segment.time,
          note: segment.note,
          period: sessionPeriod(segment.time),
        });
        totalSessions++;
      }
    }
  }

  const days: WeekDayPlan[] = WEEK_DAYS.map((day) => {
    const sessions = byDay.get(day) ?? [];
    return {
      day,
      ...WEEK_DAY_LABELS[day],
      sessions,
      rest: sessions.length === 0,
    };
  });

  return {
    days,
    activeDays: days.filter((d) => !d.rest).length,
    totalSessions,
    unreadable,
  };
}

/** Una fila de la ilustración: un momento del día a lo largo de la semana. */
export interface PeriodRow {
  period: DayPeriod;
  label: string;
  icon: string;
  cells: { day: WeekDay; initial: string; label: string; sessions: number }[];
}

const PERIOD_META: Record<DayPeriod, { label: string; icon: string }> = {
  'mañana': { label: 'Mañana', icon: 'ph:sun-horizon-bold' },
  'tarde': { label: 'Tarde', icon: 'ph:sun-bold' },
};

/**
 * La rejilla que ilustra la forma de la semana: dos filas —mañana y tarde— por
 * los siete días. Dibujada, se lee de un vistazo lo que en una lista costaría
 * varios párrafos: el club entrena de tarde entre semana, después del colegio,
 * y de mañana el fin de semana.
 *
 * Una fila sin ninguna sesión en toda la semana no se devuelve: si el club
 * nunca entrenara de mañana, no habría por qué pintar esa franja vacía.
 */
export function buildPeriodGrid(days: WeekDayPlan[]): PeriodRow[] {
  return DAY_PERIODS.map((period) => ({
    period,
    ...PERIOD_META[period],
    cells: days.map((day) => ({
      day: day.day,
      initial: day.initial,
      label: day.label,
      sessions: day.sessions.filter((session) => session.period === period).length,
    })),
  })).filter((row) => row.cells.some((cell) => cell.sessions > 0));
}

// ─── Dónde se entrena ───────────────────────────────────────────────────────

export interface TrainingPlace {
  programId: string;
  programTitle: string;
  location: string;
}

/**
 * El lugar de cada programa. El campo `location` del frontmatter dice cosas
 * que la página nunca mostraba y que sí importan —"Punto de encuentro: …",
 * "Variado: pista Yumbo (miércoles) y salidas por fuera"—: no todos los
 * programas entrenan siempre en el mismo sitio.
 *
 * Los programas sin `location` simplemente no aparecen.
 */
export function trainingPlaces(
  programs: (Pick<ProgramScheduleInput, 'id' | 'title' | 'order'> & { location?: string })[]
): TrainingPlace[] {
  return [...programs]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter((program): program is typeof program & { location: string } => Boolean(program.location))
    .map((program) => ({
      programId: program.id,
      programTitle: program.title,
      location: program.location,
    }));
}

// ─── Preguntas que conviene leer antes de escribir ──────────────────────────

/**
 * De qué habla alguien que está a punto de escribirle al club: si su hijo tiene
 * la edad, si necesita saber montar, cuánto cuesta y cómo es el proceso. Las de
 * horario y ubicación quedan fuera a propósito: esta página ya las responde
 * arriba, con la semana y el mapa.
 */
export const CONTACT_FAQ_CATEGORIES = ['general', 'inscripciones'] as const;

interface FaqInput {
  data: { question: string; answer: string; category: string; order: number; draft?: boolean };
}

/**
 * Las preguntas más frecuentes que aplican a esta página, ordenadas por el
 * `order` que les puso el club. Devuelve una lista vacía —y entonces el bloque
 * no se pinta— cuando no hay ninguna de esas categorías.
 */
export function selectContactFaqs<T extends FaqInput>(faqs: T[], limit = 4): T[] {
  const categories = new Set<string>(CONTACT_FAQ_CATEGORIES);

  return faqs
    .filter((faq) => !faq.data.draft && categories.has(faq.data.category))
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, limit);
}
