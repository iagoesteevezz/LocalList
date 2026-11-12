// Lista de la compra: lectura en tiempo real y escrituras.
//
// Regla de oro para la cobertura mala: la UI NUNCA espera (await) a una
// escritura. Firestore la aplica al instante en la caché local y la sube
// cuando hay red. Si el servidor la rechaza, se avisa con onError.

import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { isCategoryId, type CategoryId } from '../domain/categories';
import type { Item } from '../domain/types';
import { auth, db } from './firebase';

type ErrorHandler = (error: unknown) => void;

let onError: ErrorHandler = (error) => console.error(error);
/** La UI registra aquí cómo avisar de una escritura rechazada. */
export function setWriteErrorHandler(handler: ErrorHandler) {
  onError = handler;
}

function fire(write: Promise<unknown>) {
  write.catch((error: unknown) => onError(error));
}

const itemsCol = (familyId: string) => collection(db, 'families', familyId, 'items');
const itemRef = (familyId: string, id: string) => doc(db, 'families', familyId, 'items', id);
const catalogRef = (familyId: string, id: string) => doc(db, 'families', familyId, 'catalog', id);

function stamp() {
  return { updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid ?? '' };
}

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

function toItem(id: string, data: DocumentData): Item {
  return {
    id,
    name: String(data.name ?? id),
    qty: typeof data.qty === 'number' ? data.qty : 1,
    done: data.done === true,
    category: isCategoryId(data.category) ? data.category : 'otros',
    doneAt: toMillis(data.doneAt),
  };
}

export interface ItemsState {
  items: Item[];
  loaded: boolean;
  /** Hay cambios locales que aún no han llegado al servidor. */
  pending: boolean;
}

export function useItems(familyId: string): ItemsState {
  const [state, setState] = useState<ItemsState>({ items: [], loaded: false, pending: false });

  useEffect(() => {
    return onSnapshot(
      itemsCol(familyId),
      { includeMetadataChanges: true },
      (snap) => {
        setState({
          // 'estimate': un "marcado" recién hecho ya tiene hora aunque el servidor no haya contestado.
          items: snap.docs.map((d) => toItem(d.id, d.data({ serverTimestamps: 'estimate' }))),
          loaded: true,
          pending: snap.metadata.hasPendingWrites,
        });
      },
      (error) => onError(error),
    );
  }, [familyId]);

  return state;
}

// ─── Escrituras ─────────────────────────────────────────────────────────────

export function addItem(familyId: string, item: { id: string; name: string; category: CategoryId; qty?: number }) {
  fire(
    setDoc(itemRef(familyId, item.id), {
      name: item.name,
      qty: item.qty ?? 1,
      done: false,
      category: item.category,
      doneAt: null,
      ...stamp(),
    }),
  );
  // Recordar el producto para sugerirlo la próxima vez.
  fire(
    setDoc(
      catalogRef(familyId, item.id),
      { name: item.name, category: item.category, uses: increment(1), lastUsedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

/** Marca o desmarca. Se escribe el valor deseado, nunca "lo contrario de lo que había". */
export function setDone(familyId: string, id: string, done: boolean) {
  fire(updateDoc(itemRef(familyId, id), { done, doneAt: done ? serverTimestamp() : null, ...stamp() }));
}

export function setQty(familyId: string, id: string, qty: number) {
  const value = Math.min(99, Math.max(1, Math.round(qty)));
  fire(updateDoc(itemRef(familyId, id), { qty: value, ...stamp() }));
}

/** Cambia la categoría del producto y la recuerda para la próxima vez. */
export function setCategory(familyId: string, item: Item, category: CategoryId) {
  fire(updateDoc(itemRef(familyId, item.id), { category, ...stamp() }));
  fire(
    setDoc(
      catalogRef(familyId, item.id),
      { name: item.name, category, uses: increment(0), lastUsedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

/** Vuelve a poner en la lista un producto tal y como estaba (para "Deshacer"). */
export function restoreItems(familyId: string, items: readonly Item[]) {
  const batch = writeBatch(db);
  for (const item of items) {
    batch.set(itemRef(familyId, item.id), {
      name: item.name,
      qty: item.qty,
      done: item.done,
      category: item.category,
      doneAt: item.doneAt ? Timestamp.fromMillis(item.doneAt) : null,
      ...stamp(),
    });
  }
  fire(batch.commit());
}

/**
 * Guarda en la lista un producto que solo estaba en el catálogo, como "ya lo
 * tenemos" (marcado, sin hora). Hace falta para poder cambiarle la cantidad o la sección.
 */
export function saveUsual(familyId: string, item: Item) {
  fire(
    setDoc(itemRef(familyId, item.id), {
      name: item.name,
      qty: item.qty,
      done: true,
      category: item.category,
      doneAt: null,
      ...stamp(),
    }),
  );
}

/** Borra el producto de la lista y del catálogo: deja de salir en "Lo de siempre". */
export function forgetItem(familyId: string, id: string) {
  const batch = writeBatch(db);
  batch.delete(itemRef(familyId, id));
  batch.delete(catalogRef(familyId, id));
  fire(batch.commit());
}

/** Deshace forgetItem: vuelve el producto y su entrada del catálogo. */
export function restoreForgotten(familyId: string, item: Item, uses: number) {
  restoreItems(familyId, [item]);
  fire(
    setDoc(catalogRef(familyId, item.id), {
      name: item.name,
      category: item.category,
      uses: Math.max(0, Math.round(uses)),
      lastUsedAt: serverTimestamp(),
    }),
  );
}
