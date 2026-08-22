/**
 * Lógica compartida del equipo adulto del club (colección `directivos`):
 * a qué área pertenece cada rol, en qué orden se leen las áreas y qué cifras
 * puede sostener la página.
 *
 * Mismo patrón que `DOCUMENT_CATEGORIES` en Transparencia o `CONTACT_CHANNELS`
 * en Contacto: el vocabulario editorial vive aquí, tipado, y la plantilla solo
 * lo pinta. Todo lo demás —nombre, cargo, credenciales— sale de
 * `src/content/directivos/*.md`; este módulo no inventa una sola línea de
 * texto sobre una persona.
 *
 * Regla del sistema editorial: sin fichas cargadas, `summarizeStaff()` devuelve
 * `null` y la página omite las cifras en vez de estimarlas.
 * Ver docs/04-sistema-editorial.md.
 */

/** Los mismos roles que declara `directivosSchema` (`src/lib/schemas.ts`). */
export type StaffRole =
  | 'presidente'
  | 'vicepresidente'
  | 'secretario'
  | 'tesorero'
  | 'fiscal'
  | 'vocal'
  | 'entrenador-principal'
  | 'entrenador'
  | 'preparador-fisico'
  | 'mecanico'
  | 'medico'
  | 'coordinador';

export type StaffAreaId = 'directiva' | 'tecnico';

export interface StaffArea {
  id: StaffAreaId;
  /** Titular del grupo. */
  label: string;
  /** Antetítulo corto, en el vocabulario de `SectionIntro`. */
  eyebrow: string;
  /** A qué pregunta de una familia responde este grupo. */
  purpose: string;
  /** Icono Phosphor del grupo. */
  icon: string;
  /** Orden de lectura: primero quién responde legalmente, después quién entrena. */
  order: number;
  /** Roles del schema que caen en esta área. */
  roles: StaffRole[];
}

export const STAFF_AREAS: Record<StaffAreaId, StaffArea> = {
  directiva: {
    id: 'directiva',
    label: 'Quién responde por el club',
    eyebrow: 'Junta directiva',
    purpose:
      'La junta que firma, rinde cuentas y responde legalmente por el club ante las familias y ante la liga.',
    icon: 'ph:bank-bold',
    order: 1,
    roles: ['presidente', 'vicepresidente', 'secretario', 'tesorero', 'fiscal', 'vocal'],
  },
  tecnico: {
    id: 'tecnico',
    label: 'Quién está en la pista',
    eyebrow: 'Cuerpo técnico',
    purpose:
      'Las personas adultas que acompañan cada entrenamiento y cada válida: quienes dirigen, preparan y atienden al grupo.',
    icon: 'ph:person-simple-bike-bold',
    order: 2,
    roles: [
      'entrenador-principal',
      'entrenador',
      'preparador-fisico',
      'mecanico',
      'medico',
      'coordinador',
    ],
  },
};

/** Áreas en orden de lectura. */
export const STAFF_AREA_ORDER: StaffAreaId[] = (Object.values(STAFF_AREAS) as StaffArea[])
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((area) => area.id);

/**
 * Un rol que el vocabulario no conozca no pierde a la persona: cae en el
 * cuerpo técnico, igual que `getCategoryProfile()` cae en su categoría de
 * respaldo en Transparencia.
 */
export function getAreaForRole(role: string): StaffArea {
  const match = (Object.values(STAFF_AREAS) as StaffArea[]).find((area) =>
    (area.roles as string[]).includes(role),
  );
  return match ?? STAFF_AREAS.tecnico;
}

/** Lo que la página necesita de una ficha de `directivos`. */
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  photo?: string;
  bio?: string;
  certifications: string[];
  yearJoined?: number;
  active: boolean;
  order: number;
  draft: boolean;
}

export interface StaffGroup {
  area: StaffArea;
  members: StaffMember[];
}

export interface StaffSummary {
  /** Personas publicables. */
  people: number;
  /** Áreas con al menos una persona. */
  areas: number;
  /** Credenciales declaradas en total, o `null` si ninguna ficha trae. */
  certifications: number | null;
  /** Año de ingreso más antiguo, o `null` si ninguna ficha lo declara. */
  sinceYear: number | null;
}

/** Mismo filtro de publicación que el resto del sitio: sin borradores ni inactivos. */
export function isPublishableStaff(member: StaffMember): boolean {
  return !member.draft && member.active;
}

/** Orden curado por el club (`order`) y, a igualdad, alfabético. */
export function sortStaff(members: StaffMember[]): StaffMember[] {
  return members.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'));
}

/**
 * Agrupa por área en el orden de lectura y **omite el área que nadie ocupa**,
 * para no dejar un encabezado de grupo sin fichas debajo (mismo criterio que
 * `groupByLevel()` en patrocinadores).
 */
export function groupStaffByArea(members: StaffMember[]): StaffGroup[] {
  return STAFF_AREA_ORDER.map((areaId) => ({
    area: STAFF_AREAS[areaId],
    members: sortStaff(members.filter((member) => getAreaForRole(member.role).id === areaId)),
  })).filter((group) => group.members.length > 0);
}

/**
 * Cifras de cabecera. Devuelve `null` sin personas publicables: la página no
 * pinta un "0 integrantes" ni una cifra de relleno.
 */
export function summarizeStaff(members: StaffMember[]): StaffSummary | null {
  if (members.length === 0) return null;

  const certifications = members.reduce((total, member) => total + member.certifications.length, 0);
  const years = members
    .map((member) => member.yearJoined)
    .filter((year): year is number => typeof year === 'number');

  return {
    people: members.length,
    areas: groupStaffByArea(members).length,
    certifications: certifications > 0 ? certifications : null,
    sinceYear: years.length > 0 ? Math.min(...years) : null,
  };
}
