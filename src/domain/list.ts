// La lista funciona como la nota compartida del móvil que usaba la familia:
// están TODOS los productos de siempre. Aro vacío = hace falta comprarlo;
// con ✓ = ya lo tenemos. Marcar no borra nada: el producto se queda en la lista.
//
// - "Para comprar": lo que hace falta (aro vacío).
// - "Lo de siempre": todo lo marcado y los productos del catálogo, con ✓.
//   Tocar uno lo sube a "Para comprar".
// En el súper (pestaña Comprar) lo recién marcado se queda en su sitio un rato
// (TRIP_MS) para que las filas no salten mientras se compra.

import { CATEGORIES, type Category } from './categories';
import type { CatalogEntry } from './suggest';
import type { Item } from './types';

/** En la pestaña Comprar, lo marcado hace menos de esto sigue a la vista: dura una compra. */
export const TRIP_MS = 3 * 60 * 60 * 1000;

/** Hace falta comprarlo, o se ha marcado en esta compra. */
export function inTrip(item: Item, now: number): boolean {
  if (!item.done) return true;
  return item.doneAt != null && now - item.doneAt < TRIP_MS;
}

export interface CategoryGroup {
  category: Category;
  items: Item[];
}

export interface Note {
  /** Para comprar: lo pendiente, por secciones. */
  needed: CategoryGroup[];
  /** Lo de siempre: lo marcado y el catálogo, por secciones. */
  usual: CategoryGroup[];
  /** Productos de "Lo de siempre" que solo están en el catálogo (aún sin documento en la lista). */
  onlyInCatalog: ReadonlySet<string>;
}

const collator = new Intl.Collator('es', { sensitivity: 'base' });

/** Agrupa por secciones, en su orden; dentro, por nombre. Marcar no mueve la fila. */
export function groupByCategory(items: readonly Item[]): CategoryGroup[] {
  return CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category.id).sort((a, b) => collator.compare(a.name, b.name)),
  })).filter((g) => g.items.length > 0);
}

/** Un producto del catálogo que no está en la lista: se muestra como "ya lo tenemos". */
function fromCatalog(entry: CatalogEntry): Item {
  return { id: entry.id, name: entry.name, qty: 1, done: true, category: entry.category, doneAt: null };
}

export function buildNote(items: readonly Item[], catalog: readonly CatalogEntry[]): Note {
  const ids = new Set(items.map((i) => i.id));
  const extra = catalog.filter((e) => !ids.has(e.id)).map(fromCatalog);

  return {
    needed: groupByCategory(items.filter((i) => !i.done)),
    usual: groupByCategory([...items.filter((i) => i.done), ...extra]),
    onlyInCatalog: new Set(extra.map((i) => i.id)),
  };
}
