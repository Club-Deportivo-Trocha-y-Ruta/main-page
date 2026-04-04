export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'pre-infantil': 'Pre-infantil',
    infantil: 'Infantil',
    juvenil: 'Juvenil',
    sub23: 'Sub-23',
    elite: 'Elite',
    master: 'Master',
  };
  return labels[category] ?? category;
}

export function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    upcoming: 'Proximo',
    ongoing: 'En curso',
    past: 'Pasado',
    cancelled: 'Cancelado',
  };
  return labels[status] ?? status;
}

interface CalendarEventParams {
  title: string;
  date: Date;
  location: string;
  description?: string;
  duration?: number; // horas, default 4
}

function toGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateGoogleCalendarUrl({
  title,
  date,
  location,
  description = '',
  duration = 4,
}: CalendarEventParams): string {
  const start = toGCalDate(date);
  const end = toGCalDate(new Date(date.getTime() + duration * 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    location,
    details: description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICSContent({
  title,
  date,
  location,
  description = '',
  duration = 4,
}: CalendarEventParams): string {
  const start = toGCalDate(date);
  const end = toGCalDate(new Date(date.getTime() + duration * 60 * 60 * 1000));
  const now = toGCalDate(new Date());
  const uid = `${start}-${title.toLowerCase().replace(/\s+/g, '-')}@clubtrochayruta`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trocha y Ruta//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
