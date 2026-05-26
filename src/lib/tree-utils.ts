/**
 * Shared lookup tables for tree collection display labels and colors.
 * Used by index.astro, TrochaVerdeGrid.astro, TrochaVerdeSiembras.astro, and species detail pages.
 */

export const categoryLabels: Record<string, string> = {
  frutal: 'Frutal',
  ornamental: 'Ornamental',
  nativo: 'Nativo',
  maderable: 'Maderable',
};

export const categoryColors: Record<string, { bg: string; text: string }> = {
  frutal: { bg: 'bg-amber-100', text: 'text-amber-700' },
  ornamental: { bg: 'bg-purple-100', text: 'text-purple-900' },
  nativo: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  maderable: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export const statusLabels: Record<string, string> = {
  sembrado: 'Sembrado',
  creciendo: 'Creciendo',
  floreciendo: 'Floreciendo',
};

export const statusColors: Record<string, { bg: string; text: string }> = {
  sembrado: { bg: 'bg-sky-100', text: 'text-sky-700' },
  creciendo: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  floreciendo: { bg: 'bg-pink-100', text: 'text-pink-700' },
};

export const journeyLabels: Record<number, string> = {
  0: 'Primera siembra',
  1: 'Segunda siembra',
  2: 'Tercera siembra',
  3: 'Cuarta siembra',
  4: 'Quinta siembra',
  5: 'Sexta siembra',
};
