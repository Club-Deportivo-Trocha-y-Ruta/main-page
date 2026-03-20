export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
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
