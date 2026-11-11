// Lista de la compra: lectura en tiempo real y escrituras.
//
// Regla de oro para la cobertura mala: la UI NUNCA espera (await) a una
// escritura. Firestore la aplica al instante en la caché local y la sube
// cuando hay red. Si el servidor la rechaza, se avisa con onError.

import {
  Timestamp,
  collection,
  deleteDoc,
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

export function removeItem(familyId: string, id: string) {
  fire(deleteDoc(itemRef(familyId, id)));
}

/** "Terminar compra": quita de la lista todo lo que ya está en el carro. */
export function removeItems(familyId: string, ids: readonly string[]) {
  // Un batch admite 500 operaciones; una lista familiar no llega ni de lejos.
  const batch = writeBatch(db);
  for (const id of ids) batch.delete(itemRef(familyId, id));
  fire(batch.commit());
}
