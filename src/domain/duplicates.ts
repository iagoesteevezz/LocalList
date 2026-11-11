// Detección de productos repetidos o con erratas.
//
// Diferencia con la V1: ya no BLOQUEA. Devuelve qué ha encontrado y la UI
// ofrece opciones ("Ya está: sumar 1" / "¿Querías decir…?" / "Es otro").

import { KNOWN_WORDS } from './categories';
import { editDistance, productKey } from './text';

export interface Named {
  name: string;
}

export type Match<T extends Named> =
  | { kind: 'same'; item: T } // misma clave: es el mismo producto ("Tomates" = "tomate")
  | { kind: 'similar'; item: T }; // probable errata ("yogur nautral")

/** Errores de letra tolerados según la longitud de la palabra. */
function tolerance(word: string): number {
  if (word.length >= 8) return 2;
  if (word.length >= 5) return 1;
  return 0; // palabras cortas: "pasa"/"pasta", "col"/"sol" son productos distintos
}

/** ¿Las dos palabras son la misma con una errata? */
function isTypo(a: string, b: string): boolean {
  // Si ambas son palabras reales del diccionario ("pollo" y "bollo"),
  // son productos distintos aunque se parezcan.
  if (KNOWN_WORDS.has(a) && KNOWN_WORDS.has(b)) return false;
  const max = Math.min(tolerance(a), tolerance(b));
  return max > 0 && editDistance(a, b) <= max;
}

/**
 * Dos claves son "parecidas" si tienen las mismas palabras salvo UNA,
 * y esa una es una errata de la otra.
 */
function keysAreSimilar(a: string, b: string): boolean {
  const wa = a.split(' ');
  const wb = b.split(' ');
  if (wa.length !== wb.length) return false;
  let differences = 0;
  for (let i = 0; i < wa.length; i++) {
    if (wa[i] === wb[i]) continue;
    if (++differences > 1 || !isTypo(wa[i]!, wb[i]!)) return false;
  }
  return differences === 1;
}

/** Busca en `items` uno igual o parecido a `name`. Prioriza el igual. */
export function findMatch<T extends Named>(name: string, items: readonly T[]): Match<T> | null {
  const key = productKey(name);
  if (!key) return null;

  let similar: T | null = null;
  for (const item of items) {
    const other = productKey(item.name);
    if (other === key) return { kind: 'same', item };
    if (!similar && keysAreSimilar(key, other)) similar = item;
  }
  return similar ? { kind: 'similar', item: similar } : null;
}
