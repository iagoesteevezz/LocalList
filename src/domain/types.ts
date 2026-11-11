// Modelo de dominio. Independiente de Firebase: la capa de datos (Fase 3)
// convierte los documentos de Firestore a estos tipos.

import type { CategoryId } from './categories';

/** Un producto de la lista de la familia. Su id es productId(name). */
export interface Item {
  id: string;
  name: string;
  qty: number;
  done: boolean;
  category: CategoryId;
  /** Momento en que se marcó (ms). Ordena lo marcado al final del pasillo. */
  doneAt?: number | null;
}

export interface Aisle {
  /** Estable: renombrar, reordenar o borrar otros pasillos no lo cambia. */
  id: string;
  name: string;
  icon?: string;
  /** Categorías que se encuentran en este pasillo. */
  categories: CategoryId[];
}

export interface Store {
  id: string;
  name: string;
  icon: string;
  /** En el orden en que se recorre el súper. */
  aisles: Aisle[];
  /** Excepciones: id de producto → id de pasillo ("la leche aquí está en el 6"). */
  overrides: Record<string, string>;
}
