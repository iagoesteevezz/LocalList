// Supermercados de la familia (families/{fid}/stores/{storeId}).

import {
  FieldPath,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { isCategoryId } from '../domain/categories';
import type { StoreDraft } from '../domain/storeEdit';
import type { Aisle, Store } from '../domain/types';
import { db } from './firebase';

const storesCol = (fid: string) => collection(db, 'families', fid, 'stores');
const storeRef = (fid: string, sid: string) => doc(db, 'families', fid, 'stores', sid);

/** Convierte el documento a Store tolerando datos incompletos o antiguos. */
function toStore(id: string, data: DocumentData): Store {
  const aisles: Aisle[] = Array.isArray(data.aisles)
    ? data.aisles
        .filter((a: unknown): a is Record<string, unknown> => typeof a === 'object' && a !== null)
        .filter((a) => typeof a.id === 'string' && a.id !== '')
        .map((a) => ({
          id: a.id as string,
          name: typeof a.name === 'string' ? a.name : '',
          categories: Array.isArray(a.categories) ? a.categories.filter(isCategoryId) : [],
        }))
    : [];
  const overrides: Record<string, string> = {};
  if (data.overrides && typeof data.overrides === 'object') {
    for (const [k, v] of Object.entries(data.overrides as Record<string, unknown>)) {
      if (typeof v === 'string') overrides[k] = v;
    }
  }
  return { id, name: String(data.name ?? 'Supermercado'), icon: String(data.icon ?? 'cart'), aisles, overrides };
}

export interface StoresState {
  stores: Store[];
  loaded: boolean;
}

export function useStores(familyId: string): StoresState {
  const [state, setState] = useState<StoresState>({ stores: [], loaded: false });

  useEffect(() => {
    return onSnapshot(
      storesCol(familyId),
      (snap) => {
        const stores = snap.docs.map((d) => toStore(d.id, d.data()));
        stores.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        setState({ stores, loaded: true });
      },
      (error) => console.error(error),
    );
  }, [familyId]);

  return state;
}

/** Guarda (crea o reemplaza) un supermercado. Devuelve su id. */
export function saveStore(familyId: string, draft: StoreDraft, storeId?: string): string {
  const ref = storeId ? storeRef(familyId, storeId) : doc(storesCol(familyId));
  // Sin await: con mala cobertura se guarda en local y se sube después.
  setDoc(ref, { ...draft, updatedAt: serverTimestamp() }).catch((e: unknown) => console.error(e));
  return ref.id;
}

export function deleteStore(familyId: string, storeId: string) {
  deleteDoc(storeRef(familyId, storeId)).catch((e: unknown) => console.error(e));
}

/**
 * "En este súper, este producto está en este pasillo." (aisleId null = quitar la excepción).
 * Se usa desde el modo compra al colocar un producto que no tenía pasillo.
 */
export function setOverride(familyId: string, storeId: string, itemId: string, aisleId: string | null) {
  // FieldPath evita interpretar el id del producto como parte de la ruta.
  updateDoc(
    storeRef(familyId, storeId),
    new FieldPath('overrides', itemId),
    aisleId ?? deleteField(),
    'updatedAt',
    serverTimestamp(),
  ).catch((e: unknown) => console.error(e));
}
