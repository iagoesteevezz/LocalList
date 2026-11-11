// Sugerencias al escribir: productos que la familia ya ha apuntado antes.

import type { CategoryId } from './categories';
import { normalize } from './text';

export interface CatalogEntry {
  id: string;
  name: string;
  category: CategoryId;
  uses: number;
}

/**
 * Hasta `max` productos del catálogo que encajan con lo que se está escribiendo.
 * Encaja si alguna palabra del producto EMPIEZA por lo escrito
 * ("le" → Leche, Lechuga, "Pan de molde" con "mol").
 * Los más usados primero; los que empiezan por lo escrito, antes que el resto.
 * Excluye lo que ya está pendiente en la lista.
 */
export function suggest(
  input: string,
  catalog: readonly CatalogEntry[],
  pendingIds: ReadonlySet<string>,
  max = 4,
): CatalogEntry[] {
  const q = normalize(input);
  if (q.length < 2) return [];

  const scored: { entry: CatalogEntry; score: number }[] = [];
  for (const entry of catalog) {
    if (pendingIds.has(entry.id)) continue;
    const name = normalize(entry.name);
    if (name === q) continue; // ya lo ha escrito entero: no hace falta sugerirlo
    let score: number;
    if (name.startsWith(q)) score = 2;
    else if (name.split(' ').some((w) => w.startsWith(q))) score = 1;
    else continue;
    scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.entry.uses - a.entry.uses || a.entry.name.localeCompare(b.entry.name, 'es'))
    .slice(0, max)
    .map((s) => s.entry);
}
