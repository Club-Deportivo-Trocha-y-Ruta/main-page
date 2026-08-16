/**
 * Lógica compartida de la página 404.
 *
 * Un 404 no es un callejón sin salida: es una señal de ruta. En vez de un
 * botón genérico a la portada, la página ofrece los cuatro puntos de control
 * reales del sitio —calendario, noticias, programas, inscripciones— y cada
 * uno con un dato derivado del contenido, no un texto fijo escrito en la
 * plantilla.
 *
 * Mismo contrato que `summarizePrograms()` o `summarizeDocuments()`: si el
 * contenido no sostiene el dato (no hay próxima fecha, no hay noticias
 * todavía), el punto de control aparece igual — solo que con `fact: null` en
 * vez de un texto inventado.
 *
 * Puro, sin `node:fs` y sin importar `astro:content` — recibe los datos por
 * parámetro, igual que `gallery.ts` o `transparency.ts`, para poder testearlo
 * sin tocar disco ni collections. Reutiliza las derivaciones que ya existen
 * (`buildSeason`, `summarizePrograms`, `ENROLLMENT_STEPS`) en vez de
 * recalcularlas.
 */
import { buildSeason, dayLabel, monthShort } from './calendar';
import { summarizePrograms } from './programs';
import { ENROLLMENT_STEPS, type EnrollmentStep } from './enrollment';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type ControlPointId = 'calendario' | 'noticias' | 'programas' | 'inscripciones';

/** El dato que respalda un punto de control. `null` cuando el contenido no lo sostiene todavía. */
export interface ControlPointFact {
  icon: string;
  label: string;
  value: string;
}

export interface ControlPoint {
  id: ControlPointId;
  /** Nombre de la entrada, como aparece en la navegación del sitio. */
  label: string;
  /** Qué hay detrás del enlace, sin importar si el `fact` existe. */
  description: string;
  /** Texto del enlace: qué hace quien lo sigue. */
  cta: string;
  href: string;
  /** Icono Phosphor de cabecera de la tarjeta. */
  icon: string;
  fact: ControlPointFact | null;
}

// ─── Calendario ─────────────────────────────────────────────────────────────

interface CalendarEventInput {
  id: string;
  data: { title: string; date: Date; endDate?: Date; city?: string; status?: string };
}

/**
 * La próxima fecha real de la temporada, vía `buildSeason()` — la misma
 * derivación que ya usa `/calendario`. Sin próxima fecha (toda la temporada ya
 * corrió, o no hay eventos publicados), el punto de control se devuelve
 * igual, con `fact: null`: no se inventa una fecha para no dejarlo vacío.
 */
export function calendarControlPoint(
  events: CalendarEventInput[],
  now: Date = new Date()
): ControlPoint {
  const { next } = buildSeason(events, now);

  return {
    id: 'calendario',
    label: 'Calendario',
    description: 'Fechas, resultados y crónica de cada válida de la temporada.',
    cta: 'Ver el calendario',
    href: '/calendario',
    icon: 'ph:calendar-dots-bold',
    fact: next
      ? {
          icon: 'ph:flag-checkered-bold',
          label: 'Próxima fecha',
          value: `${next.day} de ${next.month} · ${next.label}`,
        }
      : null,
  };
}

// ─── Noticias ───────────────────────────────────────────────────────────────

interface NewsInput {
  data: { title: string; date: Date };
}

/** La más reciente por fecha, sin asumir que la lista ya llega ordenada. */
function latestNews<T extends NewsInput>(news: T[]): T | null {
  return news.reduce<T | null>((latest, article) => {
    if (!latest) return article;
    return article.data.date.getTime() > latest.data.date.getTime() ? article : latest;
  }, null);
}

/**
 * La última crónica publicada: su título y su fecha, en el mismo formato
 * corto (`día de mes`) que ya usan `SeasonTrack` y `TrochaVerdeTimeline`. Sin
 * noticias, `fact` queda en `null`.
 */
export function newsControlPoint(news: NewsInput[]): ControlPoint {
  const latest = latestNews(news);

  return {
    id: 'noticias',
    label: 'Noticias',
    description: 'Las crónicas de cada carrera, con protagonistas y resultados.',
    cta: 'Leer las noticias',
    href: '/noticias',
    icon: 'ph:newspaper-bold',
    fact: latest
      ? {
          icon: 'ph:newspaper-bold',
          label: 'Última crónica',
          value: `${latest.data.title} · ${dayLabel(latest.data.date)} de ${monthShort(latest.data.date)}`,
        }
      : null,
  };
}

// ─── Programas ──────────────────────────────────────────────────────────────

interface ProgramSummaryInput {
  ageMin: number;
  ageMax: number;
  schedule?: string;
  maxStudents?: number;
}

/**
 * Cuántos programas hay y desde qué edad, vía `summarizePrograms()` — la
 * misma cifra de cabecera que ya usa `/programas`. `ageRange` solo es `null`
 * cuando no hay programas publicados: ese es el único caso en que se omite
 * el dato.
 */
export function programsControlPoint(programs: ProgramSummaryInput[]): ControlPoint {
  const totals = summarizePrograms(programs);

  return {
    id: 'programas',
    label: 'Programas',
    description: 'Las etapas de formación, de la iniciación al alto rendimiento.',
    cta: 'Conocer los programas',
    href: '/programas',
    icon: 'ph:path-bold',
    fact: totals.ageRange
      ? {
          icon: 'ph:users-three-bold',
          label: 'Programas activos',
          value: `${totals.programs} ${totals.programs === 1 ? 'programa' : 'programas'} · ${totals.ageRange} años`,
        }
      : null,
  };
}

// ─── Inscripciones ──────────────────────────────────────────────────────────

/**
 * El paso siguiente para quien llegó buscando cómo entrar: el primero de
 * `ENROLLMENT_STEPS` (`@lib/enrollment`), la misma lista que numera
 * `/inscripciones`. Recibe los pasos por parámetro —con la constante real
 * como valor por defecto— para poder testear el caso sin pasos sin depender
 * de ese módulo.
 */
export function enrollmentControlPoint(steps: EnrollmentStep[] = ENROLLMENT_STEPS): ControlPoint {
  const first = steps[0];

  return {
    id: 'inscripciones',
    label: 'Inscripciones',
    description: 'Cómo entra tu hijo o hija al club, paso a paso.',
    cta: 'Empezar la inscripción',
    href: '/inscripciones',
    icon: 'ph:clipboard-text-bold',
    fact: first
      ? { icon: first.icon, label: `Paso 1 de ${steps.length}`, value: first.title }
      : null,
  };
}

// ─── Los cuatro juntos ────────────────────────────────────────────────────

export interface ControlPointsInput {
  events: CalendarEventInput[];
  news: NewsInput[];
  programs: ProgramSummaryInput[];
  now?: Date;
}

/**
 * Los cuatro puntos de control, siempre en el mismo orden — calendario,
 * noticias, programas, inscripciones — sin importar qué dato falte o sobre.
 * Un punto de control nunca desaparece: como mucho, su `fact` queda en
 * `null`.
 */
export function buildControlPoints({
  events,
  news,
  programs,
  now = new Date(),
}: ControlPointsInput): ControlPoint[] {
  return [
    calendarControlPoint(events, now),
    newsControlPoint(news),
    programsControlPoint(programs),
    enrollmentControlPoint(),
  ];
}
