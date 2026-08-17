import { describe, it, expect } from 'vitest';
import {
  getGalleryCategory,
  GALLERY_CATEGORIES,
  photoCountLabel,
  summarizeGallery,
  sortAlbumsByDate,
  selectFeaturedAlbum,
  findEventForAlbum,
  chroniclesForEvent,
  resolveAlbumContext,
} from '../gallery';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const album = (id: string, date: string, photos: number, extra: Record<string, unknown> = {}) => ({
  id,
  data: {
    title: `Álbum ${id}`,
    date: at(date),
    images: Array.from({ length: photos }, (_, i) => ({ src: `foto-${i}.webp`, alt: `Foto ${i}` })),
    featured: false,
    relatedEvent: undefined as string | undefined,
    ...extra,
  },
});

const evento = (id: string, title: string, date: string, relatedNews: string[] = []) => ({
  id,
  data: { title, date: at(date), relatedNews },
});

const noticia = (id: string, title: string, relatedEvent?: string) => ({
  id,
  data: { title, relatedEvent },
});

// ============================================================
// Categorías
// ============================================================

describe('getGalleryCategory', () => {
  it('traduce el valor del enum a una etiqueta legible', () => {
    expect(getGalleryCategory('competencia').label).toBe('Competencia');
  });

  it('cae en competencia ante un valor desconocido', () => {
    expect(getGalleryCategory('torneo')).toBe(GALLERY_CATEGORIES.competencia);
  });

  it('ninguna categoría usa el teal o el lima vivos como color de texto', () => {
    // Sobre fondos claros solo los tonos -deep cumplen 4.5:1.
    for (const [name, style] of Object.entries(GALLERY_CATEGORIES)) {
      expect(style.text, name).toMatch(/-deep$/);
    }
  });
});

// ============================================================
// Fotos
// ============================================================

describe('photoCountLabel', () => {
  it('usa singular con una sola foto', () => {
    expect(photoCountLabel(1)).toBe('1 foto');
  });

  it('usa plural en el resto de casos, incluido cero', () => {
    expect(photoCountLabel(0)).toBe('0 fotos');
    expect(photoCountLabel(45)).toBe('45 fotos');
  });
});

// ============================================================
// Resumen de la colección
// ============================================================

describe('summarizeGallery', () => {
  it('cuenta álbumes y fotos totales', () => {
    const summary = summarizeGallery([album('a', '2026-03-01', 45), album('b', '2026-08-02', 27)]);
    expect(summary.totalAlbums).toBe(2);
    expect(summary.totalPhotos).toBe(72);
  });

  it('describe el periodo cubierto según lo que abarque', () => {
    expect(summarizeGallery([album('a', '2026-03-01', 1), album('b', '2026-08-02', 1)]).span).toBe(
      'marzo – agosto 2026'
    );
    expect(summarizeGallery([album('a', '2026-08-01', 1), album('b', '2026-08-02', 1)]).span).toBe(
      'Agosto 2026'
    );
    expect(summarizeGallery([album('a', '2025-11-01', 1), album('b', '2026-02-02', 1)]).span).toBe(
      'Noviembre 2025 – Febrero 2026'
    );
  });

  it('no inventa nada sin álbumes', () => {
    expect(summarizeGallery([])).toEqual({ totalAlbums: 0, totalPhotos: 0, span: null });
  });

  it('sostiene el total de fotos y el periodo con la forma real de los siete álbumes', () => {
    // 45 + 11 + 7 + 13 + 3 + 5 + 27 = 111, de marzo a agosto de 2026.
    const albums = [
      album('copa-valle-ginebra-2026', '2026-03-01', 45),
      album('copa-valle-pavas-2026', '2026-04-19', 11),
      album('copa-valle-cali-2026', '2026-05-17', 7),
      album('departamental-ginebra-2026', '2026-06-14', 13),
      album('clasica-santa-rosa-tapias-2026', '2026-07-12', 3),
      album('nacional-pereira-2026', '2026-07-18', 5),
      album('copa-valle-palmira-2026', '2026-08-02', 27, { featured: true }),
    ];
    const summary = summarizeGallery(albums);
    expect(summary.totalAlbums).toBe(7);
    expect(summary.totalPhotos).toBe(111);
    expect(summary.span).toBe('marzo – agosto 2026');
  });
});

// ============================================================
// Orden y selección
// ============================================================

describe('sortAlbumsByDate', () => {
  it('ordena del más reciente al más antiguo', () => {
    const albums = [
      album('marzo', '2026-03-01', 1),
      album('agosto', '2026-08-02', 1),
      album('junio', '2026-06-14', 1),
    ];
    expect(sortAlbumsByDate(albums).map((a) => a.id)).toEqual(['agosto', 'junio', 'marzo']);
  });

  it('no muta el arreglo original', () => {
    const albums = [album('marzo', '2026-03-01', 1), album('agosto', '2026-08-02', 1)];
    const originalOrder = albums.map((a) => a.id);
    sortAlbumsByDate(albums);
    expect(albums.map((a) => a.id)).toEqual(originalOrder);
  });
});

describe('selectFeaturedAlbum', () => {
  it('respeta el destacado manual cuando hay exactamente uno', () => {
    const albums = [album('ginebra', '2026-03-01', 45), album('palmira', '2026-08-02', 27, { featured: true })];
    expect(selectFeaturedAlbum(albums)?.id).toBe('palmira');
  });

  it('con los siete álbumes reales, el destacado manual manda sobre el de más fotos', () => {
    // Ginebra tiene 45 fotos (el álbum más grande) pero no está marcado
    // `featured`; Palmira tiene 27 y sí lo está. Debe ganar Palmira.
    const albums = [
      album('copa-valle-ginebra-2026', '2026-03-01', 45),
      album('copa-valle-palmira-2026', '2026-08-02', 27, { featured: true }),
    ];
    expect(selectFeaturedAlbum(albums)?.id).toBe('copa-valle-palmira-2026');
  });

  it('cae en el álbum con más fotos si ninguno está destacado', () => {
    const albums = [album('a', '2026-03-01', 5), album('b', '2026-08-02', 45), album('c', '2026-06-01', 13)];
    expect(selectFeaturedAlbum(albums)?.id).toBe('b');
  });

  it('cae en el álbum con más fotos si hay más de uno destacado', () => {
    const albums = [
      album('a', '2026-03-01', 5, { featured: true }),
      album('b', '2026-08-02', 45, { featured: true }),
    ];
    expect(selectFeaturedAlbum(albums)?.id).toBe('b');
  });

  it('devuelve null sin álbumes', () => {
    expect(selectFeaturedAlbum([])).toBeNull();
  });
});

// ============================================================
// Relación álbum → evento → noticia
// ============================================================

describe('findEventForAlbum', () => {
  const events = [evento('2026-08-copa-valle-v-palmira', 'V Válida Copa Valle - Palmira', '2026-08-01')];

  it('resuelve el evento cuando el id coincide', () => {
    const found = findEventForAlbum(
      album('palmira', '2026-08-02', 27, { relatedEvent: '2026-08-copa-valle-v-palmira' }),
      events
    );
    expect(found?.data.title).toBe('V Válida Copa Valle - Palmira');
  });

  it('devuelve null sin relatedEvent', () => {
    expect(findEventForAlbum(album('suelto', '2026-07-12', 3), events)).toBeNull();
  });

  it('devuelve null cuando relatedEvent no coincide con ningún id real (caso Ginebra)', () => {
    // copa-valle-ginebra-2026 trae relatedEvent: "2026-copa-valle-ginebra", que
    // no coincide con el id real del evento ("2026-02-copa-valle-ii-ginebra").
    // No es hipotético: pasa hoy con el álbum más grande de los siete.
    const found = findEventForAlbum(
      album('ginebra', '2026-03-01', 45, { relatedEvent: '2026-copa-valle-ginebra' }),
      events
    );
    expect(found).toBeNull();
  });
});

describe('chroniclesForEvent', () => {
  const event = evento('2026-08-copa-valle-v-palmira', 'V Válida Copa Valle - Palmira', '2026-08-01', [
    'gymkanas',
  ]);

  it('incluye la crónica declarada en el relatedNews del evento', () => {
    const news = [noticia('gymkanas', 'Isabel gana en Palmira')];
    expect(chroniclesForEvent(event, news)).toEqual([
      { id: 'gymkanas', title: 'Isabel gana en Palmira', href: '/noticias/gymkanas' },
    ]);
  });

  it('incluye la crónica que solo declara relatedEvent, sin estar en el relatedNews', () => {
    const eventoSinListar = evento('2026-08-copa-valle-v-palmira', 'V Válida Copa Valle - Palmira', '2026-08-01', []);
    const news = [noticia('xco', 'Doblete en el podio', '2026-08-copa-valle-v-palmira')];
    expect(chroniclesForEvent(eventoSinListar, news)).toEqual([
      { id: 'xco', title: 'Doblete en el podio', href: '/noticias/xco' },
    ]);
  });

  it('no duplica una crónica presente en las dos direcciones', () => {
    const news = [noticia('gymkanas', 'Isabel gana en Palmira', '2026-08-copa-valle-v-palmira')];
    expect(chroniclesForEvent(event, news)).toHaveLength(1);
  });

  it('ignora un id de relatedNews que no existe en la colección de noticias', () => {
    expect(() => chroniclesForEvent(event, [])).not.toThrow();
    expect(chroniclesForEvent(event, [])).toEqual([]);
  });

  it('devuelve una lista vacía sin crónicas en ninguna dirección', () => {
    const eventoSolo = evento('2026-06-campeonato-departamental', 'Departamental de MTB', '2026-06-12');
    expect(chroniclesForEvent(eventoSolo, [noticia('otra', 'Una noticia sin relación')])).toEqual([]);
  });
});

describe('resolveAlbumContext', () => {
  it('resuelve el evento y cruza las dos direcciones de sus crónicas', () => {
    const events = [
      evento('2026-08-copa-valle-v-palmira', 'V Válida Copa Valle - Palmira', '2026-08-01', ['gymkanas']),
    ];
    const news = [
      noticia('gymkanas', 'Isabel gana en Palmira'),
      noticia('xco', 'Doblete en el podio', '2026-08-copa-valle-v-palmira'),
    ];
    const context = resolveAlbumContext(
      album('copa-valle-palmira-2026', '2026-08-02', 27, {
        relatedEvent: '2026-08-copa-valle-v-palmira',
        featured: true,
      }),
      events,
      news
    );
    expect(context.event).toEqual({
      id: '2026-08-copa-valle-v-palmira',
      title: 'V Válida Copa Valle - Palmira',
      date: at('2026-08-01'),
      href: '/calendario#evento-2026-08-copa-valle-v-palmira',
    });
    expect(context.chronicles.map((c) => c.id).sort()).toEqual(['gymkanas', 'xco']);
  });

  it('no inventa evento ni crónicas para un álbum sin relatedEvent', () => {
    // Caso real: clasica-santa-rosa-tapias-2026 no trae relatedEvent, aunque
    // existe un evento de fecha muy cercana en la colección.
    const events = [evento('2026-07-clasica-santa-rosa-tapias', 'I Clásica de Santa Rosa de Tapias', '2026-07-11')];
    const context = resolveAlbumContext(album('clasica-santa-rosa-tapias-2026', '2026-07-12', 3), events, []);
    expect(context).toEqual({ event: null, chronicles: [] });
  });

  it('no inventa evento cuando relatedEvent no coincide con ningún id real (caso Ginebra)', () => {
    const events = [evento('2026-02-copa-valle-ii-ginebra', 'II Válida Copa Valle - Ginebra', '2026-02-28')];
    const news = [noticia('cronica-ginebra', 'Trocha y Ruta deja huella en Ginebra', '2026-copa-valle-ginebra')];
    const context = resolveAlbumContext(
      album('copa-valle-ginebra-2026', '2026-03-01', 45, { relatedEvent: '2026-copa-valle-ginebra' }),
      events,
      news
    );
    expect(context).toEqual({ event: null, chronicles: [] });
  });

  it('resuelve el evento aunque no tenga ninguna crónica', () => {
    const events = [evento('2026-04-copa-valle-iii-la-cumbre', 'III Válida Copa Valle - La Cumbre', '2026-04-19')];
    const context = resolveAlbumContext(
      album('copa-valle-pavas-2026', '2026-04-19', 11, { relatedEvent: '2026-04-copa-valle-iii-la-cumbre' }),
      events,
      []
    );
    expect(context.event?.title).toBe('III Válida Copa Valle - La Cumbre');
    expect(context.chronicles).toEqual([]);
  });
});
