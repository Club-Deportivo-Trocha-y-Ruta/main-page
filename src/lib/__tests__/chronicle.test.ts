import { describe, it, expect } from 'vitest';
import {
  resolveChronicleContext,
  placeChronicle,
  type AlbumInput,
  type ChronicleInput,
  type EventInput,
} from '../chronicle';

const event = (
  id: string,
  iso: string,
  city: string,
  relatedNews: string[] = [],
  extra: Partial<EventInput['data']> = {}
): EventInput => ({
  id,
  data: {
    title: `Válida ${city}`,
    date: new Date(iso),
    location: `Pista de ${city}`,
    city,
    category: 'xco',
    level: 'departamental',
    relatedNews,
    ...extra,
  },
});

const chronicle = (
  id: string,
  iso: string,
  extra: Partial<ChronicleInput['data']> = {}
): ChronicleInput => ({
  id,
  data: { title: `Crónica ${id}`, date: new Date(iso), category: 'competencias', ...extra },
});

const album = (id: string, photos: number): AlbumInput => ({
  id,
  data: { title: `Álbum ${id}`, images: Array.from({ length: photos }, (_, i) => i) },
});

// La V válida de Palmira es el caso real con dos crónicas: la de XCO y la de
// gymkanas. Solo una aparece en el `relatedNews` del evento; la otra se
// relaciona por `relatedEvent`.
const PALMIRA = event('palmira', '2026-08-09', 'Palmira', ['palmira-xco']);
const XCO = chronicle('palmira-xco', '2026-08-11', {
  relatedEvent: 'palmira',
  relatedGallery: 'album-palmira',
});
const GYMKANAS = chronicle('palmira-gymkanas', '2026-08-12', {
  relatedEvent: 'palmira',
  relatedGallery: 'album-palmira',
});
const NEWS = [XCO, GYMKANAS];
const EVENTS = [PALMIRA];
const ALBUMS = [album('album-palmira', 17)];

// ============================================================
// resolveChronicleContext
// ============================================================

describe('resolveChronicleContext', () => {
  it('resuelve la carrera que cubre la crónica', () => {
    const { race } = resolveChronicleContext(XCO, EVENTS, ALBUMS, NEWS);
    expect(race).toMatchObject({
      id: 'palmira',
      where: 'Palmira',
      discipline: 'Cross Country olímpico',
      level: 'Departamental',
      href: '/calendario#evento-palmira',
    });
    expect(race?.when).toMatch(/^9 de [a-záéíóú]+$/);
  });

  it('resuelve el álbum con su número de fotos', () => {
    const { album: found } = resolveChronicleContext(XCO, EVENTS, ALBUMS, NEWS);
    expect(found).toMatchObject({
      id: 'album-palmira',
      photos: '17 fotos',
      href: '/galeria/album-palmira',
    });
  });

  it('encuentra la crónica hermana de la misma carrera', () => {
    // Gymkanas no está en el `relatedNews` del evento: se llega por la otra
    // dirección de la relación.
    const { siblings } = resolveChronicleContext(XCO, EVENTS, ALBUMS, NEWS);
    expect(siblings.map((s) => s.id)).toEqual(['palmira-gymkanas']);
  });

  it('nunca se devuelve a sí misma como hermana', () => {
    for (const article of NEWS) {
      const { siblings } = resolveChronicleContext(article, EVENTS, ALBUMS, NEWS);
      expect(siblings.map((s) => s.id)).not.toContain(article.id);
    }
  });

  it('no enlaza un álbum que no existe', () => {
    // Caso real: `2026-09-copa-valle-roldanillo-xco` declara un álbum que no
    // está publicado. Antes de armar la URL hay que comprobar que resuelve.
    const roto = chronicle('roldanillo', '2026-09-21', {
      relatedEvent: 'palmira',
      relatedGallery: 'album-que-no-existe',
    });
    const { album: found, race } = resolveChronicleContext(roto, EVENTS, ALBUMS, [...NEWS, roto]);
    expect(found).toBeNull();
    // La carrera sí resuelve: un eslabón roto no tumba el resto.
    expect(race).not.toBeNull();
  });

  it('no enlaza una carrera que no existe', () => {
    const roto = chronicle('x', '2026-09-21', { relatedEvent: 'evento-fantasma' });
    const ctx = resolveChronicleContext(roto, EVENTS, ALBUMS, [roto]);
    expect(ctx.race).toBeNull();
    expect(ctx.siblings).toEqual([]);
  });

  it('sobrevive a una crónica sin relaciones', () => {
    const suelta = chronicle('dia-tierra', '2026-04-22', { category: 'comunidad' });
    expect(resolveChronicleContext(suelta, EVENTS, ALBUMS, [suelta])).toEqual({
      race: null,
      album: null,
      siblings: [],
    });
  });

  it('cae al lugar cuando el evento no trae ciudad', () => {
    const sinCiudad = event('sc', '2026-03-01', '', [], { city: undefined });
    sinCiudad.data.location = 'Pista Carlos Castro';
    const art = chronicle('a', '2026-03-02', { relatedEvent: 'sc' });
    const { race } = resolveChronicleContext(art, [sinCiudad], [], [art]);
    expect(race?.where).toBe('Pista Carlos Castro');
  });

  it('deja el nivel en null si el evento no lo declara', () => {
    const sinNivel = event('sn', '2026-03-01', 'Cali', [], { level: undefined });
    const art = chronicle('a', '2026-03-02', { relatedEvent: 'sn' });
    expect(resolveChronicleContext(art, [sinNivel], [], [art]).race?.level).toBeNull();
  });
});

// ============================================================
// placeChronicle
// ============================================================

const ARCHIVO = [
  chronicle('marzo', '2026-03-01'),
  chronicle('abril', '2026-04-10'),
  chronicle('mayo', '2026-05-20'),
];

describe('placeChronicle', () => {
  it('ordena cronológicamente, no por el orden de entrada', () => {
    const desordenado = [ARCHIVO[2], ARCHIVO[0], ARCHIVO[1]];
    const p = placeChronicle(desordenado, 'abril');
    expect(p.previous?.id).toBe('marzo');
    expect(p.next?.id).toBe('mayo');
  });

  it('sitúa la crónica en el archivo', () => {
    expect(placeChronicle(ARCHIVO, 'abril')).toMatchObject({ position: 2, total: 3 });
  });

  it('la más antigua no tiene anterior', () => {
    const p = placeChronicle(ARCHIVO, 'marzo');
    expect(p.previous).toBeNull();
    expect(p.next?.id).toBe('abril');
    expect(p.position).toBe(1);
  });

  it('la más reciente no tiene siguiente', () => {
    const p = placeChronicle(ARCHIVO, 'mayo');
    expect(p.previous?.id).toBe('abril');
    expect(p.next).toBeNull();
    expect(p.position).toBe(3);
  });

  it('devuelve posición 0 si la crónica no está en la lista', () => {
    expect(placeChronicle(ARCHIVO, 'inexistente')).toEqual({
      previous: null,
      next: null,
      position: 0,
      total: 3,
    });
  });

  it('sobrevive a un archivo de una sola crónica', () => {
    expect(placeChronicle([ARCHIVO[0]], 'marzo')).toMatchObject({
      previous: null,
      next: null,
      position: 1,
      total: 1,
    });
  });

  it('el vecino trae su fecha lista para pintar', () => {
    expect(placeChronicle(ARCHIVO, 'mayo').previous?.when).toMatch(/^10 de [a-záéíóú]+$/);
  });
});
