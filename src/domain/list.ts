// Agrupación de la lista "de casa" (sin súper elegido): por categorías.

import { CATEGORIES, type Category } from './categories';
import type { Item } from './types';

export interface CategoryGroup {
  category: Category;
  items: Item[];
}

export interface GroupedList {
  groups: CategoryGroup[];
  /** Ya cogido: una sola sección al final. */
  done: Item[];
}

const collator = new Intl.Collator('es', { sensitivity: 'base' });

export function groupByCategory(items: readonly Item[]): GroupedList {
  const pending = items.filter((i) => !i.done);
  const groups = CATEGORIES.map((category) => ({
    category,
    items: pending
      .filter((i) => i.category === category.id)
      .sort((a, b) => collator.compare(a.name, b.name)),
  })).filter((g) => g.items.length > 0);

  const done = items
    .filter((i) => i.done)
    .sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));

  return { groups, done };
}
