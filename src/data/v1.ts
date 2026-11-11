// Lectura (solo lectura) de la lista de la V1 y escritura del resultado en la V2.
//
// La V1 vive en OTRO proyecto de Firebase (locallist-18b64) y su documento es
// de lectura pública, así que basta con la API REST: no hace falta iniciar
// sesión allí ni cargar un segundo SDK.

import { doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { V1Data, V1Plan } from '../domain/migrateV1';
import type { Item } from '../domain/types';
import { auth, db } from './firebase';

const V1_DOC_URL =
  'https://firestore.googleapis.com/v1/projects/locallist-18b64/databases/(default)/documents/' +
  'supermercados/mercadona_cruce?key=AIzaSyDPb6Ira09z5sUQ4AtD6uyibVKQsQshGgc';

type RestValue = Record<string, unknown>;

/** Convierte el formato tipado de la API REST ({stringValue: …}) a valores normales. */
function plain(value: RestValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) {
    const values = (value.arrayValue as { values?: RestValue[] }).values ?? [];
    return values.map(plain);
  }
  return null;
}

export async function readV1List(): Promise<V1Data> {
  const res = await fetch(V1_DOC_URL);
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`La V1 respondió ${res.status}`);
  const json = (await res.json()) as { fields?: Record<string, RestValue> };
  return Object.fromEntries(Object.entries(json.fields ?? {}).map(([k, v]) => [k, plain(v)]));
}

const MAX_BATCH = 400; // Firestore admite 500 operaciones por batch

/** Escribe la lista importada (y el catálogo). Espera a que el servidor lo confirme. */
export async function writeV1Import(familyId: string, plan: V1Plan): Promise<void> {
  const uid = auth.currentUser?.uid ?? '';
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];

  const toCatalog = (item: Item) => (b: ReturnType<typeof writeBatch>) =>
    b.set(
      doc(db, 'families', familyId, 'catalog', item.id),
      { name: item.name, category: item.category, uses: increment(1), lastUsedAt: serverTimestamp() },
      { merge: true },
    );

  for (const item of plan.items) {
    ops.push((b) =>
      b.set(doc(db, 'families', familyId, 'items', item.id), {
        name: item.name,
        qty: item.qty,
        done: false,
        category: item.category,
        doneAt: null,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      }),
    );
    ops.push(toCatalog(item));
  }
  for (const item of plan.known) ops.push(toCatalog(item));

  for (let i = 0; i < ops.length; i += MAX_BATCH) {
    const batch = writeBatch(db);
    ops.slice(i, i + MAX_BATCH).forEach((op) => op(batch));
    await batch.commit();
  }
}
