import { describe, it, expect } from 'vitest';
import {
  renderMilestoneText,
  buildMilestoneItems,
  type MilestoneData,
} from '../milestones';

const base: MilestoneData = {
  label: '2010',
  title: 'Fundación',
  body: 'Texto',
  order: 1,
  draft: false,
};

describe('renderMilestoneText', () => {
  it('sustituye un marcador por su valor', () => {
    expect(renderMilestoneText('Van {{trees}} árboles', { trees: 77 })).toBe(
      'Van 77 árboles'
    );
  });

  it('sustituye varios marcadores, incluso repetidos', () => {
    expect(
      renderMilestoneText('{{club}} nació en {{founded}}; {{club}} sigue', {
        club: 'Trocha y Ruta',
        founded: 2010,
      })
    ).toBe('Trocha y Ruta nació en 2010; Trocha y Ruta sigue');
  });

  it('tolera espacios dentro de las llaves', () => {
    expect(renderMilestoneText('{{  trees }}', { trees: 12 })).toBe('12');
  });

  it('deja intacto el marcador sin valor, para que salte en QA', () => {
    expect(renderMilestoneText('Van {{trees}} árboles', {})).toBe(
      'Van {{trees}} árboles'
    );
  });

  it('devuelve el texto igual cuando no hay marcadores', () => {
    expect(renderMilestoneText('Sin marcadores', { trees: 5 })).toBe(
      'Sin marcadores'
    );
  });
});

describe('buildMilestoneItems', () => {
  it('descarta los borradores', () => {
    const items = buildMilestoneItems([
      { ...base, title: 'Publicado' },
      { ...base, title: 'Borrador', draft: true },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('Publicado');
  });

  it('ordena por el campo order', () => {
    const items = buildMilestoneItems([
      { ...base, title: 'Tercero', order: 3 },
      { ...base, title: 'Primero', order: 1 },
      { ...base, title: 'Segundo', order: 2 },
    ]);

    expect(items.map((i) => i.title)).toEqual(['Primero', 'Segundo', 'Tercero']);
  });

  it('no muta el arreglo recibido', () => {
    const entries = [
      { ...base, title: 'B', order: 2 },
      { ...base, title: 'A', order: 1 },
    ];
    buildMilestoneItems(entries);

    expect(entries.map((e) => e.title)).toEqual(['B', 'A']);
  });

  it('resuelve marcadores en label, title y body', () => {
    const [item] = buildMilestoneItems(
      [
        {
          ...base,
          label: '{{founded}}',
          title: 'Nace {{club}}',
          body: 'Ya son {{trees}} árboles',
        },
      ],
      { founded: 2010, club: 'Trocha y Ruta', trees: 77 }
    );

    expect(item?.label).toBe('2010');
    expect(item?.title).toBe('Nace Trocha y Ruta');
    expect(item?.body).toBe('Ya son 77 árboles');
  });

  it('deja image en undefined cuando el hito no trae foto', () => {
    const [item] = buildMilestoneItems([base]);

    expect(item?.image).toBeUndefined();
  });

  it('conserva icon e imageAlt', () => {
    const [item] = buildMilestoneItems([
      { ...base, icon: 'ph:flag-bold', imageAlt: 'Descripción' },
    ]);

    expect(item?.icon).toBe('ph:flag-bold');
    expect(item?.imageAlt).toBe('Descripción');
  });

  it('devuelve arreglo vacío sin entradas', () => {
    expect(buildMilestoneItems([])).toEqual([]);
  });
});
