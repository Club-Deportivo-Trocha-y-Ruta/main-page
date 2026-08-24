import { describe, it, expect } from 'vitest';
import {
  STAFF_AREAS,
  STAFF_AREA_ORDER,
  getAreaForRole,
  groupStaffByArea,
  isPublishableStaff,
  sortStaff,
  summarizeStaff,
  type StaffMember,
} from '../staff';

// Los nombres de los ejemplos son ficticios a propósito: la colección real está
// vacía y ninguna persona del club se escribe en un test.
function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 'persona-ejemplo',
    name: 'Persona Ejemplo',
    role: 'entrenador',
    roleLabel: 'Entrenadora',
    certifications: [],
    active: true,
    order: 0,
    draft: false,
    ...overrides,
  };
}

describe('STAFF_AREA_ORDER', () => {
  it('lee primero la junta directiva y después el cuerpo técnico', () => {
    expect(STAFF_AREA_ORDER).toEqual(['directiva', 'tecnico']);
  });

  it('cada rol del schema pertenece a una sola área', () => {
    const roles = STAFF_AREA_ORDER.flatMap((areaId) => STAFF_AREAS[areaId].roles);
    expect(new Set(roles).size).toBe(roles.length);
  });
});

describe('getAreaForRole', () => {
  it('ubica los cargos de la junta en la directiva', () => {
    expect(getAreaForRole('presidente').id).toBe('directiva');
    expect(getAreaForRole('tesorero').id).toBe('directiva');
  });

  it('ubica los cargos de pista en el cuerpo técnico', () => {
    expect(getAreaForRole('entrenador-principal').id).toBe('tecnico');
    expect(getAreaForRole('mecanico').id).toBe('tecnico');
  });

  it('un rol desconocido no pierde a la persona: cae en el cuerpo técnico', () => {
    expect(getAreaForRole('utilero').id).toBe('tecnico');
  });
});

describe('isPublishableStaff', () => {
  it('descarta borradores e inactivos', () => {
    expect(isPublishableStaff(member())).toBe(true);
    expect(isPublishableStaff(member({ draft: true }))).toBe(false);
    expect(isPublishableStaff(member({ active: false }))).toBe(false);
  });
});

describe('sortStaff', () => {
  it('respeta el orden curado y desempata alfabéticamente', () => {
    const sorted = sortStaff([
      member({ id: 'c', name: 'Carla Ejemplo', order: 2 }),
      member({ id: 'b', name: 'Bruno Ejemplo', order: 1 }),
      member({ id: 'a', name: 'Ana Ejemplo', order: 1 }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
  });

  it('no muta el arreglo recibido', () => {
    const input = [member({ id: 'b', order: 2 }), member({ id: 'a', order: 1 })];
    sortStaff(input);
    expect(input.map((entry) => entry.id)).toEqual(['b', 'a']);
  });
});

describe('groupStaffByArea', () => {
  it('sin fichas no devuelve ningún grupo', () => {
    expect(groupStaffByArea([])).toEqual([]);
  });

  it('omite el área que nadie ocupa', () => {
    const groups = groupStaffByArea([member({ role: 'entrenador' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].area.id).toBe('tecnico');
  });

  it('agrupa en el orden de lectura', () => {
    const groups = groupStaffByArea([
      member({ id: 'tecnica', role: 'entrenador-principal' }),
      member({ id: 'presidencia', role: 'presidente' }),
    ]);
    expect(groups.map((group) => group.area.id)).toEqual(['directiva', 'tecnico']);
    expect(groups[0].members[0].id).toBe('presidencia');
  });
});

describe('summarizeStaff', () => {
  it('sin fichas devuelve null: la página omite las cifras en vez de inventarlas', () => {
    expect(summarizeStaff([])).toBeNull();
  });

  it('cuenta personas y áreas ocupadas', () => {
    const totals = summarizeStaff([
      member({ id: 'presidencia', role: 'presidente' }),
      member({ id: 'tecnica', role: 'entrenador' }),
    ]);
    expect(totals?.people).toBe(2);
    expect(totals?.areas).toBe(2);
  });

  it('omite las credenciales cuando ninguna ficha declara alguna', () => {
    expect(summarizeStaff([member()])?.certifications).toBeNull();
  });

  it('suma las credenciales declaradas', () => {
    const totals = summarizeStaff([
      member({ id: 'a', certifications: ['UCI nivel 1', 'Primeros auxilios'] }),
      member({ id: 'b', certifications: ['Juez de ruta'] }),
    ]);
    expect(totals?.certifications).toBe(3);
  });

  it('toma el año de ingreso más antiguo y lo omite si nadie lo declara', () => {
    expect(
      summarizeStaff([member({ id: 'a', yearJoined: 2021 }), member({ id: 'b', yearJoined: 2018 })])
        ?.sinceYear,
    ).toBe(2018);
    expect(summarizeStaff([member()])?.sinceYear).toBeNull();
  });
});
