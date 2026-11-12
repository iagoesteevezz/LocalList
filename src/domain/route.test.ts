import { describe, expect, it } from 'vitest';
import { CATEGORY_IDS, detectCategory } from './categories';
import { buildNote, inTrip, TRIP_MS } from './list';
import type { CatalogEntry } from './suggest';
import { aisleFor, planRoute } from './route';
import { MERCADONA_MELENARA } from './templates';
import { productId } from './text';
import type { Item, Store } from './types';

function item(name: string, extra: Partial<Item> = {}): Item {
  return {
    id: productId(name)!,
    name,
    qty: 1,
    done: false,
    category: detectCategory(name),
    ...extra,
  };
}

const mercadona: Store = { id: 's1', ...MERCADONA_MELENARA };

describe('aisleFor', () => {
  it('usa la categoría del producto', () => {
    expect(aisleFor(item('Plátanos'), mercadona)?.id).toBe('p1');
    expect(aisleFor(item('Detergente'), mercadona)?.id).toBe('p7');
  });

  it('una excepción gana a la categoría', () => {
    expect(aisleFor(item('Leche'), mercadona)?.id).toBe('p6'); // no en la nevera (p4)
  });

  it('la excepción por primera palabra cubre variantes', () => {
    expect(aisleFor(item('Leche sin lactosa'), mercadona)?.id).toBe('p6');
    expect(aisleFor(item('Galletas María'), mercadona)?.id).toBe('p7');
  });

  it('ignora excepciones a pasillos que ya no existen', () => {
    const store: Store = { ...mercadona, overrides: { leche: 'borrado' } };
    expect(aisleFor(item('Leche'), store)?.id).toBe('p4');
  });

  it('sin pasillo para su categoría → null', () => {
    expect(aisleFor(item('Regalo cumpleaños'), mercadona)).toBeNull();
  });
});

describe('planRoute', () => {
  const items = [
    item('Detergente'),
    item('Plátanos', { done: true, doneAt: 200 }),
    item('Manzanas'),
    item('Calabacín', { done: true, doneAt: 100 }),
    item('Aguacates'),
    item('Regalo cumpleaños'),
  ];
  const route = planRoute(items, mercadona);

  it('respeta el orden del recorrido e incluye pasillos vacíos', () => {
    expect(route.sections.map((s) => s.aisle?.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
  });

  it('todo por nombre: lo marcado se queda en su sitio', () => {
    const p1 = route.sections[0]!;
    expect(p1.items.map((i) => i.name)).toEqual(['Aguacates', 'Calabacín', 'Manzanas', 'Plátanos']);
    expect(p1.pending.map((i) => i.name)).toEqual(['Aguacates', 'Manzanas']);
    expect(p1.done.map((i) => i.name)).toEqual(['Calabacín', 'Plátanos']);
  });

  it('separa lo que no tiene pasillo', () => {
    expect(route.unassigned.pending.map((i) => i.name)).toEqual(['Regalo cumpleaños']);
  });

  it('indica el siguiente pasillo con pendientes y el total', () => {
    expect(route.nextAisleId).toBe('p1');
    expect(route.pendingCount).toBe(4);

    const soloLimpieza = planRoute([item('Lejía')], mercadona);
    expect(soloLimpieza.nextAisleId).toBe('p7');
  });

  it('con todo marcado no hay siguiente pasillo', () => {
    const done = planRoute([item('Pan', { done: true })], mercadona);
    expect(done.nextAisleId).toBeNull();
    expect(done.pendingCount).toBe(0);
  });
});

describe('plantilla Mercadona Melenara', () => {
  it('cada categoría (salvo "otros") tiene pasillo', () => {
    const covered = new Set(mercadona.aisles.flatMap((a) => a.categories));
    const missing = CATEGORY_IDS.filter((c) => c !== 'otros' && !covered.has(c));
    expect(missing).toEqual([]);
  });

  it('ninguna categoría está en dos pasillos', () => {
    const all = mercadona.aisles.flatMap((a) => a.categories);
    expect(new Set(all).size).toBe(all.length);
  });

  it('las excepciones apuntan a pasillos que existen', () => {
    const ids = new Set(mercadona.aisles.map((a) => a.id));
    for (const aisleId of Object.values(mercadona.overrides)) expect(ids).toContain(aisleId);
  });
});

describe('buildNote y inTrip', () => {
  const NOW = 10 * TRIP_MS;
  const catalog: CatalogEntry[] = [
    { id: 'leche', name: 'Leche', category: detectCategory('Leche'), uses: 3 },
    { id: 'gofio', name: 'Gofio', category: detectCategory('Gofio'), uses: 1 },
  ];
  const note = buildNote(
    [
      item('Lejía'),
      item('Tomates', { done: true, doneAt: NOW - 1000 }), // marcado en esta compra
      item('Cebollas'),
      item('Leche', { done: true, doneAt: NOW - TRIP_MS - 1 }), // de otra compra
    ],
    catalog,
  );
  const names = (groups: typeof note.needed) => groups.flatMap((g) => g.items.map((i) => i.name));

  it('para comprar: solo lo pendiente, por secciones y nombre', () => {
    expect(note.needed.map((g) => g.category.id)).toEqual(['frutas_verduras', 'limpieza']);
    expect(names(note.needed)).toEqual(['Cebollas', 'Lejía']);
  });

  it('lo de siempre: todo lo marcado y el catálogo, sin repetir', () => {
    expect(names(note.usual).sort()).toEqual(['Gofio', 'Leche', 'Tomates']);
    expect([...note.onlyInCatalog]).toEqual(['gofio']);
  });

  it('lo del catálogo se muestra como "ya lo tenemos"', () => {
    const gofio = note.usual.flatMap((g) => g.items).find((i) => i.id === 'gofio')!;
    expect(gofio.done).toBe(true);
  });

  it('inTrip: sin hora de marcado, ya no es de esta compra', () => {
    expect(inTrip(item('Pan', { done: true, doneAt: null }), NOW)).toBe(false);
    expect(inTrip(item('Pan'), NOW)).toBe(true);
  });
});
