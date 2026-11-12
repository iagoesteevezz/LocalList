// Ordena la lista según el recorrido de un supermercado (modo compra).

import type { Aisle, Item, Store } from './types';

export interface RouteSection {
  /** null = productos que no encajan en ningún pasillo de este súper. */
  aisle: Aisle | null;
  /** Todo el pasillo por nombre: marcar no cambia la fila de sitio. */
  items: Item[];
  pending: Item[];
  done: Item[];
}

export interface Route {
  /** Un tramo por pasillo, en orden de recorrido (incluye pasillos vacíos). */
  sections: RouteSection[];
  unassigned: RouteSection;
  /** Primer pasillo con algo pendiente: hacia dónde ir ahora. */
  nextAisleId: string | null;
  pendingCount: number;
}

/**
 * Pasillo de un producto en un súper:
 * 1) excepción guardada para ese producto exacto ("leche-entera");
 * 2) excepción guardada para su primera palabra ("leche" → vale para
 *    "Leche entera", "Leche sin lactosa"…);
 * 3) el primer pasillo que declara su categoría;
 * 4) ninguno.
 * Una excepción que apunta a un pasillo borrado se ignora.
 */
export function aisleFor(item: Item, store: Store): Aisle | null {
  const head = item.id.split('-')[0]!;
  for (const key of [item.id, head]) {
    const overrideId = store.overrides[key];
    const aisle = overrideId && store.aisles.find((a) => a.id === overrideId);
    if (aisle) return aisle;
  }
  return store.aisles.find((a) => a.categories.includes(item.category)) ?? null;
}

const collator = new Intl.Collator('es', { sensitivity: 'base' });
const byName = (a: Item, b: Item) => collator.compare(a.name, b.name);

function section(aisle: Aisle | null, items: Item[]): RouteSection {
  const sorted = [...items].sort(byName);
  return {
    aisle,
    items: sorted,
    pending: sorted.filter((i) => !i.done),
    done: sorted.filter((i) => i.done),
  };
}

export function planRoute(items: readonly Item[], store: Store): Route {
  const byAisle = new Map<string, Item[]>(store.aisles.map((a) => [a.id, []]));
  const unassigned: Item[] = [];

  for (const item of items) {
    const aisle = aisleFor(item, store);
    if (aisle) byAisle.get(aisle.id)!.push(item);
    else unassigned.push(item);
  }

  const sections = store.aisles.map((a) => section(a, byAisle.get(a.id)!));
  const rest = section(null, unassigned);

  return {
    sections,
    unassigned: rest,
    nextAisleId: sections.find((s) => s.pending.length > 0)?.aisle?.id ?? null,
    pendingCount: items.filter((i) => !i.done).length,
  };
}
