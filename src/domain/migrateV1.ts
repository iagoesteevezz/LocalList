// Conversión de la lista de la V1 al modelo de la V2.
//
// La V1 guardaba todo en UN documento (supermercados/mercadona_cruce):
//   productos_p1..p7: string[]        nombres por pasillo del Mercadona
//   tachado_<nombre>: boolean         marcado
//   cantidad_<nombre>: number         cantidad
// La V2 guarda un documento por producto, y el pasillo sale de la categoría
// (o de una excepción si en ese Mercadona está en otro sitio).
//
// Ojo con el significado: la V1 era un inventario fijo ("en casa, quita el tick
// a lo que necesites comprar"), así que MARCADO = no hace falta comprarlo.
// En la V2 la lista es solo lo que falta: lo no marcado entra en la lista y lo
// marcado va solo al catálogo, para que se sugiera al escribir.

import { detectCategory } from './categories';
import { aisleFor } from './route';
import type { StoreTemplate } from './templates';
import { cleanName, productId } from './text';
import type { Item } from './types';

export type V1Data = Record<string, unknown>;

export interface V1Plan {
  /** Lo que falta (no marcado en la V1): entra en la lista. */
  items: Item[];
  /** Lo que estaba marcado en la V1 (no hace falta): solo al catálogo. */
  known: Item[];
  /** Excepciones para el súper: el producto está en otro pasillo que el de su categoría. */
  overrides: Record<string, string>;
  /** Ya existían en la V2: no se tocan. */
  skipped: string[];
  /** Nombres que no se pudieron convertir (vacíos, sin letras). */
  invalid: string[];
}

const AISLE_FIELD = /^productos_p(\d+)$/;

export function planV1Import(data: V1Data, existingIds: ReadonlySet<string>, store: StoreTemplate): V1Plan {
  const items = new Map<string, Item>();
  const known = new Map<string, Item>();
  const overrides: Record<string, string> = {};
  const skipped: string[] = [];
  const invalid: string[] = [];

  // Pasillos en orden (p1, p2…), para que el resultado sea estable.
  const fields = Object.keys(data)
    .filter((k) => AISLE_FIELD.test(k))
    .sort((a, b) => Number(AISLE_FIELD.exec(a)![1]) - Number(AISLE_FIELD.exec(b)![1]));

  for (const field of fields) {
    const aisleId = `p${AISLE_FIELD.exec(field)![1]}`;
    const names = Array.isArray(data[field]) ? (data[field] as unknown[]) : [];

    for (const raw of names) {
      if (typeof raw !== 'string') continue;
      const name = cleanName(raw);
      const id = productId(name);
      if (!id) {
        invalid.push(raw);
        continue;
      }
      if (existingIds.has(id)) {
        if (!skipped.includes(name)) skipped.push(name);
        continue;
      }
      if (items.has(id) || known.has(id)) continue; // repetido en la V1: vale el primero

      const qtyRaw = data[`cantidad_${raw}`];
      const qty = typeof qtyRaw === 'number' && Number.isFinite(qtyRaw) ? Math.min(99, Math.max(1, Math.round(qtyRaw))) : 1;
      const item: Item = { id, name, qty, done: false, category: detectCategory(name), doneAt: null };
      if (data[`tachado_${raw}`] === true) known.set(id, item);
      else items.set(id, item);

      // Solo se guarda excepción si en este súper la categoría lo llevaría a otro pasillo.
      const byCategory = aisleFor(item, { id: 'x', ...store, overrides: {} });
      const exists = store.aisles.some((a) => a.id === aisleId);
      if (exists && byCategory?.id !== aisleId) overrides[id] = aisleId;
    }
  }

  return { items: [...items.values()], known: [...known.values()], overrides, skipped, invalid };
}
