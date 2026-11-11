// Qué hacer cuando alguien escribe un producto y pulsa "Añadir".

import { detectCategory, type CategoryId } from './categories';
import { findMatch } from './duplicates';
import type { CatalogEntry } from './suggest';
import { cleanName, productId } from './text';
import type { Item } from './types';

export interface NewItem {
  id: string;
  name: string;
  category: CategoryId;
}

export type AddDecision =
  | { kind: 'invalid' } // vacío o sin letras
  | { kind: 'add'; item: NewItem } // nuevo: añadir
  | { kind: 'already-pending'; existing: Item } // ya está apuntado: ofrecer "sumar 1"
  | { kind: 'back-from-cart'; existing: Item } // estaba en el carro: vuelve a la lista
  | { kind: 'maybe-typo'; existing: Item; item: NewItem }; // ¿querías decir…?

export function decideAdd(
  input: string,
  items: readonly Item[],
  catalog: readonly CatalogEntry[] = [],
): AddDecision {
  const name = cleanName(input);
  const id = productId(name);
  if (!id) return { kind: 'invalid' };

  const match = findMatch(name, items);
  if (match?.kind === 'same') {
    return match.item.done
      ? { kind: 'back-from-cart', existing: match.item }
      : { kind: 'already-pending', existing: match.item };
  }

  // Si la familia ya corrigió la categoría de este producto, se respeta.
  const known = catalog.find((e) => e.id === id);
  const item: NewItem = { id, name, category: known?.category ?? detectCategory(name) };

  if (match?.kind === 'similar') return { kind: 'maybe-typo', existing: match.item, item };
  return { kind: 'add', item };
}
